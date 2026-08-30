"""
MediKiosk Module D — Consent & ABDM (Ayushman Bharat Digital Mission) Integration Client.
Provides a swappable interface architecture:
  - ABDMClientInterface (Standard Contract)
  - SimulatedABDMClient (Zero-network in-memory simulation with seed patient histories)
  - LiveABDMClient (Production stub for ABDM Sandbox Gateway v0.5)
  - get_abdm_client() (Single-point factory based on ABDM_MODE environment variable)
"""

import os
import time
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime


# ─── SEED DEMO PATIENT DATABASE (Clearly Fictional) ───────────────────────────
DEMO_PATIENTS_REGISTRY: Dict[str, Dict[str, Any]] = {
    # ── RETURNING PATIENTS (With 1-2 Prior Clinical Encounters) ──────────────
    "SIM-91-2001-0000-0001": {
        "abha_number": "SIM-91-2001-0000-0001",
        "abha_address": "rameshwar.prasad@sbx-sim",
        "name": "Rameshwar Prasad",
        "gender": "M",
        "dob": "1968-01-01",
        "age": 58,
        "mobile": "+91-98765-43210",
        "address": {"district": "Varanasi", "state": "Uttar Pradesh", "pincode": "221001"},
        "simulated": True,
        "is_returning_patient": True,
        "care_contexts": [
            {
                "care_context_reference": "CC-VAR-2025-0891",
                "encounter_date": "2025-11-14",
                "facility": "District Civil Hospital Varanasi — OPD Medicine",
                "doctor": "Dr. R. K. Sharma (MCI-84920)",
                "chief_complaint": "Polyuria, increased thirst, and bilateral knee stiffness",
                "diagnoses": ["Type 2 Diabetes Mellitus", "Essential Hypertension", "Bilateral Knee Osteoarthritis"],
                "prescriptions": [
                    {"name": "Metformin", "dose": "500mg", "frequency": "1-0-1 (BD)", "instructions": "Before food"},
                    {"name": "Telmisartan", "dose": "40mg", "frequency": "1-0-0 (OD)", "instructions": "Morning after food"},
                    {"name": "Paracetamol", "dose": "650mg", "frequency": "SOS", "instructions": "On severe pain"}
                ],
                "lab_investigations": [
                    {"test": "HbA1c", "value": 8.4, "unit": "%", "flag": "HIGH", "reference": "4.0-5.6%"},
                    {"test": "Fasting Blood Sugar", "value": 168, "unit": "mg/dL", "flag": "HIGH", "reference": "70-100 mg/dL"},
                    {"test": "Serum Creatinine", "value": 0.9, "unit": "mg/dL", "flag": "NORMAL", "reference": "0.6-1.2 mg/dL"}
                ]
            },
            {
                "care_context_reference": "CC-VAR-2026-0142",
                "encounter_date": "2026-03-20",
                "facility": "District Civil Hospital Varanasi — Cardiology Clinic",
                "doctor": "Dr. S. K. Gupta (MCI-65412)",
                "chief_complaint": "Mild exertional breathlessness, routine follow-up",
                "diagnoses": ["Stable Angina Pectoris / Coronary Artery Disease", "Type 2 Diabetes Mellitus"],
                "prescriptions": [
                    {"name": "Atorvastatin", "dose": "20mg", "frequency": "0-0-1 (HS)", "instructions": "At bedtime"},
                    {"name": "Sorbitrate", "dose": "5mg", "frequency": "SOS", "instructions": "Sublingual on chest tightness"}
                ],
                "lab_investigations": [
                    {"test": "Total Cholesterol", "value": 235, "unit": "mg/dL", "flag": "HIGH", "reference": "125-200 mg/dL"},
                    {"test": "Triglycerides", "value": 195, "unit": "mg/dL", "flag": "HIGH", "reference": "50-150 mg/dL"}
                ]
            }
        ]
    },
    "SIM-91-2002-0000-0002": {
        "abha_number": "SIM-91-2002-0000-0002",
        "abha_address": "sunita.devi@sbx-sim",
        "name": "Sunita Devi",
        "gender": "F",
        "dob": "1979-08-15",
        "age": 47,
        "mobile": "+91-98765-43211",
        "address": {"district": "Patna", "state": "Bihar", "pincode": "800001"},
        "simulated": True,
        "is_returning_patient": True,
        "care_contexts": [
            {
                "care_context_reference": "CC-PAT-2025-4421",
                "encounter_date": "2025-12-05",
                "facility": "Patna Medical College Hospital — Chest OPD",
                "doctor": "Dr. Anjali Sinha (BCMR-44102)",
                "chief_complaint": "Nocturnal dry cough and wheezing during winter cold",
                "diagnoses": ["Bronchial Asthma", "Allergic Rhinitis"],
                "prescriptions": [
                    {"name": "Salbutamol Inhaler (100mcg)", "dose": "2 puffs", "frequency": "SOS", "instructions": "During acute wheeze"},
                    {"name": "Montelukast", "dose": "10mg", "frequency": "0-0-1 (HS)", "instructions": "Bedtime for 30 days"}
                ],
                "lab_investigations": [
                    {"test": "Absolute Eosinophil Count (AEC)", "value": 650, "unit": "cells/mcL", "flag": "HIGH", "reference": "40-440 cells/mcL"},
                    {"test": "Chest X-Ray PA View", "value": "Hyperinflated lung fields, no active focal consolidation", "unit": "Text", "flag": "NORMAL"}
                ]
            }
        ]
    },
    "SIM-91-2003-0000-0003": {
        "abha_number": "SIM-91-2003-0000-0003",
        "abha_address": "gurpreet.singh@sbx-sim",
        "name": "Gurpreet Singh",
        "gender": "M",
        "dob": "1962-04-10",
        "age": 64,
        "mobile": "+91-98765-43212",
        "address": {"district": "Amritsar", "state": "Punjab", "pincode": "143001"},
        "simulated": True,
        "is_returning_patient": True,
        "care_contexts": [
            {
                "care_context_reference": "CC-ASR-2024-9102",
                "encounter_date": "2024-09-18",
                "facility": "Guru Nanak Dev Hospital Amritsar — Cardiology",
                "doctor": "Dr. H. S. Dhillon (PMC-12948)",
                "chief_complaint": "Post-PCI follow-up (Drug Eluting Stent to LAD placed July 2024)",
                "diagnoses": ["Coronary Artery Disease (Post-PTCA)", "Dyslipidemia", "Hypertension"],
                "prescriptions": [
                    {"name": "Aspirin", "dose": "75mg", "frequency": "1-0-0 (OD)", "instructions": "After breakfast"},
                    {"name": "Clopidogrel", "dose": "75mg", "frequency": "1-0-0 (OD)", "instructions": "After breakfast"},
                    {"name": "Rosuvastatin", "dose": "20mg", "frequency": "0-0-1 (HS)", "instructions": "Bedtime"}
                ],
                "lab_investigations": [
                    {"test": "Echocardiography LVEF", "value": 52, "unit": "%", "flag": "NORMAL", "reference": "50-70%"}
                ]
            }
        ]
    },
    "SIM-91-2004-0000-0004": {
        "abha_number": "SIM-91-2004-0000-0004",
        "abha_address": "lakshmi.narayanan@sbx-sim",
        "name": "Lakshmi Narayanan",
        "gender": "F",
        "dob": "1973-11-22",
        "age": 52,
        "mobile": "+91-98765-43213",
        "address": {"district": "Madurai", "state": "Tamil Nadu", "pincode": "625001"},
        "simulated": True,
        "is_returning_patient": True,
        "care_contexts": [
            {
                "care_context_reference": "CC-MDU-2025-1109",
                "encounter_date": "2025-10-12",
                "facility": "Government Rajaji Hospital Madurai — AYUSH Integrated Clinic",
                "doctor": "Dr. S. Meenakshi (TNSC-9812)",
                "chief_complaint": "Chronic lower back ache (Kati Shula) and morning stiffness",
                "diagnoses": ["Sandhigata Vata (Osteoarthritis)", "Kati Shula (Lumbar Spondylosis)"],
                "prescriptions": [
                    {"name": "Yogaraja Guggulu", "dose": "2 tabs", "frequency": "1-0-1 (BD)", "instructions": "With lukewarm water"},
                    {"name": "Mahanarayana Taila", "dose": "10ml", "frequency": "Local", "instructions": "Gentle external application"}
                ],
                "lab_investigations": [
                    {"test": "Serum Uric Acid", "value": 5.2, "unit": "mg/dL", "flag": "NORMAL", "reference": "3.5-7.2 mg/dL"}
                ]
            }
        ]
    },

    # ── NEW PATIENTS (Brand New Registration / Zero Prior Linked Records) ────
    "SIM-91-1001-0000-0001": {
        "abha_number": "SIM-91-1001-0000-0001",
        "abha_address": "ananya.sharma@sbx-sim",
        "name": "Ananya Sharma",
        "gender": "F",
        "dob": "1998-06-18",
        "age": 28,
        "mobile": "+91-98765-43214",
        "address": {"district": "Jaipur", "state": "Rajasthan", "pincode": "302001"},
        "simulated": True,
        "is_returning_patient": False,
        "care_contexts": []
    },
    "SIM-91-1002-0000-0002": {
        "abha_number": "SIM-91-1002-0000-0002",
        "abha_address": "mohammed.farhan@sbx-sim",
        "name": "Mohammed Farhan",
        "gender": "M",
        "dob": "1993-02-04",
        "age": 33,
        "mobile": "+91-98765-43215",
        "address": {"district": "Hyderabad", "state": "Telangana", "pincode": "500001"},
        "simulated": True,
        "is_returning_patient": False,
        "care_contexts": []
    },
    "SIM-91-1003-0000-0003": {
        "abha_number": "SIM-91-1003-0000-0003",
        "abha_address": "arun.chatterjee@sbx-sim",
        "name": "Arun Chatterjee",
        "gender": "M",
        "dob": "1985-09-30",
        "age": 40,
        "mobile": "+91-98765-43216",
        "address": {"district": "Kolkata", "state": "West Bengal", "pincode": "700001"},
        "simulated": True,
        "is_returning_patient": False,
        "care_contexts": []
    }
}


# ─── 1. STANDARD ABDM CLIENT INTERFACE ────────────────────────────────────────

class ABDMClientInterface:
    """
    Standard interface for ABDM (Ayushman Bharat Digital Mission) Gateway calls.
    Both SimulatedABDMClient and LiveABDMClient implement this exact contract.
    """

    def verify_or_create_abha(self, identifier: str) -> Dict[str, Any]:
        """
        Accepts an ABHA number, Aadhaar-style ID, or registration input.
        Returns an ABHA profile object adhering to the official NHA schema.
        """
        raise NotImplementedError

    def verifyOrCreateABHA(self, identifier: str) -> Dict[str, Any]:
        """CamelCase alias matching specification."""
        return self.verify_or_create_abha(identifier)

    def request_consent(self, patient_profile: Dict[str, Any], purpose: str = "CARETREE") -> Dict[str, Any]:
        """
        Initiates a consent request artifact against the patient's ABHA account.
        Returns a consent record with status (PENDING / GRANTED / DENIED) and timestamp.
        """
        raise NotImplementedError

    def requestConsent(self, patient_profile: Dict[str, Any], purpose: str = "CARETREE") -> Dict[str, Any]:
        """CamelCase alias matching specification."""
        return self.request_consent(patient_profile, purpose)

    def link_care_context(self, abha_id: str, history_bundle: Dict[str, Any]) -> Dict[str, Any]:
        """
        Registers a structured clinical care context against the patient's ABHA account.
        """
        raise NotImplementedError

    def linkCareContext(self, abha_id: str, history_bundle: Dict[str, Any]) -> Dict[str, Any]:
        """CamelCase alias matching specification."""
        return self.link_care_context(abha_id, history_bundle)

    def fetch_linked_history(self, abha_id: str) -> Dict[str, Any]:
        """
        Fetches previously linked care contexts and structured health records for a returning patient.
        """
        raise NotImplementedError

    def fetchLinkedHistory(self, abha_id: str) -> Dict[str, Any]:
        """CamelCase alias matching specification."""
        return self.fetch_linked_history(abha_id)

    def push_fhir_bundle(self, bundle: Dict[str, Any], target_his: str = "DEFAULT") -> Dict[str, Any]:
        """
        Submits the completed FHIR R4 Bundle to the ABDM Health Information Exchange (HIE-CM).
        """
        raise NotImplementedError

    def pushFHIRBundle(self, bundle: Dict[str, Any], target_his: str = "DEFAULT") -> Dict[str, Any]:
        """CamelCase alias matching specification."""
        return self.push_fhir_bundle(bundle, target_his)

    # Legacy/QR helpers
    def verify_abha_qr(self, qr_data: str) -> Dict[str, Any]:
        raise NotImplementedError

    def authenticate(self) -> str:
        raise NotImplementedError


# ─── 2. SIMULATED ABDM CLIENT (Zero-Network, In-Memory Scaffolding) ───────────

import copy

class SimulatedABDMClient(ABDMClientInterface):
    """
    High-fidelity in-memory ABDM simulation layer.
    Enables realistic demo and testing of returning vs new patient journeys,
    care-context linking, and consent artifacts without calling external NHA servers.
    Every produced record is tagged with `simulated: True` and `SIM-` ID prefix.
    """

    def __init__(self):
        self.mode = "SIMULATED"
        self._database = copy.deepcopy(DEMO_PATIENTS_REGISTRY)
        self._consents_store: Dict[str, Dict[str, Any]] = {}
        self._linked_bundles: Dict[str, List[Dict[str, Any]]] = {}

    def verify_or_create_abha(self, identifier: str) -> Dict[str, Any]:
        """
        Verifies an existing ABHA number/identifier from the seed registry,
        or creates a new synthetic ABHA profile with a SIM- prefix.
        """
        clean_id = (identifier or "").strip()
        
        # Clean QR URI scheme if present (e.g. abha://SIM-91-2001-0000-0001)
        if clean_id.startswith("abha://"):
            clean_id = clean_id.replace("abha://", "")

        # 1. Search in seeded database
        for abha_key, profile in self._database.items():
            if (clean_id == abha_key or 
                clean_id == profile.get("abha_address") or 
                clean_id == profile.get("mobile") or 
                clean_id.lower() in profile.get("name", "").lower()):
                
                resp = dict(profile)
                resp["status"] = "VERIFIED_EXISTING_RECORD"
                resp["simulated"] = True
                resp["auth_mode"] = "DEMO_SIMULATED_AUTH"
                return resp

        # 2. If not found, dynamically generate a realistic new synthetic ABHA Profile
        synthetic_suffix = str(int(time.time()))[-4:]
        new_abha = f"SIM-91-1099-0000-{synthetic_suffix}"
        new_profile = {
            "abha_number": new_abha,
            "abha_address": f"user.{synthetic_suffix}@sbx-sim",
            "name": clean_id if len(clean_id) > 2 and not clean_id.isdigit() else "New Patient",
            "gender": "O",
            "dob": "1995-01-01",
            "age": 31,
            "mobile": "+91-98765-00000",
            "address": {"district": "New Delhi", "state": "Delhi", "pincode": "110001"},
            "simulated": True,
            "is_returning_patient": False,
            "care_contexts": [],
            "status": "NEW_ABHA_REGISTERED_SIMULATED",
            "auth_mode": "DEMO_SIMULATED_AUTH"
        }
        self._database[new_abha] = new_profile
        return new_profile

    def request_consent(self, patient_profile: Dict[str, Any], purpose: str = "CARETREE") -> Dict[str, Any]:
        """
        Simulates the ABDM consent flow with realistic PENDING -> GRANTED transitions.
        """
        consent_id = f"SIM-CONSENT-{uuid.uuid4().hex[:10].upper()}"
        abha_id = patient_profile.get("abha_number", "SIM-UNKNOWN")
        
        consent_record = {
            "consent_id": consent_id,
            "abha_number": abha_id,
            "purpose": purpose,
            "status": "GRANTED",
            "granted_at": datetime.now().isoformat(),
            "expires_at": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time() + 86400)),
            "data_fiduciary": "District Hospital Civil Lines OPD (MediKiosk)",
            "purpose_text": "Care Context linking, SOCRATES intake & clinical history review",
            "granular_scopes": ["demographics", "voice_intake", "ocr_documents", "his_abdm_share"],
            "simulated": True,
            "source": "MEDIKIOSK_ABDM_SIMULATION_V1"
        }
        self._consents_store[consent_id] = consent_record
        return consent_record

    def link_care_context(self, abha_id: str, history_bundle: Dict[str, Any]) -> Dict[str, Any]:
        """
        Registers a care context against the patient's in-memory record.
        """
        ref_id = f"CC-SIM-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        new_context = {
            "care_context_reference": ref_id,
            "encounter_date": datetime.now().strftime("%Y-%m-%d"),
            "facility": "District Civil Hospital OPD (MediKiosk Terminal)",
            "doctor": "Attending Physician (OPD Room 104)",
            "chief_complaint": history_bundle.get("chief_complaint", "General Clinical Intake"),
            "diagnoses": history_bundle.get("diagnoses", []),
            "prescriptions": history_bundle.get("medications", []),
            "lab_investigations": history_bundle.get("lab_results", [])
        }

        # Store against patient if exists in memory
        if abha_id in self._database:
            self._database[abha_id].setdefault("care_contexts", []).insert(0, new_context)
            self._database[abha_id]["is_returning_patient"] = True

        if abha_id not in self._linked_bundles:
            self._linked_bundles[abha_id] = []
        self._linked_bundles[abha_id].append(history_bundle)

        return {
            "status": "CARE_CONTEXT_LINKED_SIMULATED",
            "care_context_reference": ref_id,
            "abha_number": abha_id,
            "linked_at": datetime.now().isoformat(),
            "simulated": True
        }

    def fetch_linked_history(self, abha_id: str) -> Dict[str, Any]:
        """
        Returns previously linked clinical records for returning patient journey.
        """
        profile = self._database.get(abha_id)
        if not profile:
            # Try searching by address
            for k, p in self._database.items():
                if p.get("abha_address") == abha_id:
                    profile = p
                    break

        if not profile:
            return {
                "abha_number": abha_id,
                "is_returning_patient": False,
                "total_care_contexts": 0,
                "care_contexts": [],
                "simulated": True
            }

        contexts = profile.get("care_contexts", [])
        return {
            "abha_number": profile.get("abha_number"),
            "name": profile.get("name"),
            "is_returning_patient": len(contexts) > 0,
            "total_care_contexts": len(contexts),
            "care_contexts": contexts,
            "simulated": True,
            "notice": "DEMO DATA — Generated from MediKiosk Simulated ABDM Repository"
        }

    def push_fhir_bundle(self, bundle: Dict[str, Any], target_his: str = "DEFAULT") -> Dict[str, Any]:
        """
        Simulates pushing completed FHIR R4 Bundle to the HIE-CM repository.
        """
        tx_id = f"SIM-TX-{uuid.uuid4().hex[:12].upper()}"
        return {
            "status": "FHIR_BUNDLE_ACCEPTED_SIMULATED",
            "transaction_id": tx_id,
            "target_his": target_his,
            "resource_type": bundle.get("resourceType", "Bundle"),
            "entries_transferred": len(bundle.get("entry", [])),
            "timestamp": datetime.now().isoformat(),
            "simulated": True
        }

    def verify_abha_qr(self, qr_data: str) -> Dict[str, Any]:
        """Backward-compatible QR parser."""
        return self.verify_or_create_abha(qr_data)

    def authenticate(self) -> str:
        """Returns mock JWT token."""
        return f"SIM_ABDM_BEARER_JWT_{uuid.uuid4().hex}"

    def get_all_demo_patients(self) -> List[Dict[str, Any]]:
        """Utility to retrieve all seeded patients for the demo selector UI."""
        return list(self._database.values())


# ─── 3. LIVE ABDM CLIENT (Production Stub) ────────────────────────────────────

class LiveABDMClient(ABDMClientInterface):
    """
    Live ABDM Gateway v0.5 Client Stub.
    
    // TODO: Implement against ABDM Sandbox Gateway (https://gateway.abdm.gov.in/v0.5)
    // Reference: sandbox.abdm.gov.in and medikiosk-manual-build-reference.md Phase 5.
    // Requires: ABDM_CLIENT_ID, ABDM_CLIENT_SECRET, ABDM_FACILITY_ID, X-CM-ID.
    """

    def __init__(self, client_id: Optional[str] = None, client_secret: Optional[str] = None):
        self.mode = "LIVE_PRODUCTION"
        self.client_id = client_id or os.environ.get("ABDM_CLIENT_ID", "")
        self.client_secret = client_secret or os.environ.get("ABDM_CLIENT_SECRET", "")
        self.base_url = "https://gateway.abdm.gov.in/v0.5"

    def verify_or_create_abha(self, identifier: str) -> Dict[str, Any]:
        # TODO: Implement POST /v0.5/users/auth/init and Aadhaar OTP verification against NHA Gateway
        raise NotImplementedError(
            "Live ABDM Sandbox Client not configured. "
            "Set ABDM_MODE=simulated for testing or provision credentials on sandbox.abdm.gov.in. "
            "See medikiosk-manual-build-reference.md Phase 5."
        )

    def request_consent(self, patient_profile: Dict[str, Any], purpose: str = "CARETREE") -> Dict[str, Any]:
        # TODO: Implement POST /v0.5/consent-requests/init with HIU/HIP consent artifact
        raise NotImplementedError(
            "Live ABDM Sandbox Client not configured. "
            "See sandbox.abdm.gov.in and medikiosk-manual-build-reference.md Phase 5."
        )

    def link_care_context(self, abha_id: str, history_bundle: Dict[str, Any]) -> Dict[str, Any]:
        # TODO: Implement POST /v0.5/links/link/init and /v0.5/links/link/confirm
        raise NotImplementedError(
            "Live ABDM Sandbox Client not configured. "
            "See sandbox.abdm.gov.in and medikiosk-manual-build-reference.md Phase 5."
        )

    def fetch_linked_history(self, abha_id: str) -> Dict[str, Any]:
        # TODO: Implement POST /v0.5/health-information/cm/request and callback handling
        raise NotImplementedError(
            "Live ABDM Sandbox Client not configured. "
            "See sandbox.abdm.gov.in and medikiosk-manual-build-reference.md Phase 5."
        )

    def push_fhir_bundle(self, bundle: Dict[str, Any], target_his: str = "DEFAULT") -> Dict[str, Any]:
        # TODO: Implement ECDH key pair generation + AES-GCM encryption + POST /v0.5/health-information/transfer
        raise NotImplementedError(
            "Live ABDM Sandbox Client not configured. "
            "See sandbox.abdm.gov.in and medikiosk-manual-build-reference.md Phase 5."
        )

    def verify_abha_qr(self, qr_data: str) -> Dict[str, Any]:
        return self.verify_or_create_abha(qr_data)

    def authenticate(self) -> str:
        # TODO: Call POST /v0.5/sessions to obtain dynamic access token
        raise NotImplementedError(
            "Live ABDM Sandbox Client not configured. "
            "See sandbox.abdm.gov.in and medikiosk-manual-build-reference.md Phase 5."
        )


# ─── 4. SINGLETON FACTORY PROVIDER ────────────────────────────────────────────

_singleton_simulated_client: Optional[SimulatedABDMClient] = None
_singleton_live_client: Optional[LiveABDMClient] = None

def get_abdm_client() -> ABDMClientInterface:
    """
    Single-point factory function that reads the ABDM_MODE environment variable.
    Options:
      - ABDM_MODE='simulated' (Default): Uses in-memory SimulatedABDMClient with seed patients.
      - ABDM_MODE='live': Uses LiveABDMClient against official NHA endpoints.
    Swapping from simulation to live requires touching ZERO other files in the codebase.
    """
    global _singleton_simulated_client, _singleton_live_client
    mode = os.environ.get("ABDM_MODE", "simulated").strip().lower()

    if mode == "live":
        if _singleton_live_client is None:
            _singleton_live_client = LiveABDMClient()
        return _singleton_live_client
    else:
        if _singleton_simulated_client is None:
            _singleton_simulated_client = SimulatedABDMClient()
        return _singleton_simulated_client


# Backward-compatible class alias mapping
ABDMClient = SimulatedABDMClient

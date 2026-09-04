"""
MediKiosk Clinical Ontology & Red-Flag Rule Engine.
Defines the clinical schema, FHIR R4 mapping contracts, and safety critical rules.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

# ==========================================
# 1. FHIR R4 MAPPING CONTRACTS
# ==========================================
# Every ontology field must map to a specific FHIR R4 resource type.
FHIR_MAPPING_CONTRACTS = {
    "chief_complaint": "Condition",
    "hpi_site": "Observation",
    "hpi_onset": "Observation",
    "hpi_character": "Observation",
    "hpi_radiation": "Observation",
    "hpi_association": "Observation",
    "hpi_timing": "Observation",
    "hpi_exacerbating_relieving": "Observation",
    "hpi_severity": "Observation",
    "past_medical_history": "Condition",
    "past_surgical_history": "Procedure",
    "drug_history": "MedicationStatement",
    "allergy_history": "AllergyIntolerance",
    "family_history": "FamilyMemberHistory",
    "personal_history": "Observation",  # e.g., smoking, diet, sleep
    "review_of_systems": "Observation",
    "prior_investigations": "Observation",
    "ayush_prakriti": "Observation",
    "ayush_vikriti": "Observation",
    "ayush_sara": "Observation",
    "ayush_samhanana": "Observation",
    "ayush_pramana": "Observation",
    "ayush_satmya": "Observation",
    "ayush_sattva": "Observation",
    "ayush_ahara_shakti": "Observation",
    "ayush_vyayama_shakti": "Observation",
    "ayush_vaya": "Observation",
    "ayush_ahara_vihara": "Observation",
    "ayush_dosha_scores": "Observation",
    "ayush_namaste_codes": "Condition",
    "ayush_nidana": "Observation",
    "ayush_samprapti": "Observation",
}

# ==========================================
# 2. ONTOLOGY DATA MODELS
# ==========================================

@dataclass
class NAMASTECode:
    """
    National AYUSH Morbidity and Standardized Terminologies Electronic (NAMASTE) code structure.
    Cross-referenced with WHO ICD-11 Traditional Medicine Module 2 (TM2) where applicable.
    """
    namaste_code: str
    namaste_term: str
    icd11_tm2_code: Optional[str] = None
    ayush_system: str = "Ayurveda"
    category: str = "General Morbidity"
    description: Optional[str] = None

@dataclass
class SOCRATES_HPI:
    site: Optional[str] = None
    onset: Optional[str] = None
    character: Optional[str] = None
    radiation: Optional[str] = None
    association: List[str] = field(default_factory=list)
    timing: Optional[str] = None
    exacerbating_relieving: Optional[str] = None
    severity: Optional[str] = None  # Scale of 1-10 or Mild/Moderate/Severe

@dataclass
class AYUSHExtension:
    """
    Comprehensive AYUSH Dashavidha Pariksha & Traditional Clinical Ontology.
    Captures all 10 clinical examination parameters, quantitative dosha scores, and NAMASTE codes.
    """
    prakriti: Optional[str] = None
    vikriti: Optional[str] = None
    sara: Optional[str] = None
    samhanana: Optional[str] = None
    pramana: Optional[str] = None
    satmya: Optional[str] = None
    sattva: Optional[str] = None
    ahara_shakti: Optional[str] = None
    vyayama_shakti: Optional[str] = None
    vaya: Optional[str] = None
    ahara_vihara: Optional[str] = None
    # Scored Dosha Metrics (0 - 100 percentage)
    vata_score: float = 0.0
    pitta_score: float = 0.0
    kapha_score: float = 0.0
    # NAMASTE / ICD-11 TM2 traditional disease codings
    namaste_diagnoses: List[NAMASTECode] = field(default_factory=list)
    # Vaidya Clinical Assessment Notes
    nidana: Optional[str] = None       # Etiological factors
    samprapti: Optional[str] = None   # Pathogenesis & disease progression
    dhatu_involvement: Optional[str] = None
    srota_involvement: Optional[str] = None

@dataclass
class ClinicalOntology:
    chief_complaint: str
    hpi: SOCRATES_HPI = field(default_factory=SOCRATES_HPI)
    past_medical_history: List[str] = field(default_factory=list)
    past_surgical_history: List[str] = field(default_factory=list)
    drug_history: List[str] = field(default_factory=list)
    allergy_history: List[str] = field(default_factory=list)
    family_history: List[str] = field(default_factory=list)
    personal_history: Dict[str, str] = field(default_factory=dict)
    review_of_systems: Dict[str, str] = field(default_factory=dict)
    prior_investigations: List[Dict[str, Any]] = field(default_factory=list)
    ayush: Optional[AYUSHExtension] = None

# ==========================================
# 3. RED-FLAG RULE ENGINE (HARD-CODED)
# ==========================================
# Safety critical rules table. Must be strictly rule-based, not model-based.
# Format: List of rules, where each rule contains a list of trigger symptoms/conditions,
# and an alert priority + message.

RED_FLAG_RULES = [
    {
        "id": "RF-001",
        "description": "Acute Coronary Syndrome (ACS) - Chest Pain with breathlessness or radiation",
        "conditions": {
            "chief_complaint": ["chest pain", "chest tightness", "angina"],
            "hpi_association": ["breathlessness", "dyspnea", "shortness of breath", "sweating", "diaphoresis"],
            "hpi_radiation": ["left arm", "left shoulder", "jaw", "neck", "back"]
        },
        "operator": "AND",  # Chief complaint matches AND (any association OR any radiation matches)
        "priority": "CRITICAL",
        "alert_message": "POSSIBLE ACUTE CORONARY SYNDROME. Route immediately to Emergency/Triage counter."
    },
    {
        "id": "RF-002",
        "description": "Acute Stroke - Slurred speech, unilateral weakness, facial droop",
        "conditions": {
            "chief_complaint": ["stroke", "weakness", "paralysis", "slurred speech", "numbness"],
            "hpi_association": ["slurred speech", "facial droop", "arm drift", "unilateral weakness", "difficulty speaking"]
        },
        "operator": "OR",
        "priority": "CRITICAL",
        "alert_message": "POSSIBLE ACUTE STROKE (FAST CRITERIA). Route immediately to Emergency."
    },
    {
        "id": "RF-003",
        "description": "Sepsis/Severe Infection - High fever with altered sensorium or extreme breathlessness",
        "conditions": {
            "chief_complaint": ["fever", "pyrexia"],
            "hpi_association": ["altered mental status", "confusion", "hallucinations", "extreme breathlessness", "severe chills"]
        },
        "operator": "AND",
        "priority": "HIGH",
        "alert_message": "POSSIBLE SEVERE SEPSIS/INFECTION. Prompt physician evaluation required."
    },
    {
        "id": "RF-004",
        "description": "Anaphylaxis - Sudden rash, swelling, and difficulty breathing",
        "conditions": {
            "chief_complaint": ["allergy", "rash", "swelling", "hives"],
            "hpi_association": ["breathlessness", "wheezing", "throat tightness", "stridor"]
        },
        "operator": "AND",
        "priority": "CRITICAL",
        "alert_message": "POSSIBLE ANAPHYLAXIS. Route to Emergency immediately."
    },
    {
        "id": "RF-005",
        "description": "Severe Dyspnea - Severe breathlessness standalone",
        "conditions": {
            "chief_complaint": ["breathlessness", "dyspnea", "severe breathing difficulty", "asthma attack"]
        },
        "operator": "ANY",
        "priority": "HIGH",
        "alert_message": "SEVERE RESPIRATORY DISTRESS. Priority consult required."
    }
]

def check_red_flags(chief_complaint: str, hpi: Any) -> Optional[Dict[str, Any]]:
    """
    Evaluates current clinical data against the hard-coded safety rules.
    Returns the matching rule dictionary if triggered, else None.
    """
    cc_lower = (chief_complaint or "").lower()
    if isinstance(hpi, dict):
        raw_assoc = hpi.get("association") or hpi.get("associated_symptoms") or []
        if isinstance(raw_assoc, str):
            raw_assoc = [raw_assoc]
        assoc_lower = [str(a).lower() for a in raw_assoc]
        rad_lower = str(hpi.get("radiation") or "").lower()
    else:
        assoc_lower = [a.lower() for a in (getattr(hpi, "association", None) or [])]
        rad_lower = (getattr(hpi, "radiation", None) or "").lower()

    for rule in RED_FLAG_RULES:
        conditions = rule["conditions"]
        
        # Check chief complaint match
        cc_match = any(term in cc_lower for term in conditions.get("chief_complaint", []))
        
        # Check association match
        assoc_match = any(any(term in a for term in conditions.get("hpi_association", [])) for a in assoc_lower)
        
        # Check radiation match
        rad_match = False
        if "hpi_radiation" in conditions and rad_lower:
            rad_match = any(term in rad_lower for term in conditions["hpi_radiation"])

        # Rules matching logic
        if rule["id"] == "RF-001":  # Special AND/OR logic for ACS
            if cc_match and (assoc_match or rad_match):
                return rule
        elif rule["id"] == "RF-002":  # Stroke can trigger on CC or HPI associations
            if cc_match or assoc_match:
                return rule
        elif rule["id"] == "RF-003":  # Sepsis: Fever AND association
            if cc_match and assoc_match:
                return rule
        elif rule["id"] == "RF-004":  # Anaphylaxis: Allergy/Rash AND association
            if cc_match and assoc_match:
                return rule
        elif rule["id"] == "RF-005":  # Severe Dyspnea standalone
            if cc_match:
                return rule
                
    return None

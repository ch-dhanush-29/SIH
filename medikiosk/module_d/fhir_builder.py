"""
FHIR R4 Bundle Builder for MediKiosk.
Maps clinical ontology models to standard FHIR resources per the ABDM guidelines.
"""

from typing import Dict, Any, List
from medikiosk.ontology import ClinicalOntology, SOCRATES_HPI, AYUSHExtension

class FHIRBundleBuilder:
    def __init__(self, patient_id: str = "Patient/1"):
        self.patient_id = patient_id

    def build_bundle(self, ontology: ClinicalOntology, documents: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Creates a complete FHIR R4 Bundle containing all recorded clinical entities.
        """
        entries = []
        
        # 1. Chief Complaint as a Condition
        cc_entry = self._build_condition("chief-complaint", ontology.chief_complaint, "active")
        entries.append(self._to_bundle_entry(cc_entry))

        # 2. SOCRATES HPI fields as Observations
        hpi = ontology.hpi
        if hpi.site:
            entries.append(self._to_bundle_entry(self._build_observation("hpi-site", hpi.site)))
        if hpi.onset:
            entries.append(self._to_bundle_entry(self._build_observation("hpi-onset", hpi.onset)))
        if hpi.character:
            entries.append(self._to_bundle_entry(self._build_observation("hpi-character", hpi.character)))
        if hpi.radiation:
            entries.append(self._to_bundle_entry(self._build_observation("hpi-radiation", hpi.radiation)))
        if hpi.timing:
            entries.append(self._to_bundle_entry(self._build_observation("hpi-timing", hpi.timing)))
        if hpi.exacerbating_relieving:
            entries.append(self._to_bundle_entry(self._build_observation("hpi-exacerbating-relieving", hpi.exacerbating_relieving)))
        if hpi.severity:
            entries.append(self._to_bundle_entry(self._build_observation("hpi-severity", hpi.severity)))
            
        for idx, assoc in enumerate(hpi.association):
            entries.append(self._to_bundle_entry(self._build_observation(f"hpi-association-{idx}", assoc)))

        # 3. Past Medical History as Conditions
        for idx, med_hist in enumerate(ontology.past_medical_history):
            entries.append(self._to_bundle_entry(self._build_condition(f"past-medical-{idx}", med_hist, "resolved")))

        # 4. Past Surgical History as Procedures
        for idx, surg_hist in enumerate(ontology.past_surgical_history):
            entries.append(self._to_bundle_entry(self._build_procedure(f"past-surgical-{idx}", surg_hist)))

        # 5. Drug History as MedicationStatements
        for idx, drug in enumerate(ontology.drug_history):
            entries.append(self._to_bundle_entry(self._build_medication_statement(f"medication-{idx}", drug)))

        # 6. Allergy History as AllergyIntolerances
        for idx, allergy in enumerate(ontology.allergy_history):
            entries.append(self._to_bundle_entry(self._build_allergy_intolerance(f"allergy-{idx}", allergy)))

        # 7. AYUSH Parameters as Observations (if present)
        if ontology.ayush:
            ayush = ontology.ayush
            ayush_fields = [
                ("prakriti", ayush.prakriti),
                ("vikriti", ayush.vikriti),
                ("sara", ayush.sara),
                ("samhanana", ayush.samhanana),
                ("pramana", ayush.pramana),
                ("satmya", ayush.satmya),
                ("sattva", ayush.sattva),
                ("ahara_shakti", ayush.ahara_shakti),
                ("vyayama_shakti", ayush.vyayama_shakti),
                ("vaya", ayush.vaya),
                ("ahara_vihara", ayush.ahara_vihara)
            ]
            for name, val in ayush_fields:
                if val:
                    entries.append(self._to_bundle_entry(self._build_observation(f"ayush-{name.replace('_', '-')}", val, category="ayush")))

        # 8. Scanned Documents as DocumentReferences
        if documents:
            for idx, doc in enumerate(documents):
                entries.append(self._to_bundle_entry(self._build_document_reference(f"doc-ref-{idx}", doc)))

        # Compile Bundle
        bundle = {
            "resourceType": "Bundle",
            "type": "document",
            "entry": entries
        }
        return bundle

    def _to_bundle_entry(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "fullUrl": f"urn:uuid:{resource.get('id')}",
            "resource": resource
        }

    def _build_condition(self, condition_id: str, code_text: str, clinical_status: str) -> Dict[str, Any]:
        return {
            "resourceType": "Condition",
            "id": condition_id,
            "clinicalStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                        "code": clinical_status
                    }
                ]
            },
            "code": {
                "text": code_text
            },
            "subject": {
                "reference": self.patient_id
            }
        }

    def _build_observation(self, obs_id: str, value_text: str, category: str = "hpi") -> Dict[str, Any]:
        return {
            "resourceType": "Observation",
            "id": obs_id,
            "status": "final",
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                            "code": category
                        }
                    ]
                }
            ],
            "code": {
                "text": obs_id.replace("-", " ").title()
            },
            "subject": {
                "reference": self.patient_id
            },
            "valueString": value_text
        }

    def _build_procedure(self, proc_id: str, note: str) -> Dict[str, Any]:
        return {
            "resourceType": "Procedure",
            "id": proc_id,
            "status": "completed",
            "code": {
                "text": note
            },
            "subject": {
                "reference": self.patient_id
            }
        }

    def _build_medication_statement(self, med_id: str, medication_text: str) -> Dict[str, Any]:
        return {
            "resourceType": "MedicationStatement",
            "id": med_id,
            "status": "active",
            "medicationCodeableConcept": {
                "text": medication_text
            },
            "subject": {
                "reference": self.patient_id
            }
        }

    def _build_allergy_intolerance(self, allergy_id: str, allergy_text: str) -> Dict[str, Any]:
        return {
            "resourceType": "AllergyIntolerance",
            "id": allergy_id,
            "clinicalStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                        "code": "active"
                    }
                ]
            },
            "code": {
                "text": allergy_text
            },
            "patient": {
                "reference": self.patient_id
            }
        }

    def _build_document_reference(self, doc_id: str, doc_details: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "resourceType": "DocumentReference",
            "id": doc_id,
            "status": "current",
            "docStatus": "final",
            "type": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "34133-9",
                        "display": "Summarization of episode note"
                    }
                ]
            },
            "subject": {
                "reference": self.patient_id
            },
            "content": [
                {
                    "attachment": {
                        "contentType": doc_details.get("content_type", "application/pdf"),
                        "url": doc_details.get("url", ""),
                        "title": doc_details.get("title", "Digitized Scan")
                    }
                }
            ]
        }

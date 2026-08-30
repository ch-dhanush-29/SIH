"""
Unit tests for the MediKiosk platform.
Verifies red-flag safety rules, state machine transitions, DPDP consent/purging, and FHIR mapping.
"""

import unittest
import os
from medikiosk.ontology import check_red_flags, SOCRATES_HPI, ClinicalOntology
from medikiosk.module_d.state_machine import SessionStateMachine, StateMachineError
from medikiosk.module_d.consent_manager import ConsentManager
from medikiosk.module_d.fhir_builder import FHIRBundleBuilder
from medikiosk.module_b.ocr_pipeline import DocumentDigitizer, TesseractIndicOCRProvider
from medikiosk.module_a.dialogue_manager import DialogueManager
from medikiosk.module_c.summary_generator import SummaryGenerator
from medikiosk.his.his_translator import HISTranslator

class TestRedFlagRules(unittest.TestCase):
    def test_rf_001_acs_triggered(self):
        # Chest pain + radiation to left arm
        hpi = SOCRATES_HPI(radiation="moves to my left arm")
        alert = check_red_flags("severe chest pain", hpi)
        self.assertIsNotNone(alert)
        self.assertEqual(alert["id"], "RF-001")
        self.assertIn("ACUTE CORONARY SYNDROME", alert["alert_message"])

        # Chest pain + breathlessness (association)
        hpi2 = SOCRATES_HPI(association=["breathlessness", "sweating"])
        alert2 = check_red_flags("chest tightness", hpi2)
        self.assertIsNotNone(alert2)
        self.assertEqual(alert2["id"], "RF-001")

    def test_rf_001_acs_not_triggered(self):
        # Chest pain alone (without radiation/breathlessness) does not trigger RF-001
        # It triggers RF-005 (Severe Dyspnea) only if chief complaint is breathlessness.
        # Wait, let's verify if chest pain alone triggers anything.
        hpi = SOCRATES_HPI()
        alert = check_red_flags("chest pain", hpi)
        self.assertFalse(alert is not None and alert["id"] == "RF-001")

    def test_rf_002_stroke_triggered(self):
        # Triggered by slurred speech chief complaint
        hpi = SOCRATES_HPI()
        alert = check_red_flags("slurred speech", hpi)
        self.assertIsNotNone(alert)
        self.assertEqual(alert["id"], "RF-002")

        # Triggered by association
        hpi2 = SOCRATES_HPI(association=["unilateral weakness"])
        alert2 = check_red_flags("numbness", hpi2)
        self.assertIsNotNone(alert2)
        self.assertEqual(alert2["id"], "RF-002")

    def test_rf_003_sepsis_triggered(self):
        # Fever + altered mental status
        hpi = SOCRATES_HPI(association=["confusion"])
        alert = check_red_flags("High fever since 3 days", hpi)
        self.assertIsNotNone(alert)
        self.assertEqual(alert["id"], "RF-003")

    def test_rf_004_anaphylaxis_triggered(self):
        # Allergy/rash + throat tightness
        hpi = SOCRATES_HPI(association=["throat tightness"])
        alert = check_red_flags("severe skin rash", hpi)
        self.assertIsNotNone(alert)
        self.assertEqual(alert["id"], "RF-004")

    def test_rf_005_severe_dyspnea_triggered(self):
        # Breathlessness chief complaint
        hpi = SOCRATES_HPI()
        alert = check_red_flags("breathlessness", hpi)
        self.assertIsNotNone(alert)
        self.assertEqual(alert["id"], "RF-005")


class TestStateMachine(unittest.TestCase):
    def setUp(self):
        self.sm = SessionStateMachine()

    def test_initial_state(self):
        self.assertEqual(self.sm.state, SessionStateMachine.IDLE)
        self.assertFalse(self.sm.physician_confirmed)

    def test_valid_flow(self):
        self.sm.transition_to(SessionStateMachine.CONSENT_PENDING)
        self.sm.transition_to(SessionStateMachine.IDENTIFICATION)
        self.sm.transition_to(SessionStateMachine.INTAKE_ACTIVE)
        self.sm.transition_to(SessionStateMachine.SUMMARY_PENDING_REVIEW)
        
        # Enforce confirm before submit
        with self.assertRaises(StateMachineError):
            self.sm.transition_to(SessionStateMachine.SUBMITTED)

        self.sm.confirm_physician()
        self.assertEqual(self.sm.state, SessionStateMachine.CONFIRMED)
        self.assertTrue(self.sm.physician_confirmed)
        
        self.sm.transition_to(SessionStateMachine.SUBMITTED)
        self.assertEqual(self.sm.state, SessionStateMachine.SUBMITTED)

    def test_red_flag_override(self):
        # Red flag can transition from ANY state
        self.sm.transition_to(SessionStateMachine.CONSENT_PENDING)
        self.sm.transition_to(SessionStateMachine.RED_FLAG_ALERT)
        self.assertEqual(self.sm.state, SessionStateMachine.RED_FLAG_ALERT)


class TestConsentManager(unittest.TestCase):
    def setUp(self):
        self.test_log = "test_consent_audit_log.csv"
        self.cm = ConsentManager(log_file_path=self.test_log)

    def tearDown(self):
        if os.path.exists(self.test_log):
            os.remove(self.test_log)

    def test_granular_consent_logging(self):
        self.cm.start_session("session_001", "patient_99")
        self.assertFalse(self.cm.consent_voice_intake)
        
        self.cm.grant_consent("voice_intake", "Voice conversation history capture")
        self.assertTrue(self.cm.consent_voice_intake)
        
        self.cm.update_session_data("demographics", {"name": "Arjun"})
        self.assertEqual(self.cm.session_data["demographics"]["name"], "Arjun")

        # DPDP purge validation
        self.cm.purge_session()
        self.assertFalse(self.cm.session_active)
        self.assertEqual(len(self.cm.session_data), 0)
        self.assertFalse(self.cm.consent_voice_intake)


class TestFHIRBundleBuilder(unittest.TestCase):
    def test_fhir_mapping(self):
        hpi = SOCRATES_HPI(site="chest", onset="1 hour ago", radiation="left arm", association=["sweating"])
        ontology = ClinicalOntology(
            chief_complaint="chest pain",
            hpi=hpi,
            past_medical_history=["Hypertension"],
            drug_history=["Metformin 500mg"]
        )
        
        builder = FHIRBundleBuilder(patient_id="Patient/100")
        bundle = builder.build_bundle(ontology)
        
        self.assertEqual(bundle["resourceType"], "Bundle")
        self.assertEqual(bundle["type"], "document")
        
        # Verify specific resource types exist in the entries
        resource_types = [entry["resource"]["resourceType"] for entry in bundle["entry"]]
        self.assertIn("Condition", resource_types)
        self.assertIn("Observation", resource_types)
        self.assertIn("MedicationStatement", resource_types)
        
        # Check specific mapped fields
        cc_res = [e["resource"] for e in bundle["entry"] if e["resource"]["id"] == "chief-complaint"][0]
        self.assertEqual(cc_res["code"]["text"], "chest pain")
        self.assertEqual(cc_res["subject"]["reference"], "Patient/100")


class TestDialogueManagerAllComplaints(unittest.TestCase):
    def test_all_10_complaints_flow(self):
        complaints = [
            "chest pain", "fever", "cough", "abdominal pain", "headache",
            "breathlessness", "joint pain", "vomiting", "diarrhea", "skin rash", "dizziness"
        ]
        for cc in complaints:
            dm = DialogueManager()
            dm.start_dialogue(cc)
            self.assertTrue(dm.dialogue_active or dm.red_flag_triggered)
            q = dm.get_next_question()
            if not dm.red_flag_triggered:
                self.assertIsNotNone(q)
                self.assertIsInstance(q, str)

class TestAYUSHBundleMapping(unittest.TestCase):
    def test_ayush_observations_in_bundle(self):
        from medikiosk.ontology import AYUSHExtension
        ayush = AYUSHExtension(
            prakriti="Vata-Pitta",
            vikriti="Kapha Vriddhi",
            sara="Rasa Sara",
            ahara_shakti="Pravara (Strong digestion)"
        )
        ontology = ClinicalOntology(
            chief_complaint="joint pain",
            ayush=ayush
        )
        builder = FHIRBundleBuilder(patient_id="Patient/AYUSH-01")
        bundle = builder.build_bundle(ontology)
        
        obs_ids = [e["resource"]["id"] for e in bundle["entry"] if e["resource"]["resourceType"] == "Observation"]
        self.assertIn("ayush-prakriti", obs_ids)
        self.assertIn("ayush-vikriti", obs_ids)
        self.assertIn("ayush-sara", obs_ids)
        self.assertIn("ayush-ahara-shakti", obs_ids)

class TestHISTranslation(unittest.TestCase):
    def setUp(self):
        ontology = ClinicalOntology(
            chief_complaint="abdominal pain",
            past_medical_history=["Gastritis"],
            drug_history=["Pantoprazole 40mg OD"]
        )
        builder = FHIRBundleBuilder(patient_id="Patient/HIS-99")
        self.bundle = builder.build_bundle(ontology)

    def test_hl7_v2_translation(self):
        translator = HISTranslator(target_format="HL7_V2")
        res = translator.translate_and_send(self.bundle)
        self.assertEqual(res["format"], "HL7_V2_ORU")
        self.assertIn("MSH|", res["payload"])
        self.assertIn("PID|1||HIS-99", res["payload"])
        self.assertIn("OBX|1|TX|CC^Chief Complaint||abdominal pain", res["payload"])

    def test_custom_json_translation(self):
        translator = HISTranslator(target_format="CUSTOM_JSON")
        res = translator.translate_and_send(self.bundle)
        self.assertEqual(res["format"], "CUSTOM_JSON")
        self.assertEqual(res["payload"]["chiefComplaint"], "abdominal pain")
        self.assertIn("Gastritis", res["payload"]["diagnoses"])
        self.assertIn("Pantoprazole 40mg OD", res["payload"]["medications"])

class TestDocumentDigitization(unittest.TestCase):
    def test_ocr_and_abnormal_flagging(self):
        digitizer = DocumentDigitizer(TesseractIndicOCRProvider())
        results = digitizer.process_document(b"sample_prescription_bytes")
        
        self.assertIn("diagnoses", results)
        self.assertIn("medications", results)
        self.assertIn("lab_results", results)
        
        # Verify abnormal flags are computed correctly
        hba1c_lab = [l for l in results["lab_results"] if l["test_name"] == "HBA1C"][0]
        self.assertEqual(hba1c_lab["flag"], "HIGH")

if __name__ == "__main__":
    unittest.main()

"""
Unit Tests for AYUSH Dashavidha Pariksha, Scored Prakriti-Vikriti Engine,
and NAMASTE ↔ ICD-11-TM2 Registry Adapter.
"""

import unittest
from medikiosk.ontology import ClinicalOntology, SOCRATES_HPI, AYUSHExtension, NAMASTECode, FHIR_MAPPING_CONTRACTS
from medikiosk.ayush.namaste_registry import get_namaste_client, SEED_NAMASTE_REGISTRY
from medikiosk.ayush.prakriti_quiz import PRAKRITI_QUESTIONNAIRE, calculate_prakriti_scores, evaluate_vikriti_imbalance
from medikiosk.module_d.fhir_builder import FHIRBundleBuilder
from medikiosk.module_c.summary_generator import SummaryGenerator
from medikiosk.module_d.state_machine import SessionStateMachine

class TestAYUSHNamasteModule(unittest.TestCase):
    def setUp(self):
        self.namaste_client = get_namaste_client()

    def test_namaste_registry_seeded_count_and_fields(self):
        """Verify the local seeded reference registry contains at least 35 disease pairs with required fields."""
        self.assertGreaterEqual(len(SEED_NAMASTE_REGISTRY), 35)
        for item in SEED_NAMASTE_REGISTRY:
            self.assertIn("namaste_code", item)
            self.assertIn("namaste_term", item)
            self.assertIn("category", item)
            self.assertTrue(item["namaste_code"].startswith("AYU-"))

    def test_namaste_search_and_exact_lookup(self):
        """Verify search by term, symptom, category, and code."""
        # Search by term
        results = self.namaste_client.search_codes("Sandhigata")
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0].namaste_code, "AYU-VV-001")
        self.assertEqual(results[0].icd11_tm2_code, "TM2-MSK-01")

        # Search by allopathic equivalent
        results_gerd = self.namaste_client.search_codes("GERD")
        self.assertGreater(len(results_gerd), 0)
        self.assertIn("Amlapitta", results_gerd[0].namaste_term)

        # Lookup by exact code
        exact = self.namaste_client.get_by_code("AYU-MB-001")
        self.assertIsNotNone(exact)
        self.assertIn("Prameha", exact.namaste_term)
        self.assertEqual(exact.icd11_tm2_code, "TM2-MET-01")

    def test_prakriti_quiz_scoring_calculation(self):
        """Verify quantitative calculation of Vata, Pitta, and Kapha percentage scores."""
        # Simulated responses with strong Vata bias
        vata_answers = {
            "frame_skin": "Vata",
            "appetite_digestion": "Vata",
            "weather_tolerance": "Vata",
            "sleep_dreams": "Vata",
            "mental_temperament": "Pitta",
            "activity_speech": "Vata"
        }
        res = calculate_prakriti_scores(vata_answers)
        self.assertIn("vata_score", res)
        self.assertIn("pitta_score", res)
        self.assertIn("kapha_score", res)
        self.assertAlmostEqual(res["vata_score"] + res["pitta_score"] + res["kapha_score"], 100.0, delta=0.5)
        self.assertGreater(res["vata_score"], 60.0)
        self.assertIn("Vata", res["dominant_prakriti"])

    def test_vikriti_imbalance_evaluation(self):
        """Verify active doshic morbidity calculation against baseline Prakriti."""
        prakriti = {"vata_score": 40.0, "pitta_score": 40.0, "kapha_score": 20.0}
        symptoms = ["severe burning sensation in stomach", "acid reflux", "skin redness with itching"]
        vikriti = evaluate_vikriti_imbalance(prakriti, symptoms, vikriti_selection="Pittaja")
        self.assertEqual(vikriti["primary_vitiated_dosha"], "Pitta")
        self.assertGreater(vikriti["vikriti_pitta"], vikriti["vikriti_vata"])

    def test_fhir_bundle_includes_all_10_dashavidha_parameters_and_namaste(self):
        """Verify FHIR R4 Bundle Builder maps all 10 Dashavidha observations + NAMASTE Condition codings."""
        namaste_entry = self.namaste_client.get_by_code("AYU-VV-001")
        ayush_ext = AYUSHExtension(
            prakriti="Vata-Pitta",
            vikriti="Vataja",
            sara="Madhyama Sara",
            samhanana="Susamhata",
            pramana="Sama Pramana",
            satmya="Sarva Rasa Satmya",
            sattva="Pravara Sattva",
            ahara_shakti="Samagni",
            vyayama_shakti="Pravara",
            vaya="Madhyama Vaya",
            ahara_vihara="Satmya Ahara",
            vata_score=55.0,
            pitta_score=35.0,
            kapha_score=10.0,
            namaste_diagnoses=[namaste_entry] if namaste_entry else [],
            nidana="Cold climate exposure and heavy dry diet",
            samprapti="Vata vitiation in Sandhi capsular spaces"
        )
        ontology = ClinicalOntology(
            chief_complaint="knee joint pain",
            hpi=SOCRATES_HPI(site="Bilateral Knee joints", severity="6/10"),
            ayush=ayush_ext
        )

        builder = FHIRBundleBuilder(patient_id="Patient/SIM-91-AYUSH-001")
        bundle = builder.build_bundle(ontology)

        entries = bundle.get("entry", [])
        obs_types = [e["resource"]["id"] for e in entries if e["resource"]["resourceType"] == "Observation"]
        
        # Verify 10 Dashavidha parameters are present as Observation entries
        self.assertTrue(any("ayush-prakriti" in o for o in obs_types))
        self.assertTrue(any("ayush-vikriti" in o for o in obs_types))
        self.assertTrue(any("ayush-sara" in o for o in obs_types))
        self.assertTrue(any("ayush-samhanana" in o for o in obs_types))
        self.assertTrue(any("ayush-pramana" in o for o in obs_types))
        self.assertTrue(any("ayush-satmya" in o for o in obs_types))
        self.assertTrue(any("ayush-sattva" in o for o in obs_types))
        self.assertTrue(any("ayush-ahara-shakti" in o for o in obs_types))
        self.assertTrue(any("ayush-vyayama-shakti" in o for o in obs_types))
        self.assertTrue(any("ayush-vaya" in o for o in obs_types))
        self.assertTrue(any("ayush-dosha-balance" in o for o in obs_types))

        # Verify NAMASTE traditional Condition entry
        conditions = [e["resource"] for e in entries if e["resource"]["resourceType"] == "Condition"]
        namaste_conditions = [c for c in conditions if any(cd.get("system") == "http://namaste.ayush.gov.in" for cd in c.get("code", {}).get("coding", []))]
        self.assertGreater(len(namaste_conditions), 0)
        self.assertEqual(namaste_conditions[0]["code"]["coding"][0]["code"], "AYU-VV-001")

    def test_vaidya_summary_generation_and_confirm_gate(self):
        """Verify Vaidya clinical summary format and state machine transition to review state."""
        sm = SessionStateMachine()
        sm.transition_to(SessionStateMachine.CONSENT_PENDING)
        sm.transition_to(SessionStateMachine.IDENTIFICATION)
        sm.transition_to(SessionStateMachine.INTAKE_ACTIVE)

        generator = SummaryGenerator(state_machine=sm)
        ayush_data = {
            "prakriti": "Vata-Kapha",
            "vikriti": "Vataja",
            "vata_score": 60.0,
            "pitta_score": 20.0,
            "kapha_score": 20.0,
            "sara": "Pravara",
            "ahara_shakti": "Samagni",
            "namaste_diagnoses": [{"namaste_code": "AYU-VV-001", "namaste_term": "Sandhigata Vata", "icd11_tm2_code": "TM2-MSK-01"}]
        }
        dialogue_data = {"chief_complaint": "Joint Pain"}
        ocr_data = {"medications": [{"name": "Yograj Guggulu", "dose": "2 Tablets", "frequency": "BD", "system": "Ayurveda"}]}

        summary = generator.generate_vaidya_summary(ayush_data, dialogue_data, ocr_data)
        self.assertIn("english", summary)
        self.assertIn("hindi", summary)
        self.assertIn("DOSHA PARIKSHA", summary["english"])
        self.assertIn("Sandhigata Vata", summary["english"])
        self.assertIn("CONFIRM-GATE", summary["english"])
        self.assertEqual(sm.state, SessionStateMachine.SUMMARY_PENDING_REVIEW)

if __name__ == "__main__":
    unittest.main()

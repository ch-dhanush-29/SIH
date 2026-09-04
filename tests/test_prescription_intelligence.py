"""
Unit Tests for Prescription Intelligence:
1. Per-Field Confidence Scoring & Verification Threshold Flags
2. Dosage Sanity Range Validation & Abnormal Alerts
3. Drug-Drug Interaction (DDI) Rule Engine
4. Multi-Prescription Reconciliation Engine
5. Classical Ayurvedic Formulation Entity Extraction
"""

import unittest
from medikiosk.module_b.ocr_pipeline import (
    ClinicalEntityExtractor,
    DocumentDigitizer,
    OCRProviderInterface,
    validate_dosage,
    check_drug_interactions,
    reconcile_prescriptions,
    ALLOPATHIC_LEXICON_EXPANDED,
    AYURVEDIC_FORMULATION_LEXICON,
    DRUG_INTERACTION_REGISTRY
)

class SamplePrescriptionProvider(OCRProviderInterface):
    def perform_ocr(self, document_bytes: bytes) -> str:
        return (
            "PRESCRIPTION RECORD\n"
            "Date: 28/08/2026\n"
            "Dr. R. K. Sharma\n"
            "Rx:\n"
            "1. Tab Metformin 500mg - 1 BD x 30 Days\n"
            "2. Tab Telmisartan 40mg - 1 OD x 30 Days\n"
            "3. Tab Aspirin 75mg - 1 OD x 30 Days\n"
            "4. Tab Clopidogrel 75mg - 1 OD x 30 Days\n"
            "5. Churna Sitopaladi Churna 3g - Twice daily with honey\n"
            "6. Vati Yograj Guggulu 2 Tablets - BD with warm water\n"
        )

class OutOfRangePrescriptionProvider(OCRProviderInterface):
    def perform_ocr(self, document_bytes: bytes) -> str:
        return (
            "PRESCRIPTION RECORD\n"
            "Date: 28/08/2026\n"
            "Dr. Mehta\n"
            "Rx:\n"
            "1. Tab Paracetamol 5000mg - STAT\n"  # Extreme lethal overdose
            "2. Tab Glimepiride 15mg - 1 OD\n"   # Max daily is 8mg
        )

class TestPrescriptionIntelligence(unittest.TestCase):
    def setUp(self):
        self.extractor = ClinicalEntityExtractor()

    def test_per_field_confidence_calculation_and_tiers(self):
        """Verify confidence scoring logic returns EXACT, FUZZY, and UNMATCHED tiers with verify flags."""
        # Exact Match
        score_exact, tier_exact, needs_v_exact = self.extractor.calculate_confidence_score("Metformin", "metformin")
        self.assertGreaterEqual(score_exact, 0.95)
        self.assertEqual(tier_exact, "EXACT")
        self.assertFalse(needs_v_exact)

        # Fuzzy Match (Minor OCR artifact)
        score_fuzzy, tier_fuzzy, needs_v_fuzzy = self.extractor.calculate_confidence_score("Metformn", "metformin")
        self.assertGreaterEqual(score_fuzzy, 0.80)
        self.assertEqual(tier_fuzzy, "FUZZY")

        # Unmatched / Low Confidence Token
        score_unm, tier_unm, needs_v_unm = self.extractor.calculate_confidence_score("Xyloquat-ABC", None)
        self.assertLess(score_unm, 0.75)
        self.assertEqual(tier_unm, "UNMATCHED")
        self.assertTrue(needs_v_unm)

    def test_dosage_sanity_validation_flags_abnormal_and_safe_doses(self):
        """Verify dosage sanity validation correctly flags safe, sub-therapeutic, and dangerous dosages."""
        # Normal safe dose
        safe_res = validate_dosage("Paracetamol", "650mg")
        self.assertEqual(safe_res["flag"], "NORMAL")
        self.assertFalse(safe_res["is_abnormal"])

        # Critical High Overdose
        overdose_res = validate_dosage("Paracetamol", "5000mg")
        self.assertIn("HIGH", overdose_res["flag"])
        self.assertTrue(overdose_res["is_abnormal"])

        # High single dose
        high_res = validate_dosage("Telmisartan", "160mg")
        self.assertTrue(high_res["is_abnormal"])

    def test_drug_drug_interaction_checker(self):
        """Verify DDI engine detects clinically significant interactions like Aspirin + Clopidogrel."""
        meds = [
            {"name": "Ecosprin", "generic_name": "Aspirin (Enteric-Coated)"},
            {"name": "Clopilet", "generic_name": "Clopidogrel Bisulfate"},
            {"name": "Metformin", "generic_name": "Metformin Hydrochloride"}
        ]
        interactions = check_drug_interactions(meds)
        self.assertGreater(len(interactions), 0)
        interaction_ids = [i["rule_id"] for i in interactions]
        self.assertIn("DDI-001", interaction_ids)
        self.assertEqual(interactions[0]["severity"], "MODERATE")

    def test_critical_ddi_warfarin_and_nsaid(self):
        """Verify critical interaction between Warfarin and NSAID (Voveran / Diclofenac)."""
        meds = [
            {"name": "Warfarin", "generic_name": "Warfarin Sodium"},
            {"name": "Voveran", "generic_name": "Diclofenac Sodium"}
        ]
        interactions = check_drug_interactions(meds)
        self.assertEqual(len(interactions), 1)
        self.assertEqual(interactions[0]["severity"], "CRITICAL")
        self.assertIn("Bleeding", interactions[0]["interaction_name"])

    def test_multi_prescription_reconciliation_detects_duplicates_and_overlaps(self):
        """Verify multi-document reconciliation detects duplicates, dose changes, and creates active list."""
        doc1 = {
            "file_name": "Prescription_Aug2025.pdf",
            "medications": [
                {"name": "Metformin", "generic_name": "Metformin Hydrochloride", "dose": "500mg", "drug_class": "Antidiabetic"},
                {"name": "Pantoprazole", "generic_name": "Pantoprazole Sodium", "dose": "40mg", "drug_class": "Proton Pump Inhibitor"}
            ]
        }
        doc2 = {
            "file_name": "Prescription_Aug2026.pdf",
            "medications": [
                {"name": "Glycomet", "generic_name": "Metformin Hydrochloride", "dose": "1000mg", "drug_class": "Antidiabetic"},
                {"name": "Omeprazole", "generic_name": "Omeprazole", "dose": "20mg", "drug_class": "Proton Pump Inhibitor"},
                {"name": "Telmisartan", "generic_name": "Telmisartan", "dose": "40mg", "drug_class": "Antihypertensive"}
            ]
        }
        reconciliation = reconcile_prescriptions([doc1, doc2])
        self.assertEqual(reconciliation["total_source_prescriptions"], 2)
        self.assertGreater(len(reconciliation["duplicates_detected"]), 0)
        self.assertEqual(reconciliation["duplicates_detected"][0]["type"], "DOSE_MODIFICATION")
        self.assertGreater(len(reconciliation["class_overlaps"]), 0)  # Both PPIs present
        self.assertTrue(reconciliation["has_conflicts"])

    def test_classical_ayurvedic_formulations_extraction(self):
        """Verify that classical Ayurvedic preparations (Churna, Vati, Kwatha) are extracted and classified."""
        digitizer = DocumentDigitizer(SamplePrescriptionProvider())
        result = digitizer.process_document(b"ayush_prescription_bytes")
        meds = result["medications"]

        med_names = [m["name"] for m in meds]
        self.assertIn("Sitopaladi Churna", med_names)
        self.assertIn("Yograj Guggulu", med_names)

        sitopaladi = [m for m in meds if m["name"] == "Sitopaladi Churna"][0]
        self.assertEqual(sitopaladi["system"], "Ayurveda")
        self.assertEqual(sitopaladi["form"], "Churna")

    def test_bounding_box_generation(self):
        """Verify bounding boxes are generated with normalized coordinates [ymin, xmin, ymax, xmax]."""
        digitizer = DocumentDigitizer(SamplePrescriptionProvider())
        result = digitizer.process_document(b"prescription_bytes")
        boxes = result.get("bounding_boxes", [])
        self.assertGreater(len(boxes), 0)
        for b in boxes:
            self.assertIn("box", b)
            self.assertEqual(len(b["box"]), 4)
            ymin, xmin, ymax, xmax = b["box"]
            self.assertTrue(0.0 <= ymin <= 100.0)
            self.assertTrue(0.0 <= xmax <= 100.0)

if __name__ == "__main__":
    unittest.main()

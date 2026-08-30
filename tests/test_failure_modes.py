"""
MediKiosk Failure-Mode & Resilience Test Suite.
Tests edge cases, input anomalies, unexpected session terminations, and unreadable scans.
"""

import unittest
from medikiosk.ontology import ClinicalOntology, SOCRATES_HPI, check_red_flags
from medikiosk.module_d.state_machine import SessionStateMachine, StateMachineError
from medikiosk.module_d.consent_manager import ConsentManager
from medikiosk.module_b.ocr_pipeline import DocumentDigitizer, OCRProviderInterface
from medikiosk.module_a.dialogue_manager import DialogueManager

class CorruptedOCRProvider(OCRProviderInterface):
    """Simulates a torn, unreadable, or blurry scanned document."""
    def perform_ocr(self, document_bytes: bytes) -> str:
        return "### [BLURRY/TORN ARTIFACTS - UNREADABLE TEXT] ###"

class EmptyOCRProvider(OCRProviderInterface):
    """Simulates a blank page scan."""
    def perform_ocr(self, document_bytes: bytes) -> str:
        return ""

class TestFailureModes(unittest.TestCase):
    def test_corrupted_prescription_scan_graceful_handling(self):
        """Verify that a blurry or torn document does not crash the pipeline and produces empty/safe records."""
        digitizer = DocumentDigitizer(CorruptedOCRProvider())
        res = digitizer.process_document(b"corrupted_bytes")
        self.assertEqual(res["diagnoses"], [])
        self.assertEqual(res["medications"], [])
        self.assertEqual(res["lab_results"], [])

    def test_empty_prescription_scan(self):
        """Verify that an empty document scan is handled cleanly."""
        digitizer = DocumentDigitizer(EmptyOCRProvider())
        res = digitizer.process_document(b"")
        self.assertEqual(res["diagnoses"], [])
        self.assertEqual(res["medications"], [])
        self.assertEqual(res["lab_results"], [])

    def test_unsupported_chief_complaint_fallback(self):
        """Verify that an unlisted or rare chief complaint falls back to generic SOCRATES questions safely."""
        dm = DialogueManager()
        dm.start_dialogue("unusual sensation in big toe")
        self.assertTrue(dm.dialogue_active)
        q = dm.get_next_question()
        self.assertIsNotNone(q)
        self.assertIn("Where exactly", q)

    def test_mid_session_consent_revocation_purges_only_revoked_scope(self):
        """Verify that revoking document scan consent deletes scanned docs while preserving other session data until purge."""
        cm = ConsentManager(log_file_path="test_resilience_log.csv")
        cm.start_session("sess_fail_01", "P_FAIL")
        cm.grant_consent("voice_intake", "Voice intake")
        cm.grant_consent("document_scan", "Scan docs")
        
        cm.update_session_data("clinical_history", {"cc": "cough"})
        cm.update_session_data("ocr_documents", {"diagnoses": ["Asthma"]})
        
        # Revoke document scan
        cm.revoke_consent("document_scan", "Patient changed mind on documents")
        self.assertEqual(cm.session_data["ocr_documents"], {})
        self.assertIn("cc", cm.session_data["clinical_history"])
        
        cm.purge_session()
        self.assertEqual(len(cm.session_data), 0)

    def test_state_machine_invalid_jump_prevention(self):
        """Verify that unauthorized state jumps (e.g. IDLE directly to SUBMITTED) are strictly rejected."""
        sm = SessionStateMachine()
        with self.assertRaises(StateMachineError):
            sm.transition_to(SessionStateMachine.SUBMITTED)

        with self.assertRaises(StateMachineError):
            sm.transition_to(SessionStateMachine.CONFIRMED)

if __name__ == "__main__":
    unittest.main()

"""
Unit & Integration Tests for MediKiosk Module D ABDM Client & Simulation Layer.
Verifies:
  1. ABDMClientInterface contract compliance
  2. SimulatedABDMClient functionality (all 5 core methods, returning vs new patient histories)
  3. Realistic consent state machine & SIM- prefix tagging
  4. Swappability via ABDM_MODE environment variable (Simulated vs Live stub)
"""

import os
import unittest
from medikiosk.module_d.abdm_client import (
    ABDMClientInterface,
    SimulatedABDMClient,
    LiveABDMClient,
    get_abdm_client,
    DEMO_PATIENTS_REGISTRY
)


class TestABDMClientSimulation(unittest.TestCase):

    def setUp(self):
        self.client = SimulatedABDMClient()

    def test_verify_or_create_abha_returning_patient(self):
        """Verify that a seeded returning patient (Rameshwar Prasad) returns full profile with care contexts."""
        profile = self.client.verify_or_create_abha("SIM-91-2001-0000-0001")
        self.assertEqual(profile["name"], "Rameshwar Prasad")
        self.assertEqual(profile["gender"], "M")
        self.assertTrue(profile["simulated"])
        self.assertTrue(profile["is_returning_patient"])
        self.assertGreaterEqual(len(profile["care_contexts"]), 2)
        self.assertTrue(profile["abha_number"].startswith("SIM-"))

    def test_verify_or_create_abha_new_patient(self):
        """Verify that a brand new patient has empty prior care contexts."""
        profile = self.client.verify_or_create_abha("SIM-91-1001-0000-0001")
        self.assertEqual(profile["name"], "Ananya Sharma")
        self.assertFalse(profile["is_returning_patient"])
        self.assertEqual(len(profile["care_contexts"]), 0)
        self.assertTrue(profile["simulated"])

    def test_dynamic_synthetic_abha_generation(self):
        """Verify that unseeded inputs generate valid synthetic profiles tagged with SIM-."""
        profile = self.client.verify_or_create_abha("New Unseeded Patient")
        self.assertTrue(profile["abha_number"].startswith("SIM-91-1099"))
        self.assertTrue(profile["simulated"])
        self.assertEqual(profile["status"], "NEW_ABHA_REGISTERED_SIMULATED")

    def test_request_consent_flow(self):
        """Verify consent artifact creation and status."""
        profile = self.client.verify_or_create_abha("SIM-91-2001-0000-0001")
        consent = self.client.request_consent(profile, purpose="CARETREE")
        self.assertTrue(consent["consent_id"].startswith("SIM-CONSENT-"))
        self.assertEqual(consent["status"], "GRANTED")
        self.assertTrue(consent["simulated"])
        self.assertIn("voice_intake", consent["granular_scopes"])

    def test_link_care_context_and_fetch_history(self):
        """Verify registering a new care context updates patient's history."""
        abha_id = "SIM-91-1001-0000-0001"
        history_bundle = {
            "chief_complaint": "Acute pharyngitis & fever",
            "diagnoses": ["Acute Pharyngitis"],
            "medications": [{"name": "Amoxicillin", "dose": "500mg", "frequency": "TDS"}],
            "lab_results": []
        }
        link_res = self.client.link_care_context(abha_id, history_bundle)
        self.assertEqual(link_res["status"], "CARE_CONTEXT_LINKED_SIMULATED")
        self.assertTrue(link_res["care_context_reference"].startswith("CC-SIM-"))

        # Fetch history and verify it now contains 1 encounter
        history = self.client.fetch_linked_history(abha_id)
        self.assertTrue(history["is_returning_patient"])
        self.assertEqual(history["total_care_contexts"], 1)
        self.assertEqual(history["care_contexts"][0]["chief_complaint"], "Acute pharyngitis & fever")

    def test_push_fhir_bundle_simulation(self):
        """Verify pushing FHIR R4 Bundle to simulated gateway."""
        fake_bundle = {"resourceType": "Bundle", "type": "document", "entry": [{"resource": {"resourceType": "Condition"}}]}
        res = self.client.push_fhir_bundle(fake_bundle, target_his="FHIR_R4")
        self.assertEqual(res["status"], "FHIR_BUNDLE_ACCEPTED_SIMULATED")
        self.assertTrue(res["transaction_id"].startswith("SIM-TX-"))
        self.assertEqual(res["entries_transferred"], 1)
        self.assertTrue(res["simulated"])

    def test_camel_case_method_aliases(self):
        """Confirm camelCase method aliases (verifyOrCreateABHA, requestConsent, etc.) match interface."""
        p = self.client.verifyOrCreateABHA("SIM-91-2001-0000-0001")
        self.assertEqual(p["name"], "Rameshwar Prasad")
        c = self.client.requestConsent(p, "CARETREE")
        self.assertEqual(c["status"], "GRANTED")
        h = self.client.fetchLinkedHistory(p["abha_number"])
        self.assertTrue(h["is_returning_patient"])


class TestABDMSwapPath(unittest.TestCase):

    def test_simulated_mode_factory_selection(self):
        """Confirm ABDM_MODE='simulated' returns SimulatedABDMClient."""
        os.environ["ABDM_MODE"] = "simulated"
        client = get_abdm_client()
        self.assertIsInstance(client, SimulatedABDMClient)
        self.assertEqual(client.mode, "SIMULATED")

    def test_live_mode_factory_selection_and_not_implemented_contract(self):
        """Confirm ABDM_MODE='live' returns LiveABDMClient with clean NotImplementedError contract."""
        os.environ["ABDM_MODE"] = "live"
        client = get_abdm_client()
        self.assertIsInstance(client, LiveABDMClient)
        self.assertEqual(client.mode, "LIVE_PRODUCTION")

        # Verify that calling live stub methods raises NotImplementedError cleanly with informative message
        with self.assertRaises(NotImplementedError) as ctx:
            client.verify_or_create_abha("12-3456-7890-1234")
        self.assertIn("Live ABDM Sandbox Client not configured", str(ctx.exception))

        # Reset environment
        os.environ["ABDM_MODE"] = "simulated"


if __name__ == "__main__":
    unittest.main()

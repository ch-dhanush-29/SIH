"""
MediKiosk End-to-End Simulation Walkthrough.
Demonstrates:
Scenario 1: Red-Flag Emergency Case (Chest Pain with Left Arm radiation) triggering RED_FLAG_ALERT.
Scenario 2: Standard Care Path (Fever) completing the full intake, OCR digitization, summary review, edit, confirm, HIS routing, and memory purge.
"""

from medikiosk.ontology import ClinicalOntology, SOCRATES_HPI
from medikiosk.module_d.state_machine import SessionStateMachine
from medikiosk.module_d.consent_manager import ConsentManager
from medikiosk.module_d.abdm_client import ABDMClient
from medikiosk.module_d.fhir_builder import FHIRBundleBuilder
from medikiosk.module_b.ocr_pipeline import DocumentDigitizer, TesseractIndicOCRProvider, GoogleDocumentAIProvider
from medikiosk.module_a.dialogue_manager import DialogueManager, AI4BharatASR, AI4BharatTTS
from medikiosk.module_c.summary_generator import SummaryGenerator
from medikiosk.his.his_translator import HISTranslator

def run_red_flag_scenario():
    print("----------------------------------------------------")
    print("SCENARIO 1: RED-FLAG EMERGENCY INTAKE FLOW")
    print("----------------------------------------------------")
    sm = SessionStateMachine()
    cm = ConsentManager("simulated_consent_audit_log.csv")
    abdm = ABDMClient()
    dialogue_mgr = DialogueManager(state_machine=sm)

    print("[Step 1] Starting session & capturing consent...")
    sm.transition_to(sm.CONSENT_PENDING)
    cm.start_session("session_sim_emergency", "patient_emergency_01")
    cm.grant_consent("demographics", "Verify identity")
    cm.grant_consent("voice_intake", "Clinical history voice intake")
    
    sm.transition_to(sm.IDENTIFICATION)
    patient_info = abdm.verify_abha_qr("abha://qr-data-emergency")
    cm.update_session_data("demographics", patient_info)
    print(f"  Patient: {patient_info['name']} (ABHA: {patient_info['abha_number']})")

    print("[Step 2] Initiating voice intake for chest pain...")
    sm.transition_to(sm.INTAKE_ACTIVE)
    dialogue_mgr.start_dialogue("chest pain")

    # Turn 1: Site
    q1 = dialogue_mgr.get_next_question()
    print(f"  Kiosk Prompt: {q1}")
    dialogue_mgr.receive_answer("Left side of the chest")

    # Turn 2: Onset
    q2 = dialogue_mgr.get_next_question()
    print(f"  Kiosk Prompt: {q2}")
    dialogue_mgr.receive_answer("Started suddenly 30 minutes ago")

    # Turn 3: Character
    q3 = dialogue_mgr.get_next_question()
    print(f"  Kiosk Prompt: {q3}")
    dialogue_mgr.receive_answer("Squeezing heaviness")

    # Turn 4: Radiation (This should trigger red-flag rule RF-001)
    q4 = dialogue_mgr.get_next_question()
    print(f"  Kiosk Prompt: {q4}")
    print("  Patient Responds: 'Yes, it spreads down to my left arm'")
    dialogue_mgr.receive_answer("Yes, it spreads down to my left arm")

    if dialogue_mgr.red_flag_triggered:
        print("\n  >>> [SAFETY AUDIT ALERT] RED-FLAG SAFETY RULE TRIGGERED!")
        print(f"  Alert Priority: CRITICAL")
        print(f"  Clinical Action Required: {dialogue_mgr.red_flag_alert_message}")
        print(f"  State Machine State: {sm.state}")
    else:
        print("  No red flags triggered.")

    # Purge session data due to emergency exit
    cm.purge_session()
    print(f"  Session data purged. Active Session: {cm.session_active}\n")


def run_standard_scenario():
    print("----------------------------------------------------")
    print("SCENARIO 2: STANDARD CLINICAL CARE PATH FLOW")
    print("----------------------------------------------------")
    sm = SessionStateMachine()
    cm = ConsentManager("simulated_consent_audit_log.csv")
    abdm = ABDMClient()
    fhir_builder = FHIRBundleBuilder()
    ocr_digitizer = DocumentDigitizer(TesseractIndicOCRProvider())
    dialogue_mgr = DialogueManager(state_machine=sm)
    summary_gen = SummaryGenerator(state_machine=sm)
    his_translator = HISTranslator(target_format="CUSTOM_JSON")

    print("[Step 1] Initializing session and capturing granular consent...")
    sm.transition_to(sm.CONSENT_PENDING)
    cm.start_session("session_sim_standard", "patient_standard_02")
    cm.grant_consent("demographics", "Verify identity using ABHA scan-and-share")
    cm.grant_consent("voice_intake", "Clinical history voice intake interview")
    cm.grant_consent("document_scan", "Digitize and index past clinical prescriptions")
    cm.grant_consent("his_abdm_share", "Route summary to Hospital Information System")

    sm.transition_to(sm.IDENTIFICATION)
    patient_info = abdm.verify_abha_qr("abha://qr-data-standard")
    cm.update_session_data("demographics", patient_info)
    print(f"  Patient: {patient_info['name']} (ABHA: {patient_info['abha_number']})")

    print("[Step 2] Initiating voice-based history intake for fever...")
    sm.transition_to(sm.INTAKE_ACTIVE)
    dialogue_mgr.start_dialogue("fever")

    simulated_conversation = [
        ("site", "Whole body feels warm"),
        ("onset", "Started 2 days ago"),
        ("character", "High grade fever with mild shivering"),
        ("radiation", "No pain elsewhere"),
        ("association", "Slight body ache and mild cough"),
        ("timing", "Comes and goes, peaks mostly in the evening"),
        ("exacerbating_relieving", "Reduces when taking paracetamol tablet"),
        ("severity", "Temperature recorded around 101 Fahrenheit")
    ]

    for field, patient_ans in simulated_conversation:
        q = dialogue_mgr.get_next_question()
        dialogue_mgr.receive_answer(patient_ans)

    dialogue_data = dialogue_mgr.get_summary_data()
    print("  Clinical history capture completed. No red flags triggered.")

    print("[Step 3] Scanning past document/prescription...")
    sm.transition_to(sm.OCR_PROCESSING)
    mock_pdf_bytes = b"mock prescription pdf bytes"
    ocr_results = ocr_digitizer.process_document(mock_pdf_bytes)
    cm.update_session_data("ocr_documents", ocr_results)

    print("  Extracted Diagnoses:", ocr_results["diagnoses"])
    print("  Extracted Medications count:", len(ocr_results["medications"]))

    print("[Step 4] Assembling bilingual intake summary...")
    summaries = summary_gen.generate_physician_summary(dialogue_data, ocr_results)
    print(f"  Current State Machine State: {sm.state}")

    print("[Step 5] Physician reviews and edits summary details...")
    # Simulate editing a diagnosed condition
    sm.transition_to(sm.PHYSICIAN_EDITING)
    print("  Physician overrides: Adding 'Essential Hypertension' to Diagnoses.")
    if "Essential Hypertension" not in ocr_results["diagnoses"]:
        ocr_results["diagnoses"].append("Essential Hypertension")

    # Regenerate summary reflecting edits
    summaries = summary_gen.generate_physician_summary(dialogue_data, ocr_results)

    print("[Step 5b] Physician confirms summary explicitly...")
    sm.confirm_physician()
    print(f"  Explicit physician confirmation status: {sm.physician_confirmed}. State: {sm.state}")

    print("[Step 6] Compiling FHIR R4 Bundle & submitting to HIS/ABDM...")
    final_ontology = ClinicalOntology(
        chief_complaint=dialogue_data["chief_complaint"],
        hpi=SOCRATES_HPI(
            site=dialogue_data["site"],
            onset=dialogue_data["onset"],
            character=dialogue_data["character"],
            radiation=dialogue_data["radiation"],
            association=dialogue_data["association"],
            timing=dialogue_data["timing"],
            exacerbating_relieving=dialogue_data["exacerbating_relieving"],
            severity=dialogue_data["severity"]
        ),
        past_medical_history=ocr_results["diagnoses"],
        drug_history=[f"{m['name']} {m['dose']} ({m['frequency']})" for m in ocr_results["medications"]]
    )

    fhir_bundle = fhir_builder.build_bundle(final_ontology)
    
    # Route via translation layer to target HIS
    his_output = his_translator.translate_and_send(fhir_bundle)
    print(f"  Routed payload to HIS endpoint: {his_output['endpoint']}")
    print(f"  Payload Format: {his_output['format']}")

    # Submit and complete
    sm.transition_to(sm.SUBMITTED)
    print(f"  Session submitted to ABDM/HIS. State: {sm.state}")

    # Immediate session purge
    cm.purge_session()
    sm.reset()
    print(f"  Session purged. Active Session: {cm.session_active}, State: {sm.state}\n")


def main():
    print("====================================================")
    print("STARTING MEDIKIOSK WORKFLOW SIMULATION RUN")
    print("====================================================\n")
    run_red_flag_scenario()
    run_standard_scenario()
    print("====================================================")
    print("SIMULATION ENDED SUCCESSFULLY")
    print("====================================================")

if __name__ == "__main__":
    main()

"""
MediKiosk Summary Generator (Module C).
Combines clinical conversation data and OCR document findings into structured physician summaries.
Enforces bilingual outputs and links with the state machine for physician confirmation.
"""

from typing import Dict, Any, List
from medikiosk.module_a.dialogue_manager import TTSInterface

class SummaryGenerator:
    def __init__(self, state_machine=None):
        self.state_machine = state_machine

    def generate_physician_summary(self, dialogue_data: Dict[str, Any], ocr_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Assembles clinical information from conversation and documents.
        Generates bilingual summaries (English and Hindi).
        """
        # --- English Summary ---
        en_parts = []
        en_parts.append("=== CLINICAL HISTORY INTAKE SUMMARY (ENGLISH) ===")
        en_parts.append(f"Chief Complaint: {dialogue_data.get('chief_complaint', '').title()}")
        en_parts.append("\nHistory of Present Illness (SOCRATES):")
        en_parts.append(f"- Site: {dialogue_data.get('site', 'Not specified')}")
        en_parts.append(f"- Onset: {dialogue_data.get('onset', 'Not specified')}")
        en_parts.append(f"- Character: {dialogue_data.get('character', 'Not specified')}")
        en_parts.append(f"- Radiation: {dialogue_data.get('radiation', 'None')}")
        
        associations = dialogue_data.get('association', [])
        assoc_str = ", ".join(associations) if associations else "None"
        en_parts.append(f"- Associated Symptoms: {assoc_str}")
        en_parts.append(f"- Timing: {dialogue_data.get('timing', 'Not specified')}")
        en_parts.append(f"- Exacerbating/Relieving: {dialogue_data.get('exacerbating_relieving', 'Not specified')}")
        en_parts.append(f"- Severity: {dialogue_data.get('severity', 'Not specified')}/10")

        # Add digitized document findings
        en_parts.append("\nDigitized Scanned Documents:")
        if ocr_data:
            diagnoses = ocr_data.get("diagnoses", [])
            en_parts.append(f"- Extracted Diagnoses: {', '.join(diagnoses) if diagnoses else 'None'}")
            
            meds = ocr_data.get("medications", [])
            med_lines = [f"  * {m['name']} {m['dose']} ({m['frequency']})" for m in meds]
            en_parts.append(f"- Extracted Medications:\n" + ("\n".join(med_lines) if med_lines else "  * None"))
            
            labs = ocr_data.get("lab_results", [])
            lab_lines = [f"  * {l['test_name']}: {l['value']} {l['unit']} [{l['reference_range']}] - Flag: {l['flag']}" for l in labs]
            en_parts.append(f"- Extracted Lab Results:\n" + ("\n".join(lab_lines) if lab_lines else "  * None"))
        else:
            en_parts.append("- No digitized documents processed.")

        # --- Hindi Summary ---
        hi_parts = []
        hi_parts.append("=== clinical history intake summary (hindi) ===")
        # Basic translations for standard OPD outputs
        cc_map = {"chest pain": "छाती में दर्द", "fever": "बुखार", "cough": "खांसी", "abdominal pain": "पेट दर्द", "headache": "सिरदर्द", "breathlessness": "सांस लेने में कठिनाई"}
        cc_hi = cc_map.get(dialogue_data.get('chief_complaint', '').lower(), dialogue_data.get('chief_complaint', 'उल्लेखित नहीं'))
        
        hi_parts.append(f"मुख्य शिकायत: {cc_hi}")
        hi_parts.append("\nवर्तमान बीमारी का इतिहास (SOCRATES):")
        hi_parts.append(f"- स्थान (Site): {dialogue_data.get('site', 'उल्लेखित नहीं')}")
        hi_parts.append(f"- शुरुआत (Onset): {dialogue_data.get('onset', 'उल्लेखित नहीं')}")
        hi_parts.append(f"- लक्षण का प्रकार (Character): {dialogue_data.get('character', 'उल्लेखित नहीं')}")
        hi_parts.append(f"- फैलाव (Radiation): {dialogue_data.get('radiation', 'कोई नहीं')}")
        hi_parts.append(f"- जुड़े हुए लक्षण (Associations): {', '.join(associations) if associations else 'कोई नहीं'}")
        hi_parts.append(f"- समय (Timing): {dialogue_data.get('timing', 'उल्लेखित नहीं')}")
        hi_parts.append(f"- बढ़ाने/कम करने वाले कारक (Exacerbating/Relieving): {dialogue_data.get('exacerbating_relieving', 'उल्लेखित नहीं')}")
        hi_parts.append(f"- तीव्रता (Severity): {dialogue_data.get('severity', 'उल्लेखित नहीं')}/10")
        
        if ocr_data:
            diagnoses_hi = ocr_data.get("diagnoses", [])
            hi_parts.append(f"\nदस्तावेज़ से प्राप्त निदान (Diagnoses): {', '.join(diagnoses_hi) if diagnoses_hi else 'कोई नहीं'}")
        
        # Move state machine to pending review state if connected
        if self.state_machine:
            # Avoid re-transitioning if already in review or editing
            if self.state_machine.state not in [self.state_machine.SUMMARY_PENDING_REVIEW, self.state_machine.PHYSICIAN_EDITING, self.state_machine.CONFIRMED]:
                self.state_machine.transition_to(self.state_machine.SUMMARY_PENDING_REVIEW)

        return {
            "english": "\n".join(en_parts),
            "hindi": "\n".join(hi_parts)
        }

    def generate_patient_audio_query(self, dialogue_data: Dict[str, Any], tts_provider: TTSInterface, language: str = "hi") -> bytes:
        """
        Generates a friendly spoken summary text in the patient's language and synthesizes it to voice bytes.
        """
        cc = dialogue_data.get("chief_complaint", "")
        if language == "hi":
            cc_hi = {"chest pain": "छाती में दर्द", "fever": "बुखार", "cough": "खांसी", "abdominal pain": "पेट दर्द", "headache": "सिरदर्द", "breathlessness": "सांस लेने में कठिनाई"}.get(cc.lower(), "समस्या")
            text = f"नमस्ते। आपने {cc_hi} की शिकायत दर्ज की है। कृपया डॉक्टर का इंतजार करें। क्या यह जानकारी सही है?"
        else:
            text = f"Hello. You have reported {cc}. Please wait for the doctor. Is this information correct?"
            
        return tts_provider.text_to_speech(text, language)

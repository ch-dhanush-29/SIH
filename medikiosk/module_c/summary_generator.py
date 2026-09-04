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
            try:
                if self.state_machine.state == self.state_machine.IDLE:
                    self.state_machine.transition_to(self.state_machine.CONSENT_PENDING)
                    self.state_machine.transition_to(self.state_machine.IDENTIFICATION)
                    self.state_machine.transition_to(self.state_machine.INTAKE_ACTIVE)
                if self.state_machine.state not in [self.state_machine.SUMMARY_PENDING_REVIEW, self.state_machine.PHYSICIAN_EDITING, self.state_machine.CONFIRMED]:
                    self.state_machine.transition_to(self.state_machine.SUMMARY_PENDING_REVIEW)
            except Exception:
                pass

        return {
            "english": "\n".join(en_parts),
            "hindi": "\n".join(hi_parts)
        }

    def generate_vaidya_summary(
        self,
        ayush_data: Dict[str, Any],
        dialogue_data: Dict[str, Any],
        ocr_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Generates dedicated Vaidya-facing Ayurveda clinical intake summary.
        Includes Prakriti vs Vikriti comparison, Nidana, Samprapti,
        Dashavidha Pariksha clinical matrix, and NAMASTE traditional codings.
        Strict confirm-gate rule applies — never auto-suggests treatment.
        """
        en_parts = []
        en_parts.append("=== AYURVEDA VAIDYA CLINICAL INTAKE SUMMARY (वैद्य सारांश) ===")
        en_parts.append(f"Pradhana Vedana (Chief Complaint): {dialogue_data.get('chief_complaint', 'Not specified').title()}")
        
        # 1. Prakriti vs Vikriti Dosha Matrix
        prakriti = ayush_data.get("prakriti", "Tridoshaja")
        vikriti = ayush_data.get("vikriti", "Vataja")
        v_score = ayush_data.get("vata_score", 33.3)
        p_score = ayush_data.get("pitta_score", 33.3)
        k_score = ayush_data.get("kapha_score", 33.4)
        
        en_parts.append("\n1. DOSHA PARIKSHA & BALANCE PROFILE (दोष परीक्षा):")
        en_parts.append(f"- Deha Prakriti (Baseline Constitution): {prakriti}")
        en_parts.append(f"- Dosha Balance Metrics: Vata: {v_score}%, Pitta: {p_score}%, Kapha: {k_score}%")
        en_parts.append(f"- Vikriti (Current Morbidity Imbalance): {vikriti}")

        # 2. Dashavidha Pariksha Full Matrix
        en_parts.append("\n2. DASHAVIDHA PARIKSHA MATRIX (दशविध परीक्षा):")
        dashavidha_items = [
            ("Sara (Tissue Excellence / Vitality)", ayush_data.get("sara", "Madhyama")),
            ("Samhanana (Body Compactness / Build)", ayush_data.get("samhanana", "Madhyama")),
            ("Pramana (Anthropometric Proportions)", ayush_data.get("pramana", "Sama")),
            ("Satmya (Habituation & Adaptability)", ayush_data.get("satmya", "Madhyama")),
            ("Sattva (Mental Resilience / Strength)", ayush_data.get("sattva", "Madhyama")),
            ("Ahara Shakti (Digestive Capacity / Agni)", ayush_data.get("ahara_shakti", "Samagni")),
            ("Vyayama Shakti (Physical Endurance)", ayush_data.get("vyayama_shakti", "Madhyama")),
            ("Vaya (Biological Chronotype / Age Stage)", ayush_data.get("vaya", "Madhyama Vaya")),
            ("Ahara-Vihara (Diet & Lifestyle Factors)", ayush_data.get("ahara_vihara", "Satmya Ahara & Regular Sleep"))
        ]
        for label, val in dashavidha_items:
            en_parts.append(f"- {label}: {val}")

        # 3. Nidana & Samprapti
        en_parts.append("\n3. NIDANA & SAMPRAPTI GHATAKA (निदान एवं सम्प्राप्ति):")
        nidana_val = ayush_data.get("nidana") or "Ahara-Vihara Asatmya & Seasonal Vata Vitiation"
        samprapti_val = ayush_data.get("samprapti") or "Doshic aggravation leading to Srotodushti and Sthana Samshraya in Asthi-Sandhi"
        en_parts.append(f"- Nidana (Etiological Factors): {nidana_val}")
        en_parts.append(f"- Samprapti (Pathogenic Mechanism): {samprapti_val}")
        if ayush_data.get("dhatu_involvement"):
            en_parts.append(f"- Dushya / Dhatu Involved: {ayush_data.get('dhatu_involvement')}")
        if ayush_data.get("srota_involvement"):
            en_parts.append(f"- Srotas Involved: {ayush_data.get('srota_involvement')}")

        # 4. NAMASTE / ICD-11-TM2 Diagnostic Codings
        en_parts.append("\n4. NAMASTE TRADITIONAL MORBIDITY CODES (आयुष कोड):")
        namaste_codes = ayush_data.get("namaste_diagnoses", [])
        if namaste_codes:
            for n in namaste_codes:
                n_code = n.get("namaste_code") if isinstance(n, dict) else getattr(n, "namaste_code", "")
                n_term = n.get("namaste_term") if isinstance(n, dict) else getattr(n, "namaste_term", "")
                icd = n.get("icd11_tm2_code") if isinstance(n, dict) else getattr(n, "icd11_tm2_code", "None")
                en_parts.append(f"- {n_code}: {n_term} [ICD-11-TM2: {icd}]")
        else:
            en_parts.append("- No specific NAMASTE code pre-selected. Awaiting Vaidya clinical tagging.")

        # 5. Reconciled Prescriptions & Formulations
        en_parts.append("\n5. CURRENT THERAPIES & SCANNED MEDICATIONS:")
        if ocr_data and ocr_data.get("medications"):
            for m in ocr_data.get("medications", []):
                sys_tag = f"[{m.get('system', 'Allopathy')}]"
                en_parts.append(f"- {sys_tag} {m.get('name')} {m.get('dose', '')} - {m.get('frequency', '')}")
        else:
            en_parts.append("- No prior prescriptions on record.")

        en_parts.append("\n=== SAFETY & CONFIRM-GATE: DRAFT FOR VAIDYA REVIEW ONLY. NEVER COMMITTED WITHOUT VAIDYA SIGN-OFF. ===")

        # Hindi rendering
        hi_parts = []
        hi_parts.append("=== आयुष वैद्य रोग निदान एवं इतिहास सारांश ===")
        hi_parts.append(f"मुख्य व्याधि (Chief Complaint): {dialogue_data.get('chief_complaint', 'उल्लेखित नहीं')}")
        hi_parts.append(f"\n1. दोष प्रकृति व विकृति:")
        hi_parts.append(f"- देह प्रकृति: {prakriti}")
        hi_parts.append(f"- दोष अनुपात: वात: {v_score}%, पित्त: {p_score}%, कफ: {k_score}%")
        hi_parts.append(f"- वर्तमान विकृति (दोष प्रकोप): {vikriti}")
        hi_parts.append(f"\n2. दशविध परीक्षा सारांश:")
        hi_parts.append(f"- जठराग्नि व आहार शक्ति: {ayush_data.get('ahara_shakti', 'समअग्नि')}")
        hi_parts.append(f"- धातु सारता: {ayush_data.get('sara', 'मध्यम')}")
        hi_parts.append(f"- व्यायाम शक्ति / शारीरिक बल: {ayush_data.get('vyayama_shakti', 'मध्यम')}")
        hi_parts.append(f"- सत्व (मानसिक बल): {ayush_data.get('sattva', 'मध्यम')}")
        hi_parts.append(f"\n3. निदान व सम्प्राप्ति:")
        hi_parts.append(f"- हेतु / निदान: {nidana_val}")
        hi_parts.append(f"- सम्प्राप्ति: {samprapti_val}")

        if self.state_machine:
            try:
                if self.state_machine.state == self.state_machine.IDLE:
                    self.state_machine.transition_to(self.state_machine.CONSENT_PENDING)
                    self.state_machine.transition_to(self.state_machine.IDENTIFICATION)
                    self.state_machine.transition_to(self.state_machine.INTAKE_ACTIVE)
                if self.state_machine.state not in [self.state_machine.SUMMARY_PENDING_REVIEW, self.state_machine.PHYSICIAN_EDITING, self.state_machine.CONFIRMED]:
                    self.state_machine.transition_to(self.state_machine.SUMMARY_PENDING_REVIEW)
            except Exception:
                pass

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

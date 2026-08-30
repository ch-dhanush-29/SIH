"""
MediKiosk Conversational History Engine (Module A).
Implements an ontology-driven dialogue manager that restricts questions to SOCRATES fields
and runs red-flag rules on every turn. Contains pluggable ASR/TTS interface stubs.
"""

import re
from typing import Dict, Any, List, Optional
from medikiosk.ontology import SOCRATES_HPI, check_red_flags

class ASRInterface:
    def speech_to_text(self, audio_bytes: bytes, language: str) -> str:
        raise NotImplementedError

class AI4BharatASR(ASRInterface):
    """
    AI4Bharat (IIT Madras) Open-Source Indic ASR Provider (IndicWav2Vec / IndicConformer).
    Runs self-hosted / on-premise without external cloud API dependencies.
    """
    def speech_to_text(self, audio_bytes: bytes, language: str) -> str:
        return "I have severe chest pain starting an hour ago, it feels very tight and moves to my left arm."

class WhisperIndicASR(ASRInterface):
    """
    OpenAI Whisper fine-tuned for Indic languages / dialects.
    """
    def speech_to_text(self, audio_bytes: bytes, language: str) -> str:
        return "I have severe chest pain starting an hour ago, it feels very tight and moves to my left arm."

class TTSInterface:
    def text_to_speech(self, text: str, language: str) -> bytes:
        raise NotImplementedError

class AI4BharatTTS(TTSInterface):
    """
    AI4Bharat IndicTTS (FastPitch/VITS) Open-Source Text-to-Speech provider.
    Supports on-device and local server synthesis across 22 Indian languages.
    """
    def text_to_speech(self, text: str, language: str) -> bytes:
        # Mock audio byte output from AI4Bharat IndicTTS engine
        return b"MOCK_AI4BHARAT_AUDIO_OUTPUT"

# Supported chief complaints for OPD deployment (All 10 common complaints)
SUPPORTED_COMPLAINTS = {
    "chest pain",
    "fever",
    "cough",
    "abdominal pain",
    "headache",
    "breathlessness",
    "joint pain",
    "vomiting",
    "diarrhea",
    "skin rash",
    "dizziness"
}

# Dialogue script mapper for SOCRATES fields per Chief Complaint
SOCRATES_QUESTIONS = {
    "chest pain": {
        "site": "Where exactly in your chest do you feel the pain?",
        "onset": "When did the chest pain start? Did it come on suddenly or gradually?",
        "character": "Can you describe the pain? Is it sharp, dull, squeezing, or burning?",
        "radiation": "Does the pain move anywhere? E.g., to your left arm, shoulder, jaw, neck, or back?",
        "association": "Are you experiencing any other symptoms like sweating, breathlessness, or nausea?",
        "timing": "Is the pain constant, or does it come and go?",
        "exacerbating_relieving": "Does anything make the pain better or worse, like rest or deep breathing?",
        "severity": "On a scale of 1 to 10, with 10 being the worst pain, how severe is it?"
    },
    "fever": {
        "site": "Do you feel hot all over your body, or is it mostly localized?",
        "onset": "How many days ago did the fever start?",
        "character": "Is the fever accompanied by chills, shivering, or sweating?",
        "radiation": "Do you feel any pain associated with the fever, like joint pain or backache?",
        "association": "Do you have other symptoms like cough, sore throat, or confusion?",
        "timing": "Does the fever spike at specific times, or is it constant?",
        "exacerbating_relieving": "Does taking paracetamol reduce the fever?",
        "severity": "Have you measured your temperature? What was the highest reading?"
    },
    "cough": {
        "site": "Does the cough feel like it is coming from your throat or deep in your chest?",
        "onset": "How long have you had this cough? Did it start suddenly after a cold?",
        "character": "Is it a dry hacking cough, or are you bringing up sputum/mucus?",
        "radiation": "Do you have any associated throat irritation or chest discomfort?",
        "association": "Have you noticed any blood in the sputum, fever, or weight loss?",
        "timing": "Is the cough worse at night, early morning, or throughout the day?",
        "exacerbating_relieving": "Does cold air, dust, or lying down make it worse?",
        "severity": "How much is this cough disturbing your daily activities and sleep?"
    },
    "abdominal pain": {
        "site": "Which part of your stomach/abdomen is hurting (upper, lower, right, or left side)?",
        "onset": "When did the stomach pain begin? Was the onset sudden or gradual?",
        "character": "Is it cramping/colicky, sharp, dull aching, or burning sensation?",
        "radiation": "Does the pain radiate to your back, shoulder, or groin area?",
        "association": "Are you experiencing nausea, vomiting, diarrhea, constipation, or fever?",
        "timing": "Is the pain continuous, or does it come in waves?",
        "exacerbating_relieving": "Does eating food, passing gas, or using the restroom relieve or worsen it?",
        "severity": "On a scale of 1 to 10, how severe is the stomach pain?"
    },
    "headache": {
        "site": "Where is the headache located (forehead, temples, back of head, or one-sided)?",
        "onset": "When did the headache start? Was it sudden like a thunderclap or gradual?",
        "character": "Is it throbbing, pulsing, sharp, or a tight band-like squeezing pressure?",
        "radiation": "Does the pain spread down into your neck or shoulders?",
        "association": "Do you have nausea, sensitivity to bright light/sound, or visual disturbances?",
        "timing": "How long does each headache episode last, or is it continuous?",
        "exacerbating_relieving": "Does resting in a quiet dark room help relieve the headache?",
        "severity": "On a scale of 1 to 10, what is the severity of the headache?"
    },
    "breathlessness": {
        "site": "Do you feel tightness in the chest or inability to take a full breath?",
        "onset": "When did the breathing difficulty start? Was it sudden or gradual over weeks?",
        "character": "Does it feel like wheezing/gasping, air hunger, or heavy suffocation?",
        "radiation": "Do you have any associated chest or neck discomfort?",
        "association": "Do you have cough, swelling in the feet, fever, or blueish lips?",
        "timing": "Is the breathlessness worse when lying flat on your back (orthopnea)?",
        "exacerbating_relieving": "Does sitting upright or resting improve your breathing?",
        "severity": "On a scale of 1 to 10, how difficult is it to breathe right now?"
    },
    "joint pain": {
        "site": "Which joints are painful (knees, hips, shoulders, hands, or multiple joints)?",
        "onset": "When did the joint pain first start?",
        "character": "Is the pain stiff, aching, burning, or throbbing?",
        "radiation": "Does the pain radiate along the limb or stay in the joint?",
        "association": "Is there visible swelling, redness, warmth, or morning stiffness > 30 minutes?",
        "timing": "Is it worse in the morning upon waking or after physical activity?",
        "exacerbating_relieving": "Does walking or rest improve or worsen the joint pain?",
        "severity": "On a scale of 1 to 10, how much does the pain restrict your movement?"
    },
    "vomiting": {
        "site": "Does the nausea/vomiting feel centered in your upper stomach?",
        "onset": "When did the vomiting start? How many episodes have you had today?",
        "character": "What is the nature of the vomitus (food contents, clear liquid, green bile, or blood)?",
        "radiation": "Is there any accompanying pain spreading to your abdomen or back?",
        "association": "Do you have loose stools, fever, dizziness, or extreme dry mouth?",
        "timing": "Does vomiting occur immediately after eating or drinking fluids?",
        "exacerbating_relieving": "Can you keep any liquids or ORS (oral rehydration solution) down?",
        "severity": "How weak or dehydrated are you feeling on a scale of 1 to 10?"
    },
    "diarrhea": {
        "site": "Is there cramping pain in your lower or general abdomen?",
        "onset": "How many days ago did the loose stools begin?",
        "character": "Are the stools watery, mucous-filled, or containing visible blood?",
        "radiation": "Does the cramping pain radiate to your lower back or groin?",
        "association": "Do you have vomiting, fever, abdominal cramps, or weakness?",
        "timing": "How many times have you passed loose stools in the last 24 hours?",
        "exacerbating_relieving": "Does drinking ORS or fluids provide relief?",
        "severity": "How severe is your thirst, fatigue, or dehydration on a scale of 1 to 10?"
    },
    "skin rash": {
        "site": "Where on your body did the rash first appear, and where has it spread?",
        "onset": "When did you first notice the rash? Did it spread rapidly?",
        "character": "Is the rash raised, flat red spots, blisters, peeling, or hives?",
        "radiation": "Has the rash spread to your face, palms, soles, or inside your mouth?",
        "association": "Is there intense itching, burning, fever, or swelling of lips/eyes?",
        "timing": "Is the itching constant, or worse at night or after a warm bath?",
        "exacerbating_relieving": "Does applying calamine or taking anti-allergic medication help?",
        "severity": "On a scale of 1 to 10, how severe is the itching or discomfort?"
    },
    "dizziness": {
        "site": "Do you feel the room spinning around you (vertigo) or lightheadedness/faintness?",
        "onset": "When did the dizziness start? Did it occur suddenly on standing up or turning your head?",
        "character": "Is it a spinning sensation, loss of balance, or feeling like you might pass out?",
        "radiation": "Do you have any neck pain or stiffness associated with it?",
        "association": "Do you have ringing in the ears (tinnitus), hearing loss, nausea, or slurred speech?",
        "timing": "Does the dizzy spell last seconds, minutes, or continuously all day?",
        "exacerbating_relieving": "Does keeping your head still or lying down relieve the dizziness?",
        "severity": "On a scale of 1 to 10, how unstable do you feel when attempting to walk?"
    },
    # Fallback default questions for generic complaints
    "default": {
        "site": "Where exactly is this trouble felt?",
        "onset": "When did this issue first start?",
        "character": "Can you describe what it feels like?",
        "radiation": "Does this sensation spread to any other part of your body?",
        "association": "Are you experiencing any other symptoms alongside this?",
        "timing": "Does this trouble occur constantly, or does it come and go?",
        "exacerbating_relieving": "Does anything make this feeling better or worse?",
        "severity": "How severe is this problem on a scale of 1 to 10?"
    }
}

class DialogueManager:
    def __init__(self, state_machine=None):
        self.state_machine = state_machine
        self.chief_complaint = ""
        self.hpi = SOCRATES_HPI()
        self.current_field_index = 0
        self.socrates_sequence = ["site", "onset", "character", "radiation", "association", "timing", "exacerbating_relieving", "severity"]
        self.dialogue_active = False
        self.red_flag_triggered = False
        self.red_flag_alert_message = ""

    def start_dialogue(self, chief_complaint: str):
        """Initializes a SOCRATES clinical intake dialogue."""
        cc_clean = chief_complaint.strip().lower()
        if cc_clean not in SUPPORTED_COMPLAINTS:
            # We support it, but map to default fallback questions
            self.chief_complaint = chief_complaint
        else:
            self.chief_complaint = cc_clean
            
        self.hpi = SOCRATES_HPI()
        self.current_field_index = 0
        self.dialogue_active = True
        self.red_flag_triggered = False
        self.red_flag_alert_message = ""
        
        # Check red flag on initial chief complaint alone (e.g. standalone severe breathlessness)
        self._evaluate_safety()

    def get_next_question(self) -> Optional[str]:
        """Returns the next natural language question based on the ontology state."""
        if not self.dialogue_active or self.red_flag_triggered:
            return None
            
        if self.current_field_index >= len(self.socrates_sequence):
            self.dialogue_active = False
            return None
            
        field_name = self.socrates_sequence[self.current_field_index]
        q_dict = SOCRATES_QUESTIONS.get(self.chief_complaint, SOCRATES_QUESTIONS["default"])
        return q_dict.get(field_name, SOCRATES_QUESTIONS["default"][field_name])

    def receive_answer(self, answer_text: str):
        """Processes patient answer for the active field and performs entity parsing."""
        if not self.dialogue_active or self.red_flag_triggered:
            return
            
        field_name = self.socrates_sequence[self.current_field_index]
        ans_clean = answer_text.strip()
        
        # Save response to the appropriate HPI attribute
        if field_name == "site":
            self.hpi.site = ans_clean
        elif field_name == "onset":
            self.hpi.onset = ans_clean
        elif field_name == "character":
            self.hpi.character = ans_clean
        elif field_name == "radiation":
            self.hpi.radiation = ans_clean
        elif field_name == "association":
            # Split by common delimiters to capture multiple symptoms
            symptoms = [s.strip().lower() for s in re.split(r",|and|\.", ans_clean) if s.strip()]
            self.hpi.association.extend(symptoms)
        elif field_name == "timing":
            self.hpi.timing = ans_clean
        elif field_name == "exacerbating_relieving":
            self.hpi.exacerbating_relieving = ans_clean
        elif field_name == "severity":
            self.hpi.severity = ans_clean

        # Evaluate safety constraints on every turn
        self._evaluate_safety()

        # Advance to next question in sequence
        self.current_field_index += 1

    def _evaluate_safety(self):
        """Evaluates red-flag rules against the current accumulated HPI state."""
        alert = check_red_flags(self.chief_complaint, self.hpi)
        if alert:
            self.red_flag_triggered = True
            self.red_flag_alert_message = alert["alert_message"]
            self.dialogue_active = False
            if self.state_machine:
                self.state_machine.transition_to(self.state_machine.RED_FLAG_ALERT)
                
    def get_summary_data(self) -> Dict[str, Any]:
        """Returns the collected HPI data as a flat dictionary."""
        return {
            "chief_complaint": self.chief_complaint,
            "site": self.hpi.site,
            "onset": self.hpi.onset,
            "character": self.hpi.character,
            "radiation": self.hpi.radiation,
            "association": self.hpi.association,
            "timing": self.hpi.timing,
            "exacerbating_relieving": self.hpi.exacerbating_relieving,
            "severity": self.hpi.severity
        }

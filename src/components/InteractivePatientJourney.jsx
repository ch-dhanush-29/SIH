/**
 * InteractivePatientJourney.jsx
 *
 * Full functional interactive simulator for the 5-step MediKiosk patient journey.
 * Extended with:
 *   - Track 1: Deep AYUSH / Ayurveda Mode with 10 Dashavidha Pariksha parameters,
 *     scored Prakriti/Vikriti questionnaire, dosha balance visualizer, NAMASTE ↔ ICD-11-TM2 coding,
 *     and dedicated Vaidya review summary path.
 *   - Track 2: High-Assurance Prescription Intelligence with per-field confidence scoring,
 *     verify badges, bounding-box overlays, dosage sanity validation, hardcoded DDI checker,
 *     and multi-prescription medication reconciliation.
 *   - DPDP Act 2023 granular consent and strict physician/Vaidya confirm-before-submit gate.
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mic, MicOff, Volume2, ShieldCheck, FileText, CheckCircle2,
  AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, Lock, Sparkles,
  Stethoscope, Activity, Database, Send, Check, Edit3, X, Play, Eye,
  Layers, Search, AlertCircle, BarChart3, Pill, Compass, Sliders
} from 'lucide-react'

// Language configurations
const LANGUAGES = [
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'bho', name: 'भोजपुरी (Bhojpuri)', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇮🇳' }
]

// Seeded NAMASTE ↔ ICD-11-TM2 Code Samples for quick UI selection
const SEED_NAMASTE_PRESETS = [
  { code: "AYU-VV-001", term: "Sandhigata Vata (सन्धिगत वात)", icd11: "TM2-MSK-01", category: "Musculoskeletal", allopathic: "Osteoarthritis" },
  { code: "AYU-VV-002", term: "Amavata (आमवात)", icd11: "TM2-MSK-02", category: "Musculoskeletal", allopathic: "Rheumatoid Arthritis" },
  { code: "AYU-RS-002", term: "Tamaka Shwasa (तमक श्वास)", icd11: "TM2-RESP-02", category: "Respiratory", allopathic: "Bronchial Asthma" },
  { code: "AYU-GI-001", term: "Amlapitta (अम्लपित्त)", icd11: "TM2-GIT-01", category: "Gastrointestinal", allopathic: "GERD / Hyperacidity" },
  { code: "AYU-MB-001", term: "Prameha / Madhumeha (प्रमेह / मधुमेह)", icd11: "TM2-MET-01", category: "Metabolic", allopathic: "Type 2 Diabetes Mellitus" },
  { code: "AYU-NP-001", term: "Shirashoola (शिरःशूल)", icd11: "TM2-NEU-01", category: "Neurological", allopathic: "Migraine / Tension Headache" },
  { code: "AYU-DERM-001", term: "Eka Kushtha (एककुष्ठ)", icd11: "TM2-DERM-01", category: "Dermatology", allopathic: "Psoriasis Vulgaris" },
  { code: "AYU-CV-001", term: "Hridroga (हृद्रोग)", icd11: "TM2-CVD-01", category: "Cardiovascular", allopathic: "Angina / Ischemic Heart Disease" }
]

// 6-Domain Scored Prakriti Questionnaire
const PRAKRITI_QUIZ_QUESTIONS = [
  {
    id: "frame_skin",
    domain: "Sharira (Body Frame & Skin)",
    prompt: "Natural body frame & skin texture:",
    options: [
      { dosha: "Vata", label: "Slender/thin, dry rough skin", pts: { v: 1, p: 0, k: 0 } },
      { dosha: "Pitta", label: "Medium build, soft warm skin, prone to redness", pts: { v: 0, p: 1, k: 0 } },
      { dosha: "Kapha", label: "Broad/heavy sturdy build, smooth glowing skin", pts: { v: 0, p: 0, k: 1 } }
    ]
  },
  {
    id: "appetite_digestion",
    domain: "Agni (Digestion & Hunger)",
    prompt: "Typical appetite & digestion pattern:",
    options: [
      { dosha: "Vata", label: "Irregular (Vishamagni) - gas / bloating", pts: { v: 1, p: 0, k: 0 } },
      { dosha: "Pitta", label: "Sharp/intense (Tikshnagni) - acid / quick hunger", pts: { v: 0, p: 1, k: 0 } },
      { dosha: "Kapha", label: "Slow/steady (Mandagni) - heavy after meals", pts: { v: 0, p: 0, k: 1 } }
    ]
  },
  {
    id: "weather_tolerance",
    domain: "Sheeta/Ushna (Weather Tolerance)",
    prompt: "Weather causing most discomfort:",
    options: [
      { dosha: "Vata", label: "Cold dry wind & AC intolerance", pts: { v: 1, p: 0, k: 0 } },
      { dosha: "Pitta", label: "Hot summer sun & high heat intolerance", pts: { v: 0, p: 1, k: 0 } },
      { dosha: "Kapha", label: "Cold damp rain & cloudy weather intolerance", pts: { v: 0, p: 0, k: 1 } }
    ]
  },
  {
    id: "sleep_dreams",
    domain: "Nidra (Sleep & Dreaming)",
    prompt: "Usual sleep pattern & dreaming:",
    options: [
      { dosha: "Vata", label: "Light, interrupted, active dreams", pts: { v: 1, p: 0, k: 0 } },
      { dosha: "Pitta", label: "Moderate sound sleep (6-7h), vivid dreams", pts: { v: 0, p: 1, k: 0 } },
      { dosha: "Kapha", label: "Deep heavy prolonged sleep (8h+)", pts: { v: 0, p: 0, k: 1 } }
    ]
  },
  {
    id: "mental_temperament",
    domain: "Manasa (Mental Temperament)",
    prompt: "Mental response under pressure:",
    options: [
      { dosha: "Vata", label: "Quick to learn/forget, restless/anxious", pts: { v: 1, p: 0, k: 0 } },
      { dosha: "Pitta", label: "Sharp intellect, quick to anger, ambitious", pts: { v: 0, p: 1, k: 0 } },
      { dosha: "Kapha", label: "Calm, patient, excellent long-term memory", pts: { v: 0, p: 0, k: 1 } }
    ]
  },
  {
    id: "activity_speech",
    domain: "Gati (Physical Pace & Speech)",
    prompt: "Pace of walking and conversation:",
    options: [
      { dosha: "Vata", label: "Fast brisk walking, talkative, quick fatigue", pts: { v: 1, p: 0, k: 0 } },
      { dosha: "Pitta", label: "Purposeful moderate walk, articulate speech", pts: { v: 0, p: 1, k: 0 } },
      { dosha: "Kapha", label: "Slow graceful walk, deep voice, great endurance", pts: { v: 0, p: 0, k: 1 } }
    ]
  }
]

// Common chief complaints with predefined SOCRATES tracks
const COMPLAINT_PRESETS = [
  {
    id: 'chest pain',
    label: 'Chest Pain / छाती में दर्द',
    icon: '❤️',
    isEmergencyPotential: true,
    questions: [
      { field: 'site', prompt: 'Where exactly in your chest do you feel the pain?', promptHi: 'छाती में दर्द कहाँ महसूस हो रहा है?', options: ['Substernal / Left Center', 'Right side', 'Sharp point on ribs'] },
      { field: 'onset', prompt: 'When did it start? Was it sudden or gradual?', promptHi: 'यह दर्द कब और कैसे शुरू हुआ?', options: ['Sudden (1 hour ago)', 'Gradual (Past 3 days)', 'Woke up with pain'] },
      { field: 'character', prompt: 'Describe the sensation (crushing, sharp, burning, dull):', promptHi: 'दर्द का प्रकार कैसा है?', options: ['Heavy crushing / tightness', 'Sharp needle-like', 'Burning / acidity-like'] },
      { field: 'radiation', prompt: 'Does the pain move to your left arm, neck, jaw, or back?', promptHi: 'क्या दर्द बाएं हाथ, जबड़े या पीठ में जा रहा है?', options: ['Radiating to left arm & jaw', 'Radiating to back', 'No radiation (stays local)'] },
      { field: 'association', prompt: 'Are you experiencing sweating, breathlessness, or nausea?', promptHi: 'क्या पसीना, सांस फूलना या घबराहट हो रही है?', options: ['Severe sweating & breathlessness', 'Mild nausea', 'No other symptoms'] },
      { field: 'severity', prompt: 'Rate the severity on a scale of 1 to 10:', promptHi: 'दर्द की तीव्रता 1 से 10 के पैमाने पर बताएं:', options: ['8 / 10 (Severe)', '5 / 10 (Moderate)', '2 / 10 (Mild)'] }
    ]
  },
  {
    id: 'fever',
    label: 'Fever / तेज बुखार',
    icon: '🌡️',
    isEmergencyPotential: false,
    questions: [
      { field: 'site', prompt: 'Is the heat felt all over the body or with localized pain?', promptHi: 'क्या बुखार पूरे शरीर में है?', options: ['Generalized heat all over', 'Fever with severe body ache', 'Fever with throat pain'] },
      { field: 'onset', prompt: 'How many days ago did the fever start?', promptHi: 'बुखार कितने दिनों से है?', options: ['2 days ago with chills', 'Past 1 week continuous', 'Intermittent spikes'] },
      { field: 'character', prompt: 'Is it accompanied by shivering, sweating, or joint pain?', promptHi: 'क्या कंपकंपी या जोड़ों में दर्द है?', options: ['High grade with shivering/rigors', 'Mild continuous warmth', 'Spikes mainly at night'] },
      { field: 'association', prompt: 'Any associated cough, vomiting, or altered sensorium?', promptHi: 'क्या खांसी, उल्टी या अत्यधिक कमजोरी है?', options: ['Dry cough and fatigue', 'Extreme confusion / drowsiness', 'No other symptoms'] },
      { field: 'severity', prompt: 'What was the highest measured temperature?', promptHi: 'मापा गया उच्चतम तापमान क्या था?', options: ['103°F (High Grade)', '101°F (Moderate)', '99.5°F (Low Grade)'] }
    ]
  },
  {
    id: 'joint pain',
    label: 'Joint Pain / जोड़ों में दर्द (AYUSH)',
    icon: '🦴',
    isEmergencyPotential: false,
    isAyushRelevant: true,
    questions: [
      { field: 'site', prompt: 'Which joints are painful (knees, hands, back, multiple)?', promptHi: 'किन जोड़ों में दर्द है?', options: ['Bilateral Knee joints (Sandhigata Vata)', 'Small joints of hands/fingers (Amavata)', 'Lower spine & hips (Katishoola)'] },
      { field: 'onset', prompt: 'How long has this joint stiffness been present?', promptHi: 'यह दर्द कितने समय से है?', options: ['Gradual over 6 months', 'Sudden flare-up 4 days ago', 'Years of chronic aching'] },
      { field: 'character', prompt: 'Is there morning stiffness lasting > 30 minutes, swelling or burning?', promptHi: 'क्या सुबह अकड़न या सूजन रहती है?', options: ['Severe morning stiffness & crepitus', 'Aching on weight-bearing', 'Swelling with local heat'] },
      { field: 'timing', prompt: 'Does pain worsen with cold weather or physical exertion?', promptHi: 'क्या ठंड या चलने-फिरने से दर्द बढ़ता है?', options: ['Aggravated by cold & walking', 'Worse during rest', 'Constant throbbing'] }
    ]
  }
]

// Seed Demo Patient Registry
const SEED_DEMO_PATIENTS = [
  {
    id: "SIM-91-2001-0000-0001",
    name: "Rameshwar Prasad",
    age: "58",
    gender: "Male",
    complaintId: "chest pain",
    isReturning: true,
    priorSummary: "T2DM, Hypertension, CAD (2 prior OPD encounters linked on ABHA)",
    diagnoses: ["Type 2 Diabetes Mellitus", "Essential Hypertension", "Coronary Artery Disease"],
    meds: [
      { name: "Metformin", dose: "500mg", freq: "1 BD (Twice daily)", conf: 0.98, tier: "EXACT", needs_verify: false },
      { name: "Telmisartan", dose: "40mg", freq: "1 OD (Once daily)", conf: 0.98, tier: "EXACT", needs_verify: false },
      { name: "Atorvastatin", dose: "20mg", freq: "1 HS (Bedtime)", conf: 0.97, tier: "EXACT", needs_verify: false },
      { name: "Aspirin", dose: "75mg", freq: "1 OD (Morning)", conf: 0.96, tier: "EXACT", needs_verify: false },
      { name: "Clopidogrel", dose: "75mg", freq: "1 OD (Morning)", conf: 0.96, tier: "EXACT", needs_verify: false }
    ]
  },
  {
    id: "SIM-91-2002-0000-0002",
    name: "Sunita Devi",
    age: "47",
    gender: "Female",
    complaintId: "fever",
    isReturning: true,
    priorSummary: "Bronchial Asthma & Allergic Rhinitis",
    diagnoses: ["Bronchial Asthma", "Allergic Rhinitis"],
    meds: [
      { name: "Salbutamol Inhaler", dose: "2 puffs", freq: "SOS (During wheeze)", conf: 0.95, tier: "EXACT", needs_verify: false },
      { name: "Sitopaladi Churna", dose: "3g", freq: "BD with honey", conf: 0.92, tier: "EXACT", needs_verify: false, system: "Ayurveda" },
      { name: "Montelukast", dose: "10mg", freq: "1 HS (Bedtime)", conf: 0.97, tier: "EXACT", needs_verify: false }
    ]
  },
  {
    id: "SIM-91-2003-0000-0003",
    name: "Gurpreet Singh",
    age: "64",
    gender: "Male",
    complaintId: "joint pain",
    isReturning: true,
    priorSummary: "Osteoarthritis (Sandhigata Vata) & Dyslipidemia",
    diagnoses: ["Sandhigata Vata", "Osteoarthritis", "Dyslipidemia"],
    meds: [
      { name: "Yograj Guggulu", dose: "2 Tablets", freq: "1 BD with warm water", conf: 0.94, tier: "EXACT", needs_verify: false, system: "Ayurveda" },
      { name: "Maharasnadi Kwatha", dose: "20ml", freq: "1 BD before meals", conf: 0.91, tier: "EXACT", needs_verify: false, system: "Ayurveda" },
      { name: "Paracetamol", dose: "650mg", freq: "SOS on severe pain", conf: 0.98, tier: "EXACT", needs_verify: false }
    ]
  }
]

export default function InteractivePatientJourney() {
  // Navigation & Step control
  const [currentStep, setCurrentStep] = useState(1)
  const [language, setLanguage] = useState('hi')
  
  // Step 1: Identify & Consent (Seeded ABDM Profile)
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0)
  const [patientId, setPatientId] = useState(SEED_DEMO_PATIENTS[0].id)
  const [patientName, setPatientName] = useState(SEED_DEMO_PATIENTS[0].name)
  const [patientAge, setPatientAge] = useState(SEED_DEMO_PATIENTS[0].age)
  const [patientGender, setPatientGender] = useState(SEED_DEMO_PATIENTS[0].gender)
  const [isReturningPatient, setIsReturningPatient] = useState(SEED_DEMO_PATIENTS[0].isReturning)
  const [consentDemographics, setConsentDemographics] = useState(true)
  const [consentVoice, setConsentVoice] = useState(true)
  const [consentScan, setConsentScan] = useState(true)
  const [consentAbdm, setConsentAbdm] = useState(true)
  const [audioExplaining, setAudioExplaining] = useState(false)

  // Step 2: Converse (Module A) & Track 1 Deep AYUSH Mode
  const [selectedComplaintId, setSelectedComplaintId] = useState('chest pain')
  const [ayushMode, setAyushMode] = useState(false)
  
  // Scored Prakriti Questionnaire state
  const [quizAnswers, setQuizAnswers] = useState({
    frame_skin: "Vata",
    appetite_digestion: "Pitta",
    weather_tolerance: "Vata",
    sleep_dreams: "Pitta",
    mental_temperament: "Vata",
    activity_speech: "Vata"
  })
  const [showPrakritiModal, setShowPrakritiModal] = useState(false)
  const [doshaScores, setDoshaScores] = useState({ vata: 58, pitta: 30, kapha: 12, prakritiLabel: "Vata-Pitta (द्वन्द्वज)" })

  // All 10 Dashavidha Pariksha Parameters
  const [ayushPrakriti, setAyushPrakriti] = useState('Vata-Pitta')
  const [ayushVikriti, setAyushVikriti] = useState('Vataja (वातज - तीव्र शूल / जकड़न)')
  const [ayushSara, setAyushSara] = useState('Madhyama Sara (मध्यम धातु सारता)')
  const [ayushSamhanana, setAyushSamhanana] = useState('Madhyama Samhanana (मध्यम सुगठन)')
  const [ayushPramana, setAyushPramana] = useState('Sama Pramana (अनुरूप शारीरिक माप)')
  const [ayushSatmya, setAyushSatmya] = useState('Sarva Rasa Satmya (सर्व रस सात्म्य)')
  const [ayushSattva, setAyushSattva] = useState('Pravara Sattva (उत्तम मानसिक मनोबल)')
  const [ayushAharaShakti, setAyushAharaShakti] = useState('Samagni (सम अग्नि / उत्तम पाचन)')
  const [ayushVyayamaShakti, setAyushVyayamaShakti] = useState('Madhyama (मध्यम सहनशक्ति)')
  const [ayushVaya, setAyushVaya] = useState('Madhyama Vaya (युवा-प्रौढ़ अवस्था 20-60y)')
  const [ayushAharaVihara, setAyushAharaVihara] = useState('Satmya Ahara & Regular Sleep Routine')
  const [selectedNamasteCode, setSelectedNamasteCode] = useState(SEED_NAMASTE_PRESETS[0])
  const [namasteSearchQuery, setNamasteSearchQuery] = useState('')

  // SOCRATES state
  const [questionIndex, setQuestionIndex] = useState(0)
  const [hpiAnswers, setHpiAnswers] = useState({})
  const [isRecording, setIsRecording] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [redFlagAlert, setRedFlagAlert] = useState(null)

  // Step 3: Scan (Module B) & Track 2 Prescription Detailing
  const [overlayBoundingBoxes, setOverlayBoundingBoxes] = useState(true)
  const [scanSubTab, setScanSubTab] = useState('viewer') // 'viewer' | 'reconciliation' | 'ddi'
  const [scannedDocument, setScannedDocument] = useState({
    title: 'Civil Hospital OPD Prescription Slip (28/08/2026)',
    type: 'Dual Prescription & Biochemistry',
    ocrText: `PATIENT REPORT - DISTRICT GENERAL HOSPITAL
Date: 28/08/2026 | Dr. R. K. Sharma, MD | OPD Room 104
Provisional Diagnosis: Type 2 Diabetes Mellitus, Essential Hypertension, Sandhigata Vata
Rx:
1. Tab Metformin 500mg - 1 BD before meals x 30 Days [Conf: 98% EXACT]
2. Tab Telmisartan 40mg - 1 OD morning x 30 Days [Conf: 98% EXACT]
3. Tab Ecosprin 75mg - 1 OD post lunch [Conf: 96% EXACT]
4. Tab Clopilet 75mg - 1 OD post lunch [Conf: 95% EXACT]
5. Vati Yograj Guggulu 2 Tabs - BD with warm water [Conf: 94% EXACT - Ayurveda]
6. Tab Paracetamol 1500mg - STAT [Conf: 68% FUZZY - DOSAGE HIGH]
Lab Results:
HBA1C: 8.4 % [Ref: 4.0 - 5.6 %] -> HIGH [ALERT]
Fasting Blood Sugar: 168 mg/dL [Ref: 70 - 100 mg/dL] -> HIGH [ALERT]
Serum Creatinine: 0.9 mg/dL [Ref: 0.6 - 1.2 mg/dL] -> NORMAL`,
    diagnoses: ['Type 2 Diabetes Mellitus', 'Essential Hypertension', 'Sandhigata Vata'],
    medications: [
      { name: 'Metformin', dose: '500mg', freq: '1 BD (Twice daily)', conf: 0.98, tier: 'EXACT', needs_verify: false, dose_status: 'NORMAL', box: [22, 10, 27, 90] },
      { name: 'Telmisartan', dose: '40mg', freq: '1 OD (Once daily)', conf: 0.98, tier: 'EXACT', needs_verify: false, dose_status: 'NORMAL', box: [28, 10, 33, 90] },
      { name: 'Ecosprin (Aspirin)', dose: '75mg', freq: '1 OD (After lunch)', conf: 0.96, tier: 'EXACT', needs_verify: false, dose_status: 'NORMAL', box: [34, 10, 39, 90] },
      { name: 'Clopilet (Clopidogrel)', dose: '75mg', freq: '1 OD (After lunch)', conf: 0.95, tier: 'EXACT', needs_verify: false, dose_status: 'NORMAL', box: [40, 10, 45, 90] },
      { name: 'Yograj Guggulu', dose: '2 Tablets', freq: '1 BD (Warm water)', conf: 0.94, tier: 'EXACT', needs_verify: false, system: 'Ayurveda', dose_status: 'NORMAL', box: [46, 10, 51, 90] },
      { name: 'Paracetamol', dose: '1500mg', freq: 'STAT SOS', conf: 0.68, tier: 'FUZZY', needs_verify: true, dose_status: 'DOSAGE HIGH', box: [52, 10, 57, 90] }
    ],
    labs: [
      { test: 'HbA1c', value: '8.4', unit: '%', ref: '4.0 - 5.6 %', flag: 'HIGH', box: [65, 10, 70, 85] },
      { test: 'Fasting Blood Sugar', value: '168', unit: 'mg/dL', ref: '70 - 100 mg/dL', flag: 'HIGH', box: [71, 10, 76, 85] },
      { test: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', ref: '0.6 - 1.2 mg/dL', flag: 'NORMAL', box: [77, 10, 82, 85] }
    ],
    interactions: [
      {
        id: "DDI-001",
        drugA: "Ecosprin (Aspirin)",
        drugB: "Clopilet (Clopidogrel)",
        severity: "MODERATE",
        title: "Dual Antiplatelet Bleeding Risk",
        desc: "Synergistic inhibition of platelet aggregation increases gastrointestinal bleeding risk. Ensure gastroprotection (PPI) and monitor."
      }
    ],
    reconciledList: [
      { name: "Metformin 500mg BD", source: "Ongoing Continuous", status: "ACTIVE", conflict: null },
      { name: "Telmisartan 40mg OD", source: "Prescription Aug 2026", status: "ACTIVE", conflict: null },
      { name: "Ecosprin 75mg OD", source: "Prescription Aug 2026", status: "ACTIVE", conflict: "DDI with Clopidogrel" },
      { name: "Clopilet 75mg OD", source: "Cardiology OPD", status: "ACTIVE", conflict: "DDI with Aspirin" },
      { name: "Yograj Guggulu 2 Tabs BD", source: "AYUSH OPD", status: "ACTIVE", conflict: null },
      { name: "Paracetamol 1500mg STAT", source: "Current Scan", status: "FLAGGED", conflict: "Exceeds max single safe dose" }
    ]
  })

  // Step 4 & 5: Review & Confirmation
  const [summaryMode, setSummaryMode] = useState('allopathic') // 'allopathic' | 'vaidya'
  const [editableDiagnoses, setEditableDiagnoses] = useState([])
  const [editableMeds, setEditableMeds] = useState([])
  const [physicianNotes, setPhysicianNotes] = useState('Patient presented via MediKiosk. Clinical intake verified against past prescriptions. Dual antiplatelet confirmed post-PCI. High paracetamol dose flagged for adjustment.')
  const [physicianConfirmed, setPhysicianConfirmed] = useState(false)
  const [hisFormat, setHisFormat] = useState('FHIR_R4')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [sessionPurged, setSessionPurged] = useState(false)

  // Initialize editable states
  useEffect(() => {
    setEditableDiagnoses([...scannedDocument.diagnoses])
    setEditableMeds([...scannedDocument.medications])
  }, [scannedDocument])

  // Recalculate Prakriti scores when quiz answers change
  useEffect(() => {
    let v = 0, p = 0, k = 0
    Object.values(quizAnswers).forEach(ans => {
      if (ans === "Vata") v += 1
      if (ans === "Pitta") p += 1
      if (ans === "Kapha") k += 1
    })
    const total = v + p + k || 1
    const vPct = Math.round((v / total) * 100)
    const pPct = Math.round((p / total) * 100)
    const kPct = 100 - vPct - pPct
    
    let label = "Vata-Pitta (द्वन्द्वज)"
    if (vPct >= 55) label = "Vataja (वातज प्रधान)"
    else if (pPct >= 55) label = "Pittaja (पित्तज प्रधान)"
    else if (kPct >= 55) label = "Kaphaja (कफज प्रधान)"
    else if (Math.abs(vPct - pPct) <= 15) label = "Vata-Pitta (द्वन्द्वज)"
    else if (Math.abs(pPct - kPct) <= 15) label = "Pitta-Kapha (द्वन्द्वज)"

    setDoshaScores({ vata: vPct, pitta: pPct, kapha: kPct, prakritiLabel: label })
    setAyushPrakriti(label)
  }, [quizAnswers])

  const activeComplaint = COMPLAINT_PRESETS.find(c => c.id === selectedComplaintId) || COMPLAINT_PRESETS[0]
  const currentQuestion = activeComplaint.questions[questionIndex]

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleAnswer = (answerValue) => {
    const fieldName = currentQuestion.field
    const updatedHpi = { ...hpiAnswers, [fieldName]: answerValue }
    setHpiAnswers(updatedHpi)

    if (selectedComplaintId === 'chest pain') {
      const radiation = updatedHpi.radiation || ''
      const association = updatedHpi.association || ''
      if (
        (radiation.includes('left arm') || radiation.includes('jaw')) ||
        (association.includes('sweating') || association.includes('breathlessness'))
      ) {
        setRedFlagAlert({
          ruleId: 'RF-001',
          condition: 'Possible Acute Coronary Syndrome (ACS Criteria)',
          priority: 'CRITICAL',
          message: 'CRITICAL ALERT: Substernal chest discomfort with radiation to left arm / diaphoresis. Patient routed to Immediate Triage & Emergency ECG counter.'
        })
      }
    }

    if (questionIndex < activeComplaint.questions.length - 1) {
      setQuestionIndex(q => q + 1)
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setQuestionIndex(0)
    setHpiAnswers({})
    setRedFlagAlert(null)
    setPhysicianConfirmed(false)
    setIsSubmitted(false)
    setSessionPurged(false)
    setSummaryMode('allopathic')
  }

  const filteredNamasteCodes = SEED_NAMASTE_PRESETS.filter(item => 
    !namasteSearchQuery || 
    item.term.toLowerCase().includes(namasteSearchQuery.toLowerCase()) || 
    item.allopathic.toLowerCase().includes(namasteSearchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(namasteSearchQuery.toLowerCase())
  )

  return (
    <div className="bg-ink2/90 border border-mist/20 rounded-lg shadow-2xl overflow-hidden my-8 text-paper font-sans">
      
      {/* ABDM & AYUSH Gateway Status Bar */}
      <div className="bg-emerald-950/40 border-b border-emerald-500/30 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-emerald-300 font-mono gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span><strong>ABDM & AYUSH PIPELINE ACTIVE</strong>: Module D FHIR R4 Bundles · NAMASTE ↔ ICD-11-TM2 · DDI Interaction Checker</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-sage/20 border border-sage/40 rounded text-[10px] uppercase font-bold text-sage">
            10-PARAM DASHAVIDHA
          </span>
          <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/40 rounded text-[10px] uppercase font-bold text-cyan-300">
            PER-FIELD CONFIDENCE
          </span>
        </div>
      </div>

      {/* Header bar with Stepper */}
      <div className="bg-ink border-b border-mist/15 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-saffron/20 border border-saffron flex items-center justify-center">
            <Activity className="w-5 h-5 text-saffron" />
          </div>
          <div>
            <h4 className="font-display text-lg font-bold text-paper flex items-center gap-2">
              MediKiosk Enterprise AI Intake
              <span className="font-mono text-[10px] bg-sage/20 text-sage border border-sage/40 px-2 py-0.5 rounded">
                v3.2 Production Spec
              </span>
            </h4>
            <p className="font-mono text-mist/60 text-xs">
              Autonomous Clinical Anamnesis · Dual Allopathy & Ayurveda Pipeline
            </p>
          </div>
        </div>

        {/* Top Step Breadcrumb */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono">
          {[
            { n: 1, label: 'Identify' },
            { n: 2, label: 'Converse' },
            { n: 3, label: 'Scan & DDI' },
            { n: 4, label: 'Summarize' },
            { n: 5, label: 'Consult' }
          ].map((s) => (
            <button
              key={s.n}
              onClick={() => setCurrentStep(s.n)}
              className={[
                'flex items-center gap-1 px-2.5 py-1 rounded transition-colors',
                currentStep === s.n
                  ? 'bg-saffron text-ink font-bold shadow'
                  : currentStep > s.n
                  ? 'bg-sage/20 text-sage border border-sage/40'
                  : 'text-mist/40 hover:text-mist'
              ].join(' ')}
            >
              <span>{s.n}.</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
          <button
            onClick={handleReset}
            title="Reset Kiosk Session"
            className="p-1.5 ml-1 rounded bg-ink3 text-mist/60 hover:text-paper hover:bg-ink hover:text-saffron transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Stage */}
      <div className="p-6 md:p-8 min-h-[500px]">
        <AnimatePresence mode="wait">

          {/* ========================================================= */}
          {/* STEP 1: IDENTIFY & CONSENT */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <motion.div key="step-1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
              <div className="bg-ink3/60 border border-mist/20 rounded-xl p-3.5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="text-saffron font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <span>👤</span> Select Seeded ABDM Demo Profile:
                  </span>
                  <span className="text-[11px] text-sage font-mono">
                    {isReturningPatient ? "🔄 Returning Patient (2 Prior Encounters)" : "🆕 New Patient Intake"}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-1">
                  {SEED_DEMO_PATIENTS.map((p, idx) => {
                    const isSel = selectedPatientIndex === idx;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPatientIndex(idx);
                          setPatientId(p.id);
                          setPatientName(p.name);
                          setPatientAge(p.age);
                          setPatientGender(p.gender);
                          setIsReturningPatient(p.isReturning);
                          if (p.complaintId) setSelectedComplaintId(p.complaintId);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
                          isSel
                            ? "bg-saffron text-ink font-bold border-saffron shadow-md"
                            : "bg-ink border-mist/20 text-paper/70 hover:border-saffron/50"
                        }`}
                      >
                        <span>{p.isReturning ? "🔄" : "🆕"}</span>
                        <span>{p.name}</span>
                        <span className="text-[10px] opacity-60">({p.age}{p.gender[0]})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-ink/80 border border-mist/15 rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-saffron uppercase tracking-wider font-semibold">
                      ABDM Gateway · ABHA Verification
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-sage bg-sage/10 px-2 py-0.5 rounded font-mono">
                      <CheckCircle2 className="w-3 h-3" /> M1 Verified
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-mist/50 block text-[11px] mb-1">ABHA Health ID Number:</label>
                      <input
                        type="text"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        className="w-full bg-ink3 border border-mist/20 rounded px-3 py-2 text-paper focus:outline-none focus:border-saffron"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="text-mist/50 block text-[11px] mb-1">Patient Name:</label>
                        <input
                          type="text"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className="w-full bg-ink3 border border-mist/20 rounded px-3 py-2 text-paper"
                        />
                      </div>
                      <div>
                        <label className="text-mist/50 block text-[11px] mb-1">Age / Sex:</label>
                        <input
                          type="text"
                          value={`${patientAge} / ${patientGender[0]}`}
                          readOnly
                          className="w-full bg-ink3/50 border border-mist/10 rounded px-3 py-2 text-paper/60"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consent Card */}
                <div className="bg-ink/80 border border-mist/15 rounded-md p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-sage uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-sage" /> DPDP Act 2023 Consent Verification
                    </span>
                    <button
                      onClick={() => {
                        setAudioExplaining(true)
                        speakText('कृपया ध्यान दें। आपकी सहमति से हम आपकी बीमारी की जानकारी डॉक्टर के कंप्यूटर तक पहुँचाते हैं।')
                        setTimeout(() => setAudioExplaining(false), 3500)
                      }}
                      className="flex items-center gap-1 text-[11px] text-saffron bg-saffron/10 px-2 py-0.5 rounded"
                    >
                      <Volume2 className="w-3 h-3" /> {audioExplaining ? 'Playing...' : 'Audio Consent'}
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 p-1.5 bg-ink3/40 rounded cursor-pointer">
                      <input type="checkbox" checked={consentDemographics} onChange={e => setConsentDemographics(e.target.checked)} className="accent-saffron" />
                      <span>Capture Demographics & ABHA Profile for OPD token queue</span>
                    </label>
                    <label className="flex items-center gap-2 p-1.5 bg-ink3/40 rounded cursor-pointer">
                      <input type="checkbox" checked={consentVoice} onChange={e => setConsentVoice(e.target.checked)} className="accent-saffron" />
                      <span>Record spoken history for AI SOCRATES & AYUSH structuring</span>
                    </label>
                    <label className="flex items-center gap-2 p-1.5 bg-ink3/40 rounded cursor-pointer">
                      <input type="checkbox" checked={consentScan} onChange={e => setConsentScan(e.target.checked)} className="accent-saffron" />
                      <span>Perform OCR & DDI checking on prescription uploads</span>
                    </label>
                    <label className="flex items-center gap-2 p-1.5 bg-ink3/40 rounded cursor-pointer">
                      <input type="checkbox" checked={consentAbdm} onChange={e => setConsentAbdm(e.target.checked)} className="accent-saffron" />
                      <span>Transmit finalized FHIR bundle upon physician/Vaidya confirmation</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-2 bg-saffron text-ink font-semibold px-6 py-3 rounded text-sm hover:bg-saffron-light transition-all shadow-md"
                >
                  Proceed to Conversational Intake <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: CONVERSE (MODULE A) + DEEP AYUSH / DASHAVIDHA */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <motion.div key="step-2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
              
              <div className="flex flex-wrap items-center justify-between border-b border-mist/10 pb-4 gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold text-saffron flex items-center gap-2">
                    <Mic className="w-5 h-5" /> Step 2: Conversational Multimodal History Intake (Module A)
                  </h3>
                  <p className="text-sm text-mist/70">
                    SOCRATES Adaptive Branching + Deep 10-Parameter AYUSH Pariksha + Scored Prakriti-Vikriti Engine.
                  </p>
                </div>
                
                {/* AYUSH Mode Toggle */}
                <div className="flex items-center gap-2 bg-sage/10 border border-sage/40 px-3.5 py-1.5 rounded-full">
                  <Sparkles className="w-4 h-4 text-sage" />
                  <span className="text-xs font-mono font-bold text-sage">Deep AYUSH Mode (Dashavidha):</span>
                  <button
                    onClick={() => setAyushMode(m => !m)}
                    className={[
                      'w-11 h-6 flex items-center rounded-full p-1 transition-colors',
                      ayushMode ? 'bg-sage justify-end' : 'bg-ink3 justify-start'
                    ].join(' ')}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                  </button>
                </div>
              </div>

              {/* Red Flag Alert */}
              {redFlagAlert && (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-alert/90 border-2 border-white/40 p-4 rounded-lg shadow-lg flex items-start gap-4 text-white">
                  <AlertTriangle className="w-8 h-8 flex-shrink-0 text-white animate-pulse" />
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider">🚨 {redFlagAlert.ruleId} · {redFlagAlert.condition}</h4>
                    <p className="text-xs mt-1 text-white/90">{redFlagAlert.message}</p>
                  </div>
                </motion.div>
              )}

              {/* Chief Complaint Selector */}
              <div>
                <label className="block text-xs font-mono text-mist/60 uppercase mb-2">Select Chief Complaint:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {COMPLAINT_PRESETS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedComplaintId(c.id)
                        setQuestionIndex(0)
                        setHpiAnswers({})
                        setRedFlagAlert(null)
                        if (c.isAyushRelevant) setAyushMode(true)
                      }}
                      className={[
                        'flex items-center gap-3 p-3 rounded border text-left text-xs transition-all',
                        selectedComplaintId === c.id
                          ? 'border-saffron bg-saffron/10 text-paper font-semibold shadow'
                          : 'border-mist/15 bg-ink/60 text-mist/70 hover:border-mist/40'
                      ].join(' ')}
                    >
                      <span className="text-xl">{c.icon}</span>
                      <div>
                        <p className="text-sm font-display text-paper">{c.label}</p>
                        <p className="text-[11px] text-mist/50 font-mono">{c.isAyushRelevant ? "Traditional AYUSH Track" : "SOCRATES Branching"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SOCRATES Dialogue Panel */}
              <div className="bg-ink border border-mist/15 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-saffron uppercase tracking-wider">
                    Question {questionIndex + 1} of {activeComplaint.questions.length} · SOCRATES Field: [<strong>{currentQuestion.field.toUpperCase()}</strong>]
                  </span>
                  <button onClick={() => speakText(language === 'hi' ? currentQuestion.promptHi : currentQuestion.prompt)} className="flex items-center gap-1 text-xs text-saffron hover:underline">
                    <Volume2 className="w-3.5 h-3.5" /> Speak Prompt
                  </button>
                </div>

                <div className="bg-ink3/40 border border-mist/10 p-4 rounded-md">
                  <h4 className="font-display text-lg text-paper font-semibold mb-1">{language === 'hi' ? currentQuestion.promptHi : currentQuestion.prompt}</h4>
                  <p className="text-xs text-mist/60 italic">{language === 'hi' ? currentQuestion.prompt : currentQuestion.promptHi}</p>
                </div>

                {/* Choice Buttons */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-mist/60 uppercase">Touch Choices:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {currentQuestion.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(opt)}
                        className={[
                          'p-2.5 rounded border text-xs text-left transition-all',
                          hpiAnswers[currentQuestion.field] === opt
                            ? 'border-sage bg-sage/20 text-paper font-semibold'
                            : 'border-mist/15 bg-ink2/70 text-mist/90 hover:border-saffron/60 hover:bg-ink3'
                        ].join(' ')}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Simulation */}
                <div className="p-3 bg-ink2/50 border border-mist/10 rounded flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setIsRecording(r => !r)
                        if (!isRecording) {
                          setVoiceText('Listening (AI4Bharat IndicConformer)...')
                          setTimeout(() => {
                            setVoiceText(currentQuestion.options[0])
                            handleAnswer(currentQuestion.options[0])
                            setIsRecording(false)
                          }, 1500)
                        }
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-alert text-white animate-pulse' : 'bg-saffron text-ink'}`}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <div>
                      <p className="text-xs font-semibold text-paper">{isRecording ? 'Listening...' : 'Tap to Speak Answer in Hindi/Regional Language'}</p>
                      <p className="text-[11px] text-mist/50 font-mono">{voiceText || 'Noise-robust acoustic model (96.8% confidence)'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TRACK 1: DEEP AYUSH & 10-PARAM DASHAVIDHA PARIKSHA SECTION */}
              {ayushMode && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-sage/10 border border-sage/40 rounded-xl space-y-6">
                  
                  {/* AYUSH Header & Scored Prakriti Trigger */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sage/20 pb-3">
                    <div>
                      <h4 className="font-display text-base font-bold text-sage flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-sage" /> AYUSH Dashavidha Pariksha (दशविध परीक्षा Matrix)
                      </h4>
                      <p className="text-xs text-mist/70">
                        10-Parameter Traditional Assessment & Quantitative Dosha Balance Metrics
                      </p>
                    </div>

                    <button
                      onClick={() => setShowPrakritiModal(true)}
                      className="px-4 py-2 bg-sage hover:bg-sage-dark text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 shadow"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Take Scored Prakriti Quiz (6 Domains)</span>
                    </button>
                  </div>

                  {/* Dosha Balance Visualization Chart */}
                  <div className="bg-ink3/80 border border-sage/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-sage uppercase flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-sage" /> Quantitative Dosha Balance Profile
                      </span>
                      <span className="text-xs font-mono text-saffron font-bold">
                        Calculated Prakriti: {doshaScores.prakritiLabel}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3 pt-1 text-xs font-mono">
                      {/* Vata Bar */}
                      <div className="space-y-1 bg-ink/60 p-2.5 rounded border border-mist/10">
                        <div className="flex justify-between">
                          <span className="text-cyan-400 font-bold">Vata (वात):</span>
                          <span className="font-bold text-paper">{doshaScores.vata}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${doshaScores.vata}%` }} />
                        </div>
                        <span className="text-[10px] text-mist/60 block">Movement, Nervous, Joints</span>
                      </div>

                      {/* Pitta Bar */}
                      <div className="space-y-1 bg-ink/60 p-2.5 rounded border border-mist/10">
                        <div className="flex justify-between">
                          <span className="text-amber-400 font-bold">Pitta (पित्त):</span>
                          <span className="font-bold text-paper">{doshaScores.pitta}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${doshaScores.pitta}%` }} />
                        </div>
                        <span className="text-[10px] text-mist/60 block">Metabolism, Heat, Digestion</span>
                      </div>

                      {/* Kapha Bar */}
                      <div className="space-y-1 bg-ink/60 p-2.5 rounded border border-mist/10">
                        <div className="flex justify-between">
                          <span className="text-emerald-400 font-bold">Kapha (कफ):</span>
                          <span className="font-bold text-paper">{doshaScores.kapha}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${doshaScores.kapha}%` }} />
                        </div>
                        <span className="text-[10px] text-mist/60 block">Structure, Lubrication, Immunity</span>
                      </div>
                    </div>
                  </div>

                  {/* All 10 Dashavidha Parameter Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    
                    {/* 1. Prakriti */}
                    <div>
                      <label className="text-mist/70 block text-[11px] font-mono mb-1">1. Prakriti (Constitution):</label>
                      <select value={ayushPrakriti} onChange={e => setAyushPrakriti(e.target.value)} className="w-full bg-ink border border-mist/20 rounded p-2 text-paper text-xs">
                        <option value="Vata-Pitta">Vata-Pitta (वात-पित्त)</option>
                        <option value="Kapha-Vata">Kapha-Vata (कफ-वात)</option>
                        <option value="Pitta-Kapha">Pitta-Kapha (पित्त-कफ)</option>
                        <option value="Vataja">Vataja (वात प्रधान)</option>
                        <option value="Pittaja">Pittaja (पित्त प्रधान)</option>
                        <option value="Kaphaja">Kaphaja (कफ प्रधान)</option>
                        <option value="Tridoshaja">Tridoshaja (त्रिदोषज)</option>
                      </select>
                    </div>

                    {/* 2. Vikriti */}
                    <div>
                      <label className="text-mist/70 block text-[11px] font-mono mb-1">2. Vikriti (Active Imbalance):</label>
                      <select value={ayushVikriti} onChange={e => setAyushVikriti(e.target.value)} className="w-full bg-ink border border-mist/20 rounded p-2 text-paper text-xs">
                        <option value="Vataja (वातज - तीव्र शूल / जकड़न)">Vataja (Pain, Crepitus, Stiffness)</option>
                        <option value="Pittaja (पित्तज - दाह, जलन, सूजन)">Pittaja (Burning, Acid, Redness)</option>
                        <option value="Kaphaja (कफज - भारीपन, स्राव)">Kaphaja (Congestion, Heaviness)</option>
                        <option value="Sannipataja (त्रिदोषज सन्निपात)">Sannipataja (Multi-doshic)</option>
                      </select>
                    </div>

                    {/* 3. Sara */}
                    <div>
                      <label className="text-mist/70 block text-[11px] font-mono mb-1">3. Sara (Dhatu Excellence / Vitality):</label>
                      <select value={ayushSara} onChange={e => setAyushSara(e.target.value)} className="w-full bg-ink border border-mist/20 rounded p-2 text-paper text-xs">
                        <option value="Pravara Sara (उत्तम धातु सारता)">Pravara Sara (Superior Vitality)</option>
                        <option value="Madhyama Sara (मध्यम धातु सारता)">Madhyama Sara (Moderate)</option>
                        <option value="Avara Sara (हीन सारता)">Avara Sara (Poor/Depleted)</option>
                      </select>
                    </div>

                    {/* 4. Samhanana */}
                    <div>
                      <label className="text-mist/70 block text-[11px] font-mono mb-1">4. Samhanana (Body Compactness):</label>
                      <select value={ayushSamhanana} onChange={e => setAyushSamhanana(e.target.value)} className="w-full bg-ink border border-mist/20 rounded p-2 text-paper text-xs">
                        <option value="Susamhata (सुसंहत / सुगठित शरीर)">Susamhata (Well-compact / Strong)</option>
                        <option value="Madhyama (मध्यम शरीर)">Madhyama (Moderate Build)</option>
                        <option value="Hina (हीन संहनन)">Hina (Weak / Loose Build)</option>
                      </select>
                    </div>

                    {/* 5. Pramana */}
                    <div>
                      <label className="text-mist/70 block text-[11px] font-mono mb-1">5. Pramana (Proportions):</label>
                      <select value={ayushPramana} onChange={e => setAyushPramana(e.target.value)} className="w-full bg-ink border border-mist/20 rounded p-2 text-paper text-xs">
                        <option value="Sama Pramana (अनुरूप प्रमाण)">Sama Pramana (Proportionate)</option>
                        <option value="Vishama Pramana (असम प्रमाण)">Vishama Pramana (Disproportionate)</option>
                      </select>
                    </div>

                    {/* 6. Satmya */}
                    <div>
                      <label className="text-mist/70 block text-[11px] font-mono mb-1">6. Satmya (Adaptability):</label>
                      <select value={ayushSatmya} onChange={e => setAyushSatmya(e.target.value)} className="w-full bg-ink border border-mist/20 rounded p-2 text-paper text-xs">
                        <option value="Sarva Rasa Satmya (सर्व रस सात्म्य)">Sarva Rasa Satmya (All Tastes)</option>
                        <option value="Madhyama Satmya (मध्यम)">Madhyama (Moderate Adaptability)</option>
                        <option value="Eka Rasa Satmya (एक रस)">Eka Rasa Satmya (Narrow Diet)</option>
                      </select>
                    </div>

                    {/* 7. Sattva */}
                    <div>
                      <label className="text-mist/70 block text-[11px] font-mono mb-1">7. Sattva (Mental Resilience):</label>
                      <select value={ayushSattva} onChange={e => setAyushSattva(e.target.value)} className="w-full bg-ink border border-mist/20 rounded p-2 text-paper text-xs">
                        <option value="Pravara Sattva (उत्तम मनोबल)">Pravara Sattva (High Resilience)</option>
                        <option value="Madhyama Sattva (मध्यम)">Madhyama Sattva (Moderate)</option>
                        <option value="Avara Sattva (हीन मनोबल)">Avara Sattva (Fragile / Anxious)</option>
                      </select>
                    </div>

                    {/* 8. Ahara Shakti */}
                    <div>
                      <label className="text-mist/70 block text-[11px] font-mono mb-1">8. Ahara Shakti (Agni / Digestion):</label>
                      <select value={ayushAharaShakti} onChange={e => setAyushAharaShakti(e.target.value)} className="w-full bg-ink border border-mist/20 rounded p-2 text-paper text-xs">
                        <option value="Samagni (सम अग्नि / उत्तम पाचन)">Samagni (Balanced Digestion)</option>
                        <option value="Tikshnagni (तीक्ष्ण अग्नि / तीव्र भूख)">Tikshnagni (Hyperactive / Acidic)</option>
                        <option value="Mandagni (मन्द अग्नि / धीमा पाचन)">Mandagni (Sluggish Digestion)</option>
                        <option value="Vishamagni (विषम अग्नि / अनियमित)">Vishamagni (Irregular / Bloating)</option>
                      </select>
                    </div>

                    {/* 9. Vyayama Shakti */}
                    <div>
                      <label className="text-mist/70 block text-[11px] font-mono mb-1">9. Vyayama Shakti (Endurance):</label>
                      <select value={ayushVyayamaShakti} onChange={e => setAyushVyayamaShakti(e.target.value)} className="w-full bg-ink border border-mist/20 rounded p-2 text-paper text-xs">
                        <option value="Pravara (उत्तम शारीरिक सहनशक्ति)">Pravara (High Endurance)</option>
                        <option value="Madhyama (मध्यम सहनशक्ति)">Madhyama (Moderate Endurance)</option>
                        <option value="Avara (शीघ्र थकान)">Avara (Low / Early Fatigue)</option>
                      </select>
                    </div>

                    {/* 10. Vaya */}
                    <div>
                      <label className="text-mist/70 block text-[11px] font-mono mb-1">10. Vaya (Age Chronotype):</label>
                      <select value={ayushVaya} onChange={e => setAyushVaya(e.target.value)} className="w-full bg-ink border border-mist/20 rounded p-2 text-paper text-xs">
                        <option value="Madhyama Vaya (युवा-प्रौढ़ अवस्था 20-60y)">Madhyama Vaya (20 - 60y)</option>
                        <option value="Vriddhavastha (वृद्धावस्था &gt;60y)">Vriddhavastha (Elderly &gt;60y)</option>
                        <option value="Balyavastha (बाल्यावस्था &lt;16y)">Balyavastha (Pediatric &lt;16y)</option>
                      </select>
                    </div>

                    {/* Extra: Ahara-Vihara */}
                    <div className="sm:col-span-2">
                      <label className="text-mist/70 block text-[11px] font-mono mb-1">Lifestyle & Diet (आहार-विहार):</label>
                      <input
                        type="text"
                        value={ayushAharaVihara}
                        onChange={e => setAyushAharaVihara(e.target.value)}
                        className="w-full bg-ink border border-mist/20 rounded p-2 text-paper text-xs"
                      />
                    </div>
                  </div>

                  {/* NAMASTE ↔ ICD-11-TM2 Diagnostic Code Selector */}
                  <div className="bg-ink/80 border border-sage/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-sage uppercase flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5" /> NAMASTE ↔ ICD-11-TM2 Code Selector (Seeded Local Registry)
                      </span>
                      <span className="text-[10px] font-mono text-mist/60">
                        {filteredNamasteCodes.length} codes mapped
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Search NAMASTE code, term, or allopathic equivalent (e.g. Sandhigata, Asthma, GERD)..."
                        value={namasteSearchQuery}
                        onChange={e => setNamasteSearchQuery(e.target.value)}
                        className="flex-1 bg-ink3 border border-mist/20 rounded px-3 py-1.5 text-xs text-paper focus:outline-none focus:border-sage font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                      {filteredNamasteCodes.map((item) => {
                        const isSelected = selectedNamasteCode?.code === item.code
                        return (
                          <button
                            key={item.code}
                            onClick={() => setSelectedNamasteCode(item)}
                            className={`p-2.5 rounded text-left text-xs font-mono transition-all border flex items-center justify-between ${
                              isSelected
                                ? 'bg-sage/20 border-sage text-paper font-bold'
                                : 'bg-ink3/40 border-mist/10 text-mist/80 hover:border-sage/40'
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-paper flex items-center gap-1.5">
                                <span>{item.term}</span>
                              </div>
                              <div className="text-[10px] text-mist/50">Allopathic: {item.allopathic}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] px-1.5 py-0.5 bg-sage/20 text-sage rounded border border-sage/40 block">
                                {item.code}
                              </span>
                              <span className="text-[9px] text-cyan-400 block mt-0.5 font-mono">
                                ICD: {item.icd11}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <button onClick={() => setCurrentStep(1)} className="inline-flex items-center gap-2 border border-mist/30 text-mist/80 px-4 py-2 rounded text-xs hover:border-mist/60 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Identity
                </button>
                <button onClick={() => setCurrentStep(3)} className="inline-flex items-center gap-2 bg-saffron text-ink font-semibold px-6 py-3 rounded text-sm hover:bg-saffron-light transition-all shadow-md">
                  Proceed to Document Scan (Module B) <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: SCAN (MODULE B) + HIGH-ASSURANCE PRESCRIPTION INTELLIGENCE */}
          {/* ========================================================= */}
          {currentStep === 3 && (
            <motion.div key="step-3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
              
              <div className="flex flex-wrap items-center justify-between border-b border-mist/10 pb-4 gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold text-saffron flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Step 3: Medical Document Digitization & OCR Detailing (Module B)
                  </h3>
                  <p className="text-sm text-mist/70">
                    Per-field confidence scoring, bounding-box traceability, dosage sanity ranges & DDI interaction engine.
                  </p>
                </div>

                {/* Sub-Tabs: Document View / Reconciled View / DDI */}
                <div className="flex items-center gap-1 bg-ink3 p-1 rounded-lg text-xs font-mono">
                  <button
                    onClick={() => setScanSubTab('viewer')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                      scanSubTab === 'viewer' ? 'bg-saffron text-ink shadow' : 'text-mist/70 hover:text-paper'
                    }`}
                  >
                    1. Scanned Document & BBoxes
                  </button>
                  <button
                    onClick={() => setScanSubTab('reconciliation')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                      scanSubTab === 'reconciliation' ? 'bg-cyan-500 text-ink shadow' : 'text-mist/70 hover:text-paper'
                    }`}
                  >
                    2. Reconciled Meds View
                  </button>
                  <button
                    onClick={() => setScanSubTab('ddi')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1 ${
                      scanSubTab === 'ddi' ? 'bg-alert text-white shadow' : 'text-alert hover:bg-alert/10'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>3. DDI Warnings ({scannedDocument.interactions.length})</span>
                  </button>
                </div>
              </div>

              {/* DDI Alert Banner */}
              {scannedDocument.interactions.length > 0 && (
                <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-3 text-xs text-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <span>⚠️ DRUG-DRUG INTERACTION DETECTED:</span>
                      <span className="px-2 py-0.5 bg-amber-500/20 rounded font-mono text-[10px] text-amber-300">
                        {scannedDocument.interactions[0].title}
                      </span>
                    </div>
                    <p className="text-mist/80 text-[11px]">{scannedDocument.interactions[0].desc}</p>
                  </div>
                </div>
              )}

              {/* TAB 1: Document Viewport with Interactive Bounding Box Overlays */}
              {scanSubTab === 'viewer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Scanned Document with Highlighted Bounding Box Overlay */}
                  <div className="bg-ink border border-mist/15 rounded-md p-5 space-y-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-saffron uppercase tracking-wider font-semibold flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-saffron" /> Scanned Slip with Bounding Boxes
                      </span>
                      <button
                        onClick={() => setOverlayBoundingBoxes(b => !b)}
                        className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                          overlayBoundingBoxes ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-ink3 text-mist/50 border-mist/20'
                        }`}
                      >
                        {overlayBoundingBoxes ? "✓ BBox Overlays ON" : "BBox Overlays OFF"}
                      </button>
                    </div>

                    {/* Prescription viewport mockup */}
                    <div className="relative bg-slate-900 border border-mist/20 rounded-lg p-4 font-mono text-xs text-slate-200 shadow-inner max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {scannedDocument.ocrText}

                      {/* Render simulated bounding box overlay highlights */}
                      {overlayBoundingBoxes && (
                        <div className="absolute inset-0 pointer-events-none p-4 space-y-3">
                          <div className="border border-cyan-400/80 bg-cyan-400/10 rounded px-1 text-[9px] text-cyan-300 font-bold inline-block">
                            [BBOX-MED-01: Metformin 500mg | 98% EXACT]
                          </div>
                          <div className="border border-cyan-400/80 bg-cyan-400/10 rounded px-1 text-[9px] text-cyan-300 font-bold inline-block ml-2">
                            [BBOX-MED-02: Telmisartan 40mg | 98% EXACT]
                          </div>
                          <div className="border border-red-500/80 bg-red-500/15 rounded px-1 text-[9px] text-red-300 font-bold block mt-4">
                            [BBOX-MED-06: Paracetamol 1500mg | 68% VERIFY REQUIRED]
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 bg-mist/5 border border-mist/10 rounded flex items-center justify-between text-xs font-mono">
                      <span>Document: <strong>{scannedDocument.title}</strong></span>
                      <span className="text-sage font-bold">100% Traceable</span>
                    </div>
                  </div>

                  {/* Right: Extracted Entities with Confidence Badges & Dosage Flags */}
                  <div className="space-y-4">
                    <div className="bg-ink border border-mist/15 rounded-md p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-mono text-xs text-saffron uppercase tracking-wider font-semibold">
                          Extracted Active Drugs (Per-Field Confidence)
                        </h4>
                        <span className="text-[10px] font-mono text-mist/50">Lexicon Tiers</span>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {scannedDocument.medications.map((m, i) => (
                          <div
                            key={i}
                            className={`p-2.5 rounded text-xs border flex items-center justify-between ${
                              m.needs_verify
                                ? 'bg-red-950/30 border-red-500/40 text-paper'
                                : 'bg-ink2/60 border-mist/10 text-mist/90'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2 font-semibold text-paper">
                                <span>{m.name}</span>
                                <span className="text-mist/60 font-normal">({m.dose})</span>
                                {m.system === 'Ayurveda' && (
                                  <span className="text-[9px] bg-sage/20 text-sage px-1.5 py-0.2 rounded border border-sage/40">
                                    AYUSH
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-mist/50 font-mono mt-0.5">{m.freq}</div>
                            </div>

                            <div className="text-right font-mono">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold border block ${
                                  m.needs_verify
                                    ? 'bg-alert/20 text-alert border-alert/40 animate-pulse'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {m.needs_verify ? `⚠️ ${m.dose_status}` : `✓ ${m.conf * 100}% ${m.tier}`}
                              </span>
                              {m.needs_verify && (
                                <span className="text-[9px] text-alert block mt-0.5 font-bold">
                                  [VERIFY REQUIRED]
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Labs */}
                    <div className="bg-ink border border-mist/15 rounded-md p-4 space-y-2">
                      <h4 className="font-mono text-xs text-sage uppercase tracking-wider font-semibold">
                        Abnormal Lab Results Highlighting (ICMR Ranges)
                      </h4>
                      <div className="space-y-1.5">
                        {scannedDocument.labs.map((l, i) => (
                          <div key={i} className={`p-2 rounded text-xs flex justify-between border ${l.flag === 'HIGH' ? 'bg-alert/15 border-alert/40' : 'bg-ink2/40 border-mist/10'}`}>
                            <div>
                              <span className="font-semibold text-paper">{l.test}</span>
                              <span className="text-[10px] text-mist/50 block font-mono">Ref: {l.ref}</span>
                            </div>
                            <div className="text-right font-mono">
                              <span className="font-bold text-paper">{l.value} {l.unit}</span>
                              <span className={`block text-[10px] font-bold ${l.flag === 'HIGH' ? 'text-alert' : 'text-sage'}`}>[{l.flag}]</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Reconciled Multi-Prescription View */}
              {scanSubTab === 'reconciliation' && (
                <div className="bg-ink border border-mist/15 rounded-xl p-5 space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-mist/10 pb-3">
                    <div>
                      <span className="text-cyan-400 uppercase font-bold text-xs flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-cyan-400" /> Multi-Prescription Reconciled Current-Medication List
                      </span>
                      <p className="text-[11px] text-mist/60 mt-0.5">
                        Synthesizes multiple uploaded prescriptions, detects duplicates, active vs past regimens, and therapy conflicts.
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/40 font-bold">
                      {scannedDocument.reconciledList.length} Items Reconciled
                    </span>
                  </div>

                  <div className="space-y-2">
                    {scannedDocument.reconciledList.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex flex-wrap items-center justify-between gap-2 ${
                          item.conflict
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                            : 'bg-ink2/60 border-mist/10 text-paper'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-sm text-paper flex items-center gap-2">
                            <span>{item.name}</span>
                            <span className="text-[10px] font-normal px-2 py-0.2 bg-ink3 rounded border border-mist/20 text-mist/70">
                              Source: {item.source}
                            </span>
                          </div>
                          {item.conflict && (
                            <div className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold">
                              <AlertCircle className="w-3.5 h-3.5" /> {item.conflict}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                              item.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-alert/20 text-alert border-alert/40 animate-pulse'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: DDI Rule Engine Details */}
              {scanSubTab === 'ddi' && (
                <div className="bg-ink border border-mist/15 rounded-xl p-5 space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-mist/10 pb-3">
                    <span className="text-alert uppercase font-bold text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-alert" /> Hardcoded Drug-Drug Interaction (DDI) Safety Rulebook
                    </span>
                    <span className="text-[11px] text-mist/60">30 Rule Pairs Seeded</span>
                  </div>

                  <div className="space-y-3">
                    {scannedDocument.interactions.map((ddi) => (
                      <div key={ddi.id} className="p-4 bg-alert/10 border border-alert/40 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-alert flex items-center gap-1.5">
                            ⚡ {ddi.title} [{ddi.id}]
                          </span>
                          <span className="px-2 py-0.5 bg-alert/20 text-alert rounded border border-alert/40 font-bold text-[10px]">
                            {ddi.severity} ALERT
                          </span>
                        </div>
                        <div className="text-paper/90 text-xs">
                          <strong>Interacting Agents:</strong> {ddi.drugA} ⟷ {ddi.drugB}
                        </div>
                        <p className="text-mist/80 text-xs leading-relaxed">{ddi.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <button onClick={() => setCurrentStep(2)} className="inline-flex items-center gap-2 border border-mist/30 text-mist/80 px-4 py-2 rounded text-xs hover:border-mist/60 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Conversation
                </button>
                <button onClick={() => setCurrentStep(4)} className="inline-flex items-center gap-2 bg-saffron text-ink font-semibold px-6 py-3 rounded text-sm hover:bg-saffron-light transition-all shadow-md">
                  Generate Structured Summary (Module C) <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: SUMMARIZE (MODULE C) - DUAL ALLOPATHIC & VAIDYA */}
          {/* ========================================================= */}
          {currentStep === 4 && (
            <motion.div key="step-4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
              
              <div className="flex flex-wrap items-center justify-between border-b border-mist/10 pb-4 gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold text-saffron flex items-center gap-2">
                    <Database className="w-5 h-5" /> Step 4: Structured Summary & FHIR R4 Bundle Assembly (Module C & D)
                  </h3>
                  <p className="text-sm text-mist/70">
                    Dual rendering paths: Allopathic Clinical Summary vs Vaidya Ayurveda Assessment.
                  </p>
                </div>

                {/* Summary Path Toggle */}
                <div className="flex items-center gap-2 bg-ink3 p-1 rounded-lg text-xs font-mono">
                  <button
                    onClick={() => setSummaryMode('allopathic')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                      summaryMode === 'allopathic' ? 'bg-saffron text-ink shadow' : 'text-mist/70 hover:text-paper'
                    }`}
                  >
                    Allopathic OPD Summary
                  </button>
                  <button
                    onClick={() => setSummaryMode('vaidya')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                      summaryMode === 'vaidya' ? 'bg-sage text-slate-950 font-bold shadow' : 'text-sage hover:bg-sage/10'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Vaidya Ayurveda Summary</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Card: Clinical Summary Text (Allopathic or Vaidya) */}
                <div className="bg-ink border border-mist/15 rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-saffron uppercase tracking-wider font-semibold">
                      {summaryMode === 'vaidya' ? "AYURVEDA VAIDYA CLINICAL INTAKE (वैद्य सारांश)" : "Standard Clinical History Format (Allopathy)"}
                    </span>
                    <button
                      onClick={() => speakText(summaryMode === 'vaidya' ? `नमस्ते ${patientName}, आपका आयुष वैद्य सारांश तैयार है।` : `नमस्ते ${patientName}, आपका सारांश तैयार है। डॉक्टर समीक्षा करेंगे।`)}
                      className="flex items-center gap-1 text-[11px] text-sage bg-sage/10 px-2 py-0.5 rounded"
                    >
                      <Volume2 className="w-3 h-3" /> Audio Confirm
                    </button>
                  </div>

                  {summaryMode === 'allopathic' ? (
                    <div className="space-y-3 text-xs bg-ink2/40 p-4 rounded border border-mist/10 max-h-80 overflow-y-auto leading-relaxed font-mono">
                      <div>
                        <span className="text-saffron font-bold uppercase text-[11px] block">1. Chief Complaint:</span>
                        <p className="text-paper font-semibold">{selectedComplaintId.toUpperCase()}</p>
                      </div>
                      <div>
                        <span className="text-sage font-bold uppercase text-[11px] block">2. HPI (SOCRATES Framework):</span>
                        <ul className="list-disc pl-4 text-mist/80 space-y-0.5">
                          {Object.entries(hpiAnswers).map(([k, v]) => (
                            <li key={k}><strong className="text-paper capitalize">{k}:</strong> {v}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-mist/60 font-bold uppercase text-[11px] block">3. Scanned Past Diagnoses:</span>
                        <p className="text-paper">{scannedDocument.diagnoses.join(', ')}</p>
                      </div>
                      <div>
                        <span className="text-mist/60 font-bold uppercase text-[11px] block">4. Active Medications & DDI Alerts:</span>
                        <p className="text-paper">
                          {scannedDocument.medications.map(m => `${m.name} ${m.dose} (${m.freq})`).join('; ')}
                        </p>
                      </div>
                      <div>
                        <span className="text-mist/60 font-bold uppercase text-[11px] block">5. Abnormal Lab Results:</span>
                        <p className="text-paper">HbA1c: 8.4% (HIGH), Fasting Glucose: 168 mg/dL (HIGH)</p>
                      </div>
                    </div>
                  ) : (
                    /* Vaidya Summary Path */
                    <div className="space-y-3 text-xs bg-sage/5 p-4 rounded border border-sage/30 max-h-80 overflow-y-auto leading-relaxed font-mono">
                      <div>
                        <span className="text-sage font-bold uppercase text-[11px] block">1. Pradhana Vedana (Chief Complaint):</span>
                        <p className="text-paper font-semibold">{selectedComplaintId.toUpperCase()} (सन्धिगत शूल / वेदना)</p>
                      </div>
                      <div>
                        <span className="text-saffron font-bold uppercase text-[11px] block">2. Dosha Pariksha (Prakriti vs Vikriti):</span>
                        <p className="text-paper">
                          • Deha Prakriti: <strong>{doshaScores.prakritiLabel}</strong> (Vata: {doshaScores.vata}%, Pitta: {doshaScores.pitta}%, Kapha: {doshaScores.kapha}%)<br />
                          • Current Vikriti: <strong className="text-amber-300">{ayushVikriti}</strong>
                        </p>
                      </div>
                      <div>
                        <span className="text-cyan-400 font-bold uppercase text-[11px] block">3. Dashavidha Pariksha Matrix:</span>
                        <ul className="list-disc pl-4 text-mist/80 space-y-0.5 text-[11px]">
                          <li>Sara: {ayushSara}</li>
                          <li>Samhanana: {ayushSamhanana}</li>
                          <li>Ahara Shakti / Agni: {ayushAharaShakti}</li>
                          <li>Vyayama Shakti: {ayushVyayamaShakti}</li>
                          <li>Sattva / Mental Resilience: {ayushSattva}</li>
                        </ul>
                      </div>
                      <div>
                        <span className="text-sage font-bold uppercase text-[11px] block">4. NAMASTE / ICD-11-TM2 Traditional Coding:</span>
                        <p className="text-paper font-semibold">
                          {selectedNamasteCode.code} - {selectedNamasteCode.term} [ICD-11-TM2: {selectedNamasteCode.icd11}]
                        </p>
                      </div>
                      <div className="pt-2 text-[10px] text-amber-300 italic border-t border-sage/20">
                        * Strict Confirm-Gate: Draft only. Never auto-suggests treatment or commits without Vaidya sign-off.
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Card: FHIR R4 JSON Bundle Inspector */}
                <div className="bg-ink border border-mist/15 rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-sage uppercase tracking-wider font-semibold">
                      FHIR R4 JSON Bundle (ABDM & AYUSH Profile)
                    </span>
                    <span className="font-mono text-[10px] text-mist/50">hl7.org/fhir/R4</span>
                  </div>

                  <div className="bg-ink3 text-sage font-mono text-[11px] p-4 rounded border border-mist/15 max-h-80 overflow-y-auto">
                    <pre>{JSON.stringify({
                      resourceType: "Bundle",
                      type: "document",
                      id: "medikiosk-bundle-087",
                      entry: [
                        {
                          resourceType: "Condition",
                          id: "chief-complaint",
                          code: { text: selectedComplaintId },
                          subject: { reference: `Patient/${patientId}` }
                        },
                        {
                          resourceType: "Condition",
                          id: "namaste-traditional-diagnosis",
                          code: {
                            coding: [
                              { system: "http://namaste.ayush.gov.in", code: selectedNamasteCode.code, display: selectedNamasteCode.term },
                              { system: "http://id.who.int/icd/release/11/mms/tm2", code: selectedNamasteCode.icd11, display: selectedNamasteCode.term }
                            ],
                            text: selectedNamasteCode.term
                          }
                        },
                        {
                          resourceType: "Observation",
                          id: "ayush-prakriti-dosha-balance",
                          category: [{ coding: [{ code: "ayush", display: "Traditional Medicine" }] }],
                          valueString: `Prakriti: ${doshaScores.prakritiLabel}; Vata: ${doshaScores.vata}%, Pitta: ${doshaScores.pitta}%, Kapha: ${doshaScores.kapha}%`
                        },
                        {
                          resourceType: "Observation",
                          id: "ayush-ahara-shakti",
                          valueString: ayushAharaShakti
                        },
                        {
                          resourceType: "MedicationStatement",
                          id: "med-reconciled-0",
                          medicationCodeableConcept: { text: "Metformin 500mg BD" }
                        },
                        {
                          resourceType: "Observation",
                          id: "lab-hba1c",
                          code: { text: "HbA1c" },
                          valueQuantity: { value: 8.4, unit: "%" },
                          interpretation: [{ coding: [{ code: "H", display: "High" }] }]
                        }
                      ]
                    }, null, 2)}</pre>
                  </div>
                </div>

              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <button onClick={() => setCurrentStep(3)} className="inline-flex items-center gap-2 border border-mist/30 text-mist/80 px-4 py-2 rounded text-xs hover:border-mist/60 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Documents
                </button>
                <button onClick={() => setCurrentStep(5)} className="inline-flex items-center gap-2 bg-saffron text-ink font-semibold px-6 py-3 rounded text-sm hover:bg-saffron-light transition-all shadow-md">
                  Open Physician / Vaidya Review & Confirm (Step 5) <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP 5: CONSULT & PHYSICIAN / VAIDYA CONFIRMATION GATE */}
          {/* ========================================================= */}
          {currentStep === 5 && (
            <motion.div key="step-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
              
              <div className="border-b border-mist/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-saffron flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" /> Step 5: Clinical Review & Strict Confirmation Gate
                  </h3>
                  <p className="text-sm text-mist/70">
                    Strict architecture rule: AI summary is a draft. Must be confirmed by doctor/Vaidya before submission to Hospital EHR.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-mist/50">Target Protocol:</span>
                  <select value={hisFormat} onChange={(e) => setHisFormat(e.target.value)} className="bg-ink border border-mist/20 text-paper text-xs rounded px-2.5 py-1">
                    <option value="FHIR_R4">HL7 FHIR R4 (ABDM & AYUSH Native)</option>
                    <option value="HL7_V2">HL7 v2.5 ORU^R01 Message</option>
                    <option value="CUSTOM_JSON">Custom Hospital JSON API</option>
                  </select>
                </div>
              </div>

              {/* Review Dashboard */}
              <div className="bg-ink border border-mist/15 rounded-md p-6 space-y-5">
                
                <div className="flex items-center justify-between border-b border-mist/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-mist/10 border border-mist/30 flex items-center justify-center text-paper font-bold text-sm">
                      Dr
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-paper text-sm">Dr. R. K. Sharma, MD / Vaidya Shastri</h4>
                      <p className="text-xs text-mist/60">Reviewing Patient: <strong>{patientName}</strong> (Token #OPD-087)</p>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-xs px-3 py-1 rounded-full font-bold border ${
                      physicianConfirmed
                        ? 'bg-sage/20 text-sage border-sage/40'
                        : 'bg-saffron/20 text-saffron border-saffron/40 animate-pulse'
                    }`}
                  >
                    {physicianConfirmed ? '✓ CONFIRMED & AUTHORIZED' : '⚠️ AWAITING DIGITAL SIGN-OFF'}
                  </span>
                </div>

                {/* Scanned Items with Low Confidence Flags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
                  
                  {/* Left: Diagnoses & Trad Morbidity */}
                  <div className="space-y-2.5">
                    <label className="text-mist/60 uppercase block font-bold">Diagnoses (Click to Edit):</label>
                    <div className="flex flex-wrap gap-2">
                      {editableDiagnoses.map((diag, i) => (
                        <span key={i} className="bg-ink3 px-2.5 py-1 rounded border border-mist/20 text-paper flex items-center gap-1.5">
                          {diag}
                          <button onClick={() => setEditableDiagnoses(editableDiagnoses.filter((_, idx) => idx !== i))} className="text-mist/40 hover:text-alert">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={() => {
                          const newDiag = prompt('Enter additional diagnosis:', 'Suspected CAD / Angina Pectoris')
                          if (newDiag) setEditableDiagnoses([...editableDiagnoses, newDiag])
                        }}
                        className="px-2 py-1 border border-dashed border-mist/30 text-mist/60 hover:text-paper rounded"
                      >
                        + Add Diagnosis
                      </button>
                    </div>

                    <div className="p-2.5 bg-ink3/40 rounded border border-mist/10 space-y-1">
                      <span className="text-[10px] text-sage uppercase font-bold block">Assigned NAMASTE Traditional Coding:</span>
                      <div className="text-paper font-semibold">{selectedNamasteCode.code}: {selectedNamasteCode.term}</div>
                    </div>
                  </div>

                  {/* Right: Flagged Medications & Interaction Warnings */}
                  <div className="space-y-2.5">
                    <label className="text-mist/60 uppercase block font-bold">Medications Requiring Physician Verification:</label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {editableMeds.map((m, i) => (
                        <div key={i} className={`p-2 rounded border flex justify-between items-center ${m.needs_verify ? 'bg-red-950/40 border-red-500/40 text-red-200' : 'bg-ink2/50 border-mist/10'}`}>
                          <span>{m.name} ({m.dose})</span>
                          <span className={`text-[10px] font-bold ${m.needs_verify ? 'text-red-400' : 'text-sage'}`}>
                            {m.needs_verify ? '[VERIFY REQUIRED]' : '[VERIFIED]'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Physician Notes */}
                <div className="space-y-2">
                  <label className="font-mono text-mist/60 uppercase block text-xs font-bold">Physician Notes & Orders:</label>
                  <textarea
                    value={physicianNotes}
                    onChange={(e) => setPhysicianNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-ink3 border border-mist/20 rounded p-2.5 text-paper text-xs focus:outline-none focus:border-saffron font-mono"
                  />
                </div>

                {/* Confirmation Actions */}
                <div className="pt-4 border-t border-mist/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPhysicianConfirmed(true)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-xs transition-all ${
                        physicianConfirmed
                          ? 'bg-sage text-white shadow'
                          : 'bg-saffron text-ink hover:bg-saffron-light'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {physicianConfirmed ? 'Physician / Vaidya Confirmed' : 'Confirm & Authorize Clinical Summary'}
                    </button>
                    <button onClick={() => setPhysicianConfirmed(false)} className="px-3 py-2.5 border border-mist/20 text-mist/60 hover:text-alert rounded text-xs">
                      Reset Confirmation
                    </button>
                  </div>

                  {/* Submission */}
                  <button
                    disabled={!physicianConfirmed || isSubmitted}
                    onClick={() => {
                      setIsSubmitted(true)
                      setTimeout(() => setSessionPurged(true), 1000)
                    }}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded text-xs font-semibold font-mono transition-all ${
                      !physicianConfirmed
                        ? 'bg-ink3 text-mist/30 cursor-not-allowed border border-mist/10'
                        : isSubmitted
                        ? 'bg-sage/30 text-sage border border-sage/50'
                        : 'bg-sage text-white hover:bg-sage-dark shadow-md'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitted ? 'Submitted to HIS & ABHA Linked' : 'Push to Hospital HIS (EHR)'}
                  </button>
                </div>

              </div>

              {/* Session Purged Banner */}
              {sessionPurged && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-sage/15 border border-sage/40 rounded-lg text-xs space-y-2 text-paper">
                  <div className="flex items-center gap-2 text-sage font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4" /> SUCCESS: RECORD COMMITTED & MEMORY PURGED
                  </div>
                  <p className="text-mist/80 leading-relaxed font-mono">
                    1. FHIR Bundle successfully transmitted to hospital EHR via {hisFormat} protocol.<br />
                    2. Traditional NAMASTE diagnostic code ({selectedNamasteCode.code}) linked to ABHA ID.<br />
                    3. <strong>DPDP Act Compliance:</strong> Transient voice recordings and raw prescription photos purged from kiosk RAM.
                  </p>
                  <div className="pt-2">
                    <button onClick={handleReset} className="bg-ink3 text-saffron hover:bg-ink px-4 py-1.5 rounded font-mono text-xs border border-saffron/30">
                      Start Next Patient Session (Reset)
                    </button>
                  </div>
                </motion.div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* PRAKRITI SCORED QUIZ MODAL */}
      <AnimatePresence>
        {showPrakritiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-ink border border-sage/40 rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto text-paper">
              <div className="flex items-center justify-between border-b border-mist/10 pb-3">
                <h4 className="font-display text-lg font-bold text-sage flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-sage" /> Prakriti Dosha Assessment (6 Classical Domains)
                </h4>
                <button onClick={() => setShowPrakritiModal(false)} className="text-mist/40 hover:text-paper">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                {PRAKRITI_QUIZ_QUESTIONS.map((q, idx) => (
                  <div key={q.id} className="bg-ink3/50 p-3.5 rounded-xl space-y-2 border border-mist/10">
                    <div className="font-bold text-paper text-[11px]">
                      {idx + 1}. {q.domain}: <span className="text-mist/80 font-normal">{q.prompt}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = quizAnswers[q.id] === opt.dosha
                        return (
                          <button
                            key={oIdx}
                            onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt.dosha })}
                            className={`p-2 rounded text-left text-[11px] border transition-all ${
                              isSelected
                                ? 'bg-sage/20 border-sage text-paper font-bold shadow'
                                : 'bg-ink/60 border-mist/15 text-mist/70 hover:border-sage/40'
                            }`}
                          >
                            <span className="block font-bold text-sage">{opt.dosha}:</span>
                            <span>{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-mist/10">
                <div className="text-xs font-mono">
                  Calculated: <strong className="text-saffron">{doshaScores.prakritiLabel}</strong> (Vata: {doshaScores.vata}%, Pitta: {doshaScores.pitta}%, Kapha: {doshaScores.kapha}%)
                </div>
                <button onClick={() => setShowPrakritiModal(false)} className="px-5 py-2 bg-sage hover:bg-sage-dark text-slate-950 font-bold rounded-lg text-xs font-mono shadow">
                  Apply Dosha Scores to Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer info */}
      <div className="bg-ink px-6 py-3 border-t border-mist/10 text-xs font-mono text-mist/50 flex flex-wrap justify-between items-center gap-2">
        <span>MediKiosk Enterprise v3.2 · AYUSH Ministry & ABDM Integrated</span>
        <span>Safety Invariant: Summary never auto-saves to EHR without physician/Vaidya review</span>
      </div>
    </div>
  )
}

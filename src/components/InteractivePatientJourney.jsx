/**
 * InteractivePatientJourney.jsx
 *
 * Full functional interactive simulator for the 5-step MediKiosk patient journey.
 * Implements Enterprise ABDM & DPDP Act 2023 requirements:
 *   - Step 1: Identify (ABHA / QR / Language / Audio-explained granular DPDP consent)
 *   - Step 2: Converse (Module A dual-mode voice/touch, SOCRATES questions, ROS, AYUSH mode, hard-coded Red Flag safety trigger)
 *   - Step 3: Scan (Module B document upload, OCR extraction, lab ref range flags, timeline)
 *   - Step 4: Summarize & Route (Module C bilingual summary + FHIR R4 JSON bundle + HIS routing)
 *   - Step 5: Consult (Physician review dashboard, inline editing, strict confirm-before-submit rule, DPDP session purge)
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mic, MicOff, Volume2, ShieldCheck, FileText, CheckCircle2,
  AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, Lock, Sparkles,
  Stethoscope, Activity, Database, Send, Check, Edit3, X, Play, Eye
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
      { field: 'site', prompt: 'Which joints are painful (knees, hands, back, multiple)?', promptHi: 'किन जोड़ों में दर्द है?', options: ['Bilateral Knee joints (Sandhigata Vata)', 'Small joints of hands/fingers', 'Lower spine & hips'] },
      { field: 'onset', prompt: 'How long has this joint stiffness been present?', promptHi: 'यह दर्द कितने समय से है?', options: ['Gradual over 6 months', 'Sudden flare-up 4 days ago', 'Years of chronic aching'] },
      { field: 'character', prompt: 'Is there morning stiffness lasting > 30 minutes, swelling or burning?', promptHi: 'क्या सुबह अकड़न या सूजन रहती है?', options: ['Severe morning stiffness & crepitus', 'Aching on weight-bearing', 'Swelling with local heat'] },
      { field: 'timing', prompt: 'Does pain worsen with cold weather or physical exertion?', promptHi: 'क्या ठंड या चलने-फिरने से दर्द बढ़ता है?', options: ['Aggravated by cold & walking', 'Worse during rest', 'Constant throbbing'] }
    ]
  }
]

// Seed Demo Patient Registry (Clearly Fictional Data for ABDM Module D Simulation)
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
      { name: "Metformin", dose: "500mg", freq: "1 BD (Twice daily)" },
      { name: "Telmisartan", dose: "40mg", freq: "1 OD (Once daily)" },
      { name: "Atorvastatin", dose: "20mg", freq: "1 HS (Bedtime)" }
    ]
  },
  {
    id: "SIM-91-2002-0000-0002",
    name: "Sunita Devi",
    age: "47",
    gender: "Female",
    complaintId: "fever",
    isReturning: true,
    priorSummary: "Bronchial Asthma & Allergic Rhinitis (1 prior encounter)",
    diagnoses: ["Bronchial Asthma", "Allergic Rhinitis"],
    meds: [
      { name: "Salbutamol Inhaler", dose: "2 puffs", freq: "SOS (During wheeze)" },
      { name: "Montelukast", dose: "10mg", freq: "1 HS (Bedtime)" }
    ]
  },
  {
    id: "SIM-91-2003-0000-0003",
    name: "Gurpreet Singh",
    age: "64",
    gender: "Male",
    complaintId: "chest pain",
    isReturning: true,
    priorSummary: "Post-PCI Stent (July 2024), Dyslipidemia",
    diagnoses: ["Coronary Artery Disease (Post-PTCA)", "Dyslipidemia"],
    meds: [
      { name: "Aspirin", dose: "75mg", freq: "1 OD (Morning)" },
      { name: "Clopidogrel", dose: "75mg", freq: "1 OD (Morning)" }
    ]
  },
  {
    id: "SIM-91-1001-0000-0001",
    name: "Ananya Sharma",
    age: "28",
    gender: "Female",
    complaintId: "fever",
    isReturning: false,
    priorSummary: "New Patient (Zero Prior Linked History)",
    diagnoses: [],
    meds: []
  },
  {
    id: "SIM-91-1002-0000-0002",
    name: "Mohammed Farhan",
    age: "33",
    gender: "Male",
    complaintId: "joint pain",
    isReturning: false,
    priorSummary: "New Patient (Zero Prior Linked History)",
    diagnoses: [],
    meds: []
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
  const [abhaVerified, setAbhaVerified] = useState(true)
  const [consentDemographics, setConsentDemographics] = useState(true)
  const [consentVoice, setConsentVoice] = useState(true)
  const [consentScan, setConsentScan] = useState(true)
  const [consentAbdm, setConsentAbdm] = useState(true)
  const [audioExplaining, setAudioExplaining] = useState(false)

  // Step 2: Converse (Module A)
  const [selectedComplaintId, setSelectedComplaintId] = useState('chest pain')
  const [ayushMode, setAyushMode] = useState(false)
  const [ayushPrakriti, setAyushPrakriti] = useState('Vata-Pitta')
  const [ayushAharaShakti, setAyushAharaShakti] = useState('Madhyama (Moderate digestion)')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [hpiAnswers, setHpiAnswers] = useState({})
  const [isRecording, setIsRecording] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [redFlagAlert, setRedFlagAlert] = useState(null)

  // Step 3: Scan (Module B)
  const [scannedDocument, setScannedDocument] = useState({
    title: 'Dr. Mehta OPD Rx + Lal PathLabs Report (28/08/2026)',
    type: 'Prescription & Biochemistry',
    ocrText: `PATIENT REPORT - DISTRICT HOSPITAL
Diagnosis: Type 2 Diabetes Mellitus, Essential Hypertension
Rx:
1. Tab Metformin 500mg - 1 BD before meals
2. Tab Telmisartan 40mg - 1 OD morning
Lab Results:
HbA1c: 8.4 % [Ref: 4.0-5.6 %] -> HIGH
Fasting Blood Sugar: 168 mg/dL [Ref: 70-100 mg/dL] -> HIGH
Serum Creatinine: 0.9 mg/dL [Ref: 0.6-1.2 mg/dL] -> NORMAL
Hemoglobin: 13.8 g/dL [Ref: 12.0-16.0 g/dL] -> NORMAL`,
    diagnoses: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
    medications: [
      { name: 'Metformin', dose: '500mg', freq: '1 BD (Twice daily)' },
      { name: 'Telmisartan', dose: '40mg', freq: '1 OD (Once daily)' }
    ],
    labs: [
      { test: 'HbA1c', value: '8.4', unit: '%', ref: '4.0 - 5.6 %', flag: 'HIGH' },
      { test: 'Fasting Blood Sugar', value: '168', unit: 'mg/dL', ref: '70 - 100 mg/dL', flag: 'HIGH' },
      { test: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', ref: '0.6 - 1.2 mg/dL', flag: 'NORMAL' },
      { test: 'Hemoglobin', value: '13.8', unit: 'g/dL', ref: '12.0 - 16.0 g/dL', flag: 'NORMAL' }
    ]
  })

  // Step 4 & 5: Physician Review & Confirmation (Module C & D)
  const [editableDiagnoses, setEditableDiagnoses] = useState([])
  const [editableMeds, setEditableMeds] = useState([])
  const [physicianNotes, setPhysicianNotes] = useState('Patient presented via MediKiosk. Clinical intake verified against past prescriptions. Emergency ECG ordered.')
  const [physicianConfirmed, setPhysicianConfirmed] = useState(false)
  const [hisFormat, setHisFormat] = useState('FHIR_R4')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [sessionPurged, setSessionPurged] = useState(false)

  // Initialize editable states
  useEffect(() => {
    setEditableDiagnoses([...scannedDocument.diagnoses])
    setEditableMeds([...scannedDocument.medications])
  }, [scannedDocument])

  // Active complaint object
  const activeComplaint = COMPLAINT_PRESETS.find(c => c.id === selectedComplaintId) || COMPLAINT_PRESETS[0]
  const currentQuestion = activeComplaint.questions[questionIndex]

  // Web Speech synthesis helper
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
  }

  // Handle answering question in Step 2
  const handleAnswer = (answerValue) => {
    const fieldName = currentQuestion.field
    const updatedHpi = { ...hpiAnswers, [fieldName]: answerValue }
    setHpiAnswers(updatedHpi)

    // Hard-coded Red-Flag Safety check on each turn (Module A rule engine)
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

  // Reset simulator
  const handleReset = () => {
    setCurrentStep(1)
    setQuestionIndex(0)
    setHpiAnswers({})
    setRedFlagAlert(null)
    setPhysicianConfirmed(false)
    setIsSubmitted(false)
    setSessionPurged(false)
  }

  return (
    <div className="bg-ink2/90 border border-mist/20 rounded-lg shadow-2xl overflow-hidden my-8 text-paper font-sans">
      
      {/* ABDM Gateway Sandbox Status Banner */}
      <div className="bg-emerald-950/40 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs text-emerald-300 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span><strong>ABDM GATEWAY SANDBOX</strong>: Module D Scaffolding Active. FHIR R4 Bundles & DPDP 2023 Consent Verification Enabled.</span>
        </div>
        <span className="hidden md:inline px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded text-[10px] uppercase tracking-wider font-bold">
          CLINICAL GATEWAY
        </span>
      </div>

      {/* Header bar with Stepper */}
      <div className="bg-ink border-b border-mist/15 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-saffron/20 border border-saffron flex items-center justify-center">
            <Activity className="w-4 h-4 text-saffron" />
          </div>
          <div>
            <h4 className="font-display text-lg font-bold text-paper flex items-center gap-2">
              MediKiosk Autonomous Engine
              <span className="font-mono text-[11px] bg-sage/20 text-sage border border-sage/40 px-2 py-0.5 rounded">
                ABDM & DPDP Active
              </span>
            </h4>
            <p className="font-mono text-data text-mist/60 text-xs">
              Autonomous Clinical History Intake · FHIR R4 Standard
            </p>
          </div>
        </div>

        {/* Top Step Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {[
            { n: 1, label: 'Identify' },
            { n: 2, label: 'Converse' },
            { n: 3, label: 'Scan' },
            { n: 4, label: 'Summarize' },
            { n: 5, label: 'Consult' }
          ].map((s) => (
            <button
              key={s.n}
              onClick={() => setCurrentStep(s.n)}
              className={[
                'flex items-center gap-1 px-2.5 py-1 rounded transition-colors',
                currentStep === s.n
                  ? 'bg-saffron text-ink font-bold'
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
            className="p-1.5 ml-2 rounded bg-ink3 text-mist/60 hover:text-paper hover:bg-ink hover:text-saffron transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="p-6 md:p-8 min-h-[480px]">
        <AnimatePresence mode="wait">

          {/* ========================================================= */}
          {/* STEP 1: IDENTIFY & CONSENT */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Seed Patient Selection Bar for Step 1 Demo */}
              <div className="bg-ink3/60 border border-mist/20 rounded-xl p-3.5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="text-saffron font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <span>👤</span> Pick Seeded ABDM Demo Patient:
                  </span>
                  <span className="text-[11px] text-sage font-mono">
                    {isReturningPatient ? "🔄 Returning Patient (2 Prior Encounters on Record)" : "🆕 New Patient (Empty History)"}
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
              <div className="flex items-center justify-between border-b border-mist/10 pb-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-saffron flex items-center gap-2">
                    <User className="w-5 h-5" /> Step 1: Patient Identification & Consent
                  </h3>
                  <p className="text-sm text-mist/70">
                    Dual ABHA Scan-and-Share authentication & DPDP Act 2023 granular consent capture.
                  </p>
                </div>
                {/* Language Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-mist/50 font-mono">Language:</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-ink border border-mist/20 text-paper text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-saffron"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: ABHA Registration */}
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
                          value={`${patientAge} / M`}
                          readOnly
                          className="w-full bg-ink3/50 border border-mist/10 rounded px-3 py-2 text-paper/60"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-mist/5 rounded border border-mist/10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/90 rounded flex items-center justify-center text-ink font-bold text-xs">
                      [QR]
                    </div>
                    <p className="text-xs text-mist/80">
                      Scan-and-Share QR Token: <strong className="text-paper">#OPD-087</strong> (General Medicine)
                    </p>
                  </div>
                </div>

                {/* Right Card: DPDP Act 2023 Consent Manager */}
                <div className="bg-ink/80 border border-mist/15 rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-sage uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-sage" /> DPDP Act 2023 Consent Form
                    </span>
                    <button
                      onClick={() => {
                        setAudioExplaining(true)
                        speakText('कृपया ध्यान दें। आपकी सहमति से हम आपकी बीमारी की जानकारी डॉक्टर के कंप्यूटर तक पहुँचाते हैं। यह डेटा परामर्श के बाद सुरक्षित रूप से हटा दिया जाता है।')
                        setTimeout(() => setAudioExplaining(false), 4000)
                      }}
                      className="flex items-center gap-1 text-[11px] text-saffron bg-saffron/10 hover:bg-saffron/20 px-2 py-0.5 rounded transition-colors"
                    >
                      <Volume2 className="w-3 h-3" /> {audioExplaining ? 'Playing Hindi Audio...' : 'Listen to Consent'}
                    </button>
                  </div>

                  <p className="text-xs text-mist/70 leading-relaxed">
                    Granular purpose limitation: All speech recordings and scanned documents are stored in transient memory and purged immediately after consultation.
                  </p>

                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2.5 p-2 bg-ink3/50 rounded cursor-pointer hover:bg-ink3 transition-colors">
                      <input
                        type="checkbox"
                        checked={consentDemographics}
                        onChange={(e) => setConsentDemographics(e.target.checked)}
                        className="accent-saffron"
                      />
                      <span>Capture Demographics & ABHA Profile for OPD token queue</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-2 bg-ink3/50 rounded cursor-pointer hover:bg-ink3 transition-colors">
                      <input
                        type="checkbox"
                        checked={consentVoice}
                        onChange={(e) => setConsentVoice(e.target.checked)}
                        className="accent-saffron"
                      />
                      <span>Record spoken history for AI SOCRATES structuring</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-2 bg-ink3/50 rounded cursor-pointer hover:bg-ink3 transition-colors">
                      <input
                        type="checkbox"
                        checked={consentScan}
                        onChange={(e) => setConsentScan(e.target.checked)}
                        className="accent-saffron"
                      />
                      <span>Perform OCR entity extraction on uploaded medical records</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-2 bg-ink3/50 rounded cursor-pointer hover:bg-ink3 transition-colors">
                      <input
                        type="checkbox"
                        checked={consentAbdm}
                        onChange={(e) => setConsentAbdm(e.target.checked)}
                        className="accent-saffron"
                      />
                      <span>Transmit finalized FHIR bundle to hospital HIS upon doctor confirmation</span>
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
          {/* STEP 2: CONVERSE (MODULE A) */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between border-b border-mist/10 pb-4 gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold text-saffron flex items-center gap-2">
                    <Mic className="w-5 h-5" /> Step 2: Conversational Multimodal History Intake (Module A)
                  </h3>
                  <p className="text-sm text-mist/70">
                    Adaptive SOCRATES questioning in Indian languages + AYUSH mode + hard-coded red-flag safety triggers.
                  </p>
                </div>
                
                {/* AYUSH Mode Toggle */}
                <div className="flex items-center gap-2 bg-sage/10 border border-sage/30 px-3 py-1.5 rounded-full">
                  <span className="text-xs font-mono text-sage">AYUSH Mode (Dashavidha Pariksha):</span>
                  <button
                    onClick={() => setAyushMode(m => !m)}
                    className={[
                      'w-10 h-5 flex items-center rounded-full p-1 transition-colors',
                      ayushMode ? 'bg-sage justify-end' : 'bg-ink3 justify-start'
                    ].join(' ')}
                  >
                    <span className="w-3.5 h-3.5 bg-white rounded-full shadow-md" />
                  </button>
                </div>
              </div>

              {/* Red-Flag Critical Alert Banner if triggered */}
              {redFlagAlert && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-alert/90 border-2 border-white/40 p-4 rounded-lg shadow-lg flex items-start gap-4 text-white"
                >
                  <AlertTriangle className="w-8 h-8 flex-shrink-0 text-white animate-pulse" />
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                      🚨 PRIORITY TRIAGE ESCALATION · {redFlagAlert.ruleId}
                    </h4>
                    <p className="text-xs font-semibold mt-1">{redFlagAlert.condition}</p>
                    <p className="text-xs mt-1 text-white/90">{redFlagAlert.message}</p>
                  </div>
                </motion.div>
              )}

              {/* Chief Complaint Selector */}
              <div>
                <label className="block text-xs font-mono text-mist/60 uppercase mb-2">
                  Select or Speak Presenting Chief Complaint:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {COMPLAINT_PRESETS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedComplaintId(c.id)
                        setQuestionIndex(0)
                        setHpiAnswers({})
                        setRedFlagAlert(null)
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
                        <p className="text-[11px] text-mist/50 font-mono">SOCRATES Branching</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Question Panel */}
              <div className="bg-ink border border-mist/15 rounded-lg p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-saffron uppercase tracking-wider">
                    Question {questionIndex + 1} of {activeComplaint.questions.length} · SOCRATES Field: [<strong>{currentQuestion.field.toUpperCase()}</strong>]
                  </span>
                  <button
                    onClick={() => speakText(language === 'hi' ? currentQuestion.promptHi : currentQuestion.prompt)}
                    className="flex items-center gap-1 text-xs text-saffron hover:underline"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Speak Audio Prompt
                  </button>
                </div>

                <div className="bg-ink3/40 border border-mist/10 p-4 rounded-md">
                  <h4 className="font-display text-lg text-paper font-semibold mb-1">
                    {language === 'hi' ? currentQuestion.promptHi : currentQuestion.prompt}
                  </h4>
                  <p className="text-xs text-mist/60 italic">
                    {language === 'hi' ? currentQuestion.prompt : currentQuestion.promptHi}
                  </p>
                </div>

                {/* Dual-Mode: Touch Choices + Simulated Speech Input */}
                <div className="space-y-3">
                  <label className="block text-xs font-mono text-mist/60 uppercase">
                    Touch Choices (Designed for Low-Literacy / Elderly):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {currentQuestion.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(opt)}
                        className={[
                          'p-3 rounded border text-xs text-left transition-all',
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

                {/* Voice Simulation Bar */}
                <div className="p-3 bg-ink2/50 border border-mist/10 rounded flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setIsRecording(r => !r)
                        if (!isRecording) {
                          setVoiceText('Recognizing spoken Indic audio...')
                          setTimeout(() => {
                            setVoiceText(currentQuestion.options[0])
                            handleAnswer(currentQuestion.options[0])
                            setIsRecording(false)
                          }, 1800)
                        }
                      }}
                      className={[
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                        isRecording
                          ? 'bg-alert text-white animate-ping'
                          : 'bg-saffron text-ink hover:bg-saffron-light'
                      ].join(' ')}
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <div>
                      <p className="text-xs font-semibold text-paper">
                        {isRecording ? 'Listening (AI4Bharat Indic ASR Engine)...' : 'Tap to Speak Answer in Hindi/Regional Language'}
                      </p>
                      <p className="text-[11px] text-mist/50 font-mono">{voiceText || 'Noise-robust multi-accent speech recognizer'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AYUSH Extensions if enabled */}
              {ayushMode && (
                <div className="p-4 bg-sage/10 border border-sage/30 rounded-lg space-y-3">
                  <h4 className="font-display text-sm font-bold text-sage flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Dashavidha Pariksha Clinical Parameters (AYUSH Spec)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-mist/60 block text-[11px]">Prakriti (Constitutional Type):</label>
                      <select
                        value={ayushPrakriti}
                        onChange={(e) => setAyushPrakriti(e.target.value)}
                        className="w-full bg-ink border border-mist/20 rounded p-2 text-paper text-xs"
                      >
                        <option value="Vata-Pitta">Vata-Pitta</option>
                        <option value="Kapha-Vata">Kapha-Vata</option>
                        <option value="Tridoshaja">Tridoshaja</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-mist/60 block text-[11px]">Ahara Shakti (Digestive Capacity):</label>
                      <select
                        value={ayushAharaShakti}
                        onChange={(e) => setAyushAharaShakti(e.target.value)}
                        className="w-full bg-ink border border-mist/20 rounded p-2 text-paper text-xs"
                      >
                        <option value="Pravara (Superior/Strong)">Pravara (Superior/Strong)</option>
                        <option value="Madhyama (Moderate)">Madhyama (Moderate)</option>
                        <option value="Avara (Weak/Suppressed)">Avara (Weak/Suppressed)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-2 border border-mist/30 text-mist/80 px-4 py-2 rounded text-xs hover:border-mist/60 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Identity
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-2 bg-saffron text-ink font-semibold px-6 py-3 rounded text-sm hover:bg-saffron-light transition-all shadow-md"
                >
                  Proceed to Document Scan (Module B) <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: SCAN (MODULE B) */}
          {/* ========================================================= */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="border-b border-mist/10 pb-4">
                <h3 className="font-display text-xl font-bold text-saffron flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Step 3: Medical Document Digitization & OCR (Module B)
                </h3>
                <p className="text-sm text-mist/70">
                  Multilingual OCR for Indian prescriptions + Entity extraction + Lab abnormal value flags.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scanned Document Preview */}
                <div className="bg-ink border border-mist/15 rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-saffron uppercase tracking-wider font-semibold">
                      Prescription / Lab Document
                    </span>
                    <span className="text-[11px] font-mono text-sage bg-sage/10 px-2 py-0.5 rounded">
                      Tesseract Indic OCR
                    </span>
                  </div>

                  <div className="bg-paper text-ink p-4 rounded text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-inner max-h-60 overflow-y-auto">
                    {scannedDocument.ocrText}
                  </div>

                  <div className="p-3 bg-mist/5 border border-mist/10 rounded flex items-center justify-between text-xs">
                    <span>Document: <strong>{scannedDocument.title}</strong></span>
                    <span className="text-sage font-semibold">100% Extracted</span>
                  </div>
                </div>

                {/* Extracted Clinical Entities & Out-of-Range Flags */}
                <div className="space-y-4">
                  {/* Extracted Diagnoses & Meds */}
                  <div className="bg-ink border border-mist/15 rounded-md p-4 space-y-3">
                    <h4 className="font-mono text-xs text-saffron uppercase tracking-wider">
                      Extracted Diagnoses & Active Drugs
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {scannedDocument.diagnoses.map((d, i) => (
                        <span key={i} className="text-xs bg-ink3 px-2.5 py-1 rounded border border-mist/20 text-paper font-semibold">
                          {d}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-1.5 pt-2">
                      {scannedDocument.medications.map((m, i) => (
                        <div key={i} className="text-xs bg-ink2/60 p-2 rounded flex justify-between">
                          <span className="font-semibold text-paper">{m.name} ({m.dose})</span>
                          <span className="text-mist/60 font-mono">{m.freq}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lab Results with Reference Ranges & High/Low Flags */}
                  <div className="bg-ink border border-mist/15 rounded-md p-4 space-y-3">
                    <h4 className="font-mono text-xs text-sage uppercase tracking-wider">
                      Lab Results & Abnormal Value Highlighting
                    </h4>
                    <div className="space-y-2">
                      {scannedDocument.labs.map((l, i) => (
                        <div
                          key={i}
                          className={[
                            'p-2.5 rounded text-xs flex items-center justify-between border',
                            l.flag === 'HIGH'
                              ? 'bg-alert/15 border-alert/40 text-paper'
                              : 'bg-ink2/50 border-mist/10 text-mist/80'
                          ].join(' ')}
                        >
                          <div>
                            <span className="font-semibold text-paper">{l.test}</span>
                            <span className="text-[11px] text-mist/60 block font-mono">Ref: {l.ref}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-paper">{l.value} {l.unit}</span>
                            <span
                              className={[
                                'block font-mono text-[10px] font-bold',
                                l.flag === 'HIGH' ? 'text-alert' : 'text-sage'
                              ].join(' ')}
                            >
                              [{l.flag}]
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-2 border border-mist/30 text-mist/80 px-4 py-2 rounded text-xs hover:border-mist/60 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Conversation
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="inline-flex items-center gap-2 bg-saffron text-ink font-semibold px-6 py-3 rounded text-sm hover:bg-saffron-light transition-all shadow-md"
                >
                  Generate FHIR Clinical Summary (Module C) <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: SUMMARIZE & ROUTE (MODULE C & D) */}
          {/* ========================================================= */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="border-b border-mist/10 pb-4">
                <h3 className="font-display text-xl font-bold text-saffron flex items-center gap-2">
                  <Database className="w-5 h-5" /> Step 4: Structured Summary & FHIR R4 Bundle Assembly (Module C & D)
                </h3>
                <p className="text-sm text-mist/70">
                  Synthesizes voice dialogue + digitized OCR records into standard FHIR R4 resources ready for physician queue.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bilingual Clinical Summary Card */}
                <div className="bg-ink border border-mist/15 rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-saffron uppercase tracking-wider font-semibold">
                      Standard Clinical History Format
                    </span>
                    <button
                      onClick={() => speakText(`नमस्ते ${patientName}, आपका सारांश तैयार है। डॉक्टर समीक्षा करेंगे।`)}
                      className="flex items-center gap-1 text-[11px] text-sage bg-sage/10 px-2 py-0.5 rounded"
                    >
                      <Volume2 className="w-3 h-3" /> Audio Confirm (Hindi)
                    </button>
                  </div>

                  <div className="space-y-3 text-xs bg-ink2/40 p-4 rounded border border-mist/10 max-h-72 overflow-y-auto leading-relaxed">
                    <div>
                      <span className="text-saffron font-bold uppercase text-[11px] block">1. Chief Complaint:</span>
                      <p className="text-paper font-semibold">{selectedComplaintId.toUpperCase()}</p>
                    </div>
                    <div>
                      <span className="text-sage font-bold uppercase text-[11px] block">2. HPI (SOCRATES Framework):</span>
                      <ul className="list-disc pl-4 text-mist/80 space-y-0.5">
                        {Object.entries(hpiAnswers).map(([k, v]) => (
                          <li key={k}>
                            <strong className="text-paper capitalize">{k}:</strong> {v}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-mist/60 font-bold uppercase text-[11px] block">3. Past Medical & Surgical History:</span>
                      <p className="text-paper">{scannedDocument.diagnoses.join(', ') || 'None recorded'}</p>
                    </div>
                    <div>
                      <span className="text-mist/60 font-bold uppercase text-[11px] block">4. Drug & Allergy History:</span>
                      <p className="text-paper">
                        {scannedDocument.medications.map(m => `${m.name} ${m.dose} (${m.freq})`).join('; ') || 'NKDA (No known drug allergies)'}
                      </p>
                    </div>
                    <div>
                      <span className="text-mist/60 font-bold uppercase text-[11px] block">5. Review of Systems & Investigations:</span>
                      <p className="text-paper">HbA1c: 8.4% (HIGH), Fasting Glucose: 168 mg/dL (HIGH)</p>
                    </div>
                  </div>
                </div>

                {/* FHIR R4 Bundle Inspector */}
                <div className="bg-ink border border-mist/15 rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-sage uppercase tracking-wider font-semibold">
                      FHIR R4 JSON Bundle (ABDM Profile)
                    </span>
                    <span className="font-mono text-[10px] text-mist/50">hl7.org/fhir/R4</span>
                  </div>

                  <div className="bg-ink3 text-sage font-mono text-[11px] p-4 rounded border border-mist/15 max-h-72 overflow-y-auto">
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
                          resourceType: "Observation",
                          id: "hpi-socrates-composite",
                          category: [{ coding: [{ code: "exam", display: "Exam" }] }],
                          valueString: Object.entries(hpiAnswers).map(([k,v]) => `${k}:${v}`).join('; ')
                        },
                        {
                          resourceType: "MedicationStatement",
                          id: "med-0",
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
                <button
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-2 border border-mist/30 text-mist/80 px-4 py-2 rounded text-xs hover:border-mist/60 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Documents
                </button>
                <button
                  onClick={() => setCurrentStep(5)}
                  className="inline-flex items-center gap-2 bg-saffron text-ink font-semibold px-6 py-3 rounded text-sm hover:bg-saffron-light transition-all shadow-md"
                >
                  Open Physician Review & Confirm (Step 5) <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP 5: CONSULT & PHYSICIAN CONFIRMATION */}
          {/* ========================================================= */}
          {currentStep === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="border-b border-mist/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-saffron flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" /> Step 5: Physician Consultation & Confirmation Gate
                  </h3>
                  <p className="text-sm text-mist/70">
                    Strict architecture rule: AI summary is a draft. Must be confirmed by doctor before submission to Hospital EHR.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-mist/50">Target HIS Protocol:</span>
                  <select
                    value={hisFormat}
                    onChange={(e) => setHisFormat(e.target.value)}
                    className="bg-ink border border-mist/20 text-paper text-xs rounded px-2.5 py-1"
                  >
                    <option value="FHIR_R4">HL7 FHIR R4 (ABDM Native)</option>
                    <option value="HL7_V2">HL7 v2.5 ORU^R01 Message</option>
                    <option value="CUSTOM_JSON">Custom Hospital JSON API</option>
                  </select>
                </div>
              </div>

              {/* Physician Review Screen (Editable) */}
              <div className="bg-ink border border-mist/15 rounded-md p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-mist/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-mist/10 border border-mist/30 flex items-center justify-center text-paper font-bold text-sm">
                      Dr
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-paper text-sm">Dr. Sharma, MD (General Medicine)</h4>
                      <p className="text-xs text-mist/60">OPD Counter 4 · Reviewing Patient: <strong>{patientName}</strong> (Token #087)</p>
                    </div>
                  </div>

                  <span
                    className={[
                      'font-mono text-xs px-3 py-1 rounded-full font-bold border',
                      physicianConfirmed
                        ? 'bg-sage/20 text-sage border-sage/40'
                        : 'bg-saffron/20 text-saffron border-saffron/40 animate-pulse'
                    ].join(' ')}
                  >
                    {physicianConfirmed ? '✓ CONFIRMED & AUTHORIZED' : '⚠️ AWAITING PHYSICIAN CONFIRMATION'}
                  </span>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div className="space-y-3">
                    <label className="font-mono text-mist/60 uppercase block">Diagnoses (Click to remove or edit):</label>
                    <div className="flex flex-wrap gap-2">
                      {editableDiagnoses.map((diag, i) => (
                        <span key={i} className="bg-ink3 px-2.5 py-1 rounded border border-mist/20 text-paper flex items-center gap-1.5">
                          {diag}
                          <button
                            onClick={() => setEditableDiagnoses(editableDiagnoses.filter((_, idx) => idx !== i))}
                            className="text-mist/40 hover:text-alert"
                          >
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
                  </div>

                  <div className="space-y-3">
                    <label className="font-mono text-mist/60 uppercase block">Physician Clinical Notes & Orders:</label>
                    <textarea
                      value={physicianNotes}
                      onChange={(e) => setPhysicianNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-ink3 border border-mist/20 rounded p-2.5 text-paper text-xs focus:outline-none focus:border-saffron"
                    />
                  </div>
                </div>

                {/* Doctor Confirmation Actions */}
                <div className="pt-4 border-t border-mist/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPhysicianConfirmed(true)}
                      className={[
                        'inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-xs transition-all',
                        physicianConfirmed
                          ? 'bg-sage text-white shadow'
                          : 'bg-saffron text-ink hover:bg-saffron-light'
                      ].join(' ')}
                    >
                      <Check className="w-4 h-4" />
                      {physicianConfirmed ? 'Physician Confirmed' : 'Confirm & Authorize Clinical Summary'}
                    </button>
                    <button
                      onClick={() => {
                        setPhysicianConfirmed(false)
                        alert('Summary rejected back for re-interview.')
                      }}
                      className="px-3 py-2.5 border border-mist/20 text-mist/60 hover:text-alert rounded text-xs"
                    >
                      Reject / Request Re-Intake
                    </button>
                  </div>

                  {/* Submission to Hospital EHR / ABDM (Gated by confirmation) */}
                  <button
                    disabled={!physicianConfirmed || isSubmitted}
                    onClick={() => {
                      setIsSubmitted(true)
                      setTimeout(() => setSessionPurged(true), 1200)
                    }}
                    className={[
                      'inline-flex items-center gap-2 px-6 py-2.5 rounded text-xs font-semibold font-mono transition-all',
                      !physicianConfirmed
                        ? 'bg-ink3 text-mist/30 cursor-not-allowed border border-mist/10'
                        : isSubmitted
                        ? 'bg-sage/30 text-sage border border-sage/50'
                        : 'bg-sage text-white hover:bg-sage-dark shadow-md'
                    ].join(' ')}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitted ? 'Submitted to HIS & ABHA Linked' : 'Push to Hospital HIS (EHR)'}
                  </button>
                </div>
              </div>

              {/* DPDP Session Purge Confirmation */}
              {sessionPurged && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-sage/15 border border-sage/40 rounded-lg text-xs space-y-2 text-paper"
                >
                  <div className="flex items-center gap-2 text-sage font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4" /> SUCCESS: RECORD COMMITTED & MEMORY PURGED
                  </div>
                  <p className="text-mist/80 leading-relaxed">
                    1. FHIR Bundle successfully transmitted to hospital EHR via {hisFormat} protocol.<br />
                    2. Care context linked to ABHA ID <strong>{patientId}</strong>.<br />
                    3. <strong>DPDP Act Compliance:</strong> All transient audio buffers and raw prescription photos purged from kiosk RAM.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={handleReset}
                      className="bg-ink3 text-saffron hover:bg-ink px-4 py-1.5 rounded font-mono text-xs border border-saffron/30"
                    >
                      Start Next Patient Session (Reset)
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer info bar */}
      <div className="bg-ink px-6 py-3 border-t border-mist/10 text-xs font-mono text-mist/50 flex flex-wrap justify-between items-center gap-2">
        <span>MediKiosk Enterprise v2.4 · National Health Systems Resource Centre (NHSRC) Compliant</span>
        <span>Clinical Safety Rule: Summary never auto-saves to EHR without physician review</span>
      </div>
    </div>
  )
}

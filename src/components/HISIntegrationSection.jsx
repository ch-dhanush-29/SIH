import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── HIS System Registry ──────────────────────────────────────────────────────
const HIS_SYSTEMS = [
  {
    id: "FHIR_R4",
    name: "FHIR R4 REST",
    badge: "ABDM Health Stack",
    icon: "🏥",
    standard: "HL7 FHIR R4",
    color: "emerald",
    endpoint: "https://ndhm-hip.gov.in/fhir/Bundle",
    auth: "ABDM OAuth2 Bearer Token",
    hospitals: ["AIIMS Delhi", "Apollo Hospitals", "PGIMER Chandigarh", "CMC Vellore"],
    description: "ABDM-compliant FHIR R4 Bundle — the national standard for all NHA-registered Health Information Providers (HIPs). Fully interoperable with ABHA Health Records.",
    resources: ["Patient", "Encounter", "Condition", "Observation", "MedicationRequest", "DiagnosticReport", "AllergyIntolerance"],
    indianStandard: true,
  },
  {
    id: "HL7_V2",
    name: "HL7 v2.5 MLLP",
    badge: "Government Hospitals",
    icon: "📡",
    standard: "HL7 v2.5 Pipe-Delimited",
    color: "blue",
    endpoint: "mllp://hospital-engine:2575",
    auth: "Network-level MLLP (LAN)",
    hospitals: ["District Hospitals", "Community Health Centres", "Taluka Hospitals", "Bahmni deployments"],
    description: "HL7 v2.5 ORU^R01 and ADT messages over MLLP transport. Most widely deployed interface standard in Indian government hospitals. Segments: MSH, PID, PV1, DG1, OBR, OBX, AL1, RXA.",
    resources: ["MSH (Header)", "PID (Patient)", "PV1 (Visit)", "DG1 (Diagnosis)", "OBX (Observations)", "AL1 (Allergies)", "RXA (Medications)"],
    indianStandard: true,
  },
  {
    id: "OPENMRS",
    name: "OpenMRS / Bahmni",
    badge: "PHC / CHC Deployments",
    icon: "🌐",
    standard: "FHIR R4 (OpenMRS Module)",
    color: "violet",
    endpoint: "https://bahmni.hospital.local/openmrs/ws/fhir2/R4",
    auth: "Basic Auth / OAuth2",
    hospitals: ["Primary Health Centres (PHC)", "Community Health Centres (CHC)", "NHM-deployed facilities", "ASHA-linked kiosks"],
    description: "OpenMRS FHIR REST API compatible with Bahmni EMR — the most widely deployed open-source clinical system in Indian public health. Supports transaction bundles with Patient, Encounter, Condition, MedicationRequest.",
    resources: ["Patient", "Encounter", "Condition", "MedicationRequest", "DiagnosticReport", "Observation"],
    indianStandard: true,
  },
  {
    id: "CUSTOM_JSON",
    name: "Custom JSON REST",
    badge: "Private Hospitals",
    icon: "🔌",
    standard: "Proprietary REST API",
    color: "amber",
    endpoint: "https://hospital-his.local/api/v1/clinical-record",
    auth: "API Key / Basic Auth",
    hospitals: ["Private Nursing Homes", "HospitalOS", "eHospital System", "Medtrix HIS"],
    description: "Flat JSON payload for legacy proprietary hospital web service APIs. Covers patient demographics, chief complaint, SOCRATES HPI, diagnoses, medications, and lab results in a simple key-value structure.",
    resources: ["patient (object)", "chief_complaint", "hpi_socrates", "diagnoses (array)", "medications (array)", "lab_results (array)"],
    indianStandard: false,
  },
  {
    id: "CSV_EXPORT",
    name: "CSV Flat Export",
    badge: "Rural / Offline OPDs",
    icon: "📋",
    standard: "Flat File CSV",
    color: "slate",
    endpoint: "local_export / USB",
    auth: "None",
    hospitals: ["Rural OPDs", "Taluka Hospitals (no IT)", "Paper-based Registers", "Sub-District Health Centres"],
    description: "Last-resort flat-file discharge summary CSV export for OPDs with no internet connectivity or HIS software. Can be printed or transferred via USB for manual data entry.",
    resources: ["Demographics", "Chief Complaint", "Diagnoses", "Medications", "Lab Results"],
    indianStandard: false,
  },
];

// ─── Sample Payloads for Demo ─────────────────────────────────────────────────
const SAMPLE_PAYLOADS = {
  FHIR_R4: `{
  "resourceType": "Bundle",
  "type": "document",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "DEMO-987654",
        "identifier": [{
          "system": "https://ndhm.gov.in/abha",
          "value": "45-1234-5678-9012"
        }],
        "name": [{ "family": "Prasad", "given": ["Rameshwar"] }],
        "gender": "male",
        "birthDate": "1968-01-01"
      }
    },
    {
      "resource": {
        "resourceType": "Condition",
        "id": "chief-complaint",
        "code": { "text": "Chest pain — 3 days duration" },
        "subject": { "reference": "Patient/DEMO-987654" }
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "status": "active",
        "medicationCodeableConcept": { "text": "Metformin 500mg" },
        "dosageInstruction": [{ "text": "Twice daily (Before meals)" }]
      }
    }
  ]
}`,
  HL7_V2: `MSH|^~\\&|MEDIKIOSK|OPD_KIOSK|HIS_RECEIVER|HOSPITAL|20260830143000||ORU^R01^ORU_R01|MKSK20260830143000|P|2.5|||AL|NE||UNICODE UTF-8
PID|1||DEMO-987654^^^ABHA^PI~45-1234-5678-9012^^^NHA^PI||Prasad^Rameshwar||19680101|M|||^^^^IND
PV1|1|O|OPD^^^HOSPITAL^OPD_LOC|||||||PHYSICIAN^ATTENDING^DR||||||SESSION_DEMO
DG1|1||TYPE_2_DIABETES_MELLITUS^Type 2 Diabetes Mellitus^LOCAL|Type 2 Diabetes Mellitus||W|||||||||1
DG1|2||ESSENTIAL_HYPERTENSION^Essential Hypertension^LOCAL|Essential Hypertension||W|||||||||1
OBR|1|||11488-4^Consultation Note^LN|||20260830143000||||||||||PHYSICIAN^ATTENDING^DR|||||||F
OBX|1|ST|CHIEF_COMPLAINT^Chief Complaint^LOCAL||Chest pain — 3 days duration||||||F
OBX|2|ST|SITE^Site of pain^LOCAL||Substernal, mid-sternal||||||F
OBX|3|ST|ONSET^Onset^LOCAL||3 days ago, sudden||||||F
OBX|4|ST|SEVERITY^Severity (NRS 0-10)^LOCAL||8/10||||||F
AL1|1|DA|PENICILLIN^Penicillin^LOCAL|U|Urticaria
RXA|0|1|20260830143000|20260830143000|METFORMIN^Metformin^LOCAL|500MG|||BD`,
  OPENMRS: `{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "DEMO-987654"
      },
      "request": { "method": "PUT", "url": "Patient/DEMO-987654" }
    },
    {
      "resource": {
        "resourceType": "Encounter",
        "status": "finished",
        "class": { "code": "AMB", "display": "Ambulatory (OPD)" }
      },
      "request": { "method": "POST", "url": "Encounter" }
    },
    {
      "resource": {
        "resourceType": "Condition",
        "code": { "text": "Type 2 Diabetes Mellitus" }
      },
      "request": { "method": "POST", "url": "Condition" }
    }
  ]
}`,
  CUSTOM_JSON: `{
  "medikiosk_version": "1.0.0",
  "patient": {
    "id": "DEMO-987654",
    "abha_id": "45-1234-5678-9012",
    "name": "Rameshwar Prasad",
    "age": "58",
    "gender": "M"
  },
  "chief_complaint": "Chest pain — 3 days duration",
  "hpi_socrates": {
    "site": "Substernal, mid-sternal",
    "onset": "3 days ago, sudden",
    "character": "Heavy, crushing, pressure-like",
    "severity": "8/10"
  },
  "diagnoses": ["Type 2 Diabetes Mellitus", "Essential Hypertension"],
  "medications": [
    "Tab Metformin 500mg (Twice daily — Before meals)",
    "Tab Telmisartan 40mg (Once daily — After breakfast)"
  ],
  "abnormal_count": 4
}`,
  CSV_EXPORT: `MEDIKIOSK DISCHARGE SUMMARY
Generated: 30/08/2026 14:30

PATIENT DEMOGRAPHICS
Patient ID,DEMO-987654
ABHA ID,45-1234-5678-9012
Name,Rameshwar Prasad
Age/Gender,58 / M

CHIEF COMPLAINT
Chief Complaint,Chest pain — 3 days duration

DIAGNOSES
,Type 2 Diabetes Mellitus
,Essential Hypertension
,Coronary Artery Disease

MEDICATIONS
Name,Dose,Frequency
Metformin,500mg,Twice daily (Before meals)
Telmisartan,40mg,Once daily (After breakfast)
Atorvastatin,20mg,At bedtime

LAB RESULTS
Test,Value,Unit,Flag,Reference Range
Hba1C,8.4,%,HIGH,4.0 - 5.6 %
Fasting Blood Sugar,168,mg/dL,HIGH,70 - 100 mg/dL
Total Cholesterol,235,mg/dL,HIGH,125 - 200 mg/dL`,
};

const COLOR_MAP = {
  emerald: { border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  blue: { border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  violet: { border: "border-violet-500/40", bg: "bg-violet-500/10", text: "text-violet-400", badge: "bg-violet-500/20 text-violet-300 border-violet-500/40" },
  amber: { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  slate: { border: "border-slate-500/40", bg: "bg-slate-500/10", text: "text-slate-400", badge: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
};

export default function HISIntegrationSection() {
  const [selected, setSelected] = useState(HIS_SYSTEMS[0]);
  const [showPayload, setShowPayload] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [physicianConfirmed, setPhysicianConfirmed] = useState(false);

  const colors = COLOR_MAP[selected.color];

  function handleSimulateSubmit() {
    if (!physicianConfirmed) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 2200);
  }

  return (
    <section id="his-integration" className="py-20 bg-gradient-to-b from-blue-950 to-slate-950 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: "linear-gradient(rgba(99,102,241,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.15) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <div className="max-w-6xl mx-auto px-4 relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-1.5 rounded-full text-indigo-400 text-sm font-medium mb-5">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            FHIR R4 · HL7 v2.5 · OpenMRS · Bahmni · ABDM
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Hospital Information System <span className="text-indigo-400">(HIS / EMR)</span> Integration
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            MediKiosk routes clinical summaries to any Indian hospital HIS — from ABDM-compliant FHIR endpoints to Bahmni PHC deployments — with mandatory physician confirmation before every data transfer.
          </p>
        </motion.div>

        {/* Physician Confirmation Gate */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-5 mb-8 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 text-xl">🔒</span>
              <span className="text-white font-bold">DPDP Act 2023 §7 — Mandatory Physician Confirmation Gate</span>
            </div>
            <p className="text-slate-400 text-sm">
              No clinical data leaves the kiosk unless the reviewing physician explicitly confirms the summary. This is a hard enforcement gate — the "Submit to HIS" button is locked until confirmation.
            </p>
          </div>
          <button
            onClick={() => { setPhysicianConfirmed(v => !v); setSubmitted(false); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
              physicianConfirmed
                ? "bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/30"
                : "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
            }`}
          >
            {physicianConfirmed ? "✓ Physician Confirmed" : "⬜ Confirm as Physician"}
          </button>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-6">
          {/* HIS System Selector */}
          <div className="md:col-span-2 space-y-3">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Select HIS / EMR Target</div>
            {HIS_SYSTEMS.map((sys) => {
              const c = COLOR_MAP[sys.color];
              const isActive = selected.id === sys.id;
              return (
                <button key={sys.id} onClick={() => { setSelected(sys); setShowPayload(false); setSubmitted(false); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isActive ? `${c.bg} ${c.border} shadow-lg` : "bg-slate-900/60 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sys.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm ${isActive ? c.text : "text-white"}`}>{sys.name}</span>
                        {sys.indianStandard && (
                          <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full font-bold">🇮🇳 NHA</span>
                        )}
                      </div>
                      <div className="text-slate-500 text-xs truncate">{sys.badge}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* HIS Detail Panel */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div key={selected.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className={`bg-slate-900/80 border ${colors.border} rounded-2xl p-6`}>

                {/* System Header */}
                <div className="flex items-start gap-4 mb-5">
                  <div className={`text-4xl p-3 rounded-xl ${colors.bg}`}>{selected.icon}</div>
                  <div>
                    <h3 className="text-white font-bold text-xl">{selected.name}</h3>
                    <div className={`text-xs font-semibold ${colors.text}`}>{selected.standard}</div>
                    <div className="text-slate-400 text-xs mt-1">{selected.description}</div>
                  </div>
                </div>

                {/* Connection Details */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: "Endpoint", value: selected.endpoint },
                    { label: "Auth Method", value: selected.auth },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-800 rounded-xl p-3">
                      <div className="text-slate-500 text-xs mb-1">{label}</div>
                      <div className="text-white text-xs font-mono break-all">{value}</div>
                    </div>
                  ))}
                </div>

                {/* FHIR Resources / Segments */}
                <div className="mb-5">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                    {selected.id === "HL7_V2" ? "HL7 Segments" : "FHIR Resources"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.resources.map((r) => (
                      <span key={r} className={`px-2 py-1 rounded-lg border text-xs font-mono ${colors.badge}`}>{r}</span>
                    ))}
                  </div>
                </div>

                {/* Indian Hospitals */}
                <div className="mb-5">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">🇮🇳 Deployed In</div>
                  <div className="flex flex-wrap gap-2">
                    {selected.hospitals.map((h) => (
                      <span key={h} className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700">{h}</span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setShowPayload(v => !v)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-semibold hover:border-slate-400 transition-all"
                  >
                    {showPayload ? "Hide" : "👁️ Preview"} Payload
                  </button>

                  <button
                    onClick={handleSimulateSubmit}
                    disabled={!physicianConfirmed || submitting || submitted}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      submitted
                        ? "bg-emerald-600 text-white cursor-default"
                        : submitting
                        ? "bg-indigo-700 text-indigo-200 cursor-not-allowed animate-pulse"
                        : physicianConfirmed
                        ? `${colors.bg} ${colors.text} border ${colors.border} hover:opacity-90`
                        : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
                    }`}
                  >
                    {submitted ? "✅ Submitted & Purged" : submitting ? "📡 Transmitting…" : physicianConfirmed ? `📤 Submit to ${selected.name}` : "🔒 Locked — Confirm First"}
                  </button>
                </div>

                {/* Submitted success message */}
                {submitted && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300">
                    ✅ Clinical summary transmitted to <strong>{selected.name}</strong>.<br />
                    🔒 Session memory purged from kiosk per <strong>DPDP Act 2023 §7</strong>. Patient data no longer resides on device.
                  </motion.div>
                )}

                {/* Payload Preview */}
                <AnimatePresence>
                  {showPayload && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="mt-4 overflow-hidden">
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Sample Payload — {selected.id}</div>
                      <pre className="bg-slate-950 border border-slate-700 rounded-xl p-4 text-xs text-slate-300 overflow-auto max-h-64 font-mono leading-relaxed">
                        {SAMPLE_PAYLOADS[selected.id]}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Workflow Timeline */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12">
          <div className="text-center text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">HIS Submission Workflow</div>
          <div className="flex flex-wrap justify-center items-center gap-0">
            {[
              { icon: "🎙️", label: "Patient Intake", sub: "Voice + Touch" },
              { icon: "📄", label: "OCR Scan", sub: "Document AI" },
              { icon: "🧠", label: "FHIR Bundle", sub: "Auto-generated" },
              { icon: "👨‍⚕️", label: "Physician Review", sub: "Edit + Confirm" },
              { icon: "🔒", label: "DPDP Gate", sub: "Confirmation required" },
              { icon: "📡", label: "HIS Submit", sub: "FHIR / HL7 / Bahmni" },
              { icon: "🗑️", label: "Memory Purge", sub: "DPDP §7 compliant" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center px-3">
                  <div className="w-12 h-12 bg-slate-800 border border-slate-600 rounded-xl flex items-center justify-center text-xl mb-1.5">{step.icon}</div>
                  <div className="text-white text-xs font-semibold text-center whitespace-nowrap">{step.label}</div>
                  <div className="text-slate-500 text-[10px] text-center">{step.sub}</div>
                </div>
                {i < arr.length - 1 && (
                  <div className="text-slate-600 text-sm px-1">→</div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

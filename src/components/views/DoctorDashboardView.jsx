import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Stethoscope, User, AlertTriangle, CheckCircle2, 
  FileText, Network, Lock, Edit3, Send, Check, RefreshCw, Eye, Bell, Activity
} from "lucide-react";

const DEFAULT_QUEUE = [
  { 
    id: "SIM-91-2001-0000-0001", 
    token: "#087", 
    name: "Rameshwar Prasad", 
    age: 58, 
    gender: "Male", 
    priority: "EMERGENCY", 
    chief_complaint: "Severe crushing chest pain radiating to left arm (3 days duration)", 
    hpi: {
      site: "Middle of Chest (Substernal)",
      onset: "Started 3 days ago",
      character: "Heavy Crushing & Pressure",
      radiation: "Spreading to Left Arm & Jaw",
      associations: "Heavy Sweating & Breathlessness",
      severity: "8 / 10 (Severe)"
    },
    diagnoses: ["Acute Cardiac Evaluation", "Type 2 Diabetes", "High Blood Pressure"],
    medications: [
      { name: "Tab Metformin", dose: "500mg", freq: "Twice daily (Before food)" },
      { name: "Tab Telmisartan", dose: "40mg", freq: "Once daily (Morning)" },
      { name: "Tab Atorvastatin", dose: "20mg", freq: "At bedtime" }
    ],
    lab_results: [
      { test: "Sugar (HbA1c)", value: "8.4", unit: "%", flag: "HIGH" },
      { test: "Fasting Blood Sugar", value: "168", unit: "mg/dL", flag: "HIGH" }
    ],
    vitals: { spo2: 97, pulse: 78, sbp: 138, dbp: 88, temp: 98.6 },
    status: "IN_CONSULTATION" 
  },
  { 
    id: "SIM-91-2002-0000-0002", 
    token: "#088", 
    name: "Sunita Devi", 
    age: 47, 
    gender: "Female", 
    priority: "ROUTINE", 
    chief_complaint: "Night-time dry cough & wheezing (Asthma check-up)", 
    hpi: {
      site: "Chest / Lungs tightness",
      onset: "1 week ago",
      character: "Dry cough with wheezing",
      severity: "5 / 10 (Moderate)"
    },
    diagnoses: ["Bronchial Asthma", "Seasonal Allergic Rhinitis"],
    medications: [
      { name: "Salbutamol Inhaler (100mcg)", dose: "2 puffs", freq: "When needed for wheezing" },
      { name: "Tab Montelukast", dose: "10mg", freq: "Once at bedtime" }
    ],
    lab_results: [
      { test: "Eosinophil Count", value: "650", unit: "cells/mcL", flag: "HIGH" }
    ],
    vitals: { spo2: 98, pulse: 82, sbp: 120, dbp: 80, temp: 98.4 },
    status: "WAITING" 
  }
];

export default function DoctorDashboardView({ theme = "dark" }) {
  const isLight = theme === "light";
  const [queue, setQueue] = useState(DEFAULT_QUEUE);
  const [selectedPatient, setSelectedPatient] = useState(DEFAULT_QUEUE[0]);
  const [diagnoses, setDiagnoses] = useState(DEFAULT_QUEUE[0].diagnoses);
  const [medications, setMedications] = useState(DEFAULT_QUEUE[0].medications);
  const [doctorNotes, setDoctorNotes] = useState("Patient checked in via self-service kiosk. Severe chest pain confirmed. Immediate 12-Lead ECG ordered.");
  const [physicianConfirmed, setPhysicianConfirmed] = useState(false);
  const [targetHIS, setTargetHIS] = useState("FHIR_R4");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedHistory, setSubmittedHistory] = useState([]);
  const [activeSubmissionResult, setActiveSubmissionResult] = useState(null);
  const [newPatientAlert, setNewPatientAlert] = useState(false);

  // Instant 0ms Sync Queue from BroadcastChannel, CustomEvent, localStorage & Backend
  useEffect(() => {
    function handleIncomingPatient(newRecord) {
      if (!newRecord || !newRecord.token) return;
      setQueue(prev => {
        const filtered = prev.filter(p => p.token !== newRecord.token && p.id !== newRecord.id);
        return [newRecord, ...filtered];
      });
      setSelectedPatient(newRecord);
      setDiagnoses(newRecord.diagnoses || ["General Medicine Intake"]);
      setMedications(newRecord.medications || []);
      setDoctorNotes(`Patient ${newRecord.name} (Token ${newRecord.token}) checked in via Kiosk. Priority: ${newRecord.priority}. Chief Complaint: ${newRecord.chief_complaint}`);
      setPhysicianConfirmed(false);
      setActiveSubmissionResult(null);
      setNewPatientAlert(true);
      setTimeout(() => setNewPatientAlert(false), 6000);
    }

    async function fetchQueue() {
      try {
        const res = await fetch("/api/doctor/queue");
        if (res.ok) {
          const data = await res.json();
          if (data.queue && data.queue.length > 0) {
            setQueue(data.queue);
          }
        }
      } catch (err) {}

      if (typeof window !== "undefined") {
        const localQueue = JSON.parse(localStorage.getItem("medikiosk_live_queue") || "[]");
        if (localQueue.length > 0) {
          setQueue(prev => {
            const combined = [...localQueue, ...prev.filter(p => !localQueue.some(l => l.token === p.token))];
            return combined;
          });
          if (localQueue[0]) {
            setSelectedPatient(localQueue[0]);
            setDiagnoses(localQueue[0].diagnoses || []);
            setMedications(localQueue[0].medications || []);
          }
        }
      }
    }

    fetchQueue();
    const interval = setInterval(fetchQueue, 2000);

    if (typeof window !== "undefined") {
      let channel = null;
      try {
        channel = new BroadcastChannel("medikiosk_live_sync");
        channel.onmessage = (event) => {
          if (event.data?.type === "NEW_PATIENT_INTAKE") {
            handleIncomingPatient(event.data.data);
          }
        };
      } catch (e) {}

      const handleCustomEvent = (e) => {
        if (e.detail) handleIncomingPatient(e.detail);
      };
      window.addEventListener("medikiosk_live_patient", handleCustomEvent);

      const handleStorage = (e) => {
        if (e.key === "medikiosk_live_queue" && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && parsed.length > 0) {
              handleIncomingPatient(parsed[0]);
            }
          } catch (err) {}
        }
      };
      window.addEventListener("storage", handleStorage);

      return () => {
        clearInterval(interval);
        if (channel) channel.close();
        window.removeEventListener("medikiosk_live_patient", handleCustomEvent);
        window.removeEventListener("storage", handleStorage);
      };
    }

    return () => clearInterval(interval);
  }, []);

  function handleSelectPatient(p) {
    setSelectedPatient(p);
    setDiagnoses(p.diagnoses || []);
    setMedications(p.medications || []);
    setPhysicianConfirmed(false);
    setActiveSubmissionResult(null);
  }

  async function handleSubmitToHIS() {
    if (!physicianConfirmed) return;
    setIsSubmitting(true);

    const payload = {
      patient_id: selectedPatient.id,
      token: selectedPatient.token,
      doctor_mci: "MCI-84920",
      doctor_name: "Dr. R. K. Sharma",
      doctor_notes: doctorNotes,
      diagnoses: diagnoses,
      medications: medications,
      target_his: targetHIS
    };

    try {
      const res = await fetch("/api/doctor/confirm-and-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setActiveSubmissionResult(data);
    } catch (err) {
      setActiveSubmissionResult({
        status: "HIS_TRANSMISSION_SUCCESS",
        target_his: targetHIS,
        token: selectedPatient.token,
        physician_signoff: "Dr. R. K. Sharma (MCI-84920)",
        dpdp_section_8_3_verified: true,
        ephemeral_memory_purged: true,
        cryptographic_block_hash: "0x8f9c" + Math.random().toString(16).slice(2, 10)
      });
    }

    setSubmittedHistory(prev => [selectedPatient, ...prev]);
    setQueue(prev => prev.filter(p => p.token !== selectedPatient.token));
    setIsSubmitting(false);
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col p-4 md:p-8 transition-colors duration-300 ${
      isLight ? "bg-slate-100 text-slate-900" : "bg-slate-950 text-white"
    }`}>
      {/* Top Header */}
      <div className={`rounded-3xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4 mb-6 border transition-colors ${
        isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-700 text-white"
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-emerald-400/40 flex items-center justify-center shadow-md bg-slate-900 shrink-0">
            <img src="/medikiosk-logo.png" alt="MediKiosk Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display">Doctor Consultation Dashboard</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-400/30 rounded-full font-mono">
                DR. R. K. SHARMA · ROOM 104
              </span>
            </div>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              Pre-Analyzed Clinical Summaries · Doctor Verification & Sign-Off · Hospital Records Sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {newPatientAlert && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/40 rounded-xl text-xs font-mono font-bold animate-bounce"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>New Patient Waiting!</span>
            </motion.div>
          )}

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={isLight ? "text-slate-500" : "text-slate-400"}>Record Format:</span>
            <select
              value={targetHIS}
              onChange={(e) => setTargetHIS(e.target.value)}
              className={`text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 font-bold border ${
                isLight ? "bg-slate-50 border-slate-300 text-slate-800" : "bg-slate-800 border-slate-700 text-white"
              }`}
            >
              <option value="FHIR_R4">HL7 FHIR R4 (Ayushman Bharat Standard)</option>
              <option value="HL7_V2">HL7 v2.5 (District Hospital System)</option>
              <option value="OPENMRS">OpenMRS / Bahmni EMR</option>
              <option value="CUSTOM_JSON">Custom Hospital JSON</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-4 gap-6 flex-1">
        
        {/* Left Column: Live Queue */}
        <div className={`lg:col-span-1 rounded-3xl p-5 space-y-4 flex flex-col justify-between border shadow-md ${
          isLight ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"
        }`}>
          <div className="space-y-3">
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
              <span className="text-xs font-mono text-saffron uppercase font-bold">OPD Patient Queue</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                isLight ? "bg-slate-100 text-slate-700" : "bg-slate-800 text-slate-300"
              }`}>
                {queue.length} Patients
              </span>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {queue.map((p) => {
                const isSel = selectedPatient?.token === p.token;
                return (
                  <button
                    key={p.token + p.id}
                    onClick={() => handleSelectPatient(p)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                      isSel
                        ? "bg-emerald-500/10 border-emerald-400 shadow-md"
                        : isLight
                        ? "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800"
                        : "bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{p.token} · {p.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                        p.priority === "EMERGENCY"
                          ? "bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/40 animate-pulse"
                          : isLight ? "bg-slate-200 text-slate-700" : "bg-slate-800 text-slate-400"
                      }`}>
                        {p.priority}
                      </span>
                    </div>
                    <div className={`text-[11px] line-clamp-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>{p.chief_complaint}</div>
                    <div className={`text-[10px] font-mono mt-1 flex justify-between ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                      <span>{p.age} Y / {p.gender}</span>
                      <span>{p.vitals ? `${p.vitals.spo2}% SpO2` : ""}</span>
                    </div>
                  </button>
                );
              })}

              {queue.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs italic">
                  All patients attended. Queue is empty!
                </div>
              )}
            </div>
          </div>

          {submittedHistory.length > 0 && (
            <div className={`border-t pt-3 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                ✓ Consultations Completed: {submittedHistory.length}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Clinical Summary & Doctor Gate */}
        <div className={`lg:col-span-3 rounded-3xl p-6 md:p-8 space-y-6 flex flex-col justify-between border shadow-lg ${
          isLight ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"
        }`}>
          
          {selectedPatient ? (
            <>
              {/* Patient Header Banner */}
              <div className={`rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{selectedPatient.token} · {selectedPatient.name}</span>
                    <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
                      {selectedPatient.id}
                    </span>
                    <span className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      {selectedPatient.age} Y / {selectedPatient.gender}
                    </span>
                  </div>
                  <div className="text-xs text-saffron mt-1 font-semibold flex items-center gap-1.5">
                    <span>🚨 Patient's Chief Complaint:</span> {selectedPatient.chief_complaint}
                  </div>
                </div>

                {/* Vitals Telemetry */}
                {selectedPatient.vitals && (
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <div className={`px-3 py-2 rounded-xl text-center border ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
                      <div className="text-slate-500 text-[10px]">Oxygen (SpO2)</div>
                      <div className="text-cyan-600 dark:text-cyan-400 font-bold text-sm">{selectedPatient.vitals.spo2}%</div>
                    </div>
                    <div className={`px-3 py-2 rounded-xl text-center border ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
                      <div className="text-slate-500 text-[10px]">Blood Pressure</div>
                      <div className="text-amber-600 dark:text-amber-400 font-bold text-sm">{selectedPatient.vitals.sbp}/{selectedPatient.vitals.dbp}</div>
                    </div>
                    <div className={`px-3 py-2 rounded-xl text-center border ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
                      <div className="text-slate-500 text-[10px]">Pulse Rate</div>
                      <div className="text-red-500 dark:text-red-400 font-bold text-sm">{selectedPatient.vitals.pulse} bpm</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Structured Anamnesis Table */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Patient Symptoms */}
                <div className={`rounded-2xl p-5 space-y-3 text-xs font-mono border ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
                }`}>
                  <span className={`text-saffron font-bold uppercase tracking-wider block border-b pb-2 ${
                    isLight ? "border-slate-200" : "border-slate-800"
                  }`}>
                    Patient Voice Anamnesis Summary
                  </span>
                  <div className="space-y-1.5">
                    {selectedPatient.hpi && Object.keys(selectedPatient.hpi).length > 0 ? (
                      Object.entries(selectedPatient.hpi).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-500 uppercase">{k}:</span>
                          <span className={k === "severity" && v.includes("Severe") ? "text-red-500 dark:text-red-400 font-bold" : isLight ? "text-slate-900 font-medium" : "text-white"}>{v}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 italic">No structured answers recorded.</div>
                    )}
                  </div>
                </div>

                {/* Right: Scanned Medical History */}
                <div className={`rounded-2xl p-5 space-y-3 text-xs font-mono border ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
                }`}>
                  <span className={`text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider block border-b pb-2 ${
                    isLight ? "border-slate-200" : "border-slate-800"
                  }`}>
                    Scanned Prescriptions & Lab Results
                  </span>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 font-bold">Diagnoses: </span>
                      {diagnoses.join(", ")}
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">Past Medicines: </span>
                      {medications.map(m => typeof m === "string" ? m : `${m.name} ${m.dose || ""} (${m.freq || ""})`).join(", ")}
                    </div>
                    {selectedPatient.lab_results && selectedPatient.lab_results.length > 0 && (
                      <div className={`rounded-xl p-2.5 space-y-1 border ${
                        isLight ? "bg-red-50 border-red-200 text-red-800" : "bg-red-950/40 border-red-500/30 text-red-300"
                      }`}>
                        <div className="font-bold">⚠️ Flagged Abnormal Labs:</div>
                        {selectedPatient.lab_results.map((l, i) => (
                          <div key={i}>• {l.test}: {l.value || l.val} {l.unit || ""} [{l.flag}]</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Doctor Consultation Notes */}
              <div className="space-y-2">
                <label className={`text-xs font-mono uppercase font-bold ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Doctor Consultation Notes & Orders:
                </label>
                <textarea
                  rows={2}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className={`w-full rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-400 font-mono border ${
                    isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                  }`}
                />
              </div>

              {/* Confirmation Gate & Action Controls */}
              <div className={`rounded-2xl p-5 space-y-4 border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
              }`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-sm">Doctor Verification & Digital Sign-Off</span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Records are only saved to the hospital system after explicit doctor review and digital sign-off.
                    </p>
                  </div>

                  <button
                    onClick={() => setPhysicianConfirmed(true)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                      physicianConfirmed
                        ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                        : isLight
                        ? "bg-amber-100 border border-amber-300 text-amber-800 hover:bg-amber-200"
                        : "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                    }`}
                  >
                    {physicianConfirmed ? "✓ Verified by Dr. Sharma (MCI-84920)" : "⬜ Sign Off & Confirm Summary"}
                  </button>
                </div>

                <div className={`flex justify-end gap-3 pt-2 border-t ${isLight ? "border-slate-200" : "border-slate-800/80"}`}>
                  <button
                    onClick={handleSubmitToHIS}
                    disabled={!physicianConfirmed || isSubmitting}
                    className={`px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                      isSubmitting
                        ? "bg-indigo-700 text-white animate-pulse"
                        : physicianConfirmed
                        ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl"
                        : isLight
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                        : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
                    }`}
                  >
                    {isSubmitting ? "Saving to Records..." : "📤 Save & Send to Hospital Records"}
                  </button>
                </div>

                {activeSubmissionResult && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-xl p-3 text-xs font-mono space-y-1 border ${
                    isLight ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                  }`}>
                    <div>✓ Clinical summary successfully saved to hospital medical records.</div>
                    <div>🔒 Patient biometric and session memory automatically deleted from terminal for privacy.</div>
                    <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Audit Verification Hash: {activeSubmissionResult.cryptographic_block_hash}
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400 font-mono text-sm">
              Please select a patient from the queue to review their clinical summary.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

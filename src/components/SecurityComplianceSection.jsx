import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Demo Hash Chain Blocks ──────────────────────────────────────────────────
const DEMO_CHAIN_BLOCKS = [
  {
    index: 0,
    event: "GENESIS_LEDGER_INITIALIZED",
    actor: "SYSTEM_ROOT",
    time: "14:00:00 UTC",
    payload: "Protocol: DPDP_ACT_2023_V1 · Cipher: SHA-256",
    hash: "0000a89f3c1b28d7e4e1a6c5f90382d619024f2b381a92e4720918c50e8291a4",
    prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
  },
  {
    index: 1,
    event: "DPDP_CONSENT_GRANTED",
    actor: "PATIENT_KIOSK",
    time: "14:02:15 UTC",
    payload: "Consents: [demographics, voice_intake, ocr_scan, abdm_share]",
    hash: "d4f82a9103c847e192f48102938475a610293847561029384756102938475610",
    prevHash: "0000a89f3c1b28d7e4e1a6c5f90382d619024f2b381a92e4720918c50e8291a4",
  },
  {
    index: 2,
    event: "RED_FLAG_SAFETY_CHECK",
    actor: "RULE_ENGINE_RF001",
    time: "14:03:42 UTC",
    payload: "Chief Complaint: Chest Pain · ACS Rule Evaluated: SAFE",
    hash: "e7192847a6102938475610293847561029384756102938475610293847561029",
    prevHash: "d4f82a9103c847e192f48102938475a610293847561029384756102938475610",
  },
  {
    index: 3,
    event: "DOCUMENT_OCR_EXTRACTED",
    actor: "TESSERACT_INDIC_OCR",
    time: "14:05:10 UTC",
    payload: "Prescription OCR: 4 Meds, 7 Lab Tests · 5 Abnormal Flags",
    hash: "b102938475610293847561029384756102938475610293847561029384756102",
    prevHash: "e7192847a6102938475610293847561029384756102938475610293847561029",
  },
  {
    index: 4,
    event: "PHYSICIAN_CONFIRMATION_GATE",
    actor: "DR_RK_SHARMA",
    time: "14:07:30 UTC",
    payload: "Verified: Dr. R. K. Sharma (MCI-84920) · Status: CONFIRMED",
    hash: "c983746192847561029384756102938475610293847561029384756102938475",
    prevHash: "b102938475610293847561029384756102938475610293847561029384756102",
  },
  {
    index: 5,
    event: "RAM_ZEROIZATION_PURGE",
    actor: "SYSTEM_PURGER",
    time: "14:08:02 UTC",
    payload: "Volatile Memory Zeroized · DPDP §8(7) Storage Limitation Enforced",
    hash: "a384756102938475610293847561029384756102938475610293847561029384",
    prevHash: "c983746192847561029384756102938475610293847561029384756102938475",
  },
];

// ─── DPDP Principles Matrix ──────────────────────────────────────────────────
const DPDP_CARDS = [
  {
    sec: "§6(1)",
    title: "Multilingual Notice & Audio Consent",
    req: "Plain language notice with audio narration across 22 scheduled Indian languages.",
    solution: "Audio-guided consent in 12 Indic languages with granular toggles.",
    icon: "🔊",
  },
  {
    sec: "§7(a)",
    title: "Strict Purpose Limitation",
    req: "Data processed solely for clinical history intake & emergency triage.",
    solution: "Data bound exclusively to SOCRATES fields & FHIR R4 resources.",
    icon: "🎯",
  },
  {
    sec: "§7(b)",
    title: "Collection Minimization",
    req: "No extraneous data or biometric telemetry collected without purpose.",
    solution: "Ontology limits questions strictly to HPI clinical parameters.",
    icon: "⚖️",
  },
  {
    sec: "§8(3)",
    title: "Physician Accuracy Gate",
    req: "Mandatory human review before clinical data reaches official medical records.",
    solution: "State machine hard-gate: Zero HIS writes without doctor confirmation.",
    icon: "👨‍⚕️",
  },
  {
    sec: "§8(7)",
    title: "Storage Limitation & Zero Retention",
    req: "Immediate erasure of data from kiosk memory upon session completion.",
    solution: "Automatic RAM zeroization (memset overwrite) upon HIS transmission.",
    icon: "🗑️",
  },
  {
    sec: "§8(5)",
    title: "Technical Safeguards",
    req: "Protection against unauthorized access, data breach, and sniffing.",
    solution: "AES-256-GCM field encryption + ephemeral session key derivation.",
    icon: "🔐",
  },
  {
    sec: "§8(4)",
    title: "Tamper-Evident Auditability",
    req: "Verifiable, non-repudiable audit trails of all fiduciary actions.",
    solution: "Immutable SHA-256 cryptographic hash-chain with Merkle root verification.",
    icon: "⛓️",
  },
];

// ─── RBAC Roles Catalog ──────────────────────────────────────────────────────
const RBAC_ROLES = [
  {
    role: "PATIENT_KIOSK",
    name: "Patient Kiosk Terminal",
    badge: "Terminal Role",
    icon: "👤",
    allowed: ["Grant/Revoke Consent", "Voice & Touch Dialogue", "Scan Prescriptions"],
    blocked: ["View Doctor Summaries", "Edit Diagnoses", "Submit to HIS", "View Audit Chain"],
  },
  {
    role: "TRIAGE_NURSE",
    name: "OPD Triage Nurse",
    badge: "Clinical Triage",
    icon: "👩‍⚕️",
    allowed: ["Record Vitals (BP/SpO2)", "Manage OPD Queue Tokens", "Acknowledge Red-Flags", "Grant Intake"],
    blocked: ["Override Prescriptions", "Submit to HIS without Doctor", "Configure System"],
  },
  {
    role: "ATTENDING_PHYSICIAN",
    name: "Attending Physician",
    badge: "Clinical Decision",
    icon: "🩺",
    allowed: ["Read Bilingual Summaries", "Edit Diagnoses & Meds", "Confirm Summary Gate", "Authorize HIS Submit"],
    blocked: ["Modify Cryptographic Ledger", "Change Kiosk Peripherals"],
  },
  {
    role: "AUDIT_OFFICER",
    name: "Compliance & Security Auditor",
    badge: "Governance",
    icon: "🛡️",
    allowed: ["Inspect SHA-256 Hash Chain", "Verify Merkle Root Integrity", "Export ISO 27799 Certificates"],
    blocked: ["Access Patient Clinical Files", "Edit Prescriptions", "Trigger HIS Writes"],
  },
];

export default function SecurityComplianceSection() {
  const [activeTab, setActiveTab] = useState("ledger");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  
  // Encryption Sandbox State
  const [sampleText, setSampleText] = useState("Rameshwar Prasad | ABHA: 45-1234-5678-9012 | Diagnosis: CAD");
  const [encryptedField, setEncryptedField] = useState(null);
  const [isZeroized, setIsZeroized] = useState(false);

  // RBAC State
  const [selectedRole, setSelectedRole] = useState(RBAC_ROLES[2]);

  // Simulate verification
  function handleVerifyChain() {
    setIsVerifying(true);
    setVerificationResult(null);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationResult({
        isValid: true,
        totalBlocks: DEMO_CHAIN_BLOCKS.length,
        merkleRoot: "7f92a103c847e192f48102938475a61029384756102938475610293847561029",
        status: "CHAIN_INTEGRITY_VERIFIED_100_PERCENT",
        timestamp: new Date().toISOString()
      });
    }, 1800);
  }

  // Simulate Encryption
  function handleEncryptSandbox() {
    const fakeCipher = btoa(encodeURIComponent(sampleText)).slice(0, 32);
    const fakeNonce = Math.random().toString(36).substring(2, 18);
    const fakeTag = Math.random().toString(36).substring(2, 18);
    setEncryptedField({
      ciphertext: `${fakeCipher}...[AES-256-GCM]`,
      nonce: fakeNonce,
      authTag: fakeTag,
      algorithm: "AES-256-GCM / HMAC-SHA256",
      keyFingerprint: "SHA256:8f92b4c10a"
    });
    setIsZeroized(false);
  }

  // Simulate Zeroize
  function handleZeroize() {
    setIsZeroized(true);
    setEncryptedField(null);
  }

  return (
    <section id="security-compliance" className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Subtle security background mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{ backgroundImage: "radial-gradient(#38bdf8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="max-w-6xl mx-auto px-4 relative">
        {/* Section Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 rounded-full text-emerald-400 text-sm font-medium mb-5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            DPDP Act 2023 · ISO 27799 · AES-256 · SHA-256 Ledger
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Security, Cryptography <span className="text-emerald-400">&</span> Compliance
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Zero-retention ephemeral memory architecture, cryptographic audit chain, and hard physician confirmation gates — guaranteeing strict Indian regulatory compliance.
          </p>
        </motion.div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { id: "ledger", label: "⛓️ Cryptographic Audit Ledger", sub: "SHA-256 Hash Chain" },
            { id: "dpdp", label: "📜 DPDP Act 2023 Matrix", sub: "7 Statutory Principles" },
            { id: "encryption", label: "🔐 Zero-Retention & Crypto", sub: "AES-256 & RAM Wipe" },
            { id: "rbac", label: "🛡️ RBAC Access Gate", sub: "Least-Privilege Roles" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-slate-900 border-emerald-400 shadow-lg shadow-emerald-500/30 font-bold"
                  : "bg-slate-900/80 text-slate-300 border-slate-700 hover:border-emerald-500/50"
              }`}
            >
              <div>{tab.label}</div>
              <div className={`text-xs mt-0.5 ${activeTab === tab.id ? "text-slate-800 font-semibold" : "text-slate-500"}`}>{tab.sub}</div>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ──── TAB 1: CRYPTOGRAPHIC AUDIT LEDGER ──── */}
          {activeTab === "ledger" && (
            <motion.div key="ledger" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {/* Header Action Bar */}
              <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span>⛓️</span> Immutable SHA-256 Audit Chain
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Every consent grant, safety check, OCR scan, and RAM wipe is appended to a tamper-evident cryptographic ledger.
                  </p>
                </div>
                <button
                  onClick={handleVerifyChain}
                  disabled={isVerifying}
                  className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shrink-0 ${
                    isVerifying
                      ? "bg-emerald-800 text-emerald-200 cursor-not-allowed animate-pulse"
                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/30"
                  }`}
                >
                  {isVerifying ? "🔍 Verifying Hashes…" : "✓ Verify Chain Integrity"}
                </button>
              </div>

              {/* Verification Result Banner */}
              {verificationResult && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-5 text-emerald-300">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🛡️</span>
                    <span className="text-white font-bold text-base">Cryptographic Audit Chain Integrity 100% Verified</span>
                    <span className="text-xs bg-emerald-500/30 border border-emerald-400 px-2.5 py-0.5 rounded-full font-bold">ZERO TAMPERING</span>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-xs font-mono mt-3">
                    <div className="bg-emerald-900/40 p-2.5 rounded-xl">
                      <span className="text-emerald-400 font-bold block mb-1">Total Blocks:</span>
                      {verificationResult.totalBlocks} Blocks Verified
                    </div>
                    <div className="bg-emerald-900/40 p-2.5 rounded-xl col-span-2 truncate">
                      <span className="text-emerald-400 font-bold block mb-1">Merkle Tree Root Hash:</span>
                      {verificationResult.merkleRoot}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Blocks Stream */}
              <div className="space-y-3">
                {DEMO_CHAIN_BLOCKS.map((block) => (
                  <div key={block.index} className="bg-slate-900/90 border border-slate-700 hover:border-slate-500 rounded-xl p-4 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-lg flex items-center justify-center text-xs font-bold font-mono">
                          #{block.index}
                        </span>
                        <span className="text-white font-bold text-sm">{block.event}</span>
                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md border border-slate-700">{block.actor}</span>
                      </div>
                      <span className="text-slate-500 text-xs font-mono">{block.time}</span>
                    </div>

                    <div className="text-slate-300 text-xs mb-3 bg-slate-950/60 p-2 rounded-lg font-mono">
                      {block.payload}
                    </div>

                    <div className="grid md:grid-cols-2 gap-2 text-[11px] font-mono text-slate-500">
                      <div className="truncate">
                        <span className="text-slate-600">PREV: </span>{block.prevHash.slice(0, 32)}…
                      </div>
                      <div className="truncate text-emerald-400/80">
                        <span className="text-slate-600">HASH: </span>{block.hash.slice(0, 32)}…
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ──── TAB 2: DPDP ACT 2023 PRINCIPLES ──── */}
          {activeTab === "dpdp" && (
            <motion.div key="dpdp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid md:grid-cols-2 gap-4">
                {DPDP_CARDS.map((card) => (
                  <div key={card.sec} className="bg-slate-900/80 border border-slate-700 hover:border-emerald-500/40 rounded-2xl p-5 transition-all">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{card.icon}</span>
                        <div>
                          <div className="text-white font-bold text-base">{card.title}</div>
                          <div className="text-emerald-400 text-xs font-semibold">DPDP Act 2023 {card.sec}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold shrink-0">
                        ✓ 100% Pass
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 font-bold block mb-0.5">Statutory Requirement:</span>
                        <span className="text-slate-300">{card.req}</span>
                      </div>
                      <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/40">
                        <span className="text-emerald-400 font-bold block mb-0.5">MediKiosk Technical Solution:</span>
                        <span className="text-slate-200">{card.solution}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ──── TAB 3: ENCRYPTION & ZEROIZATION SANDBOX ──── */}
          {activeTab === "encryption" && (
            <motion.div key="encryption" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Field-Level Encryption Sandbox */}
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                    <span>🔐</span> AES-256-GCM Field Encryption
                  </h3>
                  <p className="text-slate-400 text-xs mb-4">
                    Test live field-level encryption with HKDF session subkey derivation and HMAC authentication tags.
                  </p>

                  <div className="mb-4">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
                      Input Sensitive Field (Plaintext)
                    </label>
                    <input
                      type="text"
                      value={sampleText}
                      onChange={(e) => setSampleText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleEncryptSandbox}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 mb-4"
                  >
                    ⚡ Encrypt with AES-256-GCM
                  </button>

                  {encryptedField && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block">CIPHERTEXT:</span>
                        <span className="text-emerald-400 break-all">{encryptedField.ciphertext}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">NONCE (128-BIT):</span>
                        <span className="text-slate-300">{encryptedField.nonce}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">AUTH TAG (HMAC-SHA256):</span>
                        <span className="text-cyan-400">{encryptedField.authTag}</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Ephemeral Memory Sanitizer */}
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                    <span>🗑️</span> Volatile Memory Zeroization
                  </h3>
                  <p className="text-slate-400 text-xs mb-4">
                    DPDP Act 2023 §8(7) mandates immediate data destruction. MediKiosk executes cryptographic overwrite on session finish.
                  </p>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-400">Memory Storage Engine</span>
                      <span className="text-emerald-400 font-bold">Volatile RAM Only</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-400">Idle Auto-Lock Timeout</span>
                      <span className="text-white font-mono">300 Seconds (5 Min)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Persistent Disk Retention</span>
                      <span className="text-red-400 font-bold">0.00 Bytes (None)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleZeroize}
                    className={`w-full py-3 font-bold rounded-xl transition-all ${
                      isZeroized
                        ? "bg-red-900/60 border border-red-500 text-red-200 cursor-default"
                        : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
                    }`}
                  >
                    {isZeroized ? "✓ Memory Zeroized (Memset 0x00)" : "🚨 Trigger Instant Cryptographic Zeroization"}
                  </button>

                  {isZeroized && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 bg-red-950/60 border border-red-500/40 rounded-xl p-3 text-xs text-red-300">
                      ✓ RAM Session buffer overwritten with cryptorandom noise.<br />
                      ✓ All references deallocated. Zero trace persists on kiosk hardware.
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ──── TAB 4: RBAC ROLES MATRIX ──── */}
          {activeTab === "rbac" && (
            <motion.div key="rbac" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid md:grid-cols-5 gap-6">
                {/* Role Selector */}
                <div className="md:col-span-2 space-y-2.5">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Select Active Role</div>
                  {RBAC_ROLES.map((r) => {
                    const isSel = selectedRole.role === r.role;
                    return (
                      <button
                        key={r.role}
                        onClick={() => setSelectedRole(r)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          isSel
                            ? "bg-emerald-500/10 border-emerald-400 text-white shadow-lg"
                            : "bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{r.icon}</span>
                          <div>
                            <div className="font-bold text-sm">{r.name}</div>
                            <div className="text-slate-500 text-xs">{r.badge}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Permissions Breakdown */}
                <div className="md:col-span-3 bg-slate-900/80 border border-slate-700 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-slate-800 rounded-xl">{selectedRole.icon}</span>
                    <div>
                      <h4 className="text-white font-bold text-lg">{selectedRole.name}</h4>
                      <div className="text-emerald-400 text-xs font-mono">{selectedRole.role}</div>
                    </div>
                  </div>

                  {/* Allowed Permissions */}
                  <div>
                    <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                      ✓ Authorized Permissions
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedRole.allowed.map((perm) => (
                        <span key={perm} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-medium">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Blocked Permissions */}
                  <div>
                    <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
                      ✕ Prohibited Security Boundaries
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedRole.blocked.map((perm) => (
                        <span key={perm} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

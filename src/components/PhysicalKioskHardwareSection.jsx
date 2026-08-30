import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Peripheral Device Registry ──────────────────────────────────────────────
const HARDWARE_PERIPHERALS = [
  {
    id: "printer",
    name: "ESC/POS Thermal Token Printer",
    model: "Epson TM-T88VI / TVS RP-3200 Star",
    bus: "USB Bus 001 Device 004",
    status: "ONLINE",
    telemetry: "Paper Roll: 85% Remaining · 80mm Autocutter Ready",
    icon: "🖨️",
  },
  {
    id: "vitals",
    name: "Medical Vitals Sensor Hub",
    model: "Omron NIBP + Contec SpO2 + BPL IR Temp",
    bus: "Serial COM3 (115200 baud)",
    status: "ONLINE",
    telemetry: "SpO2: 97% · NIBP: 138/88 mmHg · Temp: 98.6°F",
    icon: "🩺",
  },
  {
    id: "mic",
    name: "4-Channel Acoustic Beamforming Mic Array",
    model: "ReSpeaker 4-Mic / XMOS xCORE-VOICE DSP",
    bus: "USB Audio Class 2.0 (16kHz Mono)",
    status: "ONLINE",
    telemetry: "Azimuth 90° Locked · AEC & NS: +20dB SNR Boost",
    icon: "🎙️",
  },
  {
    id: "camera",
    name: "13MP 4K Overhead Document Camera",
    model: "Sony IMX258 UVC Auto-Focus Macro",
    bus: "USB 3.0 Bus 002 Device 002",
    status: "ONLINE",
    telemetry: "300 DPI Optical · Auto-Deskew & Shadow Removal",
    icon: "📷",
  },
  {
    id: "scanner",
    name: "2D Imager Barcode Scanner",
    model: "Honeywell Xenon 1900G / Newland HR22",
    bus: "USB HID Pos / Virtual COM",
    status: "ONLINE",
    telemetry: "ABHA QR Scan & Share Decoder: Armed",
    icon: "📱",
  },
  {
    id: "chassis",
    name: "Anti-Tamper Kiosk Chassis & UPS",
    model: "Industrial IP54 Vandal-Resistant Enclosure",
    bus: "Internal GPIO / I2C Power Management",
    status: "ONLINE",
    telemetry: "Tamper Switch: Sealed · UPS Battery: 100% (4.5h)",
    icon: "🛡️",
  },
];

export default function PhysicalKioskHardwareSection() {
  const [activeTab, setActiveTab] = useState("printer");
  
  // Printer state
  const [tokenType, setTokenType] = useState("normal"); // "normal" | "emergency"
  const [isPrinting, setIsPrinting] = useState(false);
  const [printedSlip, setPrintedSlip] = useState(true);

  // Vitals state
  const [vitalsData, setVitalsData] = useState({
    spo2: 97,
    pulse: 78,
    sbp: 138,
    dbp: 88,
    temp: 98.6,
    weight: 72.5,
    height: 168.0,
  });

  // Audio DSP state
  const [ambientNoise, setAmbientNoise] = useState(78);

  function handlePrintToken(type) {
    setTokenType(type);
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      setPrintedSlip(true);
    }, 1200);
  }

  return (
    <section id="hardware-services" className="py-20 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-15"
        style={{ backgroundImage: "linear-gradient(rgba(56,189,248,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="max-w-6xl mx-auto px-4 relative">
        {/* Section Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-4 py-1.5 rounded-full text-blue-400 text-sm font-medium mb-5">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            ESC/POS Printer · NIBP/SpO2 Sensor Hub · 4-Mic DSP Beamforming · 4K Camera
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Physical Kiosk Hardware <span className="text-blue-400">&</span> Device Drivers
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Production-grade drivers for physical OPD kiosk terminals — thermal token printing, digital medical vitals capture, high-noise acoustic beamforming, and anti-tamper telemetry.
          </p>
        </motion.div>

        {/* Peripheral Bus Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {HARDWARE_PERIPHERALS.map((dev) => (
            <div key={dev.id} className="bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{dev.icon}</div>
              <div className="text-white text-xs font-bold truncate">{dev.name.split(" ")[0]} {dev.name.split(" ")[1]}</div>
              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span className="text-emerald-400 text-[10px] font-bold font-mono">ONLINE</span>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Feature Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { id: "printer", label: "🖨️ ESC/POS Thermal Token Printer", sub: "OPD Queue Slips & Barcode" },
            { id: "vitals", label: "🩺 Medical Vitals Sensor Hub", sub: "SpO2 · NIBP · IR Temp · BMI" },
            { id: "audio", label: "🎙️ Directional Mic Array & DSP", sub: "Far-Field Noise Attenuation" },
            { id: "camera", label: "📷 4K Document Camera & QR", sub: "Auto-Deskew & ABHA Decoder" },
            { id: "watchdog", label: "🛡️ Kiosk Chassis Watchdog", sub: "UPS · Thermal · Anti-Tamper" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                activeTab === tab.id
                  ? "bg-blue-500 text-slate-900 border-blue-400 shadow-lg shadow-blue-500/30 font-bold"
                  : "bg-slate-900/80 text-slate-300 border-slate-700 hover:border-blue-500/50"
              }`}
            >
              <div>{tab.label}</div>
              <div className={`text-xs mt-0.5 ${activeTab === tab.id ? "text-slate-800 font-semibold" : "text-slate-500"}`}>{tab.sub}</div>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ──── TAB 1: ESC/POS THERMAL PRINTER ──── */}
          {activeTab === "printer" && (
            <motion.div key="printer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 gap-6">
              {/* Controls */}
              <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 space-y-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span>🖨️</span> Thermal Token Printer Driver (ESC/POS)
                </h3>
                <p className="text-slate-400 text-xs">
                  Sends raw ESC/POS binary command streams to 80mm thermal receipt printers over USB / Serial COM. Features bilingual formatting, big token numbering, and emergency red-flag watermarks.
                </p>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Port / Interface:</span>
                    <span className="text-white">USB001 (Epson/TVS-E ESC/POS)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paper Width / DPI:</span>
                    <span className="text-white">80mm / 203 DPI Thermal Raster</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Autocutter Mechanism:</span>
                    <span className="text-emerald-400 font-bold">Enabled (GS V A 3)</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => handlePrintToken("normal")}
                    disabled={isPrinting}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 text-sm"
                  >
                    {isPrinting && tokenType === "normal" ? "⚙️ Generating ESC/POS Bytes…" : "📄 Print Routine OPD Token (#087)"}
                  </button>

                  <button
                    onClick={() => handlePrintToken("emergency")}
                    disabled={isPrinting}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 text-sm"
                  >
                    {isPrinting && tokenType === "emergency" ? "🚨 Triggering Resus Slip…" : "🚨 Print Emergency Red-Flag Slip (Priority Resus)"}
                  </button>
                </div>
              </div>

              {/* Physical Slip Preview */}
              <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                  Physical Thermal Slip Output (80mm)
                </div>

                {printedSlip && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`w-full max-w-sm bg-amber-50 text-slate-900 rounded-lg p-5 font-mono text-xs shadow-2xl border-t-8 ${
                      tokenType === "emergency" ? "border-red-600" : "border-amber-400"
                    }`}
                  >
                    {/* Header */}
                    <div className="text-center border-b border-dashed border-slate-400 pb-2 mb-2">
                      <div className="font-bold text-sm text-slate-950">DISTRICT CIVIL HOSPITAL</div>
                      <div className="text-[10px] text-slate-600">Ayushman Bharat OPD Registration Kiosk</div>
                    </div>

                    {/* Emergency Alert Banner */}
                    {tokenType === "emergency" && (
                      <div className="bg-red-600 text-white text-center font-bold text-xs py-1.5 px-2 rounded mb-2 animate-pulse">
                        🚨 EMERGENCY TRIAGE -- DO NOT WAIT<br />
                        <span className="text-[10px]">PROCEED DIRECTLY TO RESUSCITATION BAY 1</span>
                      </div>
                    )}

                    {/* Token Number */}
                    <div className="text-center py-2 border-b border-dashed border-slate-400 mb-3">
                      <div className="text-[10px] text-slate-600 uppercase">Your OPD Token Number</div>
                      <div className={`text-4xl font-extrabold tracking-wider ${tokenType === "emergency" ? "text-red-600" : "text-slate-900"}`}>
                        {tokenType === "emergency" ? "#EMG-01" : "#087"}
                      </div>
                      <div className="text-[10px] text-slate-600 mt-1">
                        {tokenType === "emergency" ? "IMMEDIATE ATTENTION" : "4 Patients Ahead (~24 mins wait)"}
                      </div>
                    </div>

                    {/* Patient & Clinic Details */}
                    <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-3 mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Patient:</span>
                        <span className="font-bold">Rameshwar Prasad (58Y/M)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">ABHA ID:</span>
                        <span className="font-bold">45-1234-5678-9012</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Department:</span>
                        <span className="font-bold">General Medicine OPD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Room / Floor:</span>
                        <span className="font-bold">Room 104, 1st Floor</span>
                      </div>
                    </div>

                    {/* Footer QR Matrix */}
                    <div className="text-center space-y-1">
                      <div className="text-[10px] text-slate-600">Scan QR for Live Queue Status on Phone</div>
                      <div className="font-mono text-[9px] bg-slate-200 py-1 rounded">
                        [QR: abha://medikiosk/token/087]
                      </div>
                      <div className="text-[9px] text-slate-500">
                        DPDP Act 2023 Compliant · Memory Purged
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ──── TAB 2: MEDICAL VITALS HUB ──── */}
          {activeTab === "vitals" && (
            <motion.div key="vitals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      <span>🩺</span> Medical Vitals Sensor Hub (Serial / BLE)
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Integrates non-invasive clinical sensors to measure SpO2, NIBP blood pressure, pulse, core body temperature, and BMI.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs font-bold font-mono">PORT: COM3 (115200 baud)</span>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full text-xs font-bold">
                      ✓ SENSORS CALIBRATED
                    </span>
                  </div>
                </div>

                {/* Vitals Telemetry Gauges */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* SpO2 */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">Blood Oxygen (SpO2)</div>
                    <div className="text-3xl font-extrabold text-cyan-400">{vitalsData.spo2} <span className="text-sm font-normal">%</span></div>
                    <div className="text-slate-500 text-[10px] mt-1">Ref: 95 - 100% · Status: Normal</div>
                  </div>

                  {/* Pulse */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">Pulse Rate</div>
                    <div className="text-3xl font-extrabold text-red-400">{vitalsData.pulse} <span className="text-sm font-normal">bpm</span></div>
                    <div className="text-slate-500 text-[10px] mt-1">Ref: 60 - 100 bpm · Normal</div>
                  </div>

                  {/* Blood Pressure */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">Blood Pressure (NIBP)</div>
                    <div className="text-3xl font-extrabold text-amber-400">{vitalsData.sbp}/{vitalsData.dbp}</div>
                    <div className="text-amber-400/80 text-[10px] mt-1 font-semibold">Stage 1 Elevated (138/88)</div>
                  </div>

                  {/* Temperature */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">Body Temperature</div>
                    <div className="text-3xl font-extrabold text-emerald-400">{vitalsData.temp} <span className="text-sm font-normal">°F</span></div>
                    <div className="text-slate-500 text-[10px] mt-1">Infrared Core · Afebrile</div>
                  </div>
                </div>

                {/* Anthropometry & FHIR Mapping */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                    <div className="text-slate-400 font-bold uppercase">⚖️ Anthropometry (Ultrasonic Stadiometer)</div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Weight:</span>
                      <span className="text-white font-bold">{vitalsData.weight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Height:</span>
                      <span className="text-white font-bold">{vitalsData.height} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Calculated BMI:</span>
                      <span className="text-amber-400 font-bold">25.7 kg/m² (Overweight)</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                    <div className="text-slate-400 font-bold uppercase">🧬 FHIR R4 Vital Signs Bundle</div>
                    <div className="text-slate-300 font-mono text-[11px] bg-slate-900 p-2.5 rounded-lg">
                      Observation.code: 85354-9 (BP Panel)<br />
                      Observation.code: 2708-6 (SpO2: {vitalsData.spo2}%)<br />
                      Observation.code: 8867-4 (Heart Rate: {vitalsData.pulse}/min)
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ──── TAB 3: DIRECTIONAL AUDIO DSP ──── */}
          {activeTab === "audio" && (
            <motion.div key="audio" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Acoustic Simulator */}
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 space-y-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span>🎙️</span> Acoustic Beamforming & Noise Suppression
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Indian hospital OPD halls frequently exceed 80 dBA ambient noise. MediKiosk utilizes a 4-channel microphone array with far-field beamforming and acoustic echo cancellation (AEC).
                  </p>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Simulate OPD Ambient Noise Level:</span>
                      <span className="text-amber-400 font-bold font-mono">{ambientNoise} dBA</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="90"
                      value={ambientNoise}
                      onChange={(e) => setAmbientNoise(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>Quiet Clinic (60 dB)</span>
                      <span>Busy OPD Hall (78 dB)</span>
                      <span>Chaotic Triage (90 dB)</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Beamformer Azimuth:</span>
                      <span className="text-cyan-400 font-bold">90° Centered Cone (±22.5°)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Noise Suppression Gain:</span>
                      <span className="text-emerald-400 font-bold">+20.0 dB SNR Enhancement</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Speech Clarity Score:</span>
                      <span className="text-white font-bold">{Math.max(65, 100 - (ambientNoise - 60) * 0.8).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Acoustic Visualizer */}
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
                    Far-Field Microphone Acceptance Cone (Polar Pattern)
                  </div>

                  <div className="relative w-48 h-48 rounded-full border-2 border-dashed border-blue-500/40 flex items-center justify-center mb-3">
                    {/* Beamforming focus cone */}
                    <div className="absolute top-0 w-24 h-24 bg-blue-500/20 rounded-t-full border-t-2 border-blue-400" />
                    <div className="relative z-10 text-center">
                      <div className="text-3xl">👤</div>
                      <div className="text-[10px] text-blue-300 font-bold mt-1">PATIENT ZONE<br />(Azimuth 90°)</div>
                    </div>
                    {/* Attenuation zones */}
                    <div className="absolute bottom-2 text-[9px] text-slate-500">
                      Background Hall Noise Attenuated (-22 dB)
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    <span className="text-emerald-400 font-bold">AEC Active: </span>
                    Internal TTS speaker prompts are digitally subtracted from mic input to prevent acoustic feedback.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ──── TAB 4: 4K CAMERA & BARCODE ──── */}
          {activeTab === "camera" && (
            <motion.div key="camera" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 space-y-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span>📷</span> 13MP Overhead Document Camera
                  </h3>
                  <p className="text-slate-400 text-xs">
                    4K macro document camera with dual LED shadow-free ring light. Captures physical handwritten prescriptions and lab reports at 300 DPI optical equivalent.
                  </p>

                  <div className="space-y-2 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono">
                    <div className="text-emerald-400 font-bold">✓ 4-Corner Document Boundary Detection</div>
                    <div className="text-emerald-400 font-bold">✓ Real-time Perspective Homography Deskew</div>
                    <div className="text-emerald-400 font-bold">✓ Adaptive Contrast Enhancement for Faded Ink</div>
                    <div className="text-slate-400">✓ Optical Resolution: 3840 x 2160 (300 DPI A4)</div>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 space-y-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span>📱</span> 2D Barcode & ABHA QR Scanner
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Dedicated wide-angle 2D imager barcode reader. Instantly decodes ABHA Scan-and-Share QR codes from patient mobile screens or Ayushman cards.
                  </p>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-1.5">
                    <div className="text-cyan-400 font-bold">Decoded ABHA Payload:</div>
                    <div className="text-white">ABHA Number: 45-1234-5678-9012</div>
                    <div className="text-slate-300">Name: Rameshwar Prasad</div>
                    <div className="text-slate-400">Auth Token: HMAC-SHA256 Verified</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ──── TAB 5: CHASSIS WATCHDOG ──── */}
          {activeTab === "watchdog" && (
            <motion.div key="watchdog" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      <span>🛡️</span> Kiosk Hardware Supervisor & Anti-Tamper Telemetry
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Continuous hardware health telemetry, thermal monitoring, battery backup management, and chassis security switch.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full text-xs font-bold">
                    SYSTEM HEALTH: 100% OPERATIONAL
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <div className="text-slate-500 text-xs mb-1">CPU Temperature</div>
                    <div className="text-2xl font-bold text-emerald-400">44.2 °C</div>
                    <div className="text-slate-600 text-[10px] mt-1">Fan: 1,850 RPM (Optimal)</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <div className="text-slate-500 text-xs mb-1">UPS Battery Backup</div>
                    <div className="text-2xl font-bold text-cyan-400">100%</div>
                    <div className="text-slate-600 text-[10px] mt-1">Est: 4.5 Hours on Battery</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <div className="text-slate-500 text-xs mb-1">Chassis Tamper Seal</div>
                    <div className="text-2xl font-bold text-emerald-400">SECURE</div>
                    <div className="text-slate-600 text-[10px] mt-1">Physical Microswitch OK</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <div className="text-slate-500 text-xs mb-1">Kiosk Mode Lockdown</div>
                    <div className="text-2xl font-bold text-blue-400">ACTIVE</div>
                    <div className="text-slate-600 text-[10px] mt-1">Wayland / udev USB Lock</div>
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

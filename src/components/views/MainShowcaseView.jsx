import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, ArrowRight, ShieldCheck, Stethoscope, User, Rocket, 
  Cpu, Mic, Camera, FileText, CheckCircle2, AlertTriangle, 
  Lock, Network, RefreshCw, Terminal, Play, Database, Award, 
  QrCode, Printer, HardDrive, Heart, Wifi, ExternalLink, Sparkles
} from 'lucide-react'

import CardFlipScene from '../../three/CardFlipScene.jsx'
import ProblemSection from '../ProblemSection.jsx'
import ModulesSection from '../ModulesSection.jsx'
import JourneySection from '../JourneySection.jsx'
import SpeechDocumentAISection from '../SpeechDocumentAISection.jsx'
import HISIntegrationSection from '../HISIntegrationSection.jsx'
import PhysicalKioskHardwareSection from '../PhysicalKioskHardwareSection.jsx'
import SecurityComplianceSection from '../SecurityComplianceSection.jsx'
import TrustSection from '../TrustSection.jsx'
import CTASection from '../CTASection.jsx'
import Footer from '../Footer.jsx'
import InteractiveComponentTestPlayground from '../InteractiveComponentTestPlayground.jsx'

export default function MainShowcaseView({ webGLSupported = true, theme = 'dark' }) {
  const isLight = theme === 'light'
  const [isLabOpen, setIsLabOpen] = useState(false)

  return (
    <div className={`w-full font-sans transition-colors duration-300 ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-white'
    }`}>
      
      {/* ========================================================= */}
      {/* 1. HERO SECTION & 3D PERSPECTIVE MODEL                   */}
      {/* ========================================================= */}
      <section id="hero" className={`relative min-h-[90vh] flex items-center overflow-hidden border-b transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800/80'
      }`}>
        {/* Ambient background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] ${
            isLight ? 'bg-amber-400/10' : 'bg-saffron/10'
          }`} />
          <div className={`absolute top-1/2 right-1/4 w-[450px] h-[450px] rounded-full blur-[140px] ${
            isLight ? 'bg-cyan-500/10' : 'bg-teal-500/10'
          }`} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Headlines & Live Action Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono border backdrop-blur-md shadow-sm transition-colors ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold">ABDM M1–M3 CERTIFIED · PRODUCTION GRADE FLEET</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.1]">
                Autonomous OPD Intake & Clinical Triage Terminal
              </h1>

              <p className={`text-base sm:text-lg leading-relaxed max-w-2xl ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                MediKiosk replaces chaotic paper queues with self-service multilingual voice intake, 
                instant prescription OCR scanning, automated medical vitals capture, and zero-retention 
                DPDP Act 2023 compliant FHIR R4 EHR transmission.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="?view=kiosk"
                  className="px-7 py-3.5 bg-saffron hover:bg-saffron-light text-slate-950 font-bold rounded-2xl text-sm flex items-center gap-2 shadow-xl shadow-saffron/20 transition-all font-display hover:scale-[1.02]"
                >
                  <User className="w-4 h-4" />
                  <span>Launch Patient Kiosk</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="?view=doctor"
                  className={`px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 border transition-all ${
                    isLight 
                      ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200' 
                      : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 text-emerald-500" />
                  <span>Doctor Dashboard (Room 104)</span>
                </a>

                <button
                  onClick={() => setIsLabOpen(true)}
                  className={`px-5 py-3.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 border transition-all ${
                    isLight
                      ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-amber-500" />
                  <span>System Test Lab</span>
                </button>
              </div>

              {/* Real-time stats bar */}
              <div className={`grid grid-cols-3 gap-3 pt-4 border-t ${
                isLight ? 'border-slate-200' : 'border-slate-800/80'
              }`}>
                <div>
                  <div className="text-2xl font-bold font-mono text-saffron">&lt; 18ms</div>
                  <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Triage Latency</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">100.0%</div>
                  <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Red-Flag Recall</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">12 Dialects</div>
                  <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Indic Speech AI</div>
                </div>
              </div>
            </div>

            {/* Right: 3D Interactive Perspective Model */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <CardFlipScene theme={theme} />
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. THE PROBLEM (THE OPD CRISIS IN INDIAN HOSPITALS)       */}
      {/* ========================================================= */}
      <ProblemSection theme={theme} />

      {/* ========================================================= */}
      {/* 3. CORE ARCHITECTURE (MODULES A, B, C, D)                */}
      {/* ========================================================= */}
      <ModulesSection theme={theme} />

      {/* ========================================================= */}
      {/* 4. 5-STEP PATIENT JOURNEY & LIVE INTERACTIVE SIMULATOR    */}
      {/* ========================================================= */}
      <section id="journey">
        <JourneySection theme={theme} />
      </section>

      {/* ========================================================= */}
      {/* 5. INDIC SPEECH & DOCUMENT OCR AI ENGINE                 */}
      {/* ========================================================= */}
      <section id="speech-ai">
        <SpeechDocumentAISection theme={theme} />
      </section>

      {/* ========================================================= */}
      {/* 6. HIS INTEGRATION & FHIR R4 / ABDM INTEROPERABILITY     */}
      {/* ========================================================= */}
      <section id="his-integration">
        <HISIntegrationSection theme={theme} />
      </section>

      {/* ========================================================= */}
      {/* 7. PHYSICAL KIOSK HARDWARE SERVICES & TELEMETRY          */}
      {/* ========================================================= */}
      <section id="hardware-services">
        <PhysicalKioskHardwareSection theme={theme} />
      </section>

      {/* ========================================================= */}
      {/* 8. DPDP ACT 2023 SECURITY & EPHEMERAL AUDIT LEDGER       */}
      {/* ========================================================= */}
      <section id="security-compliance">
        <SecurityComplianceSection theme={theme} />
      </section>

      {/* ========================================================= */}
      {/* 9. ABDM STANDARDS, CERTIFICATIONS & CLINICAL TRUST       */}
      {/* ========================================================= */}
      <section id="trust">
        <TrustSection theme={theme} />
      </section>

      {/* ========================================================= */}
      {/* 10. CALL TO ACTION & PRODUCTION FLEET LAUNCH HUB         */}
      {/* ========================================================= */}
      <section id="cta">
        <CTASection theme={theme} />
      </section>

      {/* Footer */}
      <Footer theme={theme} />

      {/* Interactive System Test Lab Modal */}
      <InteractiveComponentTestPlayground
        isOpen={isLabOpen}
        onClose={() => setIsLabOpen(false)}
      />

    </div>
  )
}

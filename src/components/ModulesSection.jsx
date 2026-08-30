/**
 * ModulesSection.jsx
 * Dark (ink) section. Four modules A–D, each with an ultra-attractive,
 * distinct visual motif, interactive badge styling, and an animated data pipeline flow.
 */
import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { siteCopy } from '../content/copy.js'
import { Sparkles, Scan, Stethoscope, ShieldCheck, Activity, ArrowRight } from 'lucide-react'

/* ── Rich SVG / Canvas Motifs per Module ─────────────────────────────── */

function WaveformMotif() {
  return (
    <div className="relative p-3.5 bg-ink3/60 border border-saffron/30 rounded-xl flex flex-col gap-2 shadow-inner">
      <div className="flex items-center justify-between text-[11px] font-mono text-saffron">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-saffron animate-ping" />
          AI4Bharat Indic ASR
        </span>
        <span className="text-mist/50">12 Languages</span>
      </div>

      <svg width="100%" height="42" viewBox="0 0 200 42" aria-hidden="true" className="text-saffron">
        <defs>
          <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E8930A" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#E8930A" stopOpacity="1" />
            <stop offset="100%" stopColor="#4A7C6F" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path
          d="M0,21 Q20,5 40,21 T80,21 T120,5 T160,35 T200,21"
          fill="none"
          stroke="url(#waveGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M0,21 Q25,32 50,21 T100,10 T150,28 T200,21"
          fill="none"
          stroke="#4A7C6F"
          strokeWidth="1.2"
          opacity="0.6"
        />
      </svg>

      <div className="flex justify-between text-[10px] font-mono text-mist/40 pt-1 border-t border-mist/10">
        <span>SOCRATES Adaptive Branching</span>
        <span className="text-emerald-400">Red-Flag: Active</span>
      </div>
    </div>
  )
}

function ScanMotif() {
  return (
    <div className="relative p-3.5 bg-ink3/60 border border-saffron/30 rounded-xl flex flex-col gap-2 shadow-2xl overflow-hidden group">
      {/* Animated Laser Scanning Line */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] pointer-events-none z-10"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
      />

      <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400">
        <span className="flex items-center gap-1.5 font-bold">
          <Scan className="w-3.5 h-3.5" />
          Optical Clinical NER
        </span>
        <span className="text-mist/50">300 DPI A4</span>
      </div>

      <div className="bg-ink p-2.5 rounded border border-mist/15 space-y-1 font-mono text-[10px]">
        <div className="flex justify-between text-paper/80">
          <span>Rx: Tab. Metformin</span>
          <span className="text-saffron">500mg BD</span>
        </div>
        <div className="flex justify-between text-alert font-bold">
          <span>Lab: HbA1c 8.4%</span>
          <span className="bg-alert/20 px-1 rounded">[HIGH]</span>
        </div>
      </div>

      <div className="flex justify-between text-[10px] font-mono text-mist/50">
        <span>Tesseract Indic + Doc AI</span>
        <span>Timeline: Linked</span>
      </div>
    </div>
  )
}

function CheckmarkMotif() {
  return (
    <div className="relative p-3.5 bg-ink3/60 border border-sage/40 rounded-xl flex flex-col gap-2 shadow-inner">
      <div className="flex items-center justify-between text-[11px] font-mono text-sage">
        <span className="flex items-center gap-1.5 font-bold">
          <Stethoscope className="w-3.5 h-3.5" />
          Physician Confirmation Gate
        </span>
        <span className="text-mist/50">DPDP §8(3)</span>
      </div>

      <div className="bg-ink p-2.5 rounded border border-sage/20 space-y-1 text-[11px]">
        <div className="flex items-center justify-between text-paper/90 font-semibold">
          <span>Bilingual Summary</span>
          <span className="text-sage text-[10px] bg-sage/20 px-1.5 py-0.5 rounded font-mono">READY</span>
        </div>
        <p className="text-mist/60 text-[10px] font-mono">Drafted in English & Hindi · Editable</p>
      </div>

      <div className="flex justify-between text-[10px] font-mono text-mist/50">
        <span>Zero Auto-Submit</span>
        <span className="text-saffron">Doctor Approval Req.</span>
      </div>
    </div>
  )
}

function ShieldMotif() {
  return (
    <div className="relative p-3.5 bg-ink3/60 border border-teal/40 rounded-xl flex flex-col gap-2 shadow-inner">
      <div className="flex items-center justify-between text-[11px] font-mono text-teal">
        <span className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-teal" />
          ABDM M1-M3 & DPDP
        </span>
        <span className="text-mist/50">Zero-Retention</span>
      </div>

      <div className="bg-ink p-2.5 rounded border border-mist/15 space-y-1 text-[11px]">
        <p className="text-paper/90 font-semibold">Granular Purpose-Limited Consent</p>
        <p className="text-mist/60 text-[10px] font-mono">HL7 FHIR R4 Bundle + Care-Context Linking</p>
      </div>

      <div className="flex justify-between text-[10px] font-mono text-mist/50">
        <span>Audible Local Consent</span>
        <span className="text-emerald-400">RAM Zeroization</span>
      </div>
    </div>
  )
}

const MOTIFS = {
  waveform:  WaveformMotif,
  scan:      ScanMotif,
  checkmark: CheckmarkMotif,
  shield:    ShieldMotif,
}

function ModuleCard({ item, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const Motif = MOTIFS[item.motif]

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: 0.05 }}
      className="border-t border-mist/15 pt-10 pb-10 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start hover:bg-ink2/30 px-4 rounded-xl transition-colors"
      aria-labelledby={`module-${item.id}-title`}
    >
      {/* Visual Motif Column */}
      <div className="flex flex-col gap-2" aria-label={item.motifLabel}>
        <span className="font-mono text-xs text-saffron tracking-widest font-bold flex items-center gap-2">
          MODULE {item.id}
        </span>
        <div className="mt-1">
          <Motif />
        </div>
      </div>

      {/* Content Column */}
      <div>
        <h3
          id={`module-${item.id}-title`}
          className="font-display text-card font-bold text-paper mb-1"
          style={{ fontSize: 'clamp(1.1rem, 2vw, 1.375rem)' }}
        >
          {item.title}
        </h3>
        <p className="font-sans text-sm text-saffron/90 italic mb-4">
          {item.subtitle}
        </p>
        <p className="font-sans text-body text-paper/70 leading-relaxed">
          {item.body}
        </p>
      </div>
    </motion.article>
  )
}

export default function ModulesSection() {
  const { modules } = siteCopy

  return (
    <section
      id="modules"
      className="section-dark relative overflow-hidden"
      aria-labelledby="modules-headline"
    >
      <div className="max-w-5xl mx-auto px-6 py-24">

        <p className="font-mono text-data text-saffron uppercase tracking-widest mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-saffron" />
          {modules.eyebrow}
        </p>

        <h2
          id="modules-headline"
          className="font-display text-section text-paper mb-10"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.625rem)' }}
        >
          {modules.headline}
        </h2>

        {/* Animated 4-Module End-to-End Pipeline Ribbon */}
        <div className="bg-ink3/40 border border-mist/20 rounded-2xl p-4 md:p-6 mb-14 shadow-xl">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-saffron mb-4 text-center">
            Integrated Real-Time Intake Pipeline Flow
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { mod: "Mod A", name: "Voice Intake", icon: "🎙️", desc: "SOCRATES Speech ASR" },
              { mod: "Mod B", name: "Document OCR", icon: "📄", desc: "Entity & Lab Flags" },
              { mod: "Mod C", name: "Physician Gate", icon: "👨‍⚕️", desc: "Bilingual Summary Review" },
              { mod: "Mod D", name: "HIS / ABDM", icon: "📡", desc: "FHIR R4 & RAM Purge" },
            ].map((p, i) => (
              <div key={p.mod} className="relative bg-ink/80 border border-mist/20 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{p.icon}</div>
                <div className="text-white text-xs font-bold">{p.name}</div>
                <div className="text-mist/50 text-[10px]">{p.desc}</div>
                {i < 3 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-saffron text-xs">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          {modules.items.map((item, i) => (
            <ModuleCard key={item.id} item={item} index={i} />
          ))}
        </div>

      </div>
    </section>
  )
}

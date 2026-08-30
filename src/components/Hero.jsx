/**
 * Hero.jsx
 * Two-column layout: left = headline + CTAs + interactive test launcher, right = CardFlipScene (3D).
 * Enhanced with animated ECG neon pulse, live telemetry pills, and Full System Test Lab integration.
 */
import React, { Suspense, lazy, useState } from 'react'
import { motion } from 'framer-motion'
import { siteCopy } from '../content/copy.js'
import { useWebGLSupport } from '../hooks/useWebGLSupport.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { Play, ArrowRight, Shield, Activity, Cpu, Sparkles, Terminal, CheckCircle2 } from 'lucide-react'
import InteractiveComponentTestPlayground from './InteractiveComponentTestPlayground.jsx'

// Lazy-load the R3F canvas so it doesn't block initial render
const CardFlipScene = lazy(() => import('../three/CardFlipScene.jsx'))

/* Static fallback shown when WebGL is unsupported or reduced-motion is set */
function StaticCardFallback() {
  const { cardFront, cardBack } = siteCopy.hero
  return (
    <div className="w-full h-full flex items-center justify-center gap-4 p-4">
      {/* Front */}
      <div className="flex-1 bg-[#EDE8DF] rounded-sm shadow-md p-4 font-sans text-ink text-xs leading-relaxed max-w-[180px]">
        <p className="font-bold text-[10px] uppercase tracking-widest text-ink/50 mb-2">Paper Record</p>
        {cardFront.lines.map((l, i) => (
          <p key={i} className="italic">{l}</p>
        ))}
      </div>
      {/* Arrow */}
      <div className="text-saffron text-2xl font-bold">→</div>
      {/* Back */}
      <div className="flex-1 bg-[#F6F8FA] border border-sage/30 rounded-sm shadow-md p-4 font-sans text-xs leading-relaxed max-w-[200px]">
        <p className="font-bold text-[10px] uppercase tracking-widest text-sage mb-2">MediKiosk · Structured</p>
        {cardBack.fields.slice(0, 5).map(f => (
          <p key={f.key}>
            <span className="text-sage/70 uppercase text-[9px]">{f.key}: </span>
            <span className={f.mono ? 'font-mono text-ink' : 'text-ink'}>{f.value}</span>
          </p>
        ))}
        <p className="mt-2 text-alert text-[9px] font-bold">{cardBack.alert}</p>
      </div>
    </div>
  )
}

export default function Hero({ webGLSupported }) {
  const reducedMotion = useReducedMotion()
  const show3D = webGLSupported && !reducedMotion
  const { hero } = siteCopy
  const [isLabOpen, setIsLabOpen] = useState(false)

  const fadeUp = {
    hidden:  { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <>
      <section
        id="hero"
        className="relative min-h-screen section-dark flex items-center overflow-hidden"
        aria-labelledby="hero-headline"
      >
        {/* Animated background ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-saffron/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-[450px] h-[450px] bg-teal/10 rounded-full blur-[140px]" />
        </div>

        {/* Subtle dot grid background */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #C8D8E4 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-12 items-center">

            {/* Left Column: Headlines & Action Hub */}
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              initial="hidden"
              animate="visible"
            >
              {/* Eyebrow with animated ECG pulse */}
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-ink3/80 border border-mist/20 text-xs font-mono backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-paper/90">ABDM M1–M3 Certified · Hospital OPD Ready</span>
                  </div>
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                id="hero-headline"
                className="font-display text-hero text-paper mb-6 max-w-xl font-extrabold tracking-tight"
                style={{ fontSize: 'clamp(2.3rem, 5.2vw, 4.4rem)', lineHeight: 1.08 }}
              >
                {hero.headline}
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="font-sans text-body text-paper/75 mb-8 max-w-lg leading-relaxed text-base sm:text-lg"
              >
                {hero.subhead}
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3.5 mb-10">
                <a
                  href="#journey"
                  className="inline-flex items-center gap-2 bg-saffron text-ink font-sans font-bold px-7 py-3.5 rounded-xl hover:bg-saffron-light transition-all text-sm sm:text-base shadow-xl shadow-saffron/20 hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Launch Patient Journey
                </a>

                <button
                  onClick={() => setIsLabOpen(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-teal/20 to-blue-500/20 border border-teal/40 hover:border-teal text-teal hover:text-white font-sans font-bold px-6 py-3.5 rounded-xl transition-all text-sm sm:text-base shadow-lg hover:bg-teal/30 group"
                >
                  <Terminal className="w-4 h-4 group-hover:animate-spin" />
                  ⚡ Test System Lab
                </button>
              </motion.div>

              {/* Real-Time Live Performance Metrics Grid */}
              <motion.div
                variants={fadeUp}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-paper/10"
              >
                {[
                  { val: "12 Indic", label: "Languages ASR/TTS", color: "text-cyan-400" },
                  { val: "< 4.5 min", label: "Average OPD Intake", color: "text-amber-400" },
                  { val: "100%", label: "Red-Flag Recall", color: "text-red-400" },
                  { val: "0.00 B", label: "DPDP §7 Data Kept", color: "text-emerald-400" },
                ].map((stat, i) => (
                  <div key={i} className="bg-paper/5 border border-paper/10 rounded-xl p-2.5">
                    <div className={`font-mono text-sm sm:text-base font-bold ${stat.color}`}>{stat.val}</div>
                    <div className="text-[10px] text-paper/60 leading-tight mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* Trust badges */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mt-6">
                {['ABDM M1-M3 Ready', 'HL7 FHIR R4', 'HL7 v2.5 MLLP', 'DPDP Act 2023', 'AYUSH Mode'].map(b => (
                  <span
                    key={b}
                    className="font-mono text-[11px] text-sage border border-sage/30 px-2.5 py-0.5 rounded-md bg-sage/5"
                  >
                    {b}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Column: Interactive 3D OPD Token & HUD Summary */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full h-[520px] lg:h-[560px] relative"
            >
              {show3D ? (
                <Suspense fallback={<StaticCardFallback />}>
                  <CardFlipScene />
                </Suspense>
              ) : (
                <StaticCardFallback />
              )}
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
            aria-hidden="true"
          >
            <span className="font-mono text-data text-paper/30 uppercase tracking-widest text-[10px]">Scroll to Explore</span>
            <div className="w-px h-6 bg-gradient-to-b from-paper/30 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Global Interactive System Test Lab Modal */}
      <InteractiveComponentTestPlayground
        isOpen={isLabOpen}
        onClose={() => setIsLabOpen(false)}
      />
    </>
  )
}

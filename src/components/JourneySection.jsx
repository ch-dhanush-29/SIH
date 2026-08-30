/**
 * JourneySection.jsx
 * 5-step patient journey — the one legitimately numbered sequence.
 * Includes both the visual milestone sequence rail AND the live interactive MediKiosk simulator.
 * Fully adapted for seamless Light ☀️ and Dark 🌙 themes.
 */
import React, { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { siteCopy } from '../content/copy.js'
import InteractivePatientJourney from './InteractivePatientJourney.jsx'
import { Play, Eye, Sparkles } from 'lucide-react'

function StepNode({ step, index, inView, total, isLight }) {
  const isLast = index === total - 1

  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.13 }}
      className="relative flex-1"
    >
      {/* Desktop: connector line between steps */}
      {!isLast && (
        <div
          className={`hidden md:block absolute top-7 left-[calc(50%+28px)] right-[-50%] h-px ${
            isLight ? 'bg-slate-300' : 'bg-slate-700'
          }`}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-col items-center md:items-start gap-3 md:pr-6">
        {/* Step number circle */}
        <div
          className={`w-14 h-14 rounded-2xl border-2 border-saffron flex items-center justify-center flex-shrink-0 shadow-md ${
            isLight ? 'bg-white' : 'bg-slate-900'
          }`}
          aria-hidden="true"
        >
          <span className="font-display text-xl font-bold text-saffron">
            {step.n}
          </span>
        </div>

        <div>
          <h3 className={`font-display text-lg font-bold mb-1 text-center md:text-left ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {step.title}
          </h3>
          <p className={`font-sans text-xs leading-relaxed text-center md:text-left ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {step.body}
          </p>
        </div>
      </div>
    </motion.li>
  )
}

export default function JourneySection({ theme = 'dark' }) {
  const isLight = theme === 'light'
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { journey } = siteCopy
  const [showSimulator, setShowSimulator] = useState(true)

  return (
    <section
      id="journey"
      className={`py-24 px-4 sm:px-6 lg:px-8 border-b transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
      }`}
      aria-labelledby="journey-headline"
    >
      <div className="max-w-6xl mx-auto space-y-12">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="font-mono text-xs text-saffron uppercase font-bold tracking-widest"
          >
            {journey.eyebrow}
          </motion.p>

          <button
            onClick={() => setShowSimulator(s => !s)}
            className={`inline-flex items-center gap-2 text-xs font-mono font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-saffron" />
            <span>{showSimulator ? 'Hide Interactive Engine' : 'Launch Interactive Patient Simulator'}</span>
          </button>
        </div>

        <div>
          <motion.h2
            id="journey-headline"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-3"
          >
            {journey.headline}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.15 }}
            className={`font-sans text-sm sm:text-base leading-relaxed max-w-2xl ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            {journey.subhead}
          </motion.p>
        </div>

        {/* 5-Step Architectural Journey Rail */}
        <ol
          ref={ref}
          className="flex flex-col md:flex-row gap-8 md:gap-4 list-none"
          aria-label="Patient journey steps"
        >
          {journey.steps.map((step, i) => (
            <StepNode
              key={step.n}
              step={step}
              index={i}
              inView={inView}
              total={journey.steps.length}
              isLight={isLight}
            />
          ))}
        </ol>

        {/* Live Interactive Patient Journey Simulator Component */}
        {showSimulator && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="pt-6"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`font-mono text-xs uppercase tracking-wider font-bold ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                ▶ Live Interactive Simulation (Walk through Steps 1 to 5)
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                End-to-End Clinical Verification
              </span>
            </div>

            <InteractivePatientJourney theme={theme} />
          </motion.div>
        )}

      </div>
    </section>
  )
}

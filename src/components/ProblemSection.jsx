/**
 * ProblemSection.jsx
 * Four pain points, left-right alternating layout.
 * Enhanced with an interactive animated "Chaotic OPD vs. MediKiosk AI" comparison simulator.
 * Fully adapted for Light ☀️ and Dark 🌙 themes.
 */
import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { siteCopy } from '../content/copy.js'
import { AlertCircle, Clock, Users, FileText, CheckCircle2, ArrowRight } from 'lucide-react'

const ICONS = ['📄', '⏱', '🧑‍🦳', '🌐']

function PainCard({ point, index, inView, isLight }) {
  const even = index % 2 === 0
  return (
    <motion.article
      initial={{ opacity: 0, x: even ? -24 : 24 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      className={`flex gap-6 items-start py-8 border-b last:border-b-0 ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}
    >
      {/* Icon + index number */}
      <div className="flex-shrink-0 w-12 text-center">
        <span className="text-3xl" aria-hidden="true">{ICONS[index]}</span>
      </div>

      <div className="flex-1">
        <h3 className={`font-display text-xl font-bold mb-2 ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          {point.title}
        </h3>
        <p className={`font-sans text-sm leading-relaxed ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          {point.body}
        </p>
      </div>
    </motion.article>
  )
}

export default function ProblemSection({ theme = 'dark' }) {
  const isLight = theme === 'light'
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { problem } = siteCopy
  const [comparisonMode, setComparisonMode] = useState('medikiosk') // 'chaotic' | 'medikiosk'

  return (
    <section
      id="problem"
      className={`py-24 px-4 sm:px-6 lg:px-8 border-b transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-white'
      }`}
      aria-labelledby="problem-headline"
    >
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Section Header */}
        <div className="space-y-3">
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="font-mono text-xs text-saffron uppercase font-bold tracking-widest"
          >
            {problem.eyebrow}
          </motion.p>

          <motion.h2
            id="problem-headline"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight"
          >
            {problem.headline}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`font-sans text-sm sm:text-base leading-relaxed max-w-2xl ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            {problem.subhead}
          </motion.p>
        </div>

        {/* Interactive Before-vs-After OPD Comparison Simulator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7 }}
          className={`rounded-3xl p-6 sm:p-8 border shadow-xl transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-950 border-slate-800 shadow-2xl'
          }`}
        >
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-5 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-saffron">
                Interactive OPD Workflow Simulation
              </div>
              <h3 className={`text-xl font-bold font-display mt-0.5 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                The Indian OPD Reality vs. The MediKiosk Solution
              </h3>
            </div>

            {/* Mode Switcher Buttons */}
            <div className={`flex items-center p-1 rounded-xl border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <button
                onClick={() => setComparisonMode('chaotic')}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  comparisonMode === 'chaotic'
                    ? 'bg-red-500 text-white shadow-md'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔴 Legacy Manual OPD
              </button>
              <button
                onClick={() => setComparisonMode('medikiosk')}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  comparisonMode === 'medikiosk'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🟢 MediKiosk AI
              </button>
            </div>
          </div>

          {/* Dynamic Content Swap */}
          <AnimatePresence mode="wait">
            {comparisonMode === 'chaotic' ? (
              <motion.div
                key="chaotic"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-red-50/80 border-red-200 text-red-950' : 'bg-red-950/20 border-red-500/30 text-red-300'
                }`}>
                  <div className="font-bold font-mono text-xs uppercase mb-1">Bottleneck 1: 45–90 Min Waiting Queue</div>
                  <p className="text-xs leading-relaxed">
                    Patients stand in unorganized queues without pre-triage. Emergencies (ACS, Sepsis) wait behind routine cold cases.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-red-50/80 border-red-200 text-red-950' : 'bg-red-950/20 border-red-500/30 text-red-300'
                }`}>
                  <div className="font-bold font-mono text-xs uppercase mb-1">Bottleneck 2: 90-Second Doctor Consult</div>
                  <p className="text-xs leading-relaxed">
                    Doctors must manually decipher torn handwritten prescriptions, take anamnestic history in noisy OPDs, and write paper chits.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="medikiosk"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                }`}>
                  <div className="font-bold font-mono text-xs uppercase mb-1 text-emerald-600 dark:text-emerald-400">
                    Solution 1: 2-Minute Autonomous Self-Intake
                  </div>
                  <p className="text-xs leading-relaxed">
                    Multilingual voice intake in 12 Indian languages, 4K camera prescription OCR, and automatic SpO2/NIBP vitals capture.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                }`}>
                  <div className="font-bold font-mono text-xs uppercase mb-1 text-emerald-600 dark:text-emerald-400">
                    Solution 2: Instant Room 104 Doctor Sync & 100% Emergency Recall
                  </div>
                  <p className="text-xs leading-relaxed">
                    Physician receives a structured bilingual summary with red flags highlighted and 1-click ABDM FHIR R4 sync.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 4 Pain Cards List */}
        <div ref={ref}>
          {problem.points.map((point, i) => (
            <PainCard key={point.title} point={point} index={i} inView={inView} isLight={isLight} />
          ))}
        </div>

      </div>
    </section>
  )
}

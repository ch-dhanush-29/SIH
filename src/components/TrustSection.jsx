/**
 * TrustSection.jsx
 * Standards & compliance — aimed at hospital administrators
 * and procurement reviewers. Fully responsive to Light and Dark themes.
 */
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { siteCopy } from '../content/copy.js'
import { ShieldCheck, CheckCircle2, Award, FileCheck } from 'lucide-react'

const STANDARD_COLORS = ['#E8930A', '#4A7C6F', '#0284C7', '#7C3AED']

function TrustCard({ item, index, inView, isLight }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`rounded-2xl p-7 border transition-all ${
        isLight 
          ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-sm hover:border-slate-300' 
          : 'bg-slate-900/80 border-slate-800 text-white hover:border-slate-700'
      }`}
      aria-labelledby={`trust-${index}-title`}
    >
      <span
        className="font-mono text-xs uppercase tracking-widest px-2.5 py-1 rounded-lg mb-4 inline-block text-slate-950 font-bold"
        style={{ backgroundColor: STANDARD_COLORS[index] }}
      >
        {item.badge}
      </span>

      <h3
        id={`trust-${index}-title`}
        className="font-display text-xl font-bold mb-2.5"
      >
        {item.title}
      </h3>

      <p className={`font-sans text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
        {item.body}
      </p>
    </motion.article>
  )
}

export default function TrustSection({ theme = 'dark' }) {
  const isLight = theme === 'light'
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { trust } = siteCopy

  return (
    <section
      id="trust"
      className={`py-24 px-4 sm:px-6 lg:px-8 border-b transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
      }`}
      aria-labelledby="trust-headline"
    >
      <div className="max-w-6xl mx-auto space-y-12">

        <div className="text-center max-w-3xl mx-auto space-y-3">
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="font-mono text-xs text-saffron uppercase font-bold tracking-widest"
          >
            {trust.eyebrow}
          </motion.p>

          <motion.h2
            id="trust-headline"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight"
          >
            {trust.headline}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.15 }}
            className={`font-sans text-sm sm:text-base leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            {trust.subhead}
          </motion.p>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {trust.items.map((item, i) => (
            <TrustCard key={item.title} item={item} index={i} inView={inView} isLight={isLight} />
          ))}
        </div>

        {/* ABDM milestone track */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className={`border-t pt-10 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}
        >
          <p className="font-mono text-xs text-saffron uppercase font-bold tracking-widest mb-6 text-center sm:text-left">
            ABDM Milestone Sequence (M1 · M2 · M3)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { m: 'M1', label: 'ABHA & Scan-and-Share', desc: 'Identity verification & QR token issuance' },
              { m: 'M2', label: 'Care Context Linking',  desc: 'Longitudinal record discovery & linking' },
              { m: 'M3', label: 'Consent Data Exchange', desc: 'FHIR R4 Diagnostic bundle transfer' },
            ].map((ms) => (
              <div
                key={ms.m}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-saffron/20 border border-saffron flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-xs font-bold text-saffron">{ms.m}</span>
                </div>
                <div>
                  <p className="font-sans font-bold text-sm">{ms.label}</p>
                  <p className={`font-mono text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{ms.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}

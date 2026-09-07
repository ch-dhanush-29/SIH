/**
 * CTASection.jsx
 * Plain-language call to action with asymmetric rhythm and theme compatibility.
 */
import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { siteCopy } from '../content/copy.js'
import { ArrowRight, Mail, BookOpen, ShieldCheck } from 'lucide-react'

export default function CTASection({ theme = 'dark' }) {
  const isLight = theme === 'light'
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { cta } = siteCopy

  return (
    <section
      id="cta"
      className={`py-24 px-4 sm:px-6 lg:px-8 border-b transition-colors relative overflow-hidden ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
      }`}
      aria-labelledby="cta-headline"
    >
      <div ref={ref} className="max-w-4xl mx-auto text-center space-y-8 relative z-10">

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          className={`inline-flex items-center gap-2 border px-4 py-1.5 rounded-full text-xs font-mono font-bold ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-900 border-slate-800 text-saffron'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-saffron" />
          <span>{cta.eyebrow}</span>
        </motion.div>

        <motion.h2
          id="cta-headline"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight"
        >
          {cta.headline}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.15 }}
          className={`font-sans text-base sm:text-lg leading-relaxed max-w-2xl mx-auto ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          {cta.body}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.22 }}
          className={`font-sans text-xs sm:text-sm leading-relaxed max-w-xl mx-auto ${
            isLight ? 'text-slate-500' : 'text-slate-500'
          }`}
        >
          {cta.subBody}
        </motion.p>

        {/* Asymmetric Interactive Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3.5 justify-center pt-4"
        >
          <a
            href={cta.ctaHref}
            className="inline-flex items-center justify-center gap-2.5 bg-saffron hover:bg-saffron-light text-slate-950 font-display font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-saffron/20 text-sm hover:scale-[1.02]"
            aria-label="Request a pilot demo via email"
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            <span>{cta.cta}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
          <a
            href="?view=pilot"
            className={`inline-flex items-center justify-center gap-2 border font-sans font-semibold px-7 py-4 rounded-2xl transition-all text-sm ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            aria-label="Open Hospital Pilot & Hardware Hub"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span>Open Pilot & Hardware Hub</span>
          </a>
        </motion.div>

        {/* Trust note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.45 }}
          className="flex items-center justify-center gap-2 pt-6 text-xs font-mono text-slate-500"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          <span>Shadow mode pilot · Zero HIS writes without explicit physician confirmation</span>
        </motion.div>

      </div>
    </section>
  )
}

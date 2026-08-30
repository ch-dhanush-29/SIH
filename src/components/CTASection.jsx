/**
 * CTASection.jsx
 * Light (paper) section. Plain-language call to action. No marketing buzzwords.
 */
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { siteCopy } from '../content/copy.js'

export default function CTASection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { cta } = siteCopy

  return (
    <section
      id="cta"
      className="section-light paper-texture"
      aria-labelledby="cta-headline"
    >
      <div ref={ref} className="max-w-3xl mx-auto px-6 py-24 text-center">

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          className="font-mono text-data text-saffron uppercase tracking-widest mb-5"
        >
          {cta.eyebrow}
        </motion.p>

        <motion.h2
          id="cta-headline"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-display text-section text-ink mb-6"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.625rem)' }}
        >
          {cta.headline}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.15 }}
          className="font-sans text-body text-ink/70 mb-5 leading-relaxed"
        >
          {cta.body}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.22 }}
          className="font-sans text-sm text-ink/55 mb-10 leading-relaxed"
        >
          {cta.subBody}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href={cta.ctaHref}
            className="inline-flex items-center justify-center gap-2 bg-saffron text-ink font-sans font-semibold px-8 py-4 rounded-sm hover:bg-saffron-light transition-colors text-base shadow-sm"
          >
            {cta.cta}
          </a>
          <a
            href={cta.secondaryHref}
            className="inline-flex items-center justify-center gap-2 border border-ink/25 text-ink/75 font-sans px-8 py-4 rounded-sm hover:border-ink/50 hover:text-ink transition-colors text-base"
          >
            {cta.secondary}
          </a>
        </motion.div>

        {/* Trust note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.45 }}
          className="font-mono text-data text-ink/35 mt-10"
        >
          Shadow mode pilot · No patient data without full DPDP consent
        </motion.p>

      </div>
    </section>
  )
}

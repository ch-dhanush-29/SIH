/**
 * SectionNavDock.jsx
 * Elegant, unobtrusive floating side-dock navigation showing the user's active viewing
 * position across all key sections: The Problem, How It Works, Patient Journey, and Standards.
 */
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileQuestion, Cpu, Route, Mic, Network, Server, ShieldCheck, Award, ChevronUp } from 'lucide-react'

const SECTIONS = [
  { id: 'problem', label: 'The Problem', short: 'Problem', icon: FileQuestion },
  { id: 'modules', label: 'How It Works (Modules A-D)', short: 'Modules', icon: Cpu },
  { id: 'journey', label: 'Patient Journey (5 Steps)', short: 'Journey', icon: Route },
  { id: 'speech-ai', label: 'Speech, Voice & Document AI', short: 'Speech/OCR', icon: Mic },
  { id: 'his-integration', label: 'HIS / EMR Integration', short: 'HIS/EMR', icon: Network },
  { id: 'hardware-services', label: 'Kiosk Hardware & Drivers', short: 'Hardware', icon: Server },
  { id: 'security-compliance', label: 'Security & DPDP Compliance', short: 'Security', icon: ShieldCheck },
  { id: 'trust', label: 'Standards & Trust', short: 'Standards', icon: Award },
]

export default function SectionNavDock() {
  const [activeSection, setActiveSection] = useState('')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight
      const currentProgress = (window.scrollY / totalScroll) * 100
      setScrollProgress(currentProgress)
      setVisible(window.scrollY > 280)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const elements = SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-30% 0px -40% 0px',
        threshold: 0.1,
      }
    )

    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  if (!visible) return null

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-end gap-3 pointer-events-auto"
      aria-label="Section quick navigator"
    >
      <div className="bg-ink/90 backdrop-blur-md border border-mist/20 rounded-2xl p-2 shadow-2xl flex flex-col gap-2">
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id
          const Icon = sec.icon

          return (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              title={sec.label}
              className={[
                'group relative flex items-center justify-end p-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-saffron text-ink font-bold shadow-lg scale-105'
                  : 'text-mist/50 hover:text-paper hover:bg-mist/10'
              ].join(' ')}
            >
              {/* Tooltip on hover */}
              <span className={[
                'absolute right-12 px-3 py-1 rounded-md text-xs font-mono whitespace-nowrap pointer-events-none transition-all shadow-md',
                isActive
                  ? 'bg-saffron text-ink font-bold opacity-100 translate-x-0'
                  : 'bg-ink border border-mist/20 text-paper opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
              ].join(' ')}>
                {sec.label}
              </span>

              <Icon className="w-4 h-4" />
            </a>
          )
        })}

        {/* Scroll to Top */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Back to Top"
          className="p-2.5 rounded-xl text-mist/40 hover:text-saffron hover:bg-mist/10 transition-colors mt-1 border-t border-mist/10"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Progress pill */}
      <div className="w-1.5 h-16 bg-mist/10 rounded-full overflow-hidden mr-3">
        <div
          className="w-full bg-saffron transition-all duration-150"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>
    </motion.aside>
  )
}

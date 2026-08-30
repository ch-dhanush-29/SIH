/**
 * App.jsx
 * MediKiosk Multi-View Platform.
 * Features a single, unified top header with:
 *   - 4 Independent Application Page Modes ("overview", "kiosk", "doctor", "pilot")
 *   - Light Theme ☀️ and Dark Theme 🌙 Switcher
 *   - Zero Overlapping Navigation Bar
 */
import React, { useState, useEffect } from 'react'
import Lenis from 'lenis'

import { useWebGLSupport } from './hooks/useWebGLSupport.js'
import Navbar from './components/Navbar.jsx'
import MainShowcaseView from './components/views/MainShowcaseView.jsx'
import PatientKioskView from './components/views/PatientKioskView.jsx'
import DoctorDashboardView from './components/views/DoctorDashboardView.jsx'
import PilotDeploymentView from './components/views/PilotDeploymentView.jsx'

export default function App() {
  const webGLSupported = useWebGLSupport()

  // Theme Management (Default: 'dark', persistent in localStorage)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('medikiosk_theme')
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme
      }
    }
    return 'dark'
  })

  // Synchronize documentElement class with theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      if (theme === 'light') {
        root.classList.add('light')
        root.classList.remove('dark')
      } else {
        root.classList.add('dark')
        root.classList.remove('light')
      }
      localStorage.setItem('medikiosk_theme', theme)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Read initial view from URL query param or hash, defaulting to "overview"
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const qView = params.get('view')
      if (qView && ['overview', 'kiosk', 'doctor', 'pilot'].includes(qView)) {
        return qView
      }
      const hash = window.location.hash.replace('#', '')
      if (hash && ['overview', 'kiosk', 'doctor', 'pilot'].includes(hash)) {
        return hash
      }
    }
    return 'overview'
  })

  // Synchronize view state with browser URL
  const handleViewChange = (newView) => {
    setActiveView(newView)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('view', newView)
      window.history.pushState({}, '', url.toString())
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Handle browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search)
      const qView = params.get('view')
      if (qView && ['overview', 'kiosk', 'doctor', 'pilot'].includes(qView)) {
        setActiveView(qView)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Initialise Lenis smooth scroll for the main overview page
  useEffect(() => {
    if (activeView !== 'overview') return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => lenis.destroy()
  }, [activeView])

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-paper'
    }`}>
      {/* Single Unified Top Navigation Header (Zero Overlap + Theme Toggle) */}
      <Navbar
        activeView={activeView}
        onViewChange={handleViewChange}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Render the Active Page View */}
      {activeView === 'overview' && (
        <MainShowcaseView webGLSupported={webGLSupported} theme={theme} />
      )}

      {activeView === 'kiosk' && (
        <PatientKioskView theme={theme} />
      )}

      {activeView === 'doctor' && (
        <DoctorDashboardView theme={theme} />
      )}

      {activeView === 'pilot' && (
        <PilotDeploymentView theme={theme} />
      )}
    </div>
  )
}

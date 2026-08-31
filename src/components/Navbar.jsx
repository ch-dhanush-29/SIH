/**
 * Navbar.jsx
 * Unified Universal Application Navigation Header.
 * Combines:
 *   1. MediKiosk Enterprise Brand Identity
 *   2. 4 Primary Page Mode Selectors (Same-Tab Switch + New-Tab ↗ Launchers):
 *        - "overview": Architecture & Full Showcase
 *        - "kiosk": Autonomous Patient Kiosk Terminal
 *        - "doctor": Physician OPD Consultation Dashboard
 *        - "pilot": Hospital Pilot Operations & Hardware Hub
 *   3. Section ScrollSpy sub-navigation when in Overview mode
 *   4. Zero overlapping / zero collision layout
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, ExternalLink, Home, User, Stethoscope, 
  Rocket, Menu, X, CheckCircle2, ShieldCheck, Compass, Sun, Moon
} from 'lucide-react';
import { siteCopy } from '../content/copy.js';

export const APP_PAGES = [
  {
    id: 'overview',
    name: 'Overview & Architecture',
    shortName: 'Overview',
    icon: Home,
    badge: 'Presentation',
    description: 'Complete architecture showcase with 3D models, Modules A-D, Speech AI, and Security.'
  },
  {
    id: 'kiosk',
    name: 'Patient Kiosk Terminal',
    shortName: 'Patient Kiosk',
    icon: User,
    badge: 'Terminal',
    description: 'Self-service touchscreen & voice intake for patients with token printing.'
  },
  {
    id: 'doctor',
    name: 'Doctor OPD Consultation Room',
    shortName: 'Doctor Dashboard',
    icon: Stethoscope,
    badge: 'OPD Room 104',
    description: 'Attending physician dashboard with live queue, summary review, and DPDP sign-off.'
  },
  {
    id: 'pilot',
    name: 'Pilot & Fleet Operations',
    shortName: 'Pilot Hub',
    icon: Rocket,
    badge: 'Control Hub',
    description: 'Multi-kiosk telemetry, hardware supervisor, and 8-scenario system test lab.'
  }
];

export default function Navbar({ activeView = 'overview', onViewChange, theme = 'dark', onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const { nav } = siteCopy;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fast, accurate ScrollSpy for in-page sections when in overview mode
  useEffect(() => {
    if (activeView !== 'overview') return;

    const sectionIds = ['problem', 'modules', 'journey', 'speech-ai', 'his-integration', 'hardware-services', 'security-compliance', 'trust', 'cta'];

    const handleScrollSpy = () => {
      const scrollPos = window.scrollY + 160;
      let currentSection = sectionIds[0];

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            currentSection = id;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    handleScrollSpy();
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [activeView]);

  function handleOpenNewTab(e, viewId) {
    e.stopPropagation();
    const url = new URL(window.location.href);
    url.searchParams.set('view', viewId);
    window.open(url.toString(), '_blank');
  }

  function handleSwitchView(viewId) {
    if (onViewChange) {
      onViewChange(viewId);
    }
    setMobileMenuOpen(false);
  }

  function handleNavClick(e, href) {
    e.preventDefault();
    const targetId = href.replace('#', '');
    setActiveSection(targetId);
    if (activeView !== 'overview') {
      handleSwitchView('overview');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } else {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  const isLight = theme === 'light';

  return (
    <header className={`sticky top-0 left-0 right-0 z-50 transition-colors duration-300 ${
      isLight
        ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-md text-slate-800'
        : 'bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-2xl text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <button
          onClick={() => handleSwitchView('overview')}
          className="flex items-center gap-2.5 group text-left focus:outline-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-saffron/40 flex items-center justify-center group-hover:scale-105 transition-all shadow-md shadow-saffron/15 bg-slate-900 shrink-0">
            <img src="/medikiosk-logo.png" alt="MediKiosk Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className={`font-display text-base font-bold tracking-tight flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span><span className="text-saffron">Medi</span>Kiosk</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full">
                ABDM CERTIFIED
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Autonomous Clinical Intake Platform
            </p>
          </div>
        </button>

        {/* Center: 4 Dedicated Page View Navigators (Desktop) */}
        <nav className={`hidden lg:flex items-center gap-1.5 p-1 rounded-2xl shadow-inner border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/90 border-slate-800/80'
        }`} aria-label="Application views">
          {APP_PAGES.map((page) => {
            const isCur = activeView === page.id;
            const Icon = page.icon;

            return (
              <div key={page.id} className="relative flex items-center">
                {/* Same Tab Page Switcher */}
                <button
                  onClick={() => handleSwitchView(page.id)}
                  title={page.description}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs font-mono border ${
                    isCur
                      ? 'bg-saffron text-slate-950 border-saffron shadow-md shadow-saffron/20'
                      : isLight
                      ? 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{page.shortName}</span>
                </button>

                {/* Separate Tab ↗ Launcher */}
                <button
                  onClick={(e) => handleOpenNewTab(e, page.id)}
                  title={`Open ${page.name} in a separate new browser tab / window`}
                  className={`p-1 rounded-md transition-colors ml-0.5 ${
                    isLight ? 'text-slate-400 hover:text-saffron hover:bg-slate-200' : 'text-slate-500 hover:text-saffron hover:bg-slate-800'
                  }`}
                  aria-label={`Open ${page.name} in new tab`}
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </nav>

        {/* Right: Quick Actions & Theme Switcher */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Theme Toggle Button (Light/Dark) */}
          <button
            onClick={onToggleTheme}
            title={isLight ? 'Switch to Dark Mode (Clinical Ink)' : 'Switch to Light Mode (Hospital Clean)'}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:border-slate-400'
                : 'bg-slate-900 border-slate-800 text-amber-300 hover:border-amber-400/50 hover:bg-slate-800'
            }`}
          >
            {isLight ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span className="font-bold">{isLight ? 'Dark' : 'Light'}</span>
          </button>

          <button
            onClick={() => handleSwitchView('kiosk')}
            className={`text-xs font-mono px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 border ${
              activeView === 'kiosk'
                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-400'
                : isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Kiosk</span>
          </button>

          <button
            onClick={() => handleSwitchView('doctor')}
            className={`text-xs font-mono px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 border ${
              activeView === 'doctor'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-400'
                : isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
            <span>Room 104</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border text-xs font-mono transition-all ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-800 text-amber-300'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            className={`p-2 rounded-xl border ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Overview Sub-Navbar: In-Page Section ScrollSpy (Only shown when activeView === 'overview') */}
      {activeView === 'overview' && (
        <div className={`border-t px-4 py-1.5 overflow-x-auto transition-colors ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/90 border-slate-800'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-[11px] font-mono">
            <span className={`font-bold uppercase shrink-0 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>Showcase Sections:</span>
            <div className="flex items-center gap-1.5">
              {[
                { href: '#problem', label: 'The OPD Crisis' },
                { href: '#modules', label: 'Modules A-D' },
                { href: '#journey', label: 'Patient Journey' },
                { href: '#speech-ai', label: 'Speech & OCR AI' },
                { href: '#his-integration', label: 'HIS & FHIR' },
                { href: '#hardware-services', label: 'Kiosk Hardware' },
                { href: '#security-compliance', label: 'DPDP Security' },
                { href: '#trust', label: 'ABDM Standards' },
              ].map((link) => {
                const targetId = link.href.replace('#', '');
                const isActive = activeSection === targetId;

                return (
                  <button
                    key={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`px-2.5 py-1 rounded-lg transition-all shrink-0 border cursor-pointer ${
                      isActive
                        ? 'bg-saffron text-slate-950 border-saffron font-bold shadow-sm'
                        : isLight
                        ? 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-slate-950 border-t border-slate-800 px-6 py-5 space-y-4"
          >
            <div className="space-y-2">
              <div className="text-xs font-mono text-saffron uppercase font-bold">Select Application Page:</div>
              <div className="grid grid-cols-1 gap-2">
                {APP_PAGES.map((page) => {
                  const isCur = activeView === page.id;
                  const Icon = page.icon;

                  return (
                    <div key={page.id} className="flex items-center gap-2">
                      <button
                        onClick={() => handleSwitchView(page.id)}
                        className={`flex-1 p-3 rounded-xl border text-left font-mono text-xs transition-all flex items-center justify-between ${
                          isCur
                            ? 'bg-saffron text-slate-950 font-bold border-saffron'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{page.name}</span>
                        </span>
                        <span className="text-[10px] opacity-75">{page.badge}</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenNewTab(e, page.id)}
                        title="Open in new tab"
                        className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-saffron"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

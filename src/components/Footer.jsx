/**
 * Footer.jsx
 * Professional, fully accessible footer with theme support and rich metadata.
 */
import React from 'react'
import { siteCopy } from '../content/copy.js'
import { ExternalLink, ShieldCheck, Heart } from 'lucide-react'

export default function Footer({ theme = 'dark' }) {
  const { footer } = siteCopy
  const isLight = theme === 'light'

  return (
    <footer 
      className={`border-t transition-colors duration-200 ${
        isLight ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800/80 text-white'
      }`} 
      role="contentinfo"
      aria-label="Site Footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col md:flex-row md:items-start gap-10 justify-between mb-12">

          {/* Brand Column */}
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-saffron to-amber-400 flex items-center justify-center font-display font-extrabold text-slate-950 text-sm shadow-md">
                M
              </div>
              <p className="font-display text-2xl font-bold tracking-tight">
                <span className="text-saffron">Medi</span>Kiosk
              </p>
            </div>
            <p className={`font-sans text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {footer.tagline}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>DPDP 2023 · FHIR R4</span>
              </span>
            </div>
          </div>

          {/* External Reference Links */}
          <nav aria-label="Official Sandbox and Standards Links">
            <p className={`font-mono text-xs uppercase tracking-widest mb-4 font-bold ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              National Health Standards & Sandboxes
            </p>
            <ul className="flex flex-col gap-2.5 list-none">
              {footer.links.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-sans text-sm inline-flex items-center gap-1.5 transition-colors group ${
                      isLight 
                        ? 'text-slate-700 hover:text-saffron-dark' 
                        : 'text-slate-300 hover:text-saffron'
                    }`}
                    aria-label={`${link.label} (opens in new tab)`}
                  >
                    <span className="group-hover:underline underline-offset-4">{link.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Legal & Compliance Metadata Bar */}
        <div className={`border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono ${
          isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800/80 text-slate-500'
        }`}>
          <p className="max-w-2xl text-center sm:text-left leading-relaxed">
            {footer.legal}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span>Built with precision for Indian OPDs</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" aria-hidden="true" />
          </div>
        </div>
      </div>
    </footer>
  )
}

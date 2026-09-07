import React from 'react'

/**
 * Watermark.jsx
 * Persistent fixed-position brand watermark (~12% opacity, bottom-right corner).
 * Non-interactive with pointer-events: none so it never obstructs or intercepts clicks.
 */
export default function Watermark({ theme = 'dark' }) {
  const isLight = theme === 'light'

  return (
    <div
      aria-hidden="true"
      className="fixed bottom-3 right-4 z-40 pointer-events-none select-none flex items-center gap-2.5 transition-opacity duration-300"
      style={{ opacity: isLight ? 0.14 : 0.12 }}
    >
      {/* Mini Brand Emblem */}
      <div className="w-5 h-5 rounded-md border border-current flex items-center justify-center font-display font-extrabold text-[11px] leading-none">
        M
      </div>

      <div className="flex flex-col text-right">
        <span className="font-display font-bold text-xs tracking-wider uppercase">
          MediKiosk™
        </span>
        <span className="font-mono text-[9px] tracking-widest uppercase">
          ABDM · FHIR R4 · DPDP 2023
        </span>
      </div>
    </div>
  )
}

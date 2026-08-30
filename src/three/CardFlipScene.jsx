/**
 * CardFlipScene.jsx
 *
 * THE signature 3D visual moment on MediKiosk.
 * Fully theme-responsive (☀️ Light Mode & 🌙 Dark Mode):
 *  - Front Face: Authentic Indian Hospital OPD Paper Token.
 *  - Back Face (Light Mode): Crisp Hospital Clinical EMR Summary HUD (White/Pearl, emerald accents, dark typography).
 *  - Back Face (Dark Mode): Glowing Cyber-Medical HUD (Deep navy, neon ECG pulse, holographic ABHA card).
 *  - 3D Interactive Gyroscopic/Mouse Tilt + Smooth 180° Flip Animation.
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, ShieldCheck, AlertTriangle, ArrowRight, RotateCw,
  FileText, CheckCircle2, Stethoscope, Sparkles
} from 'lucide-react'

export default function CardFlipScene({ theme = 'dark' }) {
  const isLight = theme === 'light'
  const [flipped, setFlipped] = useState(false)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const cardRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setFlipped(true), 2200)
    return () => clearTimeout(timer)
  }, [])

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setRotateX(-y * 0.04)
    setRotateY(x * 0.04)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <div
      className="relative w-full h-[520px] lg:h-[560px] flex items-center justify-center select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1200 }}
    >
      {/* Top Floating Badge */}
      <div className={`absolute top-2 left-4 z-20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-mono shadow-xl flex items-center gap-2 border transition-colors ${
        isLight ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-slate-900/90 border-slate-700 text-white'
      }`}>
        <span className={['w-2 h-2 rounded-full', flipped ? 'bg-emerald-500' : 'bg-saffron'].join(' ')} />
        <span>{flipped ? 'Output: FHIR R4 Structured Summary' : 'Input: Handwritten Paper Token'}</span>
      </div>

      {/* Flip Toggle Button */}
      <div className="absolute bottom-2 right-4 z-20">
        <button
          onClick={() => setFlipped(f => !f)}
          className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full text-xs font-mono font-bold shadow-2xl backdrop-blur-md transition-all scale-100 hover:scale-105 active:scale-95 ${
            isLight
              ? 'bg-white border-saffron text-amber-800 hover:bg-saffron hover:text-slate-950'
              : 'bg-slate-900 border-saffron/60 text-saffron hover:bg-saffron hover:text-slate-950'
          }`}
          aria-label={flipped ? 'Show paper prescription record' : 'Show structured clinical summary'}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{flipped ? '↺ View OPD Paper Record' : '↻ View AI Structured Record'}</span>
        </button>
      </div>

      {/* 3D Flipping Card Container */}
      <motion.div
        ref={cardRef}
        animate={{
          rotateY: flipped ? 180 : 0,
          rotateX: rotateX,
          rotateZ: rotateY * 0.2,
        }}
        transition={{
          rotateY: { duration: 0.85, ease: [0.34, 1.56, 0.64, 1] },
          rotateX: { duration: 0.15, ease: 'linear' },
          rotateZ: { duration: 0.15, ease: 'linear' },
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-[340px] sm:w-[380px] h-[490px] sm:h-[520px] relative cursor-pointer"
        onClick={() => setFlipped(f => !f)}
      >
        {/* ========================================================= */}
        {/* FRONT FACE: AUTHENTIC INDIAN OPD PAPER RECORD */}
        {/* ========================================================= */}
        <div
          style={{ backfaceVisibility: 'hidden' }}
          className="absolute inset-0 bg-[#F4EFE6] text-slate-900 rounded-xl border-2 border-[#D4C8B5] shadow-2xl p-5 flex flex-col justify-between overflow-hidden"
        >
          {/* Subtle paper grain */}
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#C4B59D_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Top Tricolor Strip */}
          <div className="absolute top-0 inset-x-0 h-2.5 flex">
            <div className="flex-1 bg-[#E8930A]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#4A7C6F]" />
          </div>

          {/* Hospital Header */}
          <div className="relative z-10 text-center border-b border-slate-400/40 pb-2 mt-1">
            <h3 className="font-display text-sm font-bold tracking-tight text-slate-900 uppercase">
              District General Hospital & Medical College
            </h3>
            <p className="font-sans text-[11px] text-[#4A7C6F] font-semibold">
              जिला सामान्य अस्पताल · OPD Outpatient Record
            </p>
          </div>

          {/* Token Number Box & Barcode */}
          <div className="relative z-10 flex items-center justify-between gap-3 bg-white/80 border border-slate-300 p-2.5 rounded-lg shadow-sm">
            <div className="border-l-4 border-red-600 pl-2">
              <span className="font-mono text-[10px] text-red-600 font-bold uppercase block tracking-wider">
                OPD Token No.
              </span>
              <span className="font-mono text-xl font-extrabold text-slate-900 tracking-tight">
                #OPD-087
              </span>
            </div>
            <div className="text-right font-mono text-[10px] text-slate-600">
              <div>Date: 12-Oct-2024</div>
              <div>Room: 104 (Medicine)</div>
            </div>
          </div>

          {/* Patient Details Row */}
          <div className="relative z-10 grid grid-cols-2 gap-2 text-xs font-sans bg-white/50 p-2 rounded border border-slate-300">
            <div>
              <span className="text-slate-500 font-mono text-[10px] uppercase block">Patient Name:</span>
              <span className="font-bold text-slate-900">Rameshwar Prasad</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] uppercase block">Age / Gender:</span>
              <span className="font-bold text-slate-900">58 Yrs / Male</span>
            </div>
          </div>

          {/* Doctor Handwritten Scrawl Simulation */}
          <div className="relative z-10 bg-amber-50/60 border border-dashed border-amber-300 rounded p-2.5 space-y-1 font-serif">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Physician Clinical Notes:</div>
            <p className="text-xs italic text-slate-800 leading-snug">
              "C/o severe crushing chest pain 3 days, radiating to L arm. Sweating+. H/o T2DM/HTN."
            </p>
            <div className="text-[11px] text-slate-700 pt-1 border-t border-amber-200 flex justify-between font-mono">
              <span>Rx: Tab Metformin 500mg, Telmisartan 40mg</span>
              <span className="text-red-700 font-bold">ECG Stat!</span>
            </div>
          </div>

          {/* Footer Stamped Signature */}
          <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-600 pt-1 border-t border-slate-300">
            <span>ABHA: Not Linked (Paper)</span>
            <span className="border border-indigo-500 text-indigo-700 px-1.5 py-0.5 rounded rotate-[-3deg] font-bold">
              VERIFIED OPD
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BACK FACE: STRUCTURED CLINICAL SUMMARY (THEME ADAPTIVE) */}
        {/* ========================================================= */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className={`absolute inset-0 rounded-xl border-2 shadow-2xl p-5 flex flex-col justify-between overflow-hidden transition-colors ${
            isLight
              ? 'bg-white text-slate-900 border-slate-300'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {/* Top Status Header */}
          <div className={`relative z-10 flex items-center justify-between border-b pb-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full">
                ✓ FHIR R4 VALIDATED
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">ABDM M1–M3</span>
          </div>

          {/* ABHA Profile Banner */}
          <div className={`relative z-10 p-2.5 rounded-lg border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <div className="font-bold text-sm">Rameshwar Prasad (58M)</div>
              <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">ABHA: SIM-91-2001-0000-0001</div>
            </div>
            <div className="text-right font-mono text-xs font-bold text-red-500">
              🚨 ACS Suspected
            </div>
          </div>

          {/* SOCRATES Breakdown */}
          <div className={`relative z-10 p-2.5 rounded-lg border space-y-1 text-xs font-mono ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="text-amber-600 dark:text-amber-400 font-bold uppercase text-[10px]">SOCRATES Clinical Parameters:</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
              <div><span className="text-slate-500">Site:</span> Substernal</div>
              <div><span className="text-slate-500">Onset:</span> 3 days ago</div>
              <div><span className="text-slate-500">Radiation:</span> Left Arm</div>
              <div><span className="text-slate-500">Severity:</span> 8/10 (Severe)</div>
            </div>
          </div>

          {/* Vitals Telemetry Box */}
          <div className="relative z-10 grid grid-cols-4 gap-1.5 text-center font-mono">
            <div className={`p-1.5 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-[9px] text-slate-500">SpO2</div>
              <div className="text-cyan-600 dark:text-cyan-400 font-bold text-xs">97%</div>
            </div>
            <div className={`p-1.5 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-[9px] text-slate-500">Pulse</div>
              <div className="text-red-500 font-bold text-xs">78 bpm</div>
            </div>
            <div className={`p-1.5 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-[9px] text-slate-500">BP</div>
              <div className="text-amber-600 font-bold text-xs">138/88</div>
            </div>
            <div className={`p-1.5 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-[9px] text-slate-500">Temp</div>
              <div className="text-emerald-600 font-bold text-xs">98.6°F</div>
            </div>
          </div>

          {/* Bottom HIS Confirmation Status */}
          <div className={`relative z-10 flex items-center justify-between text-[10px] font-mono border-t pt-1 ${isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'}`}>
            <span>DPDP Act 2023 §8(3) Gate: Armed</span>
            <span className="text-emerald-500 font-bold">Ready for Sign-Off</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

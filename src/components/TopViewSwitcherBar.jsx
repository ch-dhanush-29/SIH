import React from "react";
import { ExternalLink, Home, User, Stethoscope, Rocket } from "lucide-react";

export const APP_VIEWS = [
  {
    id: "overview",
    name: "Overview & Architecture",
    shortName: "Overview",
    icon: Home,
    badge: "Full Showcase",
    color: "saffron",
    description: "Complete presentation with 3D models, Modules A-D, Speech AI, HIS, and DPDP Security."
  },
  {
    id: "kiosk",
    name: "Patient Kiosk Terminal",
    shortName: "Patient Kiosk",
    icon: User,
    badge: "Kiosk Mode",
    color: "cyan",
    description: "Self-service patient intake screen with 12-language voice, ABHA scan, and token printer."
  },
  {
    id: "doctor",
    name: "Doctor Consultation Room",
    shortName: "Doctor Dashboard",
    icon: Stethoscope,
    badge: "OPD Room 104",
    color: "emerald",
    description: "Physician dashboard with live queue, bilingual summary review, and DPDP confirmation gate."
  },
  {
    id: "pilot",
    name: "Pilot & Fleet Operations",
    shortName: "Pilot Hub",
    icon: Rocket,
    badge: "Control Center",
    color: "blue",
    description: "Hospital pilot fleet supervisor, hardware watchdog, and system test lab."
  }
];

export default function TopViewSwitcherBar({ activeView, onViewChange }) {
  function handleOpenInNewTab(e, viewId) {
    e.stopPropagation();
    const url = new URL(window.location.href);
    url.searchParams.set("view", viewId);
    window.open(url.toString(), "_blank");
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-2 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand Indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-saffron animate-pulse" />
          <span className="font-bold text-white font-display text-sm tracking-wide">
            MediKiosk <span className="text-saffron">Enterprise</span>
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">Choose Application View:</span>
        </div>

        {/* 4 Views Navigation Tabs (Same Tab Switching + New Tab Launchers) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          {APP_VIEWS.map((v) => {
            const isCur = activeView === v.id;
            const Icon = v.icon;

            return (
              <div key={v.id} className="relative flex items-center">
                {/* Same Tab Switch Button */}
                <button
                  onClick={() => onViewChange(v.id)}
                  title={v.description}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs border ${
                    isCur
                      ? "bg-saffron text-slate-950 border-saffron shadow-md"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{v.shortName}</span>
                </button>

                {/* Open in Different Tab / New Window Button */}
                <button
                  onClick={(e) => handleOpenInNewTab(e, v.id)}
                  title={`Open ${v.name} in a separate new tab`}
                  className="ml-0.5 p-1 rounded-lg text-slate-500 hover:text-saffron hover:bg-slate-800 transition-colors"
                  aria-label={`Open ${v.name} in new tab`}
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}

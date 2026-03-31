"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Menu,
  X,
  Mic,
  Video,
  MonitorUp,
  PhoneOff,
  Heart,
  Thermometer,
  Wind,
  Activity,
  Clock,
  FileText,
  User,
  Stethoscope,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import patientImage from "@/assets/patient-interaction-call.png";
import logoWhite from "@/assets/brand/deeppatient-logo-white.svg";
import { HeroShapes } from "@/components/ui/shape-landing-hero";

/* ── Elapsed Timer ── */
function ElapsedTimer() {
  const [seconds, setSeconds] = useState(247); // start at 4:07

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const min = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono text-brand-forest/70">
      <Clock className="h-3.5 w-3.5" />
      <span>{min}:{sec}</span>
    </div>
  );
}

/* ── Vitals Sparkline (SVG) ── */
function HeartRateSparkline() {
  return (
    <svg viewBox="0 0 120 32" className="w-full h-8" fill="none">
      <polyline
        points="0,20 8,20 12,20 16,18 20,22 24,16 26,24 28,8 30,28 32,14 36,20 44,20 48,20 52,18 56,22 60,16 62,24 64,8 66,28 68,14 72,20 80,20 84,20 88,18 92,22 96,16 98,24 100,8 102,28 104,14 108,20 116,20 120,20"
        stroke="hsl(120, 41%, 30%)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Patient Info Panel (React component, light theme) ── */
function PatientInfoPanel() {
  return (
    <div className="flex flex-col gap-3 h-full py-1">
      {/* Patient Header */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-forest/10">
          <User className="h-3.5 w-3.5 text-brand-forest" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-brand-forest leading-tight">
            Carlos Mendez
          </p>
          <p className="text-[9px] text-brand-forest/50">Male, 34</p>
        </div>
      </div>

      {/* Vitals Section */}
      <div className="rounded-xl bg-white border border-brand-forest/8 p-3 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-success" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-forest/50">
            Vitals
          </span>
        </div>

        {/* Heart Rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-red-500" />
              <span className="text-[10px] text-brand-forest/60">HR</span>
            </div>
            <span className="text-xs font-semibold text-brand-forest">
              78 <span className="text-[9px] font-normal text-brand-forest/50">bpm</span>
            </span>
          </div>
          <HeartRateSparkline />
        </div>

        {/* Grid vitals */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-brand-cream-dark/60 px-2 py-1.5">
            <div className="flex items-center gap-1 mb-0.5">
              <Activity className="h-2.5 w-2.5 text-brand-forest/40" />
              <span className="text-[9px] text-brand-forest/50">BP</span>
            </div>
            <span className="text-[11px] font-semibold text-brand-forest">120/80</span>
          </div>
          <div className="rounded-lg bg-brand-cream-dark/60 px-2 py-1.5">
            <div className="flex items-center gap-1 mb-0.5">
              <Wind className="h-2.5 w-2.5 text-brand-forest/40" />
              <span className="text-[9px] text-brand-forest/50">SpO₂</span>
            </div>
            <span className="text-[11px] font-semibold text-brand-forest">
              98<span className="text-[9px] font-normal">%</span>
            </span>
          </div>
          <div className="rounded-lg bg-brand-cream-dark/60 px-2 py-1.5">
            <div className="flex items-center gap-1 mb-0.5">
              <Thermometer className="h-2.5 w-2.5 text-brand-forest/40" />
              <span className="text-[9px] text-brand-forest/50">Temp</span>
            </div>
            <span className="text-[11px] font-semibold text-brand-forest">
              98.6<span className="text-[9px] font-normal">°F</span>
            </span>
          </div>
          <div className="rounded-lg bg-brand-cream-dark/60 px-2 py-1.5">
            <div className="flex items-center gap-1 mb-0.5">
              <Wind className="h-2.5 w-2.5 text-brand-forest/40" />
              <span className="text-[9px] text-brand-forest/50">RR</span>
            </div>
            <span className="text-[11px] font-semibold text-brand-forest">
              16<span className="text-[9px] font-normal">/min</span>
            </span>
          </div>
        </div>
      </div>

      {/* Scenario Card */}
      <div className="rounded-xl bg-white border border-brand-forest/8 p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-brand-sage" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-forest/50">
            Scenario
          </span>
        </div>
        <div className="space-y-1.5">
          <div>
            <p className="text-[9px] font-medium text-brand-forest/40 uppercase tracking-wider">
              Chief Complaint
            </p>
            <p className="text-[11px] font-medium text-brand-forest leading-snug">
              Persistent headache for 3 days
            </p>
          </div>
          <div className="h-px bg-brand-forest/6" />
          <div>
            <p className="text-[9px] font-medium text-brand-forest/40 uppercase tracking-wider">
              History
            </p>
            <p className="text-[10px] text-brand-forest/70 leading-snug">
              No prior hx of migraines. Reports mild nausea with light sensitivity.
            </p>
          </div>
        </div>
      </div>

      {/* Scoring tag */}
      <div className="flex items-center gap-1.5 px-1 mt-auto">
        <Stethoscope className="h-3 w-3 text-brand-sage" />
        <span className="text-[9px] font-medium text-brand-forest/40">
          OSCE Rubric — Active
        </span>
      </div>
    </div>
  );
}

/* ── Video Call Controls ── */
function VideoCallControls() {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <ElapsedTimer />

      <div className="flex items-center gap-2">
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-forest/8 hover:bg-brand-forest/15 transition-colors text-brand-forest/70">
          <Mic className="h-4 w-4" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-forest/8 hover:bg-brand-forest/15 transition-colors text-brand-forest/70">
          <Video className="h-4 w-4" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-forest/8 hover:bg-brand-forest/15 transition-colors text-brand-forest/70">
          <MonitorUp className="h-4 w-4" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-500">
          <PhoneOff className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="text-[10px] font-medium text-brand-forest/50">Live</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ║            HERO SECTION                   ║
   ══════════════════════════════════════════════ */
const HeroSection = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030303]">
      {/* Gradient background — warm gold + forest glow - GPU-accelerated */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(38,92%,76%)]/[0.04] via-transparent to-[hsl(26,40%,39%)]/[0.04]" />
      <div className="flex flex-col items-end absolute -right-60 -top-10 z-0 [will-change:transform] [transform:translateZ(0)]">
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[3rem] from-[hsl(38,92%,76%)]/30 to-[hsl(187,21%,16%)]/20 [will-change:transform] [transform:translateZ(0)]"></div>
        <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[3rem] from-[hsl(26,40%,39%)]/30 to-[hsl(40,89%,55%)]/20 [will-change:transform] [transform:translateZ(0)]"></div>
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[3rem] from-[hsl(40,89%,55%)]/30 to-[hsl(187,21%,22%)]/20 [will-change:transform] [transform:translateZ(0)]"></div>
      </div>
      <div className="absolute inset-0 z-0 bg-noise opacity-30 [will-change:opacity]"></div>

      {/* ── Elegant floating shapes ── */}
      <HeroShapes />

      {/* Fade overlay at top/bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none z-[1]" />

      {/* Content container */}
      <div className="relative z-10">
        {/* ── Navigation ── */}
        <nav className="container mx-auto flex items-center justify-between px-4 py-4 mt-6">
          <div className="flex items-center gap-3">
            <img src={logoWhite} alt="DeepPatient" className="h-8 w-8" />
            <span className="text-xl font-bold text-white tracking-tight">
              DeepPatient
            </span>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-6">
              <NavItem label="Features" hasDropdown />
              <NavItem label="Pricing" />
              <NavItem label="About" />
              <NavItem label="Resources" hasDropdown />
            </div>
            <div className="flex items-center space-x-3">
              <button className="h-11 rounded-full bg-brand-sage px-7 text-sm font-semibold text-brand-forest-dark hover:brightness-105 transition-all cursor-pointer shadow-[0_0_24px_hsl(38,92%,76%,0.25)]">
                Book a Demo
              </button>
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </nav>

        {/* ── Mobile Navigation ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex flex-col p-4 bg-black/95 backdrop-blur-xl md:hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={logoWhite} alt="DeepPatient" className="h-8 w-8" />
                  <span className="text-xl font-bold text-white">
                    DeepPatient
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="cursor-pointer">
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="mt-8 flex flex-col space-y-6">
                <MobileNavItem label="Features" />
                <MobileNavItem label="Pricing" />
                <MobileNavItem label="About" />
                <MobileNavItem label="Resources" />
                <div className="pt-4">
                  <button className="w-full h-12 rounded-full bg-brand-sage px-8 text-base font-semibold text-brand-forest-dark hover:brightness-105 transition-all cursor-pointer">
                    Book a Demo
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Badge ── */}
        <div className="mx-auto mt-8 flex max-w-fit items-center justify-center space-x-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 backdrop-blur-sm">
          <span className="text-sm font-medium text-brand-sage">
            Scalable practice. Measurable outcomes.
          </span>
          <ArrowRight className="h-4 w-4 text-brand-sage" />
        </div>

        {/* ── Hero Copy ── */}
        <div className="container mx-auto mt-10 px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="mx-auto max-w-5xl text-4xl font-extrabold leading-[1.1] md:text-6xl lg:text-7xl tracking-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
              Master Clinical Skills
            </span>{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-sage via-white/90 to-brand-sage">
              with an On-Demand
            </span>{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
              AI Patient
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/40 font-light tracking-wide"
          >
            DeepPatient gives medical learners safe, repeatable, and interactive
            patient encounters — with instant, rubric-based feedback on
            communication and diagnostic skills.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            <button className="h-12 rounded-full bg-brand-sage px-8 text-base font-semibold text-brand-forest-dark hover:brightness-105 transition-all cursor-pointer shadow-[0_0_32px_hsl(38,92%,76%,0.3)]">
              Book a Demo
            </button>
            <button className="h-12 rounded-full border border-gray-600 px-8 text-base font-medium text-white hover:bg-white/5 transition-all cursor-pointer">
              Watch Demo
            </button>
          </motion.div>

          {/* ══════════════════════════════════════
               MAC WINDOW — INTERACTIVE VIDEO CALL
             ══════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.9, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative mx-auto mt-14 mb-16 w-full max-w-5xl"
          >
            {/* Glow behind */}
            <div className="absolute inset-0 rounded-2xl bg-brand-sage/15 blur-[6rem]" />
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-b from-brand-sage/8 to-transparent blur-3xl" />

            {/* Mac window frame — LIGHT THEME */}
            <div className="relative rounded-2xl border border-black/10 bg-brand-cream shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f6f6f6] border-b border-black/5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-inner" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E] shadow-inner" />
                <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-inner" />
                <span className="ml-3 text-[11px] text-black/40 font-medium">
                  DeepPatient — Live Session
                </span>
              </div>

              {/* Content area */}
              <div className="flex flex-col md:flex-row h-[360px]">
                {/* Left — Video feed */}
                <div className="flex-1 relative overflow-hidden bg-[#1a1a1a]">
                  <img
                    src={patientImage}
                    alt="AI patient video encounter — Carlos Mendez presenting with persistent headache"
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Right — Patient info panel */}
                <div className="hidden md:flex md:flex-col w-[220px] bg-brand-cream-dark/50 border-l border-black/5 p-3 text-left overflow-y-auto">
                  <PatientInfoPanel />
                </div>
              </div>

              {/* Bottom — Controls bar */}
              <div className="bg-[#f9f9f8] border-t border-black/5">
                <VideoCallControls />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

/* ── Nav sub-components ── */
function NavItem({
  label,
  hasDropdown,
}: {
  label: string;
  hasDropdown?: boolean;
}) {
  return (
    <div className="flex items-center text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">
      <span>{label}</span>
      {hasDropdown && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      )}
    </div>
  );
}

function MobileNavItem({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-800 pb-2 text-lg text-white cursor-pointer">
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 text-gray-400" />
    </div>
  );
}

export { HeroSection };

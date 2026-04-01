import {
  Activity,
  AlertCircle,
  Clock3,
  FileText,
  Heart,
  LoaderCircle,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  User,
  Video,
  Wind,
} from "lucide-react";
import { motion } from "motion/react";

import { Conversation } from "@/components/cvi/components/conversation";

import { useTavusPreview } from "./use-tavus-preview";

function HeartRateSparkline() {
  return (
    <svg viewBox="0 0 120 32" className="h-8 w-full" fill="none">
      <polyline
        points="0,20 8,20 12,20 16,18 20,22 24,16 26,24 28,8 30,28 32,14 36,20 44,20 48,20 52,18 56,22 60,16 62,24 64,8 66,28 68,14 72,20 80,20 84,20 88,18 92,22 96,16 98,24 100,8 102,28 104,14 108,20 116,20 120,20"
        stroke="hsl(120, 41%, 30%)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function PatientInfoPanel() {
  return (
    <div className="flex h-full flex-col gap-3 py-1">
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-forest/10">
          <User className="h-3.5 w-3.5 text-brand-forest" />
        </div>
        <div>
          <p className="text-[11px] font-semibold leading-tight text-brand-forest">
            Carlos Mendez
          </p>
          <p className="text-[9px] text-brand-forest/50">Male, 34</p>
        </div>
      </div>

      <div className="space-y-2.5 rounded-xl border border-brand-forest/8 bg-white p-3">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-success" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-forest/50">
            Vitals
          </span>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
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

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-brand-cream-dark/60 px-2 py-1.5">
            <div className="mb-0.5 flex items-center gap-1">
              <Activity className="h-2.5 w-2.5 text-brand-forest/40" />
              <span className="text-[9px] text-brand-forest/50">BP</span>
            </div>
            <span className="text-[11px] font-semibold text-brand-forest">120/80</span>
          </div>
          <div className="rounded-lg bg-brand-cream-dark/60 px-2 py-1.5">
            <div className="mb-0.5 flex items-center gap-1">
              <Wind className="h-2.5 w-2.5 text-brand-forest/40" />
              <span className="text-[9px] text-brand-forest/50">SpO₂</span>
            </div>
            <span className="text-[11px] font-semibold text-brand-forest">
              98<span className="text-[9px] font-normal">%</span>
            </span>
          </div>
          <div className="rounded-lg bg-brand-cream-dark/60 px-2 py-1.5">
            <div className="mb-0.5 flex items-center gap-1">
              <Thermometer className="h-2.5 w-2.5 text-brand-forest/40" />
              <span className="text-[9px] text-brand-forest/50">Temp</span>
            </div>
            <span className="text-[11px] font-semibold text-brand-forest">
              98.6<span className="text-[9px] font-normal">°F</span>
            </span>
          </div>
          <div className="rounded-lg bg-brand-cream-dark/60 px-2 py-1.5">
            <div className="mb-0.5 flex items-center gap-1">
              <Wind className="h-2.5 w-2.5 text-brand-forest/40" />
              <span className="text-[9px] text-brand-forest/50">RR</span>
            </div>
            <span className="text-[11px] font-semibold text-brand-forest">
              16<span className="text-[9px] font-normal">/min</span>
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-brand-forest/8 bg-white p-3">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-brand-sage" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-forest/50">
            Scenario
          </span>
        </div>
        <div className="space-y-1.5">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-brand-forest/40">
              Chief Complaint
            </p>
            <p className="text-[11px] font-medium leading-snug text-brand-forest">
              Persistent headache for 3 days
            </p>
          </div>
          <div className="h-px bg-brand-forest/6" />
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-brand-forest/40">
              History
            </p>
            <p className="text-[10px] leading-snug text-brand-forest/70">
              No prior hx of migraines. Reports mild nausea with light sensitivity.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-1.5 px-1">
        <Stethoscope className="h-3 w-3 text-brand-sage" />
        <span className="text-[9px] font-medium text-brand-forest/40">
          OSCE Rubric — Active
        </span>
      </div>
    </div>
  );
}

function PreviewStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-forest/8 bg-white/75 px-4 py-3 shadow-[0_15px_30px_-24px_rgba(0,0,0,0.45)] backdrop-blur-sm">
      <div className="flex items-center gap-2 text-brand-forest/50">
        <Icon className="h-4 w-4 text-brand-sage" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
          {label}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold text-brand-forest">{value}</p>
    </div>
  );
}

export function LiveSessionPreview() {
  const { conversationUrl, errorMessage, isActive, isLoading, resetSession, startSession } =
    useTavusPreview();

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay: 0.9, ease: [0.25, 0.4, 0.25, 1] }}
      className="relative mx-auto mb-16 mt-14 w-full max-w-5xl"
    >
      <div className="absolute inset-0 rounded-2xl bg-brand-sage/15 blur-[6rem]" />
      <div className="absolute -inset-4 rounded-2xl bg-gradient-to-b from-brand-sage/8 to-transparent blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-brand-cream shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2 border-b border-black/5 bg-[#f6f6f6] px-4 py-2.5">
          <div className="h-3 w-3 rounded-full bg-[#FF5F57] shadow-inner" />
          <div className="h-3 w-3 rounded-full bg-[#FEBC2E] shadow-inner" />
          <div className="h-3 w-3 rounded-full bg-[#28C840] shadow-inner" />
          <span className="ml-3 text-[11px] font-medium text-black/40">
            {isActive ? "DeepPatient — Tavus Live Preview" : "DeepPatient — Live Session"}
          </span>
        </div>

        {isActive && conversationUrl ? (
          <div className="bg-[#050505] p-3 md:p-4">
            <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-white">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-semibold">Tavus session live</span>
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                One scenario • short preview access
              </p>
            </div>
            <Conversation conversationUrl={conversationUrl} onLeave={resetSession} />
          </div>
        ) : (
          <div className="grid min-h-[480px] md:grid-cols-[minmax(0,1.4fr)_240px]">
            <div className="flex flex-col justify-between bg-[radial-gradient(circle_at_top_left,_rgba(245,215,132,0.28),_rgba(255,255,255,0.96)_48%,_rgba(240,236,230,0.92)_100%)] p-6 text-left md:p-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-sage/40 bg-brand-sage/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-forest">
                  <Video className="h-4 w-4 text-brand-bark" />
                  Tavus Live Preview
                </div>

                <h3 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-brand-forest md:text-4xl">
                  Start a real AI patient conversation directly from the site.
                </h3>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-forest/72 md:text-base">
                  The static mock has been replaced with a real Tavus-powered session. We keep
                  it intentionally narrow: one scenario, a short preview window, and a fast path
                  into a live encounter.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <PreviewStat icon={Clock3} label="Preview" value="2 to 5 minute live session" />
                  <PreviewStat icon={ShieldCheck} label="Scope" value="Single scenario for quick evaluation" />
                  <PreviewStat icon={Video} label="Access" value="Camera and microphone required" />
                </div>
              </div>

              <div className="mt-8">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={startSession}
                    disabled={isLoading}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-sage px-8 text-base font-semibold text-brand-forest-dark shadow-[0_0_32px_hsl(38,92%,76%,0.3)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Starting live session
                      </>
                    ) : (
                      "Start Live Session"
                    )}
                  </button>

                  <a
                    href="mailto:team@deeppatient.com?subject=DeepPatient%20Demo%20Request"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-brand-forest/12 px-8 text-base font-medium text-brand-forest transition-all hover:bg-brand-forest/5"
                  >
                    Book a Demo
                  </a>
                </div>

                {errorMessage ? (
                  <div
                    className="mt-4 flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-700"
                    role="status"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                ) : null}

                <p className="mt-4 text-xs leading-6 text-brand-forest/48">
                  By starting the preview you will join a Tavus session and be prompted for
                  microphone and camera access.
                </p>
              </div>
            </div>

            <div className="hidden overflow-y-auto border-l border-black/5 bg-brand-cream-dark/50 p-3 text-left md:flex md:flex-col">
              <PatientInfoPanel />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
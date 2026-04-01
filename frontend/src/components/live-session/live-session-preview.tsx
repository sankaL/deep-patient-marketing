import { useEffect, useState } from "react";
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
import replicaImg from "@/assets/replica-2.png";
import { submitDemoRequest } from "@/lib/leads";

import { ContactModal } from "./contact-modal";
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
            John Miller
          </p>
          <p className="text-[9px] text-brand-forest/50">Male, 31</p>
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
              Low mood and loss of interest for 3 months
            </p>
          </div>
          <div className="h-px bg-brand-forest/6" />
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-brand-forest/40">
              History
            </p>
            <p className="text-[10px] leading-snug text-brand-forest/70">
              Recently divorced. Works as senior IT analyst. No prior depressive episodes.
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
  const {
    completeSession,
    conversationUrl,
    errorMessage,
    isActive,
    isLoading,
    previewSessionId,
    resetSession,
    startSession,
  } = useTavusPreview();
  const contactModalEnabled = import.meta.env.VITE_CONTACT_MODAL_ENABLED !== "false";
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!previewSessionId || !isActive || !navigator.sendBeacon) {
      return;
    }

    const handlePageHide = () => {
      const body = JSON.stringify({ end_reason: "window_unload" });
      navigator.sendBeacon(
        `/api/tavus/preview-sessions/${previewSessionId}/complete`,
        new Blob([body], { type: "application/json" }),
      );
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [isActive, previewSessionId]);

  const handleContactSubmit = async (formData: {
    name: string;
    email: string;
    institution?: string;
    teamSize?: string;
  }) => {
    const demoRequestId = await submitDemoRequest(formData, "live_preview");
    setShowModal(false);
    await startSession({ demoRequestId });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay: 0.9, ease: [0.25, 0.4, 0.25, 1] }}
      className="relative mx-auto mb-12 mt-14 w-full max-w-5xl"
    >
      <div className="absolute inset-0 rounded-2xl bg-brand-sage/15 blur-[6rem]" />
      <div className="absolute -inset-4 rounded-2xl bg-gradient-to-b from-brand-sage/8 to-transparent blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-brand-cream shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2 border-b border-black/5 bg-[#f6f6f6] px-4 py-2.5">
          <div className="h-3 w-3 rounded-full bg-[#FF5F57] shadow-inner" />
          <div className="h-3 w-3 rounded-full bg-[#FEBC2E] shadow-inner" />
          <div className="h-3 w-3 rounded-full bg-[#28C840] shadow-inner" />
          <span className="ml-3 text-[11px] font-medium text-black/40">
            {isActive ? "DeepPatient — Live Preview" : "DeepPatient — Live Session"}
          </span>
        </div>

        {isActive && conversationUrl ? (
          <div className="bg-[#050505] p-3 md:p-4">
            <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-white">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-semibold">Live session active</span>
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                One scenario • short preview access
              </p>
            </div>
            <Conversation
              conversationUrl={conversationUrl}
              onLeave={() => {
                void completeSession("client_closed");
                resetSession();
              }}
            />
          </div>
        ) : (
          <div className="grid min-h-[480px] md:grid-cols-[minmax(0,1.4fr)_240px]">
            <div className="relative flex flex-col justify-between overflow-hidden p-6 text-left md:p-10">
              <div className="absolute inset-0 bg-[#12181b]" />
              <div className="absolute -bottom-20 left-0 h-64 w-64 rounded-full bg-brand-sage/12 blur-3xl" />
              <div className="absolute inset-0 hidden items-center justify-center md:flex">
                <img
                  src={replicaImg}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none h-full w-full max-w-none object-cover object-center opacity-100 blur-[8px] saturate-[0.74] brightness-[0.42] contrast-[1.16]"
                />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,12,14,0.78)_0%,rgba(8,12,14,0.68)_34%,rgba(8,12,14,0.54)_62%,rgba(8,12,14,0.7)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(172,118,76,0.16),rgba(172,118,76,0.08)_24%,rgba(8,12,14,0.22)_52%,rgba(8,12,14,0.36)_100%)]" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-brand-bark px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-[0_18px_38px_-22px_rgba(0,0,0,0.7)]">
                  <Video className="h-4 w-4 text-brand-cream" />
                  DeepPatient Live Preview
                </div>

                <h3 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Start a real AI patient conversation.
                </h3>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <PreviewStat icon={Clock3} label="Preview" value="2 to 5 minute live session" />
                  <PreviewStat icon={ShieldCheck} label="Scope" value="Single scenario for quick evaluation" />
                  <PreviewStat icon={Video} label="Access" value="Camera and microphone required" />
                </div>
              </div>

              <div className="relative z-10 mt-8">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      contactModalEnabled ? setShowModal(true) : startSession()
                    }
                    disabled={isLoading}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-success px-8 text-base font-semibold text-white shadow-[0_0_32px_hsl(120,41%,30%,0.28)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-65"
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

                <p className="mt-4 text-xs leading-6 text-white/72">
                  By starting the preview you will join a live AI session and be prompted for
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
      <ContactModal
        open={showModal}
        title="Before you start"
        description="Share a few details to start the live AI patient session."
        onClose={() => setShowModal(false)}
        onSubmit={handleContactSubmit}
        submitLabel="Start Session"
        submittingLabel="Starting..."
        submitButtonClassName="bg-success text-white shadow-[0_0_24px_hsl(120,41%,30%,0.28)]"
      />
    </motion.div>
  );
}

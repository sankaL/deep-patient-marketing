import { Play, Volume2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type IntroVideoSectionProps = {
  demoRequestId: number;
};

const IntroVideoSection = ({ demoRequestId }: IntroVideoSectionProps) => {
  const demoRef = useRef<HTMLDivElement | null>(null);
  const [hasManualPlaybackStarted, setHasManualPlaybackStarted] = useState(false);
  const isDemoPlaying = hasManualPlaybackStarted || demoRequestId > 0;

  useEffect(() => {
    if (!demoRequestId) return;
    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [demoRequestId]);

  return (
    <section className="relative py-24 md:py-32 bg-[hsl(187,21%,10%)]">
      {/* Top blend */}
      <div
        className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-[hsl(187,21%,10%)] pointer-events-none z-0"
        aria-hidden="true"
      />
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[20rem] bg-brand-sage/8 rounded-full blur-[8rem]" />

      <div className="relative container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-brand-sage text-sm font-semibold uppercase tracking-[0.2em] mb-4 block">
            Platform
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            What is DeepPatient?
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            A complete clinical skills training platform built for every role at
            your institution \u2014 from secure scenario creation to cohort-level
            analytics.
          </p>
        </motion.div>

        {/* Video player */}
        <motion.div
          ref={demoRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="scroll-mt-24"
        >
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-3 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-4">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#07181a]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(242,176,39,0.2),transparent_42%),linear-gradient(135deg,rgba(7,24,26,0.82),rgba(10,34,37,0.96))]" />

              {/* Top bar */}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur md:px-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-sage">
                    Product Demo
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white md:text-2xl">
                    DeepPatient walkthrough placeholder
                  </h3>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65">
                  {isDemoPlaying ? "Playing" : "Ready"}
                </div>
              </div>

              {/* Centre content */}
              <div className="relative flex h-full items-center justify-center px-6 pt-24 pb-20 text-center md:px-12">
                <div className="max-w-2xl">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-[0_0_40px_rgba(242,176,39,0.2)]">
                    {isDemoPlaying ? (
                      <Volume2 className="h-9 w-9 text-brand-sage" />
                    ) : (
                      <Play className="ml-1 h-9 w-9 text-white" />
                    )}
                  </div>

                  <h4 className="mt-6 text-2xl font-semibold text-white md:text-4xl">
                    {isDemoPlaying
                      ? "Demo playback started"
                      : "Watch the product walkthrough"}
                  </h4>
                  <p className="mt-4 text-sm leading-7 text-white/68 md:text-base">
                    This is a placeholder player for now. Replace this container
                    with the final recorded product video when it is ready.
                  </p>

                  {!isDemoPlaying ? (
                    <button
                      type="button"
                      onClick={() => setHasManualPlaybackStarted(true)}
                      className="mt-8 inline-flex h-12 items-center justify-center gap-3 rounded-full bg-[#F2B027] px-7 text-sm font-semibold text-brand-forest transition-all hover:brightness-105 cursor-pointer"
                    >
                      <Play className="h-4 w-4" />
                      Play placeholder
                    </button>
                  ) : (
                    <p className="mt-8 text-xs font-medium uppercase tracking-[0.22em] text-brand-sage/90">
                      Autoplay triggered from the hero CTA
                    </p>
                  )}
                </div>
              </div>

              {/* Timeline bar */}
              <div className="absolute inset-x-0 bottom-0 px-4 pb-4 md:px-6 md:pb-6">
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 backdrop-blur">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-white/55">
                    <span>Preview timeline</span>
                    <span>
                      {isDemoPlaying ? "00:18 / 01:42" : "00:00 / 01:42"}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full bg-[#F2B027] transition-all duration-700 ${
                        isDemoPlaying ? "w-[18%]" : "w-0"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export { IntroVideoSection };

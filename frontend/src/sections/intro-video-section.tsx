import { AlertCircle, Play, Volume2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

type IntroVideoSectionProps = {
  demoRequestId: number;
};

// Dropbox public demo video — no auth required, served via marketing CDN
const DROPBOX_DEMO_URL =
  "https://www.dropbox.com/scl/fi/q9tyd47c6g67drz4nourk/DeepPatient-Demo-Vid-light-HQ.mp4?rlkey=m27fmkw4dhethlzii5e201yb4&st=r48c1uc6&dl=0";

function toDropboxStreamUrl(url: string) {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.delete("dl");
  parsedUrl.searchParams.set("raw", "1");
  return parsedUrl.toString();
}

const IntroVideoSection = ({ demoRequestId }: IntroVideoSectionProps) => {
  const demoRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playbackLabel, setPlaybackLabel] = useState("Ready");
  const [playbackHint, setPlaybackHint] = useState(
    "Click play to watch the DeepPatient walkthrough.",
  );
  const videoSrc = useMemo(() => toDropboxStreamUrl(DROPBOX_DEMO_URL), []);

  const attemptPlayback = async ({
    preferAudio,
    loadingHint,
  }: {
    preferAudio: boolean;
    loadingHint: string;
  }) => {
    const video = videoRef.current;
    if (!video) return;

    setPlaybackLabel("Loading");
    setPlaybackHint(loadingHint);

    try {
      video.muted = !preferAudio;
      await video.play();
      setPlaybackLabel(preferAudio ? "Playing" : "Playing muted");
      setPlaybackHint(
        preferAudio
          ? "Demo started with audio."
          : "Autoplay started muted. Use the player to enable audio.",
      );
    } catch {
      if (preferAudio) {
        try {
          video.muted = true;
          await video.play();
          setPlaybackLabel("Playing muted");
          setPlaybackHint("Autoplay started muted. Use the player to enable audio.");
          return;
        } catch {
          // Fall through to the generic blocked state below.
        }
      }

      setPlaybackLabel("Ready");
      setPlaybackHint("Autoplay was blocked. Press play in the player.");
    }
  };

  useEffect(() => {
    if (!demoRequestId) return;

    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    const frameId = window.requestAnimationFrame(() => {
      void attemptPlayback({
        preferAudio: true,
        loadingHint: "Opening the product demo from the top.",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [demoRequestId]);

  useEffect(() => {
    const container = demoRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (video.paused || video.ended) {
            void attemptPlayback({
              preferAudio: false,
              loadingHint: "Starting the demo as the section enters view.",
            });
          }
          return;
        }

        if (!video.paused && !video.ended) {
          video.pause();
          setPlaybackLabel("Paused");
          setPlaybackHint("Playback paused while the demo is out of view.");
        }
      },
      {
        threshold: 0.65,
      },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []); // Intentionally runs once; attemptPlayback uses refs to avoid stale closures

  const mobilePlaybackLabel =
    playbackLabel === "Playing muted" ? "Muted" : playbackLabel;

  return (
    <section
      id="demo"
      className="relative overflow-hidden bg-[hsl(187,21%,10%)] pt-24 pb-20 scroll-mt-28 md:pt-28 md:pb-24 md:scroll-mt-32"
    >
      <div
        className="absolute inset-x-0 top-0 z-0 h-64 bg-gradient-to-b from-[hsl(187,24%,11%)]/10 via-[hsl(187,21%,10%)]/68 to-[hsl(187,21%,10%)] pointer-events-none"
        aria-hidden="true"
      />
      <div className="absolute top-0 left-1/2 h-[26rem] w-[52rem] -translate-x-1/2 rounded-full bg-brand-sage/8 blur-[10rem]" />

      <div className="relative container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="mb-4 block text-sm font-semibold uppercase tracking-[0.2em] text-brand-sage">
            Meet the Product
          </span>
          <h2 className="mb-6 text-3xl font-bold text-white md:text-5xl">
            What is DeepPatient?
          </h2>
          <p className="text-lg leading-relaxed text-gray-400">
            A short walkthrough of the DeepPatient experience, what the patient
            interaction includes, and the core features learners can expect.
          </p>
        </motion.div>

        <motion.div
          ref={demoRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="scroll-mt-24"
        >
          <div className="rounded-[1.25rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-1.5 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[2rem] sm:p-3 md:p-4">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#07181a]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/20 px-3 py-2 backdrop-blur sm:px-4 sm:py-3 md:px-6">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white sm:hidden">
                    DeepPatient experience
                  </p>
                  <p className="hidden text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-sage sm:block sm:text-[11px]">
                    DeepPatient Overview
                  </p>
                  <h3 className="mt-1 hidden text-sm font-semibold text-white sm:block sm:text-lg md:text-2xl">
                    See what the DeepPatient experience looks like
                  </h3>
                </div>
                <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/65 sm:px-3 sm:py-1 sm:text-xs">
                  <span className="sm:hidden">{mobilePlaybackLabel}</span>
                  <span className="hidden sm:inline">{playbackLabel}</span>
                </div>
              </div>

              <div className="bg-[radial-gradient(circle_at_top,rgba(242,176,39,0.2),transparent_42%),linear-gradient(135deg,rgba(7,24,26,0.82),rgba(10,34,37,0.96))] p-2 sm:p-4 md:p-6">
                <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
                  <video
                    ref={videoRef}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full bg-black"
                    src={videoSrc}
                    onPlay={() => {
                      setPlaybackLabel("Playing");
                      setPlaybackHint("Demo is playing.");
                    }}
                    onPause={() => {
                      setPlaybackLabel("Paused");
                      setPlaybackHint("Playback paused.");
                    }}
                    onEnded={() => {
                      setPlaybackLabel("Finished");
                      setPlaybackHint("Demo finished. Use replay to watch it again.");
                    }}
                    onError={() => {
                      setPlaybackLabel("Unavailable");
                      setPlaybackHint(
                        "The demo video could not be loaded from Dropbox.",
                      );
                    }}
                  />
                </div>

                <div className="mt-5 hidden flex-col gap-3 text-sm text-white/72 md:flex md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-brand-sage" />
                    <span>Hero CTA scrolls here and restarts playback.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {playbackLabel === "Playing muted" ? (
                      <AlertCircle className="h-4 w-4 text-brand-sage" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-brand-sage" />
                    )}
                    <span>{playbackHint}</span>
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

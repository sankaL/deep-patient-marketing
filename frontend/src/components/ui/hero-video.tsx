import { useEffect, useMemo, useRef } from "react";

const DROPBOX_DEMO_URL =
  "https://www.dropbox.com/scl/fi/q9tyd47c6g67drz4nourk/DeepPatient-Demo-Vid-light-HQ.mp4?rlkey=m27fmkw4dhethlzii5e201yb4&st=r48c1uc6&dl=0";

function toDropboxStreamUrl(url: string) {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.delete("dl");
  parsedUrl.searchParams.set("raw", "1");
  return parsedUrl.toString();
}

const HeroVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = useMemo(() => toDropboxStreamUrl(DROPBOX_DEMO_URL), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;

    const handleFirstInteraction = () => {
      if (video && video.paused) {
        video.muted = false;
        video.play().catch(() => {});
      }
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
        window.addEventListener("keydown", handleFirstInteraction, { once: true });
      });
    }

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, []);

  return (
    <div id="demo" className="mx-auto mt-12 w-full max-w-5xl px-4 pb-20 sm:mt-16 md:pb-28">
      <div className="relative rounded-[1.75rem] bg-white p-2 shadow-[0_1px_2px_hsl(187,21%,16%,0.08),0_24px_70px_hsl(187,21%,16%,0.16)] ring-1 ring-brand-forest/8 sm:rounded-[2.25rem] sm:p-3">
        <div className="absolute -top-4 left-6 rounded-full border border-brand-forest/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-forest/65 shadow-sm sm:left-10">
          A DeepPatient encounter
        </div>
        <div className="overflow-hidden rounded-[1.25rem] bg-black ring-1 ring-black/10 sm:rounded-[1.6rem]">
          <video
            ref={videoRef}
            autoPlay
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-black"
            src={videoSrc}
          />
        </div>
      </div>
    </div>
  );
};

export { HeroVideo };

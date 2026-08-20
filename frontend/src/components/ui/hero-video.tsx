import { useMemo } from "react";

const DROPBOX_DEMO_URL =
  "https://www.dropbox.com/scl/fi/q9tyd47c6g67drz4nourk/DeepPatient-Demo-Vid-light-HQ.mp4?rlkey=m27fmkw4dhethlzii5e201yb4&st=r48c1uc6&dl=0";

function toDropboxStreamUrl(url: string) {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.delete("dl");
  parsedUrl.searchParams.set("raw", "1");
  return parsedUrl.toString();
}

const HeroVideo = () => {
  const videoSrc = useMemo(() => toDropboxStreamUrl(DROPBOX_DEMO_URL), []);

  return (
    <div id="demo" className="mx-auto mt-10 w-full max-w-4xl px-4 pb-14 sm:mt-12 md:pb-20">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.5)] sm:rounded-3xl">
        <video
          autoPlay
          muted
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black"
          src={videoSrc}
        />
      </div>
    </div>
  );
};

export { HeroVideo };

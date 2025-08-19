import { Play, Pause } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

function fmtTime(sec: number) {
  if (!isFinite(sec) || isNaN(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function AudioBubble({ src}: {src: string; }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [dur, setDur] = useState(0);
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const calcDuration = () => {
      if (!isFinite(el.duration) || isNaN(el.duration)) {
        // Force the browser to compute duration for MediaRecorder/WebM
        const onFix = () => {
          if (isFinite(el.duration) && !isNaN(el.duration)) {
            setDur(el.duration || 0);
            el.currentTime = 0;
            el.removeEventListener("timeupdate", onFix);
          }
        };
        el.addEventListener("timeupdate", onFix);
        el.currentTime = 1e101;
      } else {
        setDur(el.duration || 0);
      }
    };

    const onLoaded = () => calcDuration();
    const onDurationChange = () => setDur(el.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setPos(0); };

    // Smooth timer
    const tick = () => setPos(el.currentTime || 0);
    const iv = window.setInterval(tick, 200);

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);

    return () => {
      clearInterval(iv);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    el.paused ? el.play() : el.pause();
  };

  const pct = dur > 0 ? Math.min(100, (pos / dur) * 100) : 0;

  return (
    <div className="w-[180px] sm:w-[200px]">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-full" onClick={toggle}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        <div className="flex-1">
          <div className="h-1 w-full rounded bg-black/15 overflow-hidden">
            <div className="h-full bg-black/50" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-[11px] opacity-80 tabular-nums">
            {fmtTime(pos)} <span className="opacity-60">/</span> {fmtTime(dur)}
          </div>
        </div>
      </div>

      {/* hidden native player */}
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
}

export default AudioBubble
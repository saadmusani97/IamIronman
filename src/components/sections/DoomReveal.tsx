"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HudFrame } from "@/components/ui/HudFrame";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { DOOM_FRAME_COUNT, doomFramePath } from "@/lib/doom";

export function DoomReveal() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const outroRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const seqReadoutRef = useRef<HTMLSpanElement | null>(null);

  const framesRef = useRef<HTMLImageElement[]>([]);
  const tickingRef = useRef(false);
  const loadedRef = useRef(false);
  const lastFrameRef = useRef(-1);

  const [loadProgress, setLoadProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Load all frames in parallel
  useEffect(() => {
    let cancelled = false;
    let loadedCount = 0;
    const imgs: HTMLImageElement[] = new Array(DOOM_FRAME_COUNT);

    for (let i = 1; i <= DOOM_FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = doomFramePath(i);
      const idx = i - 1;
      const onDone = () => {
        if (cancelled) return;
        loadedCount++;
        setLoadProgress(loadedCount / DOOM_FRAME_COUNT);
        if (loadedCount === DOOM_FRAME_COUNT) {
          loadedRef.current = true;
          setLoaded(true);
        }
        if (i === 1) {
          imgs[idx] = img;
          framesRef.current = imgs;
          drawFrame(0);
          lastFrameRef.current = 0;
        }
      };
      img.onload = onDone;
      img.onerror = onDone;
      imgs[idx] = img;
    }
    framesRef.current = imgs;

    return () => { cancelled = true; };
  }, []);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;

    let drawW: number, drawH: number;
    if (canvasRatio > imgRatio) {
      drawW = cw;
      drawH = cw / imgRatio;
    } else {
      drawH = ch;
      drawW = ch * imgRatio;
    }

    const drawX = (cw - drawW) / 2;
    const drawY = (ch - drawH) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawFrame(lastFrameRef.current >= 0 ? lastFrameRef.current : 0);
  }, [drawFrame]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    if (!loaded) return;
    drawFrame(0);
    lastFrameRef.current = 0;
  }, [loaded, drawFrame]);

  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      requestAnimationFrame(() => {
        tickingRef.current = false;
        const section = sectionRef.current;
        if (!section || !loadedRef.current) return;

        const rect = section.getBoundingClientRect();
        const scrollable = section.offsetHeight - window.innerHeight;
        const progress =
          scrollable <= 0
            ? 0
            : Math.min(1, Math.max(0, -rect.top / scrollable));

        const frameIndex = Math.min(
          DOOM_FRAME_COUNT - 1,
          Math.floor(progress * DOOM_FRAME_COUNT),
        );
        if (frameIndex !== lastFrameRef.current) {
          lastFrameRef.current = frameIndex;
          drawFrame(frameIndex);
        }

        // Intro text fades out early
        if (textRef.current) {
          const op = Math.max(0, 1 - progress / 0.2);
          textRef.current.style.opacity = String(op);
          textRef.current.style.transform = `translateY(${(1 - op) * -16}px)`;
        }

        // Outro fades in at end
        if (outroRef.current) {
          const op = Math.min(1, Math.max(0, (progress - 0.82) / 0.1));
          outroRef.current.style.opacity = String(op);
          outroRef.current.style.transform = `translateY(${(1 - op) * 14}px)`;
        }

        if (progressFillRef.current) {
          progressFillRef.current.style.transform = `scaleX(${progress})`;
        }

        if (seqReadoutRef.current) {
          seqReadoutRef.current.textContent =
            `SEQ ${String(frameIndex + 1).padStart(3, "0")} / ${DOOM_FRAME_COUNT}`;
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [drawFrame]);

  return (
    <section
      ref={sectionRef}
      id="doom"
      className="scroll-animation relative border-t border-white/5 bg-background"
    >
      <div
        className="sticky top-0 min-h-[100dvh] w-full overflow-hidden bg-black"
        style={{ height: "100dvh", willChange: "transform", transform: "translateZ(0)" }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ willChange: "contents", transform: "translateZ(0)" }}
        />

        {/* Dark vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 90%, transparent 30%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        {/* HUD corners — green for Doom */}
        <div className="pointer-events-none absolute left-6 top-24 md:left-10 md:top-28" style={{ color: "#2d6a2d" }}>
          <HudFrame corner="tl" size={26} />
        </div>
        <div className="pointer-events-none absolute right-6 top-24 md:right-10 md:top-28" style={{ color: "#2d6a2d" }}>
          <HudFrame corner="tr" size={26} />
        </div>
        <div className="pointer-events-none absolute bottom-14 left-6 md:bottom-16 md:left-10" style={{ color: "#2d6a2d" }}>
          <HudFrame corner="bl" size={26} />
        </div>
        <div className="pointer-events-none absolute bottom-14 right-6 md:bottom-16 md:right-10" style={{ color: "#2d6a2d" }}>
          <HudFrame corner="br" size={26} />
        </div>

        {/* Top label */}
        <div className="pointer-events-none absolute left-6 top-20 z-10 flex items-center gap-2 md:left-10 md:top-24">
          <div className="h-px w-8" style={{ background: "#2d6a2d" }} />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-400">
            Victor Von Doom &mdash; Latveria
          </span>
        </div>

        {/* Top right seq */}
        <div className="pointer-events-none absolute right-6 top-20 z-10 flex items-center gap-3 md:right-10 md:top-24">
          <span
            ref={seqReadoutRef}
            className="font-mono text-[10px] uppercase tracking-[0.28em]"
            style={{ color: "#2d6a2d" }}
          >
            SEQ 001 / {DOOM_FRAME_COUNT}
          </span>
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "#2d6a2d", boxShadow: "0 0 10px rgba(45,106,45,0.85)" }}
          />
        </div>

        {/* Intro text */}
        <div
          ref={textRef}
          className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-start gap-5 px-6 pb-24 md:px-12 md:pb-28"
          style={{ transition: "opacity 80ms linear, transform 80ms linear" }}
        >
          <EyebrowBadge>DOOM // LATVERIA // SOVEREIGN</EyebrowBadge>
          <h2 className="max-w-[14ch] font-sans text-5xl font-semibold leading-[0.95] tracking-tighter text-foreground md:text-7xl lg:text-8xl">
            Doom
            <br />
            <span style={{ color: "#2d6a2d" }}>is inevitable.</span>
          </h2>
          <p className="max-w-[42ch] font-sans text-sm leading-relaxed text-zinc-400 md:text-base">
            Victor Von Doom. Sorcerer. Scientist. Sovereign. The most dangerous man alive — and the only one who knows it.
          </p>
        </div>

        {/* Outro */}
        <div
          ref={outroRef}
          className="pointer-events-none absolute bottom-24 right-6 z-10 flex flex-col items-end gap-4 md:bottom-32 md:right-12"
          style={{ opacity: 0, transition: "opacity 80ms linear" }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: "#2d6a2d" }}>
            Doom &mdash; Reigns
          </span>
        </div>

        {/* Progress bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
          <div className="mx-6 mb-3 h-px bg-white/10 md:mx-10">
            <div
              ref={progressFillRef}
              className="h-full origin-left"
              style={{ background: "#2d6a2d", transform: "scaleX(0)", transition: "transform 80ms linear" }}
            />
          </div>
          <div className="mx-6 flex items-center justify-between pb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500 md:mx-10">
            <span>DOOM // LATVERIA</span>
            <span>Victor Von Doom // Sovereign</span>
            <span>Scroll &darr;</span>
          </div>
        </div>

        {/* Loading state */}
        {!loaded && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-black px-6">
            <EyebrowBadge>DOOM // INITIALISING</EyebrowBadge>
            <div className="h-px w-60 bg-white/10 md:w-80">
              <div
                className="h-full transition-[width] duration-150 ease-out"
                style={{ width: `${Math.round(loadProgress * 100)}%`, background: "#2d6a2d" }}
              />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">
              Loading &nbsp;&middot;&nbsp; {Math.round(loadProgress * 100)}%
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

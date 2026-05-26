"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { HudFrame } from "@/components/ui/HudFrame";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";

import { RippleGrid } from "@/components/ui/RippleGrid";

// Configure Draco decoder for compressed GLBs
useGLTF.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");

// ─── 3-D Model ────────────────────────────────────────────────────────────────

function ArcReactorModel({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const { scene } = useGLTF("https://saadmusani97.github.io/ironman-assets/arc-reactor.glb");
  const groupRef = useRef<THREE.Group>(null);

  // Auto-fit: compute bounding box once and normalise the model to radius ~1
  const normalizedScale = useRef(1);
  useEffect(() => {
    // This model has no backdrop — use the full scene directly
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    normalizedScale.current = maxDim > 0 ? 2.2 / maxDim : 1;

    // Centre the scene at origin
    const centre = new THREE.Vector3();
    box.getCenter(centre);
    scene.position.sub(centre);

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            (m as THREE.MeshStandardMaterial).envMapIntensity = 3;
          });
        } else if (mesh.material) {
          (mesh.material as THREE.MeshStandardMaterial).envMapIntensity = 3;
        }
      }
    });
  }, [scene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const p = scrollProgress.current;

    // Scale in as model appears (progress 0.4 → 0.65)
    const scaleProgress = Math.min(1, Math.max(0, (p - 0.4) / 0.25));
    const eased = 1 - Math.pow(1 - scaleProgress, 3);
    const s = normalizedScale.current * (0.5 + eased * 0.5);
    groupRef.current.scale.setScalar(s);

    // Gentle float
    groupRef.current.position.y = Math.sin(Date.now() * 0.0008) * 0.06;
  });

  return (
    <group ref={groupRef} scale={0} rotation={[Math.PI / 2, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function ArcReactor() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const rippleGridRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const tickingRef = useRef(false);
  const scrollProgress = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioPlayedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio("/arc-reactor.mp3");
    audio.volume = 0.7;
    audio.loop = false;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      requestAnimationFrame(() => {
        tickingRef.current = false;
        const section = sectionRef.current;
        if (!section) return;

        const rect = section.getBoundingClientRect();
        const scrollable = section.offsetHeight - window.innerHeight;
        const progress =
          scrollable <= 0
            ? 0
            : Math.min(1, Math.max(0, -rect.top / scrollable));

        scrollProgress.current = progress;

        // ── Text: visible at start, fades out by progress 0.35
        if (textRef.current) {
          const op = Math.max(0, 1 - progress / 0.35);
          const ty = (1 - op) * -20;
          textRef.current.style.opacity = String(op);
          textRef.current.style.transform = `translateY(${ty}px)`;
        }

        // ── Canvas: fades in from progress 0.38, fully visible by 0.6
        if (canvasWrapRef.current) {
          const op = Math.min(1, Math.max(0, (progress - 0.38) / 0.22));
          canvasWrapRef.current.style.opacity = String(op);
        }

        // ── RippleGrid: same timing as canvas
        if (rippleGridRef.current) {
          const op = Math.min(1, Math.max(0, (progress - 0.38) / 0.22));
          rippleGridRef.current.style.opacity = String(op);
        }

        // ── HUD overlay: same timing as canvas
        if (hudRef.current) {
          const op = Math.min(1, Math.max(0, (progress - 0.42) / 0.2));
          hudRef.current.style.opacity = String(op);
        }

        // ── Progress bar
        if (progressFillRef.current) {
          progressFillRef.current.style.transform = `scaleX(${progress})`;
        }

        // ── Audio: trigger once when model starts appearing
        if (audioRef.current) {
          if (progress >= 0.38 && !audioPlayedRef.current) {
            audioPlayedRef.current = true;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
          // Fade volume out as user scrolls away (progress > 0.85)
          const vol = Math.min(1, Math.max(0, 1 - (progress - 0.85) / 0.1));
          audioRef.current.volume = vol * 0.7;
          // Reset so it can play again if user scrolls back up
          if (progress < 0.3) {
            audioPlayedRef.current = false;
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="arc-reactor"
      className="scroll-animation relative border-t border-white/5 bg-background"
    >
      <div
        className="sticky top-0 min-h-[100dvh] w-full overflow-hidden bg-background"
        style={{ height: "100dvh", willChange: "transform", transform: "translateZ(0)" }}
      >
        {/* ── RippleGrid background ── */}
        <div
          ref={rippleGridRef}
          className="absolute inset-0 z-0"
          style={{ opacity: 0, transition: "opacity 80ms linear" }}
        >
          <RippleGrid
            gridColor="#9d2828"
            rippleIntensity={0.07}
            gridSize={10}
            gridThickness={16}
            fadeDistance={4.1}
            vignetteStrength={2}
            glowIntensity={1}
            opacity={1}
            gridRotation={0}
          />
        </div>

        {/* ── Radial vignette ── */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(10,10,11,0.5) 70%, rgba(10,10,11,0.92) 100%)",
          }}
        />

        {/* ── HUD corners ── */}
        <div className="pointer-events-none absolute left-6 top-24 z-20 text-accent md:left-10 md:top-28">
          <HudFrame corner="tl" size={26} />
        </div>
        <div className="pointer-events-none absolute right-6 top-24 z-20 text-accent md:right-10 md:top-28">
          <HudFrame corner="tr" size={26} />
        </div>
        <div className="pointer-events-none absolute bottom-14 left-6 z-20 text-accent md:bottom-16 md:left-10">
          <HudFrame corner="bl" size={26} />
        </div>
        <div className="pointer-events-none absolute bottom-14 right-6 z-20 text-accent md:bottom-16 md:right-10">
          <HudFrame corner="br" size={26} />
        </div>

        {/* ── Top-left label ── */}
        <div className="pointer-events-none absolute left-6 top-20 z-20 flex items-center gap-2 md:left-10 md:top-24">
          <div className="h-px w-8 bg-accent/60" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-400">
            Arc Reactor &mdash; Mark I
          </span>
        </div>

        {/* ── Top-right status ── */}
        <div className="pointer-events-none absolute right-6 top-20 z-20 flex items-center gap-3 md:right-10 md:top-24">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-400">
            Power Core
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            3 GJ/s
          </span>
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(212,162,47,0.85)]"
          />
        </div>

        {/* ── Hero text (fades out on scroll) ── */}
        <div
          ref={textRef}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 px-6 text-center"
          style={{ transition: "opacity 80ms linear, transform 80ms linear", pointerEvents: "none" }}
        >
          <EyebrowBadge>ARC REACTOR // MARK I // CAVE-BUILT</EyebrowBadge>
          <h2 className="font-sans text-5xl font-semibold leading-[0.95] tracking-tighter text-foreground md:text-7xl lg:text-[clamp(4rem,9vw,8rem)]">
            Proof that Tony
            <br />
            has a{" "}
            <span className="text-accent">heart.</span>
          </h2>
          <p className="max-w-[40ch] font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-400">
            Built in a cave &mdash; with a box of scraps.
            <br />
            Scroll to reveal the reactor.
          </p>
        </div>

        {/* ── 3-D Canvas (fades in on scroll) ── */}
        <div
          ref={canvasWrapRef}
          className="absolute inset-0 z-30"
          style={{ opacity: 0, transition: "opacity 80ms linear" }}
        >
          <Canvas
            camera={{ position: [0, 0.6, 3.2], fov: 42 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: "transparent" }}
          >
            <ambientLight intensity={1.5} />
            {/* Main cyan glow from front — matches the arc reactor light */}
            <pointLight position={[0, 0, 2]} intensity={15} color="#60e8ff" />
            {/* Rim light from behind */}
            <pointLight position={[0, 1, -3]} intensity={5} color="#60c8ff" />
            {/* Warm fill from top-right */}
            <pointLight position={[3, 3, 1]} intensity={6} color="#ffffff" />
            {/* Subtle gold accent */}
            <pointLight position={[-2, -1, 2]} intensity={3} color="#d4a22f" />
            {/* Extra fill from below */}
            <pointLight position={[0, -2, 1]} intensity={4} color="#60e8ff" />
            <Suspense fallback={null}>
              <ArcReactorModel scrollProgress={scrollProgress} />
              <Environment preset="studio" />
              <ContactShadows
                position={[0, -1.4, 0]}
                opacity={0.6}
                scale={5}
                blur={3}
                color="#00d4ff"
              />
            </Suspense>
            <OrbitControls
              autoRotate
              autoRotateSpeed={1.5}
              enableZoom={true}
              enablePan={false}
              minDistance={2}
              maxDistance={6}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.5}
            />
          </Canvas>
        </div>

        {/* ── HUD overlay on model (fades in with model) ── */}
        <div
          ref={hudRef}
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
          style={{ opacity: 0, transition: "opacity 80ms linear" }}
        >
          {/* Circular ring around model */}
          <div
            className="absolute h-[min(55vw,420px)] w-[min(55vw,420px)] rounded-full border border-accent/20"
            style={{ boxShadow: "0 0 60px 4px rgba(212,162,47,0.08) inset" }}
          />
          <div className="absolute h-[min(62vw,480px)] w-[min(62vw,480px)] rounded-full border border-white/5" />

          {/* Data labels */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 md:left-16">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent">Output</span>
            <span className="font-sans text-2xl font-semibold tracking-tight text-foreground">3 GJ/s</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">Sustained</span>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1 md:right-16">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent">Status</span>
            <span className="font-sans text-2xl font-semibold tracking-tight text-foreground">Online</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">Stable</span>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
          <div className="mx-6 mb-3 h-px bg-white/10 md:mx-10">
            <div
              ref={progressFillRef}
              className="h-full origin-left bg-accent"
              style={{ transform: "scaleX(0)", transition: "transform 80ms linear" }}
            />
          </div>
          <div className="mx-6 flex items-center justify-between pb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500 md:mx-10">
            <span>REACTOR // MARK I</span>
            <span>J.A.R.V.I.S. // POWER CORE</span>
            <span>Scroll &darr;</span>
          </div>
        </div>
      </div>
    </section>
  );
}

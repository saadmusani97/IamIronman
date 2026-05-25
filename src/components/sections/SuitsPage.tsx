"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { HudFrame } from "@/components/ui/HudFrame";

// ─── Suit data ────────────────────────────────────────────────────────────────

const BASE = "/api/model";

const SUITS = [
  {
    id: "mark1",
    file: `${BASE}/suit-mark1.glb`,
    number: "Mark I",
    name: "The Cave Suit",
    year: "2008",
    film: "Iron Man",
    audio: "/mark1-suitup.mp3",
    specs: [
      { label: "Power", value: "Makeshift Arc Reactor" },
      { label: "Weight", value: "90 lbs" },
      { label: "Top Speed", value: "Unknown" },
      { label: "Status", value: "Destroyed" },
    ],
    story:
      "Built in a cave with a box of scraps. Tony Stark's first suit — crude, heavy, and brilliant. Powered by a makeshift arc reactor, it was never meant to be elegant. It was meant to get him out alive. The suit that started everything.",
    color: "#b87333",
  },
  {
    id: "mark6",
    file: `${BASE}/suit-mark6.glb`,
    number: "Mark VI",
    name: "The Reactor Upgrade",
    year: "2010",
    film: "Iron Man 2",
    audio: "/suit-up.mp3",
    specs: [
      { label: "Power", value: "Triangular Arc Reactor" },
      { label: "Weight", value: "25 lbs" },
      { label: "Top Speed", value: "Mach 8" },
      { label: "Status", value: "Retired" },
    ],
    story:
      "Powered by a new triangular arc reactor using a synthesized element. Tony built this suit to replace the palladium core that was slowly killing him. Sleeker, faster, and built to last. It faced Whiplash and the Hammer drones — and won.",
    color: "#c0c0c0",
  },
  {
    id: "mark7",
    file: `${BASE}/suit-mark7.glb`,
    number: "Mark VII",
    name: "The Avengers Suit",
    year: "2012",
    film: "The Avengers",
    audio: "/suit-up.mp3",
    specs: [
      { label: "Power", value: "Arc Reactor Mk IV" },
      { label: "Weight", value: "25 lbs" },
      { label: "Top Speed", value: "Mach 8.7" },
      { label: "Status", value: "Destroyed" },
    ],
    story:
      "Deployed mid-air during the Battle of New York. The Mark VII introduced bracelet-based deployment — Tony could call it to him at any time. It carried him through a wormhole with a nuclear warhead and back. Almost didn't make it.",
    color: "#d4a22f",
  },
  {
    id: "mark50",
    file: `${BASE}/suit-mark50.glb`,
    number: "Mark L",
    name: "Nanotech Suit",
    year: "2018",
    film: "Avengers: Infinity War",
    audio: "/suit-up.mp3",
    specs: [
      { label: "Power", value: "Chest Arc Reactor" },
      { label: "Weight", value: "Negligible" },
      { label: "Top Speed", value: "Mach 10+" },
      { label: "Status", value: "Damaged" },
    ],
    story:
      "The first nanotech suit. Stored in Tony's arc reactor chest piece, it assembles itself around him in seconds. Fought Thanos on Titan. Nearly won. The suit that proved Tony Stark was the only one who could draw blood from a god.",
    color: "#60c8ff",
  },
  {
    id: "hulkbuster",
    file: `${BASE}/suit-hulkbuster.glb`,
    number: "Mark XLIV",
    name: "Hulkbuster",
    year: "2015",
    film: "Age of Ultron",
    audio: "/suit-up.mp3",
    specs: [
      { label: "Power", value: "Dual Arc Reactors" },
      { label: "Weight", value: "~5,000 lbs" },
      { label: "Top Speed", value: "Mach 2" },
      { label: "Status", value: "Destroyed" },
    ],
    story:
      "Co-designed by Tony Stark and Bruce Banner as a last resort. Built to contain an uncontrollable Hulk. Modular, self-repairing, and powerful enough to level a city block. It took everything Tony had — and then some.",
    color: "#d4a22f",
  },
  {
    id: "mark85",
    file: `${BASE}/suit-mark85.glb`,
    number: "Mark LXXXV",
    name: "The Final Suit",
    year: "2023",
    film: "Avengers: Endgame",
    audio: "/suit-up.mp3",
    specs: [
      { label: "Power", value: "Nano Arc Reactor" },
      { label: "Weight", value: "Negligible" },
      { label: "Top Speed", value: "Mach 10+" },
      { label: "Status", value: "Final" },
    ],
    story:
      "Tony's last and greatest creation. Built with nano-technology and an upgraded arc reactor, it housed the Infinity Stones for one final snap. The suit that saved the universe — and cost him everything. I am Iron Man.",
    color: "#d4a22f",
  },
];

SUITS.forEach((s) => useGLTF.preload(s.file));

// ─── 3D Model ─────────────────────────────────────────────────────────────────

function SuitModel3D({ file, visible }: { file: string; visible: boolean }) {
  const { scene } = useGLTF(file);
  const groupRef = useRef<THREE.Group>(null);
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = maxDim > 0 ? 2.8 / maxDim : 1;
    if (groupRef.current) groupRef.current.scale.setScalar(s);

    const centre = new THREE.Vector3();
    box.getCenter(centre);
    scene.position.sub(centre);

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          (m as THREE.MeshStandardMaterial).envMapIntensity = 2.5;
        });
      }
    });
  }, [scene]);

  useFrame(() => {
    if (!groupRef.current || !visible) return;
    groupRef.current.position.y = Math.sin(Date.now() * 0.0006) * 0.06;
  });

  return (
    <group ref={groupRef} visible={visible}>
      <primitive object={scene} />
    </group>
  );
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

function SuitsCanvas({ activeIndex }: { activeIndex: number }) {
  const suit = SUITS[activeIndex];
  return (
    <Canvas
      camera={{ position: [0, 0.3, 3.8], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <ambientLight intensity={1.0} />
      <pointLight position={[0, 1, 3]} intensity={12} color={suit.color} />
      <pointLight position={[4, 4, 1]} intensity={6} color="#ffffff" />
      <pointLight position={[-4, -2, -2]} intensity={4} color={suit.color} />
      <pointLight position={[0, -3, 2]} intensity={3} color="#60c8ff" />
      <Suspense fallback={null}>
        {SUITS.map((s, i) => (
          <SuitModel3D key={s.id} file={s.file} visible={i === activeIndex} />
        ))}
        <Environment preset="studio" />
      </Suspense>
      <OrbitControls
        autoRotate
        autoRotateSpeed={1.0}
        enableZoom={true}
        enablePan={false}
        minDistance={2}
        maxDistance={7}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.5}
      />
    </Canvas>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SuitsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right">("right");
  const [animKey, setAnimKey] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((src: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const a = new Audio(src);
    a.volume = 0.7;
    a.play().catch(() => {});
    audioRef.current = a;
  }, []);

  const goTo = useCallback(
    (idx: number, dir: "left" | "right") => {
      setAnimDir(dir);
      setAnimKey((k) => k + 1);
      setActiveIndex(idx);
      playAudio(SUITS[idx].audio);
    },
    [playAudio]
  );

  const prev = () => {
    const idx = (activeIndex - 1 + SUITS.length) % SUITS.length;
    goTo(idx, "left");
  };

  const next = () => {
    const idx = (activeIndex + 1) % SUITS.length;
    goTo(idx, "right");
  };

  // keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const suit = SUITS[activeIndex];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">

      {/* ── Grain overlay ── */}
      <div className="grain pointer-events-none fixed inset-0 z-50" />

      {/* ── Background glow ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 60% 60% at 60% 50%, ${suit.color}18 0%, transparent 70%)`,
        }}
      />

      {/* ── Navbar ── */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.32em] text-zinc-400 transition-colors hover:text-foreground"
          >
            <ArrowLeft size={12} weight="bold" />
            Back
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-foreground">
            Stark Industries // Suit Archive
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
            {String(activeIndex + 1).padStart(2, "0")} / {String(SUITS.length).padStart(2, "0")}
          </span>
        </div>
      </header>

      {/* ── HUD corners ── */}
      <div className="pointer-events-none fixed left-6 top-24 z-30 text-accent md:left-10 md:top-28">
        <HudFrame corner="tl" size={26} />
      </div>
      <div className="pointer-events-none fixed right-6 top-24 z-30 text-accent md:right-10 md:top-28">
        <HudFrame corner="tr" size={26} />
      </div>
      <div className="pointer-events-none fixed bottom-14 left-6 z-30 text-accent md:bottom-16 md:left-10">
        <HudFrame corner="bl" size={26} />
      </div>
      <div className="pointer-events-none fixed bottom-14 right-6 z-30 text-accent md:bottom-16 md:right-10">
        <HudFrame corner="br" size={26} />
      </div>

      {/* ── Main layout ── */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center pt-20 md:flex-row md:items-center md:justify-center md:gap-0">

        {/* Left arrow */}
        <button
          onClick={prev}
          aria-label="Previous suit"
          className="group fixed left-4 top-1/2 z-30 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-200 hover:border-accent/40 hover:bg-white/10 md:left-6"
        >
          <ArrowLeft
            size={18}
            weight="bold"
            className="text-zinc-400 transition-colors group-hover:text-accent"
          />
        </button>

        {/* Right arrow */}
        <button
          onClick={next}
          aria-label="Next suit"
          className="group fixed right-4 top-1/2 z-30 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-200 hover:border-accent/40 hover:bg-white/10 md:right-6"
        >
          <ArrowRight
            size={18}
            weight="bold"
            className="text-zinc-400 transition-colors group-hover:text-accent"
          />
        </button>

        {/* ── Text panel ── */}
        <div
          key={`text-${animKey}`}
          className="flex w-full max-w-[42ch] flex-col gap-6 px-8 pb-6 pt-4 text-center md:w-[38%] md:px-12 md:pb-0 md:pt-0 md:text-left"
          style={{
            animation: `suitSlideIn${animDir === "right" ? "Right" : "Left"} 0.5s cubic-bezier(0.22,1,0.36,1) both`,
          }}
        >
          {/* Film + year */}
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <span className="h-px w-10 shrink-0" style={{ background: suit.color }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[0.32em]"
              style={{ color: suit.color }}
            >
              {suit.film} &mdash; {suit.year}
            </span>
          </div>

          {/* Suit number + name */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              {suit.number}
            </p>
            <h1 className="mt-1 font-sans text-4xl font-semibold leading-[0.92] tracking-tighter text-foreground md:text-5xl lg:text-6xl">
              {suit.name}
            </h1>
          </div>

          {/* Story */}
          <p className="font-sans text-sm leading-relaxed text-zinc-400 md:text-base">
            {suit.story}
          </p>

          {/* Specs */}
          <div className="grid grid-cols-2 gap-3 border-t border-white/8 pt-4">
            {suit.specs.map((spec) => (
              <div key={spec.label} className="flex flex-col gap-0.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-600">
                  {spec.label}
                </span>
                <span className="font-sans text-sm font-medium text-foreground">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>

          {/* Dot nav */}
          <div className="flex items-center justify-center gap-2 md:justify-start">
            {SUITS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i, i > activeIndex ? "right" : "left")}
                className="h-1.5 w-1.5 rounded-full transition-all duration-300"
                style={{
                  background: i === activeIndex ? suit.color : "rgba(255,255,255,0.2)",
                  boxShadow: i === activeIndex ? `0 0 8px ${suit.color}` : "none",
                  transform: i === activeIndex ? "scale(1.4)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── 3D Model ── */}
        <div
          key={`model-${animKey}`}
          className="relative h-[55vw] w-full max-h-[600px] max-w-[600px] shrink-0 md:h-[80vh] md:w-[50vw]"
          style={{
            animation: `suitScaleIn 0.6s cubic-bezier(0.22,1,0.36,1) both`,
          }}
        >
          {/* Circular HUD ring behind model */}
          <div
            className="pointer-events-none absolute inset-[10%] rounded-full border opacity-20"
            style={{ borderColor: suit.color }}
          />
          <div
            className="pointer-events-none absolute inset-[18%] rounded-full border opacity-10"
            style={{ borderColor: suit.color }}
          />
          <SuitsCanvas activeIndex={activeIndex} />
        </div>
      </main>

      {/* ── Bottom bar ── */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
        <div className="mx-6 mb-3 h-px md:mx-10" style={{ background: `${suit.color}40` }}>
          <div
            className="h-full origin-left transition-transform duration-500"
            style={{
              background: suit.color,
              transform: `scaleX(${(activeIndex + 1) / SUITS.length})`,
            }}
          />
        </div>
        <div className="mx-6 flex items-center justify-between pb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500 md:mx-10">
          <span>← → Arrow keys to navigate</span>
          <span>J.A.R.V.I.S. // Suit Archive</span>
          <span>{suit.number} // {suit.film}</span>
        </div>
      </div>

      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes suitSlideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes suitSlideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes suitScaleIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

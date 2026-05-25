"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { HudFrame } from "@/components/ui/HudFrame";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";

// ─── Suit data ────────────────────────────────────────────────────────────────

const SUITS = [
  {
    id: "mark1",
    file: "/suit-mark1.glb",
    number: "Mark I",
    name: "The Cave Suit",
    year: "2008",
    film: "Iron Man",
    story:
      "Built in a cave with a box of scraps. Tony Stark's first suit — crude, heavy, and brilliant. Powered by a makeshift arc reactor, it was never meant to be elegant. It was meant to get him out alive.",
    color: "#b87333",
  },
  {
    id: "mark6",
    file: "/suit-mark6.glb",
    number: "Mark VI",
    name: "The Reactor Upgrade",
    year: "2010",
    film: "Iron Man 2",
    story:
      "Powered by a new triangular arc reactor using a synthesized element. Tony built this suit to replace the palladium core that was slowly killing him. Sleeker, faster, and built to last.",
    color: "#c0c0c0",
  },
  {
    id: "mark7",
    file: "/suit-mark7.glb",
    number: "Mark VII",
    name: "The Avengers Suit",
    year: "2012",
    film: "The Avengers",
    story:
      "Deployed mid-air during the Battle of New York. The Mark VII introduced bracelet-based deployment — Tony could call it to him at any time. It carried him through a wormhole and back.",
    color: "#d4a22f",
  },
  {
    id: "mark50",
    file: "/suit-mark50.glb",
    number: "Mark L",
    name: "Nanotech Suit",
    year: "2018",
    film: "Avengers: Infinity War",
    story:
      "The first nanotech suit. Stored in Tony's arc reactor chest piece, it assembles itself around him in seconds. Fought Thanos on Titan. Nearly won.",
    color: "#60c8ff",
  },
  {
    id: "hulkbuster",
    file: "/suit-hulkbuster.glb",
    number: "Mark XLIV",
    name: "Hulkbuster",
    year: "2015",
    film: "Age of Ultron",
    story:
      "Co-designed by Tony Stark and Bruce Banner as a last resort. Built to contain an uncontrollable Hulk. Modular, self-repairing, and powerful enough to level a city block.",
    color: "#d4a22f",
  },
  {
    id: "mark85",
    file: "/suit-mark85.glb",
    number: "Mark LXXXV",
    name: "The Final Suit",
    year: "2023",
    film: "Avengers: Endgame",
    story:
      "Tony's last and greatest creation. Built with nano-technology and an upgraded arc reactor, it housed the Infinity Stones for one final snap. The suit that saved the universe — and cost him everything.",
    color: "#d4a22f",
  },
];

// Preload all models
SUITS.forEach((s) => useGLTF.preload(s.file));

// ─── Single suit model (always mounted, hidden when not active) ───────────────

function SuitModel({
  file,
  color,
  visible,
}: {
  file: string;
  color: string;
  visible: boolean;
}) {
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
    const s = maxDim > 0 ? 2.4 / maxDim : 1;
    if (groupRef.current) groupRef.current.scale.setScalar(s);

    const centre = new THREE.Vector3();
    box.getCenter(centre);
    scene.position.sub(centre);

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        mats.forEach((m) => {
          (m as THREE.MeshStandardMaterial).envMapIntensity = 2;
        });
      }
    });
  }, [scene]);

  useFrame(() => {
    if (!groupRef.current || !visible) return;
    groupRef.current.position.y = Math.sin(Date.now() * 0.0007) * 0.05;
  });

  return (
    <group ref={groupRef} visible={visible}>
      <primitive object={scene} />
    </group>
  );
}

// ─── Shared canvas with all models ───────────────────────────────────────────

function SuitsCanvas({
  activeIndex,
}: {
  activeIndex: number;
}) {
  const suit = SUITS[activeIndex];

  return (
    <Canvas
      camera={{ position: [0, 0.5, 3.5], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <ambientLight intensity={1.2} />
      <pointLight position={[0, 0, 3]} intensity={10} color={suit.color} />
      <pointLight position={[3, 3, 1]} intensity={5} color="#ffffff" />
      <pointLight position={[-3, -1, -2]} intensity={3} color={suit.color} />
      <Suspense fallback={null}>
        {SUITS.map((s, i) => (
          <SuitModel
            key={s.id}
            file={s.file}
            color={s.color}
            visible={i === activeIndex}
          />
        ))}
        <Environment preset="studio" />
      </Suspense>
      <OrbitControls
        autoRotate
        autoRotateSpeed={1.2}
        enableZoom={true}
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.6}
      />
    </Canvas>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function SuitsShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const tickingRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

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

        const sliceSize = 1 / SUITS.length;
        const idx = Math.min(
          SUITS.length - 1,
          Math.floor(progress / sliceSize)
        );

        if (idx !== activeIndexRef.current) {
          activeIndexRef.current = idx;
          setActiveIndex(idx);
        }

        if (progressFillRef.current) {
          progressFillRef.current.style.transform = `scaleX(${progress})`;
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const suit = SUITS[activeIndex];

  return (
    <section
      ref={sectionRef}
      id="suits"
      className="relative border-t border-white/5 bg-background"
      style={{ height: `${SUITS.length * 100}vh` }}
    >
      <div
        className="sticky top-0 overflow-hidden bg-background"
        style={{ height: "100dvh" }}
      >
        {/* Vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(10,10,11,0.5) 75%, rgba(10,10,11,0.92) 100%)",
          }}
        />

        {/* HUD corners */}
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

        {/* Top label */}
        <div className="pointer-events-none absolute left-6 top-20 z-20 flex items-center gap-2 md:left-10 md:top-24">
          <div className="h-px w-8 bg-accent/60" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-400">
            Suit Archive &mdash; Chronological
          </span>
        </div>

        {/* Eyebrow badge */}
        <div className="pointer-events-none absolute left-1/2 top-20 z-20 -translate-x-1/2 md:top-24">
          <EyebrowBadge>STARK INDUSTRIES // SUIT ARCHIVE</EyebrowBadge>
        </div>

        {/* Dot nav */}
        <div className="pointer-events-none absolute right-6 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2 md:right-10">
          {SUITS.map((s, i) => (
            <div
              key={s.id}
              className="h-1.5 w-1.5 rounded-full transition-all duration-300"
              style={{
                background:
                  i === activeIndex ? s.color : "rgba(255,255,255,0.2)",
                boxShadow:
                  i === activeIndex ? `0 0 8px ${s.color}` : "none",
              }}
            />
          ))}
        </div>

        {/* Layout: text left, canvas right */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center md:flex-row md:items-center md:justify-between md:px-16 lg:px-24">

          {/* Text — transitions on activeIndex change */}
          <div
            key={suit.id}
            className="z-10 flex max-w-[44ch] animate-fadeSlideIn flex-col gap-5 px-6 pb-6 pt-24 text-center md:max-w-[38ch] md:px-0 md:pb-0 md:pt-0 md:text-left"
          >
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <span className="inline-block h-px w-8" style={{ background: suit.color }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[0.32em]"
                style={{ color: suit.color }}
              >
                {suit.film} &mdash; {suit.year}
              </span>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                {suit.number}
              </p>
              <h2 className="mt-1 font-sans text-4xl font-semibold leading-[0.95] tracking-tighter text-foreground md:text-5xl lg:text-6xl">
                {suit.name}
              </h2>
            </div>

            <p className="font-sans text-sm leading-relaxed text-zinc-400 md:text-base">
              {suit.story}
            </p>

            <div className="flex items-center justify-center gap-2 md:justify-start">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: suit.color, boxShadow: `0 0 8px ${suit.color}` }}
              />
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
                {activeIndex + 1} / {SUITS.length}
              </span>
            </div>
          </div>

          {/* Single shared canvas */}
          <div className="relative h-[45vw] w-full max-h-[480px] max-w-[480px] shrink-0 md:h-[55vh] md:w-[45vw]">
            <SuitsCanvas activeIndex={activeIndex} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
          <div className="mx-6 mb-3 h-px bg-white/10 md:mx-10">
            <div
              ref={progressFillRef}
              className="h-full origin-left bg-accent"
              style={{
                transform: "scaleX(0)",
                transition: "transform 80ms linear",
              }}
            />
          </div>
          <div className="mx-6 flex items-center justify-between pb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500 md:mx-10">
            <span>
              SUIT {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(SUITS.length).padStart(2, "0")}
            </span>
            <span>J.A.R.V.I.S. // SUIT ARCHIVE</span>
            <span>Scroll &darr;</span>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Navbar } from "@/components/ui/Navbar";
import { Hero } from "@/components/sections/Hero";
import { CinematicReveal } from "@/components/sections/CinematicReveal";
import { ArcReactor } from "@/components/sections/ArcReactor";
import { SuitsShowcase } from "@/components/sections/SuitsShowcase";
import { SystemsNominal } from "@/components/sections/SystemsNominal";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CinematicReveal />
        <ArcReactor />
        <SuitsShowcase />
        <SystemsNominal />
      </main>
      <Footer />
    </>
  );
}

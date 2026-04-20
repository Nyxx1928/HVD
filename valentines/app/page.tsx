import HeroSection from "@/components/HeroSection";
import LoveWall from "@/components/LoveWall";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 dark:bg-black dark:text-zinc-50">
      <HeroSection />

      <LoveWall />
    </div>
  );
}

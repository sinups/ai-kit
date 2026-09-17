import { BentoSection } from "@/app/components/landing/bento-section";
import { FactsSection } from "@/app/components/landing/facts-section";
import { Hero } from "@/app/components/landing/hero";
import { LandingFooter } from "@/app/components/landing/landing-footer";
import { LandingHeader } from "@/app/components/landing/landing-header";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <FactsSection />
        <BentoSection />
      </main>
      <LandingFooter />
    </div>
  );
}

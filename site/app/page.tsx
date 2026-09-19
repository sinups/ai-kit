import { AgentSetupSection } from "@/app/components/landing/agent-setup-section";
import { BentoSection } from "@/app/components/landing/bento-section";
import { FactsSection } from "@/app/components/landing/facts-section";
import { FAQ, FaqSection } from "@/app/components/landing/faq-section";
import { Hero } from "@/app/components/landing/hero";
import { LandingFooter } from "@/app/components/landing/landing-footer";
import { LandingHeader } from "@/app/components/landing/landing-header";
import { homeJsonLd } from "@/app/lib/seo";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd(FAQ)) }}
      />
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <FactsSection />
        <BentoSection />
        <AgentSetupSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  );
}

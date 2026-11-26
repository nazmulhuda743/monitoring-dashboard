import { Background } from "@/components/dashboard/Background";
import { BriefProvider } from "@/components/dashboard/BriefProvider";
import { ClientsSection } from "@/components/dashboard/ClientsSection";
import { ContentSection } from "@/components/dashboard/ContentSection";
import { DecisionsSection } from "@/components/dashboard/DecisionsSection";
import { EnergySection } from "@/components/dashboard/EnergySection";
import { EverythingElseSection } from "@/components/dashboard/EverythingElseSection";
import { Hero } from "@/components/dashboard/Hero";
import { NeedsSection } from "@/components/dashboard/NeedsSection";
import { ProjectsSection } from "@/components/dashboard/ProjectsSection";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { SupportSection } from "@/components/dashboard/SupportSection";
import { WaitingSection } from "@/components/dashboard/WaitingSection";

export default function MorningBrief() {
  return (
    <BriefProvider>
      <div id="top" className="relative min-h-screen bg-ink text-fg">
        <Background />
        <div className="relative z-[1] flex min-h-screen">
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 pt-[84px] pb-20 sm:px-[clamp(20px,4vw,56px)] lg:pt-7 lg:pb-[120px]">
            <div className="mx-auto flex max-w-[1180px] flex-col gap-16 lg:gap-[104px]">
              <div className="flex flex-col gap-4">
                <Hero />
                <EnergySection />
                <SummaryCards />
              </div>
              <NeedsSection />
              <WaitingSection />
              <ProjectsSection />
              <ClientsSection />
              <ContentSection />
              <SupportSection />
              <DecisionsSection />
              <EverythingElseSection />
            </div>
          </main>
        </div>
      </div>
    </BriefProvider>
  );
}

import { CtaSection } from "@/components/home/CtaSection";
import { HeroSection } from "@/components/home/HeroSection";
import { PillarsSection } from "@/components/home/PillarsSection";
import { PipelineSection } from "@/components/home/PipelineSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <PillarsSection />
      <PipelineSection />
      <CtaSection />
    </>
  );
}

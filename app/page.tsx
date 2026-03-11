"use client"

import { OpeningSection } from "@/components/about/opening-section"
import { PerspectiveHero } from "@/components/about/perspective-hero"
import { AboutCWrite } from "@/components/about/about-cwrite"
import { HowWeEnhance } from "@/components/about/how-we-enhance"
import { ValuesEducation } from "@/components/about/values-education"
import { PhilosophySection } from "@/components/about/philosophy-section"
import { VisionSection } from "@/components/about/vision-section"
import { ResearchTeam } from "@/components/about/research-team"

export default function AboutRoutePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8faff] via-[#fff8fb] to-[#fffdf5]">
      <OpeningSection />
      <PerspectiveHero />
      <AboutCWrite />
      <HowWeEnhance />
      <ValuesEducation />
      <PhilosophySection />
      <VisionSection />
      <ResearchTeam />
    </main>
  )
}

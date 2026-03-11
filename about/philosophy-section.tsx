"use client"

import { useEffect, useState, useRef } from "react"

export function PhilosophySection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.2 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 px-4 overflow-hidden"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-40 bg-gradient-to-b from-[#FFD84D] via-[#FFD84D]/50 to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-[#FFD84D]/20 via-[#FF8CC8]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#f8faff] via-[#fffdf5] to-[#fff8fb] opacity-80" />

      <div className="relative max-w-4xl mx-auto">
        <div
          className={`relative text-center mb-12 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-[#FFD84D]/30 to-transparent blur-2xl" />

          <h2 className="relative font-serif text-4xl lg:text-5xl font-bold text-[#1a1a2e]">
            The Philosophy behind LuminAI
          </h2>
        </div>

        <div
          className={`space-y-6 text-lg text-[#3a3a4a] leading-relaxed transition-all duration-1000 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="relative pl-6 border-l-4 border-[#FFD84D]">
            Derived from the Latin <span className="italic text-[#2F6BFF] font-medium">lumen</span>—meaning light—LuminAI represents{" "}
            <strong className="text-[#1a1a2e]">illumination rather than domination</strong>. We believe that AI is not an all-knowing authority. LuminAI is grounded in the belief that intelligence should guide, reveal, and amplify, not replace human agency.
          </p>

          <div className="flex items-center justify-center gap-4 py-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2F6BFF]/30 to-transparent" />
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#2F6BFF] to-[#FF8CC8]" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#FF8CC8]/30 to-transparent" />
          </div>

          <p className="relative pl-6 border-l-4 border-[#FF8CC8]">
            LuminAI aligns with <strong className="text-[#1a1a2e]">humanistic and constructivist traditions</strong> in education, where knowledge is actively constructed through reflection, dialogue, and experience. Intelligence is understood not as a static output, but as a{" "}
            <strong className="text-[#1a1a2e]">dynamic process of meaning-making</strong>.
          </p>
        </div>

        <div className="absolute -left-8 top-1/2 w-24 h-24 border-2 border-[#2F6BFF]/20 rounded-full opacity-50" />
        <div className="absolute -right-8 top-1/3 w-16 h-16 border-2 border-[#FF8CC8]/20 rounded-full opacity-50" />
      </div>
    </section>
  )
}


"use client"

import { useEffect, useState, useRef } from "react"

export function VisionSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.15 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  const visionItems = [
    "Reshape creative writing education for the digital age.",
    "Become a global innovator in creative writing education.",
    "Cultivate the next generation of creative leaders.",
  ]

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 px-4 overflow-hidden bg-gradient-to-b from-[#fff8fb] to-[#f8faff]"
    >
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-[#2F6BFF]/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gradient-to-br from-[#FF8CC8]/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4">
          <div
            className={`relative transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="p-8 lg:p-10 rounded-[2rem] bg-white/70 backdrop-blur-sm border border-white/80 shadow-xl h-full">
              <h3 className="font-serif text-3xl lg:text-4xl font-bold text-[#1a1a2e] mb-6 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#2F6BFF]" />
                Our Vision
              </h3>

              <ul className="space-y-4">
                {visionItems.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-[#3a3a4a] text-lg"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#2F6BFF] to-[#5a8eff] flex items-center justify-center text-white text-sm font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="hidden lg:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px items-center justify-center">
            <div
              className={`w-full h-3/4 transition-all duration-1000 delay-500 ${
                isVisible ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
              }`}
              style={{
                background: "linear-gradient(to bottom, transparent, #2F6BFF, #FF8CC8, #FFD84D, transparent)",
              }}
            />
          </div>

          <div
            className={`relative transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="p-8 lg:p-10 rounded-[2rem] bg-white/70 backdrop-blur-sm border border-white/80 shadow-xl h-full">
              <h3 className="font-serif text-3xl lg:text-4xl font-bold text-[#1a1a2e] mb-6 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#FF8CC8]" />
                Research Vision
              </h3>

              <div className="space-y-6 text-[#3a3a4a] text-lg leading-relaxed">
                <p>
                  We are committed to designing <strong className="text-[#1a1a2e]">human-centered, AI-supported learning frameworks</strong> that integrate self-regulated learning and educational technology to improve the effectiveness and equity of language and interdisciplinary learning.
                </p>
                <p>
                  We examine AI&apos;s role in teaching as an <strong className="text-[#1a1a2e]">inspiration and feedback tool</strong> that helps learners remain agentic, develop critical digital literacy, and adopt sustainable learning strategies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


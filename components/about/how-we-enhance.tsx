"use client"

import { useEffect, useState, useRef } from "react"
import { Bot, BookOpen, Users } from "lucide-react"

const cards = [
  {
    icon: Bot,
    title: "AI as a Writing Partner",
    color: "#2F6BFF",
    items: [
      "Thought-provoking prompts that stimulate imagination",
      "Context-aware revision and language support",
      "Keep personal voice",
    ],
  },
  {
    icon: BookOpen,
    title: "Self-Regulated Learning at the Core",
    color: "#FF8CC8",
    items: [
      "Plan, monitor, and evaluate",
      "Develop independence, metacognition, and writing confidence",
      "Build reflective thinking",
    ],
  },
  {
    icon: Users,
    title: "Learning Through Collaboration",
    color: "#FFD84D",
    items: [
      "Share writing in the Luminai Library",
      "Peer review and feedback",
      "Learn through comparison, dialogue, and revision",
    ],
  },
]

export function HowWeEnhance() {
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

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 px-4 bg-gradient-to-b from-[#f8faff] to-[#fff8fb]"
    >
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-gradient-to-r from-[#2F6BFF]/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-gradient-to-l from-[#FF8CC8]/5 to-transparent rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto">
        <h2
          className={`font-serif text-4xl lg:text-5xl font-bold text-[#1a1a2e] text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          How We Enhance Creative Writing
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {cards.map((card, index) => {
            const Icon = card.icon
            return (
              <div
                key={index}
                className={`group relative transition-all duration-700 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`}
                style={{
                  transitionDelay: `${index * 150}ms`,
                }}
              >
                <div className="relative p-8 rounded-[2rem] bg-white/80 backdrop-blur-sm border border-white shadow-lg hover:shadow-2xl transition-all duration-500 h-full">
                  <div
                    className="absolute -inset-1 rounded-[2.2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                    style={{
                      background: `linear-gradient(135deg, ${card.color}20 0%, transparent 50%)`,
                    }}
                  />

                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundColor: card.color }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-[#1a1a2e] mb-4 group-hover:text-[#2F6BFF] transition-colors duration-300">
                    {card.title}
                  </h3>

                  <ul className="space-y-3">
                    {card.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-[#5a5a7a]">
                        <span
                          className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                          style={{ backgroundColor: card.color }}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


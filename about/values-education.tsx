"use client"

import { useEffect, useState, useRef } from "react"

const values = [
  "Perseverance",
  "Respect for Others",
  "Responsibility",
  "National Identity",
  "Commitment",
  "Integrity",
  "Benevolence",
  "Law-abidingness",
  "Empathy",
  "Diligence",
  "Filial Piety",
  "Unity",
]

const colors = ["#2F6BFF", "#FF8CC8", "#FFD84D", "#5a8eff", "#ffb8dc", "#ffeb99"]

export function ValuesEducation() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
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

  const positions = [
    { x: 10, y: 15 },
    { x: 35, y: 5 },
    { x: 60, y: 18 },
    { x: 85, y: 8 },
    { x: 5, y: 45 },
    { x: 28, y: 38 },
    { x: 52, y: 50 },
    { x: 78, y: 42 },
    { x: 15, y: 75 },
    { x: 42, y: 82 },
    { x: 68, y: 72 },
    { x: 90, y: 80 },
  ]

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 px-4 overflow-hidden bg-gradient-to-b from-[#fff8fb] to-[#f8faff]"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#2F6BFF]/10 via-[#FF8CC8]/10 to-[#FFD84D]/10 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto">
        <h2
          className={`font-serif text-4xl lg:text-5xl font-bold text-[#1a1a2e] text-center mb-20 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Values Education in Action
        </h2>

        <div className="hidden lg:block relative h-[500px]">
          {values.map((value, index) => {
            const color = colors[index % colors.length]
            const pos = positions[index]
            const isHovered = hoveredIndex === index

            return (
              <div
                key={value}
                className={`absolute transition-all duration-500 cursor-pointer ${
                  isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) ${isHovered ? "scale(1.15)" : "scale(1)"}`,
                  transitionDelay: `${index * 80}ms`,
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className="relative px-6 py-4 rounded-full font-medium text-white shadow-lg transition-all duration-300"
                  style={{
                    backgroundColor: color,
                    boxShadow: isHovered
                      ? `0 0 30px ${color}60, 0 10px 40px ${color}40`
                      : `0 4px 15px ${color}30`,
                  }}
                >
                  {isHovered && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{
                        backgroundColor: color,
                        opacity: 0.3,
                      }}
                    />
                  )}
                  <span className="relative z-10">{value}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-4">
          {values.map((value, index) => {
            const color = colors[index % colors.length]

            return (
              <div
                key={value}
                className={`transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                <div
                  className="px-4 py-3 rounded-full font-medium text-white text-center text-sm shadow-lg hover:scale-105 transition-transform duration-300"
                  style={{
                    backgroundColor: color,
                  }}
                >
                  {value}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


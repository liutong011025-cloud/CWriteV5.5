"use client"

import { useEffect, useState, useRef } from "react"
import { Sparkles, Wand2, Brain, Shield } from "lucide-react"
import Image from "next/image"

const features = [
  {
    icon: Sparkles,
    title: "Support students' creative writing processes",
    gradient: "from-[#FFD84D] to-[#ffeb99]",
  },
  {
    icon: Wand2,
    title: "Preserve students' personal voice",
    gradient: "from-[#FF8CC8] to-[#ffb8dc]",
  },
  {
    icon: Brain,
    title: "Encourage metacognitive engagement",
    gradient: "from-[#2F6BFF] to-[#6b9eff]",
  },
  {
    icon: Shield,
    title: "Promote responsible AI use",
    gradient: "from-[#5a8eff] to-[#8fb3ff]",
  },
]

export function AboutCWrite() {
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
      {/* 顶部 CWrite logo：使用 logobig.png */}
      <div
        className={`flex justify-center mb-10 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="relative w-64 h-24">
          <Image
            src="/logobig.png"
            alt="CWrite logo"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* 背景装饰保持 v0 风格 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#2F6BFF]/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#FF8CC8]/10 to-transparent rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto">
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#1a1a2e] mb-4">
            About CWrite
          </h2>
          <p className="text-xl text-[#5a5a7a] max-w-2xl mx-auto">
            An AI-powered writing platform grounded in self-regulated learning and learning sciences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`group relative p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/80 shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                <div
                  className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                />

                <div className="relative flex items-start gap-5">
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#1a1a2e] group-hover:text-[#2F6BFF] transition-colors duration-300">
                      {feature.title}
                    </h3>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


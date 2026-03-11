"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"

export function PerspectiveHero() {
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
      className="relative min-h-screen overflow-hidden flex items-center justify-center"
    >
      {/* 背景油画：用 Background.png 覆盖原来的 Primavera 占位 */}
      <div
        className="absolute inset-0 transition-transform duration-700"
        style={{
          transform: `translateY(${(scrollY - 800) * 0.15}px)`,
        }}
      >
        <div className="absolute inset-0">
          <Image
            src="/Background.png"
            alt="Our philosophy background artwork"
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* 渐变光效保持设计 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(47,107,255,0.3) 0%, rgba(255,140,200,0.2) 40%, rgba(255,216,77,0.1) 70%, rgba(0,0,0,0.6) 100%)",
          }}
        />
      </div>

      {/* 中央玻璃卡片：保留 v0 文案与样式 */}
      <div
        className={`relative z-10 max-w-4xl mx-4 p-10 lg:p-16 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(20px)",
          borderRadius: "2rem",
          border: "1px solid rgba(255,255,255,0.3)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
          transform: isVisible ? `perspective(1000px) rotateX(2deg)` : "perspective(1000px) rotateX(5deg)",
        }}
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-[#FFD84D]/40 via-[#FF8CC8]/30 to-transparent rounded-full blur-3xl" />

        <h1 className="relative font-serif text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-snug text-center mb-8 text-balance">
          How can AI enhance creative writing for ESL learners while safeguarding originality, agency, and human imagination?
        </h1>

        <div className="text-center space-y-2">
          <p className="text-[#FFD84D] text-lg font-medium italic">
            Creative Writing in the Age of AI
          </p>
          <p className="text-white/80 text-base">
            We see AI as a lens that reframes creativity, not a replacement for human thought.
          </p>
        </div>

        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#FFD84D]/50 rounded-tl-lg" />
        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#FF8CC8]/50 rounded-tr-lg" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#2F6BFF]/50 rounded-bl-lg" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#FFD84D]/50 rounded-br-lg" />
      </div>
    </section>
  )
}


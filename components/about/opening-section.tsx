"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"

export function OpeningSection() {
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden"
    >
      {/* 浮动小圆点背景保持原样 */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-30 animate-pulse"
            style={{
              background: i % 3 === 0 ? "#2F6BFF" : i % 3 === 1 ? "#FFD84D" : "#FF8CC8",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* 文案区域（左） */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16 order-2 lg:order-1">
          <div
            className={`max-w-xl transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="relative p-8 lg:p-12 rounded-[2rem] bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-br from-[#2F6BFF]/20 via-[#FF8CC8]/20 to-[#FFD84D]/20 rounded-full blur-3xl" />
              
              <h1 className="relative font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-[#1a1a2e] leading-tight mb-6 text-balance">
                Creative Writing in the Age of AI
              </h1>
              
              <h2 className="text-xl lg:text-2xl text-[#2F6BFF] font-medium mb-6 italic">
                Where human imagination meets intelligent guidance.
              </h2>
              
              <div className="space-y-4 text-[#3a3a4a] text-lg leading-relaxed">
                <p>
                  CWrite is built upon learning sciences and self-regulated learning principles.
                </p>
                <p>
                  We believe AI should illuminate creativity — not replace it.
                </p>
                <p>
                  Through thoughtful design, we empower students to write with voice, confidence, and agency.
                </p>
              </div>

              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-br from-[#FFD84D] to-[#FF8CC8] rounded-[1rem] -z-10 opacity-60" />
              <div className="absolute -top-4 -right-8 w-12 h-12 bg-[#2F6BFF] rounded-full -z-10 opacity-40" />
            </div>
          </div>
        </div>

        {/* 右侧大背景图：用 flower.png 替换占位图，保留动效 */}
        <div className="flex-1 relative min-h-[50vh] lg:min-h-screen order-1 lg:order-2">
          <div
            className="absolute inset-0 z-0"
            style={{
              overflow: "hidden",
            }}
          >
            <Image
              src="/flower.png"
              alt="Creative pattern background"
              fill
              priority
              className="object-cover"
            />
          </div>

          {/* 渐变遮罩保持原设计 */}
          <div
            className="absolute inset-0 z-10"
            style={{
              background: "linear-gradient(to right, rgba(26,26,46,0.7) 0%, rgba(47,107,255,0.4) 30%, rgba(255,140,200,0.3) 60%, transparent 100%)",
            }}
          />
          <div className="absolute inset-0 bg-[#1a1a2e]/20 z-5" />
        </div>
      </div>
    </section>
  )
}


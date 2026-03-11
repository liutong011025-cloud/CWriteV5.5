"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"

const teamMembers = [
  {
    name: "Dr. YANG, Yin Nicole (PhD)",
    title: "Principal Investigator",
    image: "/Nicole.png",
  },
  {
    name: "Prof. LEE, Chi Kin John, JP (PhD)",
    title: "Co-Principal Investigator & Advisor",
    image: "/john.png",
  },
  {
    name: "Prof. GU, Ming Yue Michelle (PhD)",
    title: "Co-Investigator",
    image: "/apple.png",
  },
  {
    name: "Dr. WONG, Ming Har Ruth (PhD)",
    title: "Co-Investigator",
    image: "/ruth.png",
  },
  {
    name: "Mr. LIU, Tong Tony",
    title: "Research Assistant",
    image: "/Tony.png",
  },
]

export function ResearchTeam() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 px-4 overflow-hidden bg-gradient-to-b from-[#f8faff] via-[#fff8fb] to-[#fffdf5]"
    >
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-l from-[#2F6BFF]/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-gradient-to-r from-[#FF8CC8]/5 to-transparent rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto">
        <h2
          className={`font-serif text-4xl lg:text-5xl font-bold text-[#1a1a2e] text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Research Team
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {teamMembers.map((member, index) => (
            <div
              key={member.name}
              className={`group relative transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              <div className="relative rounded-[2rem] bg-white/80 backdrop-blur-sm border border-white shadow-lg overflow-hidden cursor-default transition-all duration-500">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
                </div>

                <div className="p-5 text-center">
                  <h3 className="font-bold text-[#1a1a2e] text-lg mb-1">
                    {member.name}
                  </h3>
                  <p className="text-[#5a5a7a] text-sm">{member.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


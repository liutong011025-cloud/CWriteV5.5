"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import type { Language } from "@/app/page"

// aboutnew 风格：neo-brutalist 粗边框阴影（用 Tailwind 近似）
const shadowBrutal = "shadow-[4px_4px_0_0_var(--foreground)]"

interface TeamMember {
  id: number
  name: string
  role: string
  subtitle: string
  image: string
  bio: string
}

const topRow: TeamMember[] = [
  {
    id: 1,
    name: "Dr. YANG, Yin Nicole (PhD)",
    role: "Principal Investigator",
    subtitle: "Research Assistant Professor",
    image: "/Nicole.png",
    bio: "Dr. Yang earned her Ph.D. in education from the Education University of Hong Kong, focusing on self-regulated learning in computer-assisted learning environments (e.g., language education). She also holds an MSc in Information Technology in Education from the University of Hong Kong, as well as a bachelor's degree in English education and linguistics. She is a visiting scholar of Paris-Saclay University in 2025, and the University of Munich in 2024.",
  },
  {
    id: 2,
    name: "Prof. LEE, Chi Kin John, JP (PhD)",
    role: "Co-Principal Investigator & Advisor",
    subtitle: "Chair Professor of Curriculum and Instruction",
    image: "/john.png",
    bio: "Professor Lee graduated from The University of Hong Kong and subsequently received an MSc degree from the University of Oxford, and an MA (Education), PhD and Diploma in Education (with distinction) from CUHK. His research interests focus on curriculum and instruction, geographical and environmental education, life and values education, and teacher development and school improvement. Professor Lee was named among the top 1% most-cited scientists in the world in terms of career-long impact (Stanford University).",
  },
]

const bottomRow: TeamMember[] = [
  {
    id: 3,
    name: "Prof. GU, Ming Yue Michelle (PhD)",
    role: "Co-Investigator",
    subtitle: "Professor, Assistant Vice President (Research)",
    image: "/apple.png",
    bio: "Michelle Gu Mingyue was Assistant Professor at The Chinese University of Hong Kong (CUHK) from 2012 to 2017. As a researcher in sociolinguistics, Professor Gu adopts multi-disciplinary approaches to explore the individual-context interplay mediated by languages and semiotics. She has theorised the concept of Digital Trans-literacies and has developed theoretical frameworks to advance the areas of language and identity, multilingualism and mobility, and family language policy.",
  },
  {
    id: 4,
    name: "Dr. WONG, Ming Har Ruth (PhD)",
    role: "Co-Investigator",
    subtitle: "Associate Head of Department, Assistant Professor",
    image: "/ruth.png",
    bio: "Dr. Ruth Wong is an assistant professor at the Department of English Language Education. She joined the university in 2004 and has published research articles in international journals as well as several textbooks and teaching resources for schools in Hong Kong.",
  },
  {
    id: 5,
    name: "Mr. LIU, Tong Tony",
    role: "Research Assistant",
    subtitle: "Graduate of AI & Educational Technology, EdUHK",
    image: "/Tony.png",
    bio: "Graduate of AI & Educational Technology, EdUHK. Research interests in AI and design, robotics automation, and STEM.",
  },
]

const researchVision = {
  title: "Research Vision",
  paragraphs: [
    "We are committed to designing human-centered, AI-supported learning frameworks that integrate self-regulated learning and educational technology to improve the effectiveness and equity of language and interdisciplinary learning.",
    "We examine AI's role in teaching as an inspiration and feedback tool that helps learners remain agentic, develop critical digital literacy, and adopt sustainable learning strategies.",
  ],
}

const translations = {
  en: {
    openingHeadline1: "Creative Writing",
    openingHeadline2: "in the Age of AI",
    openingSubtitle: "Where human imagination meets intelligent guidance.",
    openingP: "CWrite is built upon learning sciences and self-regulated learning principles. We believe AI should illuminate creativity — not replace it. Through thoughtful design, we empower students to write with voice, confidence, and agency.",
    philosophyTitle: "Our Philosophy",
    philosophyText: "Education is about developing the skills, confidence, and habits that writers need to thrive. Technology should support this journey, not shortcut it. We are building for growth, not just efficiency.",
    researchTeamTitle: "Research Team",
    researchTeamSubtitle: "Bringing together decades of expertise in learning science, AI, and education",
    enhanceTitle: "How We Enhance Creative Writing",
    enhancePillar: "Three pillars supporting your creative journey",
    aboutCWriteTitle: "About CWrite & LuminAI",
    valuesTitle: "Our Values in Education",
    visionTitle: "Our Vision",
    valuesItems: ["Perseverance", "Respect for Others", "Responsibility", "National Identity", "Commitment", "Integrity", "Benevolence", "Law-abidingness", "Empathy", "Diligence", "Filial Piety", "Unity"],
    visionItems: ["Reshape creative writing education for the digital age.", "Become a global innovator in creative writing education.", "Cultivate the next generation of creative leaders."],
  },
  zh: {
    openingHeadline1: "創意寫作",
    openingHeadline2: "在 AI 時代",
    openingSubtitle: "讓人的想像力與智能引導相遇。",
    openingP: "CWrite 基於學習科學與自我調節學習原理而建。我們相信 AI 應點亮創意，而非取代它。透過用心的設計，我們幫助學生以聲音、信心與能動性寫作。",
    philosophyTitle: "我們的理念",
    philosophyText: "教育是培養寫作者所需的能力、信心與習慣。科技應支持這段旅程，而非抄捷徑。我們為成長而建，而不只是效率。",
    researchTeamTitle: "研究團隊",
    researchTeamSubtitle: "匯聚學習科學、人工智能與教育領域數十年的專業",
    enhanceTitle: "我們如何增強創意寫作",
    enhancePillar: "三大支柱支持你的創意旅程",
    aboutCWriteTitle: "關於 CWrite 與 LuminAI",
    valuesTitle: "價值觀教育",
    visionTitle: "我們的願景",
    valuesItems: ["坚毅", "尊重他人", "责任感", "国民身份认同", "承担精神", "诚信", "仁爱", "守法", "同理心", "勤奋", "孝亲", "团结"],
    visionItems: ["重塑數碼時代的創意寫作教育。", "成為創意寫作教育的全球創新者。", "培養下一代創意領袖。"],
  },
}

export default function AboutPage({ onBack, language = "en" }: { onBack?: () => void; language?: Language }) {
  const [hoveredTeamId, setHoveredTeamId] = useState<number | null>(null)
  const [teamVisible, setTeamVisible] = useState(false)
  const teamRef = useRef<HTMLElement>(null)
  const t = translations[language as keyof typeof translations] || translations.en

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setTeamVisible(true), { threshold: 0.1 })
    teamRef.current && observer.observe(teamRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: "88px", paddingBottom: "80px" }}>
      {/* ========== Opening (aboutnew: 花紋 flower.png + 主卡 + logo logobig) ========== */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url(/flower.png)",
            backgroundRepeat: "repeat",
            backgroundSize: "420px",
            opacity: 0.75,
          }}
        />
        <div className={`absolute top-16 left-10 w-32 h-32 bg-primary rounded-[2rem] rotate-12 animate-float ${shadowBrutal} z-[1]`} />
        <div className={`absolute bottom-20 right-12 w-24 h-24 bg-secondary rounded-[2rem] -rotate-6 animate-pulse ${shadowBrutal} z-[1]`} />
        <div className={`absolute top-1/3 right-8 w-16 h-16 bg-accent rounded-[1.5rem] rotate-45 animate-pulse ${shadowBrutal} z-[1]`} />
        <div className={`absolute bottom-1/3 left-8 w-20 h-20 bg-chart-2 rounded-[2rem] -rotate-12 animate-float ${shadowBrutal} z-[1]`} style={{ animationDelay: "1s" }} />

        <div className={`relative z-10 max-w-4xl w-full mx-4 md:mx-8 p-10 md:p-20 rounded-[2.5rem] ${shadowBrutal} border-4 border-foreground bg-card/95 backdrop-blur-sm overflow-hidden group hover:shadow-xl transition-all duration-500`}>
          <div className="absolute top-0 right-0 w-28 h-28 bg-primary rounded-bl-[2rem] group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary rounded-tr-[2rem] group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10 text-center">
            <div className="flex justify-center mb-6">
              <Image src="/logobig.png" alt="CWrite" width={220} height={72} className="object-contain h-16 w-auto" unoptimized />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-foreground mb-6 leading-[1.1] tracking-tight">
              {t.openingHeadline1}
              <br />
              {t.openingHeadline2}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-5 font-semibold">
              {t.openingSubtitle}
            </p>
            <div className={`w-24 h-2 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mb-6 ${shadowBrutal}`} />
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
              {t.openingP}
            </p>
          </div>
        </div>
      </section>

      {/* ========== Philosophy (aboutnew: Background.png 全屏 + 玻璃卡) ========== */}
      <section className="py-0 relative overflow-hidden">
        <div className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center">
          <Image src="/Background.png" alt="" fill className="object-cover object-center" unoptimized />
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative z-10 max-w-3xl w-full mx-4 md:mx-8 text-center px-6 md:px-12 py-14 md:py-20 rounded-[2rem] border-2 border-white/20 bg-white/10 backdrop-blur-md shadow-2xl">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">
              {t.philosophyTitle}
            </h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mb-6" />
            <p className="text-lg md:text-xl text-white/90 leading-relaxed font-medium max-w-xl mx-auto">
              {t.philosophyText}
            </p>
          </div>
        </div>
      </section>

      {/* ========== Research Team (aboutnew: Background.png + 上2下3 卡片，頭像用 public) ========== */}
      <section ref={teamRef} className="py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/Background.png" alt="" fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-background/40" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h2 className={`text-4xl md:text-5xl font-black text-foreground mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent transition-all duration-700 ${teamVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              {t.researchTeamTitle}
            </h2>
            <p className={`text-lg text-muted-foreground max-w-2xl mx-auto font-medium transition-all duration-700 delay-100 ${teamVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              {t.researchTeamSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-6">
            {topRow.map((member, index) => (
              <div
                key={member.id}
                className={`group rounded-[2rem] overflow-hidden border-4 border-foreground bg-card hover:-translate-y-2 hover:rotate-1 transition-all duration-500 cursor-pointer relative ${shadowBrutal} hover:shadow-xl ${teamVisible ? "animate-fade-in-up opacity-100" : "opacity-0"}`}
                style={{ animationDelay: `${300 + index * 100}ms` }}
                onMouseEnter={() => setHoveredTeamId(member.id)}
                onMouseLeave={() => setHoveredTeamId(null)}
              >
                <div className="absolute top-3 left-3 z-20 w-8 h-8 bg-primary rounded-[0.75rem] flex items-center justify-center border-2 border-foreground">
                  <span className="text-primary-foreground font-black text-xs">0{index + 1}</span>
                </div>
                <div className="relative h-72 overflow-hidden">
                  <Image src={member.image} alt={member.name} fill className="object-cover object-top group-hover:scale-105 transition-transform duration-500" unoptimized />
                  <div className={`absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-500 ${hoveredTeamId === member.id ? "opacity-100" : "opacity-0"}`}>
                    <p className="text-white text-xs leading-relaxed text-center">{member.bio}</p>
                  </div>
                </div>
                <div className="p-4 relative">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-accent rounded-bl-[1rem] border-l-2 border-b-2 border-foreground group-hover:scale-110 transition-transform duration-500" />
                  <h3 className="text-sm font-black text-foreground mb-1 group-hover:text-primary transition-colors duration-300 pr-12">{member.name}</h3>
                  <p className="text-xs font-bold text-primary mb-0.5">{member.role}</p>
                  <p className="text-xs text-muted-foreground">{member.subtitle}</p>
                </div>
                <div className="absolute bottom-0 left-0 h-1.5 w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r from-primary via-secondary to-accent" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {bottomRow.map((member, index) => (
              <div
                key={member.id}
                className={`group rounded-[2rem] overflow-hidden border-4 border-foreground bg-card hover:-translate-y-2 hover:rotate-1 transition-all duration-500 cursor-pointer relative ${shadowBrutal} hover:shadow-xl ${teamVisible ? "animate-fade-in-up opacity-100" : "opacity-0"}`}
                style={{ animationDelay: `${500 + index * 100}ms` }}
                onMouseEnter={() => setHoveredTeamId(member.id)}
                onMouseLeave={() => setHoveredTeamId(null)}
              >
                <div className="absolute top-3 left-3 z-20 w-8 h-8 bg-primary rounded-[0.75rem] flex items-center justify-center border-2 border-foreground">
                  <span className="text-primary-foreground font-black text-xs">0{index + 3}</span>
                </div>
                <div className="relative h-96 overflow-hidden">
                  <Image src={member.image} alt={member.name} fill className="object-cover object-top group-hover:scale-105 transition-transform duration-500" unoptimized />
                  <div className={`absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-500 ${hoveredTeamId === member.id ? "opacity-100" : "opacity-0"}`}>
                    <p className="text-white text-xs leading-relaxed text-center">{member.bio}</p>
                  </div>
                </div>
                <div className="p-4 relative">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-accent rounded-bl-[1rem] border-l-2 border-b-2 border-foreground group-hover:scale-110 transition-transform duration-500" />
                  <h3 className="text-sm font-black text-foreground mb-1 group-hover:text-primary transition-colors duration-300 pr-12">{member.name}</h3>
                  <p className="text-xs font-bold text-primary mb-0.5">{member.role}</p>
                  <p className="text-xs text-muted-foreground">{member.subtitle}</p>
                </div>
                <div className="absolute bottom-0 left-0 h-1.5 w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r from-primary via-secondary to-accent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== How We Enhance (aboutnew 風格，logo 用 logobig.png) ========== */}
      <section className="py-12 px-4 bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex justify-center mb-8">
            <Image src="/logobig.png" alt="CWrite" width={320} height={100} className="object-contain hover:scale-105 transition-transform duration-500" unoptimized />
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-foreground mb-4 text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {t.enhanceTitle}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium text-center mb-10">
            {t.enhancePillar}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Adaptive Feedback", items: ["Real-time suggestions", "Personalized guidance", "Learning-focused insights"], color: "primary" },
              { title: "Smart Analysis", items: ["Writing pattern detection", "Strength identification", "Growth opportunities"], color: "secondary" },
              { title: "Community Learning", items: ["Peer collaboration", "Shared resources", "Collective growth"], color: "accent" },
            ].map((block, i) => (
              <div
                key={i}
                className={`p-8 rounded-[2rem] border-4 border-foreground bg-card hover:scale-105 hover:-rotate-1 transition-all duration-500 cursor-pointer group ${shadowBrutal} hover:shadow-xl relative overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[2rem] group-hover:scale-110 transition-transform duration-500 ${block.color === "primary" ? "bg-primary" : block.color === "secondary" ? "bg-secondary" : "bg-accent"}`} />
                <h3 className="text-2xl font-black text-foreground mb-6 group-hover:text-primary transition-colors duration-300 relative z-10">
                  {block.title}
                </h3>
                <ul className="space-y-4 relative z-10">
                  {block.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-3 text-muted-foreground font-medium">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="absolute bottom-0 left-0 h-2 w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r from-primary via-secondary to-accent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Values (aboutnew 風格) ========== */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-8 text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {t.valuesTitle}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {t.valuesItems.map((value, index) => (
              <span
                key={index}
                className="px-4 py-2 rounded-full border-2 border-foreground font-bold text-sm text-foreground hover:-translate-y-1 hover:shadow-lg transition-all duration-300 bg-card"
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Vision ========== */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-8 text-center">
            {t.visionTitle}
          </h2>
          <ul className="space-y-4 text-lg text-foreground font-medium">
            {t.visionItems.map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="text-primary">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Research Vision */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="rounded-3xl bg-primary text-primary-foreground p-10 shadow-xl">
          <h2 className="text-3xl md:text-4xl font-black mb-6">{researchVision.title}</h2>
          <div className="space-y-4 text-lg leading-relaxed opacity-95">
            {researchVision.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-6 px-4 bg-card border-t-4 border-foreground text-center text-muted-foreground text-sm">
        © 2025 CWrite - The Education University of Hong Kong
      </footer>
    </div>
  )
}

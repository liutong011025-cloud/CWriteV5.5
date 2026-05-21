"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import {
  BookOpen,
  Sparkles,
  Zap,
  Users,
  Brain,
  TrendingUp,
  CheckCircle,
  Heart,
  Eye,
  Star,
} from "lucide-react"
import type { Language } from "@/app/page"

interface TeamMember {
  id: number
  name: string
  role: string
  subtitle: string
  image: string
  bio: string
}

const topRow: TeamMember[] = [
  { id: 1, name: "Dr. YANG, Yin Nicole (PhD)", role: "Principal Investigator", subtitle: "Research Assistant Professor", image: "/Nicole.webp", bio: "Dr. Yang earned her Ph.D. in education from the Education University of Hong Kong, focusing on self-regulated learning in computer-assisted learning environments (e.g., language education). She also holds an MSc in Information Technology in Education from the University of Hong Kong, as well as a bachelor's degree in English education and linguistics. She is a visiting scholar of Paris-Saclay University in 2025, and the University of Munich in 2024." },
  { id: 2, name: "Prof. LEE, Chi Kin John, JP (PhD)", role: "Co-Principal Investigator & Advisor", subtitle: "Chair Professor of Curriculum and Instruction", image: "/john.webp", bio: "Professor Lee graduated from The University of Hong Kong and subsequently received an MSc degree from the University of Oxford, and an MA (Education), PhD and Diploma in Education (with distinction) from CUHK. His research interests focus on curriculum and instruction, geographical and environmental education, life and values education, and teacher development and school improvement. Professor Lee was named among the top 1% most-cited scientists in the world (Stanford University)." },
]
const bottomRow: TeamMember[] = [
  { id: 3, name: "Prof. GU, Ming Yue Michelle (PhD)", role: "Co-Investigator", subtitle: "Professor, Assistant Vice President (Research)", image: "/apple.webp", bio: "Michelle Gu Mingyue was Assistant Professor at The Chinese University of Hong Kong (CUHK) from 2012 to 2017. As a researcher in sociolinguistics, Professor Gu adopts multi-disciplinary approaches to explore the individual-context interplay mediated by languages and semiotics. She has theorised the concept of Digital Trans-literacies and has developed theoretical frameworks to advance the areas of language and identity, multilingualism and mobility, and family language policy." },
  { id: 4, name: "Dr. WONG, Ming Har Ruth (PhD)", role: "Co-Investigator", subtitle: "Associate Head of Department, Assistant Professor", image: "/ruth.webp", bio: "Dr. Ruth Wong is an assistant professor at the Department of English Language Education. She joined the university in 2004 and has published research articles in international journals as well as several textbooks and teaching resources for schools in Hong Kong." },
  { id: 5, name: "Mr. LIU, Tong Tony", role: "Research Assistant", subtitle: "Graduate of AI & Educational Technology, EdUHK", image: "/Tony.webp", bio: "Graduate of AI & Educational Technology, EdUHK. Research interests in AI and design, robotics automation, and STEM." },
]

const methods = [
  { icon: Zap, title: "Adaptive Feedback", items: ["Real-time suggestions", "Personalized guidance", "Learning-focused insights"], color: "primary" as const },
  { icon: Brain, title: "Smart Analysis", items: ["Writing pattern detection", "Strength identification", "Growth opportunities"], color: "secondary" as const },
  { icon: Users, title: "Community Learning", items: ["Peer collaboration", "Shared resources", "Collective growth"], color: "accent" as const },
]

const aboutFeatures = [
  { icon: Zap, title: "AI Writing Partner", description: "Get real-time feedback and suggestions as you write, tailored to your goals", color: "primary" as const },
  { icon: CheckCircle, title: "Self-Regulated Learning", description: "Take control of your learning journey with structured guidance and reflection", color: "secondary" as const },
  { icon: Users, title: "Collaborative Tools", description: "Share work, get peer feedback, and learn from other writers in the community", color: "accent" as const },
  { icon: TrendingUp, title: "Progress Analytics", description: "Track your improvement over time with detailed insights into your writing patterns", color: "chart-3" as const },
]

const valuesList = [
  { title: "Perseverance", color: "primary" as const },
  { title: "Respect for Others", color: "secondary" as const },
  { title: "Responsibility", color: "accent" as const },
  { title: "National Identity", color: "primary" as const },
  { title: "Commitment", color: "secondary" as const },
  { title: "Integrity", color: "accent" as const },
  { title: "Benevolence", color: "primary" as const },
  { title: "Law-abidingness", color: "secondary" as const },
  { title: "Empathy", color: "accent" as const },
  { title: "Diligence", color: "primary" as const },
  { title: "Filial Piety", color: "secondary" as const },
  { title: "Unity", color: "accent" as const },
]

const writerItems = ["Express ideas freely", "Receive meaningful feedback", "Grow continuously", "Build confidence"]
const researchItems = ["Evidence-based design", "Open research", "Real-world impact", "Innovation"]

const translations = {
  en: {
    openingH1a: "Creative Writing",
    openingH1b: "in the Age of AI",
    openingSub: "Where human imagination meets intelligent guidance.",
    openingP: "CWrite is built upon learning sciences and self-regulated learning principles. We believe AI should illuminate creativity — not replace it. Through thoughtful design, we empower students to write with voice, confidence, and agency.",
    philosophyTitle: "Our Philosophy",
    philosophyText: "Education is about developing the skills, confidence, and habits that writers need to thrive. Technology should support this journey, not shortcut it. We are building for growth, not just efficiency.",
    researchSub: "Bringing together decades of expertise in learning science, AI, and education",
    enhanceTitle: "How We Enhance Creative Writing",
    enhancePillar: "Three pillars supporting your creative journey",
    aboutTitle: "About CWrite & LuminAI",
    valuesTitle: "Our Values in Education",
    visionTitle: "Our Vision",
    writersP: "We envision a world where every writer has access to intelligent, supportive tools that help them discover their voice and refine their craft.",
    researchP: "We are advancing the field of educational technology by contributing rigorous research on how people learn to write effectively.",
    writersStat: "Writers empowered to share their stories",
    researchStat: "Research studies integrated",
  },
  zh: {
    openingH1a: "創意寫作",
    openingH1b: "在 AI 時代",
    openingSub: "讓人的想像力與智能引導相遇。",
    openingP: "CWrite 基於學習科學與自我調節學習原理而建。我們相信 AI 應點亮創意，而非取代它。透過用心的設計，我們幫助學生以聲音、信心與能動性寫作。",
    philosophyTitle: "我們的理念",
    philosophyText: "教育是培養寫作者所需的能力、信心與習慣。科技應支持這段旅程，而非抄捷徑。我們為成長而建，而不只是效率。",
    researchSub: "匯聚學習科學、人工智能與教育領域數十年的專業",
    enhanceTitle: "我們如何增強創意寫作",
    enhancePillar: "三大支柱支持你的創意旅程",
    aboutTitle: "關於 CWrite 與 LuminAI",
    valuesTitle: "價值觀教育",
    visionTitle: "我們的願景",
    writersP: "我們希望每位寫作者都能使用智能、支持性的工具，發現自己的聲音並精進寫作。",
    researchP: "我們透過嚴謹研究人們如何有效學習寫作，推動教育技術領域的發展。",
    writersStat: "寫作者得以分享自己的故事",
    researchStat: "研究與實踐相結合",
  },
}

function getColorClasses(color: string, isActive: boolean) {
  const base = {
    primary: isActive ? "bg-primary scale-110 rotate-3" : "bg-primary/80 hover:bg-primary",
    secondary: isActive ? "bg-secondary scale-110 -rotate-3" : "bg-secondary/80 hover:bg-secondary",
    accent: isActive ? "bg-accent scale-110 rotate-2" : "bg-accent/80 hover:bg-accent",
  }
  return base[color as keyof typeof base] || base.primary
}

export default function AboutPage({
  onBack,
  language = "en",
  initialSection,
}: {
  onBack?: () => void
  language?: Language
  initialSection?: "vision" | "research"
}) {
  const [hoveredTeamId, setHoveredTeamId] = useState<number | null>(null)
  const [teamVisible, setTeamVisible] = useState(false)
  const [hoveredMethod, setHoveredMethod] = useState<number | null>(null)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [activeValueIndex, setActiveValueIndex] = useState<number | null>(null)
  const teamRef = useRef<HTMLElement>(null)
  const t = translations[language as keyof typeof translations] || translations.en
  const showVisionPage = initialSection !== "research"
  const showResearchPage = initialSection !== "vision"

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && setTeamVisible(true), { threshold: 0.1 })
    teamRef.current && observer.observe(teamRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="about-new-theme min-h-screen bg-background" style={{ paddingTop: "88px", paddingBottom: "0" }}>
      {/* ========== Opening：花紋頂到頂部無空白，左右超出 ========== */}
      <section className={`${showVisionPage ? "" : "hidden"} min-h-screen flex items-center justify-center relative overflow-hidden`} style={{ marginTop: "-88px", paddingTop: "88px" }}>
        {/* flower 花紋：從頂部鋪滿、左右超出，無上下空白 */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-0"
          style={{
            top: 0,
            width: "120vw",
            height: "100%",
            minHeight: "calc(100vh + 88px)",
            backgroundImage: "url(/flower.webp)",
            backgroundRepeat: "repeat",
            backgroundSize: "420px",
            backgroundPosition: "center",
            opacity: 0.75,
          }}
        />
        <div className="absolute top-16 left-10 w-32 h-32 bg-primary rounded-[2rem] rotate-12 animate-float shadow-brutal z-[1]" />
        <div className="absolute bottom-20 right-12 w-24 h-24 bg-secondary rounded-[2rem] -rotate-6 animate-morphing shadow-brutal z-[1]" />
        <div className="absolute top-1/3 right-8 w-16 h-16 bg-accent rounded-[1.5rem] rotate-45 animate-pulse shadow-brutal z-[1]" />
        <div className="absolute bottom-1/3 left-8 w-20 h-20 bg-chart-2 rounded-[2rem] -rotate-12 animate-float shadow-brutal z-[1]" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 max-w-5xl w-full mx-4 md:mx-8 px-10 md:px-24 py-12 md:py-24 rounded-[2.5rem] shadow-brutal border-4 border-foreground bg-card/95 backdrop-blur-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute top-0 right-0 w-28 h-28 bg-primary rounded-bl-[2rem] group-hover:scale-110 transition-transform duration-500 shadow-brutal" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary rounded-tr-[2rem] group-hover:scale-110 transition-transform duration-500 shadow-brutal" />
          <div className="absolute top-1/2 right-6 w-4 h-4 bg-accent rounded-full animate-ping" />
          <div className="absolute top-8 left-8 w-3 h-3 bg-chart-2 rounded-full animate-pulse" />
          <div className="relative z-10 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-foreground mb-6 leading-[1.1] tracking-tight">
              {t.openingH1a}
              <br />
              {t.openingH1b}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-6 font-semibold">{t.openingSub}</p>
            <div className="w-24 h-2 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full shadow-brutal mb-6" />
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">{t.openingP}</p>
          </div>
        </div>
      </section>

      {/* ========== About CWrite（aboutusnewest about-cwrite）========== */}
      <section className={`${showVisionPage ? "" : "hidden"} py-12 px-4 bg-background relative overflow-hidden`}>
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-20 w-40 h-40 bg-primary/20 rounded-[2rem] rotate-12 animate-morphing shadow-brutal" />
          <div className="absolute bottom-40 left-20 w-32 h-32 bg-secondary/30 rounded-[2rem] -rotate-12 animate-float shadow-brutal" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-8 py-4 bg-card border-4 border-foreground rounded-[2rem] text-card-foreground font-black mb-8 shadow-brutal hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-6 h-6 mr-3 text-primary animate-pulse" />
              About Us
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-8 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {t.aboutTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {aboutFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="p-8 rounded-[2rem] border-4 border-foreground bg-card hover:bg-muted/50 transition-all duration-500 cursor-pointer group hover:scale-105 hover:-rotate-1 shadow-brutal hover:shadow-xl relative overflow-hidden"
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[2rem] group-hover:scale-110 transition-transform duration-500 shadow-brutal ${feature.color === "primary" ? "bg-primary" : feature.color === "secondary" ? "bg-secondary" : feature.color === "accent" ? "bg-accent" : "bg-chart-3"}`} />
                  <div className="relative z-10">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-[2rem] mb-6 transition-transform duration-500 shadow-brutal border-4 border-foreground ${hoveredFeature === index ? "scale-125 rotate-12" : ""} ${feature.color === "primary" ? "bg-primary" : feature.color === "secondary" ? "bg-secondary" : feature.color === "accent" ? "bg-accent" : "bg-chart-3"}`}>
                      <Icon className={`w-8 h-8 ${feature.color === "accent" ? "text-white" : "text-foreground"}`} />
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-4 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">{feature.description}</p>
                  </div>
                  <div className="absolute bottom-0 left-0 h-2 w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r from-primary via-secondary to-accent" />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========== How We Enhance（aboutusnewest how-we-enhance）========== */}
      <section className={`${showVisionPage ? "" : "hidden"} py-12 px-4 bg-background relative overflow-hidden`}>
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-80 h-80 bg-primary/20 rounded-[2rem] -translate-x-40 -translate-y-40 animate-morphing shadow-brutal" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/30 rounded-[2rem] translate-x-32 translate-y-32 rotate-45 animate-float shadow-brutal" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-accent/25 rounded-[2rem] rotate-12 animate-pulse shadow-brutal" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex justify-center mb-12">
            <Image src="/logobig.webp" alt="CWrite" width={400} height={200} className="object-contain group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-8 py-4 bg-card border-4 border-foreground rounded-[2rem] text-card-foreground font-black mb-8 shadow-brutal hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-6 h-6 mr-3 text-primary animate-spin" />
              Creative Writing
              <Zap className="w-6 h-6 ml-3 text-accent" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-8 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {t.enhanceTitle}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">{t.enhancePillar}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {methods.map((method, index) => {
              const Icon = method.icon
              return (
                <div
                  key={index}
                  className="p-8 rounded-[2rem] border-4 border-foreground bg-card hover:bg-muted/50 transition-all duration-500 cursor-pointer group hover:scale-105 hover:-rotate-1 shadow-brutal hover:shadow-xl relative overflow-hidden"
                  onMouseEnter={() => setHoveredMethod(index)}
                  onMouseLeave={() => setHoveredMethod(null)}
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[2rem] group-hover:scale-110 transition-transform duration-500 shadow-brutal ${method.color === "primary" ? "bg-primary" : method.color === "secondary" ? "bg-secondary" : "bg-accent"}`} />
                  <div className="relative z-10">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-[2rem] mb-6 transition-transform duration-500 shadow-brutal border-4 border-foreground ${hoveredMethod === index ? "scale-125 rotate-12" : ""} ${method.color === "primary" ? "bg-primary" : method.color === "secondary" ? "bg-secondary" : "bg-accent"}`}>
                      <Icon className={`w-8 h-8 ${method.color === "accent" ? "text-white" : "text-foreground"}`} />
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-6 group-hover:text-primary transition-colors duration-300">{method.title}</h3>
                    <ul className="space-y-4">
                      {method.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-4 group/item hover:scale-105 transition-transform duration-300">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-[1rem] flex items-center justify-center shadow-brutal border-2 border-foreground ${method.color === "primary" ? "bg-primary/20" : method.color === "secondary" ? "bg-secondary/20" : "bg-accent/20"}`}>
                            <Sparkles className="w-4 h-4 text-foreground" />
                          </div>
                          <span className="text-muted-foreground font-medium group-hover/item:text-foreground transition-colors duration-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="absolute bottom-1/3 left-6 w-3 h-3 bg-chart-2 rounded-full animate-ping shadow-brutal" style={{ animationDelay: `${index * 0.5}s` }} />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========== Values（aboutusnewest values-education）========== */}
      <section className={`${showVisionPage ? "" : "hidden"} py-12 px-4 bg-background relative overflow-hidden`}>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-6 py-3 bg-card border-4 border-foreground rounded-[2rem] text-card-foreground font-black mb-6 shadow-brutal hover:scale-105 transition-transform duration-300">
              <Heart className="w-5 h-5 mr-2 text-accent animate-pulse" />
              Core Values
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {t.valuesTitle}
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {valuesList.map((value, index) => (
              <div
                key={index}
                className={`px-4 py-2 rounded-full border-[3px] border-foreground cursor-pointer font-bold text-sm text-foreground shadow-brutal transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 ${getColorClasses(value.color, activeValueIndex === index)}`}
                onClick={() => setActiveValueIndex(activeValueIndex === index ? null : index)}
                onMouseEnter={() => setActiveValueIndex(index)}
                onMouseLeave={() => setActiveValueIndex(null)}
              >
                {value.title}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Philosophy：背景用 background.png（與 Research 的 Background.webp 區分）========== */}
      <section className={`${showVisionPage ? "" : "hidden"} py-0 relative overflow-hidden`}>
        <div className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center">
          <Image src="/background.png" alt="" fill className="object-cover object-center" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute top-6 left-6 z-20 px-4 py-2 bg-white/10 backdrop-blur-md rounded-[1rem] border border-white/20">
            <p className="text-white/90 text-xs font-semibold leading-tight">Primavera (Botticelli)</p>
            <p className="text-white/65 text-[11px] leading-tight mt-0.5">Luna, the goddess of inspiration, guides creativity.</p>
          </div>
          <div className="relative z-10 max-w-3xl w-full mx-4 md:mx-8 text-center px-6 md:px-12 py-14 md:py-20 rounded-[2rem] border-2 border-white/20 bg-white/10 backdrop-blur-md shadow-2xl">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 backdrop-blur-md rounded-[2rem] border border-white/30 text-white font-black mb-6 hover:scale-105 transition-transform duration-300">
              <BookOpen className="w-5 h-5 text-primary animate-bounce" />
              Philosophy
              <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">{t.philosophyTitle}</h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mb-6" />
            <p className="text-lg md:text-xl text-white/90 leading-relaxed font-medium max-w-xl mx-auto">{t.philosophyText}</p>
          </div>
        </div>
      </section>

      {/* ========== Vision（aboutusnewest vision-section）========== */}
      <section className={`${showVisionPage ? "" : "hidden"} py-12 px-4 bg-background relative overflow-hidden`}>
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image src="/Background.webp" alt="" fill className="scale-105 object-cover object-center blur-sm" />
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
          <div className="absolute top-0 left-0 w-80 h-80 bg-primary/10 rounded-[2rem] -translate-x-40 -translate-y-40 animate-morphing shadow-brutal" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/20 rounded-[2rem] translate-x-32 translate-y-32 rotate-45 animate-float shadow-brutal" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-4 h-4 bg-accent rounded-full animate-ping" style={{ top: `${20 + (i * 10) % 60}%`, left: `${10 + (i * 15) % 80}%`, animationDelay: `${i * 0.8}s`, animationDuration: `${3 + (i % 2)}s` }} />
          ))}
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-8 py-4 bg-card border-4 border-foreground rounded-[2rem] text-card-foreground font-black mb-8 shadow-brutal hover:scale-105 transition-transform duration-300">
              <Eye className="w-6 h-6 mr-3 text-primary animate-pulse" />
              Our Vision
              <Sparkles className="w-6 h-6 ml-3 text-accent" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-8 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {t.visionTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
            <div className="p-8 rounded-[2rem] border-4 border-foreground bg-card shadow-brutal hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary rounded-bl-[2rem] group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="inline-flex items-center px-6 py-3 bg-primary/20 rounded-[1.5rem] text-primary font-black mb-6 border-4 border-foreground shadow-brutal">
                  <Users className="w-5 h-5 mr-2" />
                  For Writers
                </div>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed font-medium">{t.writersP}</p>
                <ul className="space-y-4">
                  {writerItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-4 group/item hover:scale-105 transition-transform duration-300">
                      <div className="w-8 h-8 bg-primary rounded-[1rem] flex items-center justify-center shadow-brutal border-2 border-foreground">
                        <CheckCircle className="w-4 h-4 text-foreground" />
                      </div>
                      <span className="text-foreground font-medium group-hover/item:text-primary transition-colors duration-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="p-8 rounded-[2rem] border-4 border-foreground bg-card shadow-brutal hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary rounded-bl-[2rem] group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="inline-flex items-center px-6 py-3 bg-secondary/20 rounded-[1.5rem] text-secondary font-black mb-6 border-4 border-foreground shadow-brutal">
                  <BookOpen className="w-5 h-5 mr-2" />
                  For Research
                </div>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed font-medium">{t.researchP}</p>
                <ul className="space-y-4">
                  {researchItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-4 group/item hover:scale-105 transition-transform duration-300">
                      <div className="w-8 h-8 bg-secondary rounded-[1rem] flex items-center justify-center shadow-brutal border-2 border-foreground">
                        <CheckCircle className="w-4 h-4 text-foreground" />
                      </div>
                      <span className="text-foreground font-medium group-hover/item:text-secondary transition-colors duration-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== Research Team（還原背景圖，但頂端無多餘邊距）========== */}
      <section
        ref={teamRef}
        className={`${showResearchPage ? "" : "hidden"} pb-16 md:pb-24 px-4 relative overflow-hidden`}
      >
        <div className={`absolute inset-0 transition-opacity duration-1000 ${teamVisible ? "opacity-100" : "opacity-0"}`}>
          <Image src="/Background.webp" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-background/40" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <div className={`inline-flex items-center px-6 py-3 bg-card border-4 border-foreground rounded-[2rem] text-card-foreground font-black mb-6 shadow-brutal hover:scale-105 transition-all duration-500 ${teamVisible ? "animate-slide-up" : "opacity-0"}`}>
              <Users className="w-5 h-5 mr-2 text-primary animate-bounce" />
              Our Team
              <Star className="w-5 h-5 ml-2 text-accent animate-spin" />
            </div>
            <h2 className={`text-4xl md:text-5xl font-black text-foreground mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent ${teamVisible ? "animate-slide-up" : "opacity-0"}`} style={{ animationDelay: "100ms" }}>
              Research Team
            </h2>
            <p className={`text-lg text-muted-foreground max-w-2xl mx-auto font-medium ${teamVisible ? "animate-slide-up" : "opacity-0"}`} style={{ animationDelay: "200ms" }}>
              {t.researchSub}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-5xl mx-auto mb-10">
            {topRow.map((member, index) => (
              <div
                key={member.id}
                className={`group rounded-[2rem] overflow-hidden border-4 border-foreground bg-card hover:-translate-y-2 hover:rotate-1 transition-all duration-500 cursor-pointer relative shadow-brutal hover:shadow-xl ${teamVisible ? "animate-slide-up opacity-100" : "opacity-0"}`}
                style={{ animationDelay: `${300 + index * 100}ms` }}
                onMouseEnter={() => setHoveredTeamId(member.id)}
                onMouseLeave={() => setHoveredTeamId(null)}
              >
                <div className="relative h-64 flex items-center justify-center overflow-hidden bg-card">
                  <Image src={member.image} alt={member.name} fill className="object-contain object-top group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className={`absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-500 ${hoveredTeamId === member.id ? "opacity-100" : "opacity-0"}`}>
                    <p className="text-white text-xs leading-relaxed text-center">{member.bio}</p>
                  </div>
                </div>
                <div className="p-4 relative">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-accent rounded-bl-[1rem] border-l-[3px] border-b-[3px] border-foreground group-hover:scale-110 transition-transform duration-500" />
                  <h3 className="text-sm font-black text-foreground mb-1 group-hover:text-primary transition-colors duration-300 pr-12">{member.name}</h3>
                  <p className="text-xs font-bold text-primary mb-0.5">{member.role}</p>
                  <p className="text-xs text-muted-foreground">{member.subtitle}</p>
                </div>
                <div className="absolute bottom-0 left-0 h-1.5 w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r from-primary via-secondary to-accent" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {bottomRow.map((member, index) => (
              <div
                key={member.id}
                className={`group rounded-[2rem] overflow-hidden border-4 border-foreground bg-card hover:-translate-y-2 hover:rotate-1 transition-all duration-500 cursor-pointer relative shadow-brutal hover:shadow-xl ${teamVisible ? "animate-slide-up opacity-100" : "opacity-0"}`}
                style={{ animationDelay: `${500 + index * 100}ms` }}
                onMouseEnter={() => setHoveredTeamId(member.id)}
                onMouseLeave={() => setHoveredTeamId(null)}
              >
                <div className="relative h-72 flex items-center justify-center overflow-hidden bg-card">
                  <Image src={member.image} alt={member.name} fill className="object-contain object-top group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className={`absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-500 ${hoveredTeamId === member.id ? "opacity-100" : "opacity-0"}`}>
                    <p className="text-white text-xs leading-relaxed text-center">{member.bio}</p>
                  </div>
                </div>
                <div className="p-4 relative">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-accent rounded-bl-[1rem] border-l-[3px] border-b-[3px] border-foreground group-hover:scale-110 transition-transform duration-500" />
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

      <footer className="py-0 px-4 bg-card border-t-4 border-foreground" />
    </div>
  )
}

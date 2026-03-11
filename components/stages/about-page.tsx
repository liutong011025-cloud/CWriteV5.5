"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import type { Language } from "@/app/page"

interface Member {
  name: string
  role: string
  titles: string[]
  interests: string[]
  email: string
  scholar?: string
  photo: string
  bio: string
}

// 研究團隊：yang→Nicole, lee→john, gu→apple, wong→ruth, liu→Tony
const allTeamMembers: Member[] = [
  {
    name: "Dr. YANG, Yin Nicole (PhD)",
    role: "Principal Investigator",
    titles: ["Research Assistant Professor"],
    interests: ["AI in interdisciplinary education", "Digital literacy and competency", "Second language acquisition", "Cognitive science in learning", "Emerging technologies and pedagogical innovation"],
    email: "yyin@eduhk.hk",
    scholar: "https://scholar.google.com/citations?user=bjITS38AAAAJ&hl=zh-CN&inst=9002373801639654337&oi=ao",
    photo: "/Nicole.png",
    bio: "Dr. Yang earned her Ph.D. in education from the Education University of Hong Kong, focusing on self-regulated learning in computer-assisted learning environments (e.g., language education). She also holds an MSc in Information Technology in Education from the University of Hong Kong, and a bachelor's degree in English education and linguistics. She is a visiting scholar of Paris-Saclay University in 2025, and the University of Munich in 2024.",
  },
  {
    name: "Prof. LEE, Chi Kin John, JP (PhD)",
    role: "Co-Principal Investigator & Advisor",
    titles: ["President", "Chair Professor of Curriculum and Instruction", "Director, Academy for Applied Policy Studies and Education Futures", "Director, Academy for Educational Development and Innovation"],
    interests: ["Curriculum and instruction", "Geographical and environmental education", "School improvement", "Teacher development", "Life and values education"],
    email: "poffice@eduhk.hk",
    photo: "/john.png",
    bio: "Professor Lee graduated from The University of Hong Kong and subsequently received an MSc degree from the University of Oxford, and an MA (Education), PhD and Diploma in Education (with distinction) from CUHK. His research interests focus on curriculum and instruction, geographical and environmental education, life and values education, and teacher development and school improvement. He was named among the top 1% most-cited scientists in the world (Stanford University).",
  },
  {
    name: "Prof. GU, Ming Yue Michelle (PhD)",
    role: "Co-Investigator",
    titles: ["Professor", "Assistant Vice President (Research)"],
    interests: ["Multilingualism and mobility", "Internationalization in higher education", "(Digital) citizenship and identity studies", "Minority education", "Family language policy"],
    email: "mygu@eduhk.hk",
    scholar: "https://scholar.google.com/citations?user=PLuccV8AAAAJ&hl=en",
    photo: "/apple.png",
    bio: "Michelle Gu Mingyue was Assistant Professor at The Chinese University of Hong Kong (CUHK) from 2012 to 2017. As a researcher in sociolinguistics, Professor Gu adopts multi-disciplinary approaches to explore the individual-context interplay mediated by languages and semiotics. She has theorised the concept of Digital Trans-literacies and has developed theoretical frameworks to advance the areas of language and identity, multilingualism and mobility, and family language policy.",
  },
  {
    name: "Dr. WONG, Ming Har Ruth (PhD)",
    role: "Co-Investigator",
    titles: ["Associate Head of Department", "Assistant Professor"],
    interests: ["Motivation", "Task-based Learning", "Curriculum", "Language Arts", "Teacher Education"],
    email: "wongmh@eduhk.hk",
    scholar: "https://scholar.google.com.hk/citations?user=LG0U99AAAAAJ&hl=en",
    photo: "/ruth.png",
    bio: "Dr. Ruth Wong is an assistant professor at the Department of English Language Education. She joined the university in 2004 and has published research articles in international journals as well as several textbooks and teaching resources for schools in Hong Kong.",
  },
  {
    name: "Mr. LIU, Tong Tony",
    role: "Research Assistant",
    titles: ["Graduate of AI & Educational Technology, EdUHK"],
    interests: ["AI and design", "Robotics automation", "STEM"],
    email: "liut@eduhk.hk",
    photo: "/Tony.png",
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
    openingHeadline: "Creative Writing in the Age of AI",
    openingSubtitle: "Where human imagination meets intelligent guidance.",
    openingP1: "CWrite is built upon learning sciences and self-regulated learning principles.",
    openingP2: "We believe AI should illuminate creativity — not replace it.",
    openingP3: "Through thoughtful design, we empower students to write with voice, confidence, and agency.",
    philosophyTitle: "Our Philosophy",
    philosophyText: "Education is about developing the skills, confidence, and habits that writers need to thrive. Technology should support this journey, not shortcut it. We are building for growth, not just efficiency.",
    researchTeamTitle: "Research Team",
    researchTeamSubtitle: "Bringing together decades of expertise in learning science, AI, and education.",
    enhanceTitle: "How We Enhance Creative Writing",
    aiPartnerTitle: "AI as a Writing Partner",
    aiPartnerItems: ["Thought-provoking prompts that stimulate imagination", "Context-aware revision and language support", "Keep personal voice"],
    selfLearningTitle: "Self-Regulated Learning at the Core",
    selfLearningItems: ["Plan, monitor, and evaluate", "Develop independence, metacognition, and writing confidence", "Build reflective thinking"],
    collaborationTitle: "Learning Through Collaboration",
    collaborationItems: ["Share writing in the Luminai Library", "Peer review and feedback", "Learn through comparison, dialogue, and revision"],
    valuesTitle: "Values Education in Action",
    valuesItems: ["Perseverance", "Respect for Others", "Responsibility", "National Identity", "Commitment", "Integrity", "Benevolence", "Law-abidingness", "Empathy", "Diligence", "Filial Piety", "Unity"],
    visionTitle: "Our Vision",
    visionItems: ["Reshape creative writing education for the digital age.", "Become a global innovator in creative writing education.", "Cultivate the next generation of creative leaders."],
  },
  zh: {
    openingHeadline: "AI 時代的創意寫作",
    openingSubtitle: "讓人的想像力與智能引導相遇。",
    openingP1: "CWrite 基於學習科學與自我調節學習原理而建。",
    openingP2: "我們相信 AI 應點亮創意，而非取代它。",
    openingP3: "透過用心的設計，我們幫助學生以聲音、信心與能動性寫作。",
    philosophyTitle: "我們的理念",
    philosophyText: "教育是培養寫作者所需的能力、信心與習慣。科技應支持這段旅程，而非抄捷徑。我們為成長而建，而不只是效率。",
    researchTeamTitle: "研究團隊",
    researchTeamSubtitle: "匯聚學習科學、人工智能與教育領域數十年的專業。",
    enhanceTitle: "我們如何增強創意寫作",
    aiPartnerTitle: "AI 寫作夥伴",
    aiPartnerItems: ["啟發性問題與提示", "針對性修改建議", "保持個人風格"],
    selfLearningTitle: "自主學習",
    selfLearningItems: ["計劃、監控、評估", "發展獨立技能", "建立反思思維"],
    collaborationTitle: "協作學習",
    collaborationItems: ["在圖書館分享", "同儕評審與反饋", "持續改進"],
    valuesTitle: "價值觀教育",
    valuesItems: ["坚毅", "尊重他人", "责任感", "国民身份认同", "承担精神", "诚信", "仁爱", "守法", "同理心", "勤奋", "孝亲", "团结"],
    visionTitle: "我們的願景",
    visionItems: ["重塑數碼時代的創意寫作教育。", "成為創意寫作教育的全球創新者。", "培養下一代創意領袖。"],
  },
}

export default function AboutPage({ onBack, language = "en" }: { onBack?: () => void; language?: Language }) {
  const [scrollY, setScrollY] = useState(0)
  const [openVisible, setOpenVisible] = useState(false)
  const [philVisible, setPhilVisible] = useState(false)
  const [teamVisible, setTeamVisible] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [expandProgress, setExpandProgress] = useState(0)
  const [hoveredTeamIndex, setHoveredTeamIndex] = useState<number | null>(null)
  const [expandedTeamIndex, setExpandedTeamIndex] = useState<number | null>(null)
  const openRef = useRef<HTMLElement>(null)
  const philRef = useRef<HTMLElement>(null)
  const teamRef = useRef<HTMLElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  const t = translations[language as keyof typeof translations] || translations.en

  const features = [
    { id: 1, icon: "🤖", title: t.aiPartnerTitle, items: t.aiPartnerItems, borderColor: "border-purple-200", textColor: "text-purple-700", gradient: "from-purple-600/20" },
    { id: 2, icon: "📚", title: t.selfLearningTitle, items: t.selfLearningItems, borderColor: "border-blue-200", textColor: "text-blue-700", gradient: "from-blue-600/20" },
    { id: 3, icon: "🌟", title: t.collaborationTitle, items: t.collaborationItems, borderColor: "border-pink-200", textColor: "text-pink-700", gradient: "from-pink-600/20" },
  ]

  useEffect(() => {
    const h = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", h)
    return () => window.removeEventListener("scroll", h)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setOpenVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setPhilVisible(true), { threshold: 0.2 })
    philRef.current && o.observe(philRef.current)
    return () => o.disconnect()
  }, [])

  useEffect(() => {
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setTeamVisible(true), { threshold: 0.1 })
    teamRef.current && o.observe(teamRef.current)
    return () => o.disconnect()
  }, [])

  useEffect(() => {
    if (!featuresRef.current) return
    const handleScroll = () => {
      if (!featuresRef.current) return
      const rect = featuresRef.current.getBoundingClientRect()
      const vh = window.innerHeight / 2
      const center = rect.top + rect.height / 2
      const d = Math.abs(center - vh)
      const maxD = 800
      const zone = 20
      let p = d <= zone ? 1 : d < maxD ? Math.max(0, 1 - (d - zone) / (maxD - zone)) : 0
      setExpandProgress(Math.max(0, Math.min(1, p)))
    }
    handleScroll()
    let raf: number | null = null
    const onScroll = () => {
      if (raf == null) raf = requestAnimationFrame(() => { handleScroll(); raf = null })
    }
    let tick = false
    const th = () => {
      if (!tick) {
        requestAnimationFrame(() => { handleScroll(); tick = false })
        tick = true
      }
    }
    window.addEventListener("scroll", th, { passive: true })
    window.addEventListener("resize", handleScroll)
    return () => {
      window.removeEventListener("scroll", th)
      window.removeEventListener("resize", handleScroll)
      if (raf != null) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f8faff] px-4" style={{ paddingTop: "100px", paddingBottom: "120px" }}>
      {/* ========== Opening: Creative Writing in the Age of AI (flower + logobig) ========== */}
      <section ref={openRef} className="relative min-h-screen overflow-hidden -mx-4">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full opacity-30 animate-pulse"
              style={{
                background: i % 3 === 0 ? "#2F6BFF" : i % 3 === 1 ? "#FFD84D" : "#FF8CC8",
                top: `${(i * 17) % 100}%`,
                left: `${(i * 23) % 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        <div className="flex flex-col lg:flex-row min-h-screen">
          <div className="flex-1 flex items-center justify-center p-8 lg:p-16 order-2 lg:order-1">
            <div className={`max-w-xl transition-all duration-1000 ${openVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div className="relative p-8 lg:p-12 rounded-[2rem] bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-br from-[#2F6BFF]/20 via-[#FF8CC8]/20 to-[#FFD84D]/20 rounded-full blur-3xl" />
                <div className="relative flex justify-center mb-6">
                  <Image src="/logobig.png" alt="CWrite" width={200} height={64} className="object-contain h-14 w-auto" unoptimized />
                </div>
                <h1 className="relative font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-[#1a1a2e] leading-tight mb-6 text-balance">
                  {t.openingHeadline}
                </h1>
                <h2 className="text-xl lg:text-2xl text-[#2F6BFF] font-medium mb-6 italic">
                  {t.openingSubtitle}
                </h2>
                <div className="space-y-4 text-[#3a3a4a] text-lg leading-relaxed">
                  <p>{t.openingP1}</p>
                  <p>{t.openingP2}</p>
                  <p>{t.openingP3}</p>
                </div>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-br from-[#FFD84D] to-[#FF8CC8] rounded-[1rem] -z-10 opacity-60" />
                <div className="absolute -top-4 -right-8 w-12 h-12 bg-[#2F6BFF] rounded-full -z-10 opacity-40" />
              </div>
            </div>
          </div>

          <div className="flex-1 relative min-h-[50vh] lg:min-h-screen order-1 lg:order-2">
            <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to right, rgba(26,26,46,0.7) 0%, rgba(47,107,255,0.4) 30%, rgba(255,140,200,0.3) 60%, transparent 100%)" }} />
            <div className="absolute inset-0 bg-[#1a1a2e]/20 z-[5]" />
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700"
              style={{
                backgroundImage: "url(/flower.png)",
                transform: `scale(${1.05 + scrollY * 0.0001}) translateY(${scrollY * 0.1}px)`,
              }}
            />
          </div>
        </div>
      </section>

      {/* ========== Our Philosophy (Background.png) ========== */}
      <section ref={philRef} className="relative py-24 lg:py-32 px-4 overflow-hidden -mx-4">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url(/Background.png)" }} />
        <div className="absolute inset-0 bg-[#1a1a2e]/60" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-[#FFD84D]/20 via-[#FF8CC8]/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-1000 ${philVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-[#FFD84D]/30 to-transparent blur-2xl" />
            <h2 className="relative font-serif text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
              {t.philosophyTitle}
            </h2>
          </div>
          <p className={`relative text-lg lg:text-xl text-white/95 leading-relaxed text-center max-w-3xl mx-auto pl-6 border-l-4 border-[#FFD84D] transition-all duration-1000 delay-200 ${philVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {t.philosophyText}
          </p>
          <div className="flex items-center justify-center gap-4 py-8">
            <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent via-[#2F6BFF]/50 to-transparent" />
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#2F6BFF] to-[#FF8CC8]" />
            <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent via-[#FF8CC8]/50 to-transparent" />
          </div>
        </div>
      </section>

      {/* ========== Research Team (Background.png + member photos) ========== */}
      <section ref={teamRef} className="relative py-24 lg:py-32 px-4 overflow-hidden -mx-4">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url(/Background.png)" }} />
        <div className="absolute inset-0 bg-[#1a1a2e]/70" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-l from-[#2F6BFF]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-gradient-to-r from-[#FF8CC8]/10 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto">
          <h2 className={`font-serif text-4xl lg:text-5xl font-bold text-white text-center mb-4 transition-all duration-1000 ${teamVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {t.researchTeamTitle}
          </h2>
          <p className={`text-lg text-white/90 text-center mb-12 max-w-2xl mx-auto transition-all duration-1000 delay-100 ${teamVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {t.researchTeamSubtitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {allTeamMembers.map((member, index) => {
              const showBio = hoveredTeamIndex === index || expandedTeamIndex === index
              return (
                <div
                  key={member.name}
                  className={`group relative transition-all duration-700 ${teamVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                  onMouseEnter={() => setHoveredTeamIndex(index)}
                  onMouseLeave={() => setHoveredTeamIndex(null)}
                  onClick={() => setExpandedTeamIndex(expandedTeamIndex === index ? null : index)}
                >
                  <div
                    className="relative rounded-[2rem] bg-white/80 backdrop-blur-sm border border-white shadow-lg overflow-hidden cursor-pointer transition-all duration-500"
                    style={{
                      transform: showBio ? "translateY(-8px)" : "translateY(0)",
                      boxShadow: showBio ? "0 25px 50px -12px rgba(47,107,255,0.25), 0 0 30px rgba(255,140,200,0.15)" : "0 10px 25px -5px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div className="absolute inset-0 rounded-[2rem] opacity-0 transition-opacity duration-500 -z-10" style={{ opacity: showBio ? 1 : 0, background: "linear-gradient(135deg, #2F6BFF20, #FF8CC820, #FFD84D20)" }} />
                    <div className="relative h-48 overflow-hidden">
                      <div className="absolute inset-0 transition-transform duration-500" style={{ transform: showBio ? "scale(1.08)" : "scale(1)" }}>
                        <Image src={member.photo} alt={member.name} fill className="object-cover" unoptimized />
                      </div>
                      <div className="absolute inset-0 flex items-end transition-all duration-500" style={{ transform: showBio ? "translateY(0)" : "translateY(100%)" }}>
                        <div className="w-full p-4 max-h-full overflow-y-auto" style={{ background: "linear-gradient(to top, rgba(26,26,46,0.95), rgba(47,107,255,0.85))", backdropFilter: "blur(8px)" }}>
                          <p className="text-white/90 text-xs leading-relaxed" style={{ opacity: showBio ? 1 : 0, transitionDelay: showBio ? "150ms" : "0ms" }}>
                            {member.bio}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 text-center">
                      <h3 className="font-bold text-[#1a1a2e] text-lg mb-1 transition-colors duration-300 group-hover:text-[#2F6BFF]">{member.name}</h3>
                      <p className="text-[#5a5a7a] text-sm">{member.role}</p>
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full transition-opacity duration-500" style={{ opacity: showBio ? 0.6 : 0, background: "radial-gradient(ellipse, rgba(47,107,255,0.3), transparent)", filter: "blur(8px)" }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="lg:hidden text-center text-white/80 text-sm mt-8">Tap a card to view biography</p>
        </div>
      </section>

      {/* ========== How We Enhance (keep existing scroll-expand effect, use logobig in center) ========== */}
      <div className="max-w-7xl mx-auto mt-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-[#2F6BFF] via-[#FF8CC8] to-[#FFD84D] bg-clip-text text-transparent">
          {t.enhanceTitle}
        </h2>
        <div ref={featuresRef} className="relative h-[500px] md:h-[450px] flex items-center justify-center mb-4">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 1 - expandProgress, transform: `scale(${1 - expandProgress * 0.1}) translateY(${-expandProgress * 20}px)` }}>
            <div className="relative w-64 h-64 md:w-80 md:h-80 bg-white/90 backdrop-blur-lg rounded-3xl p-4 md:p-6 border-4 border-[#2F6BFF]/30 shadow-2xl flex items-center justify-center">
              <Image src="/logobig.png" alt="CWrite" width={240} height={80} className="object-contain w-full h-full" unoptimized />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: expandProgress }}>
            <div className="relative w-full max-w-7xl mx-auto h-full flex items-center justify-center px-4">
              {features.map((feature, index) => {
                const isHovered = hoveredCard === feature.id
                const cardWidth = 380
                const cardGap = 80
                const totalCardSpacing = cardWidth + cardGap
                const centerOffsetX = (index - 1) * totalCardSpacing * expandProgress
                const baseOffsetY = index === 1 ? -28 : index === 2 ? 28 : 0
                const cardOffsetY = baseOffsetY * expandProgress
                const cardScale = 0.4 + expandProgress * 0.6
                const cardZIndex = expandProgress > 0.3 ? (index === 1 ? 12 : index === 0 ? 11 : 10) : index
                return (
                  <div
                    key={feature.id}
                    className="absolute perspective-1000"
                    onMouseEnter={() => expandProgress > 0.2 && setHoveredCard(feature.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) translateX(${centerOffsetX}px) translateY(${cardOffsetY}px) scale(${cardScale})`,
                      pointerEvents: expandProgress > 0.2 ? "auto" : "none",
                      width: `${cardWidth}px`,
                      zIndex: cardZIndex,
                    }}
                  >
                    <div
                      className={`relative bg-white/95 backdrop-blur-md rounded-2xl p-8 border-2 ${feature.borderColor} shadow-2xl cursor-pointer`}
                      style={{
                        transformStyle: "preserve-3d",
                        transform: isHovered ? `perspective(1000px) rotateY(${index === 1 ? "12deg" : "-12deg"}) scale(1.05)` : "perspective(1000px) rotateY(0deg) scale(1)",
                        transition: "transform 0.3s ease-out, box-shadow 0.3s ease-out",
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-l ${feature.gradient} to-transparent rounded-2xl`} style={{ opacity: isHovered ? 0.3 : 0, transition: "opacity 0.3s ease-out" }} />
                      <div className="relative z-10">
                        <div className="text-6xl mb-5 text-center" style={{ transform: isHovered ? "rotate(-5deg) scale(1.1)" : "rotate(0deg) scale(1)", transition: "transform 0.3s ease-out" }}>
                          {feature.icon}
                        </div>
                        <h3 className={`text-2xl font-bold mb-4 ${feature.textColor} text-center`}>{feature.title}</h3>
                        <div className="space-y-2 text-center">
                          {feature.items.map((item, i) => (
                            <p key={i} className="text-sm text-gray-700 font-medium">{item}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="max-w-6xl mx-auto mt-16">
        <div className="bg-white/85 backdrop-blur-lg rounded-3xl p-7 border-2 border-[#FFD84D]/50 shadow-xl">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-[#1a1a2e] mb-5">{t.valuesTitle}</h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {t.valuesItems.map((value, index) => (
              <span key={`${value}-${index}`} className="rounded-full px-4 py-2 text-sm md:text-base font-semibold bg-gradient-to-r from-[#2F6BFF]/10 via-[#FF8CC8]/10 to-[#FFD84D]/10 border border-[#2F6BFF]/30 text-[#1a1a2e] shadow-sm hover:scale-105 transition-transform">
                {value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Vision */}
      <div className="max-w-5xl mx-auto mt-16">
        <h2 className="text-4xl md:text-5xl font-black text-center mb-8 text-[#1a1a2e]">{t.visionTitle}</h2>
        <ul className="space-y-4 text-xl md:text-2xl font-bold text-[#1a1a2e] leading-relaxed">
          {t.visionItems.map((item, index) => (
            <li key={index} className="flex items-center justify-center gap-4">
              <span className="text-[#2F6BFF]">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Research Vision */}
      <section className="max-w-6xl mx-auto mt-16 bg-gradient-to-br from-[#2F6BFF] via-[#5a6eff] to-[#7b8eff] text-white rounded-3xl p-10 shadow-2xl">
        <h2 className="text-4xl md:text-5xl font-black mb-6">{researchVision.title}</h2>
        <div className="space-y-4 text-lg leading-relaxed text-white/95">
          {researchVision.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto mt-16 bg-gradient-to-r from-[#1a1a2e] via-[#2F6BFF]/80 to-[#1a1a2e] text-white py-6 rounded-2xl text-center shadow-lg">
        <p className="text-white/80">© 2025 CWrite - The Education University of Hong Kong</p>
      </footer>
    </div>
  )
}

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
  bio: React.ReactNode
}

const bio = (...paragraphs: React.ReactNode[]) => (
  <div className="space-y-3">
    {paragraphs.map((paragraph, index) => (
      <p key={index}>{paragraph}</p>
    ))}
  </div>
)

const topRow: TeamMember[] = [
  {
    id: 1,
    name: "Dr. YANG, Yin Nicole (PhD)",
    role: "Principal Investigator",
    subtitle: "Research Assistant Professor",
    image: "/Nicole.webp",
    bio: bio(
      "Dr Yang is an interdisciplinary researcher of cognitive science, language education, and educational technology. Her work bridges multiple disciplines, leveraging her diverse academic background to explore innovative approaches to teaching and learning in technology-enhanced environments. Drawing upon contemporary cognitive science and learning theories, her research explores the intersection of human cognition, AI, and instructional design to understand and enhance how people learn.",
      "Her interdisciplinary research advances emerging technology-driven education, with a focus on (1) AI-powered creative language learning systems that support metacognitive strategies through emerging technologies. (2) cognitive mechanisms that drive human-computer collaboration; and (3) innovative learning design that integrates insights from cognition and technology to optimize learning outcomes. Her work investigates how people learn language and other complex skills in technology-enhanced environments, with a special focus on the cognitive and metacognitive processes underlying such learning. She is particularly interested in how humans interact with AI, and emerging technologies to support self-regulated, and higher-order thinking."
    ),
  },
  {
    id: 2,
    name: "Prof. LEE, Chi Kin John, JP (PhD)",
    role: "Co-Principal Investigator & Advisor",
    subtitle: "Chair Professor of Curriculum and Instruction",
    image: "/john.webp",
    bio: bio(
      "Professor John Lee Chi-Kin, President and Chair Professor of Curriculum and Instruction, joined The Education University of Hong Kong (the then Hong Kong Institute of Education) in 2010. He was Vice President (Academic) from 2010 to 2019, and Vice President (Academic) and Provost from 2019 to 2023.",
      <>
        His research expertise spans curriculum and instruction, teacher development, school improvement, life and values education, geographical and environmental education, educational leadership, sustainability education, and policy-oriented educational innovation. Professor Lee has served as Editor of the <em>International Journal of Children&apos;s Spirituality</em>, Executive Editor of <em>Teaching and Teacher Education</em> and editorial board member of <em>Teachers and Teaching</em>, as well as an editorial board members or advisory editor of many local, regional and international journals. He is also a prolific writer, having edited and written more than 25 books, and published over 175 journal articles and book chapters. He is the leading co-editor of the Springer book series, <em>Curriculum and School Development in Asia</em> and <em>Education for Sustainability</em>, as well as <em>The Routledge Series on Life and Values Education</em> and <em>The Routledge Series on Chinese Language Education</em>.
      </>,
      "Professor Lee has actively participated in education and social service in Hong Kong, Chinese Mainland and overseas."
    ),
  },
]
const bottomRow: TeamMember[] = [
  {
    id: 3,
    name: "Prof. GU, Ming Yue Michelle (PhD)",
    role: "Co-Investigator",
    subtitle: "Professor, Assistant Vice President (Research)",
    image: "/apple.webp",
    bio: bio(
      "Professor Michelle Gu Mingyue is Assistant Vice President (Research) and Professor in the Department of English Language Education at The Education University of Hong Kong. She is a distinguished scholar in sociolinguistics and language education, internationally recognised for her interdisciplinary research on language, identity, multilingualism, and digital literacies.",
      "As a researcher in sociolinguistics, Professor Gu adopts multi-disciplinary approaches to explore the individual-context interplay mediated by languages and semiotics. Her research integrates theories and methods from sociolinguistics, critical inquiry, discourse studies and psychology. She has theorised the concept of Digital Trans-literacies to understand identity exploration and self-concept clarity among youths in a digital world; and has developed theoretical frameworks to advance the areas of language and identity, multilingualism and mobility, family language policy, and the interaction between language, culture and ethnicity.",
      "Professor Gu is a prolific scholar with many publications in top academic journals in the fields of linguistics and languages. She is an active researcher with a strong record in securing external research grants such as the General Research Grant (5 as PI; 7 as co-I), PICO-Funded Public Policy Research (1 as PI; 3 as co-I), and the Standing Committee on Language Education and Research (research and development) projects (2 as PI; 1 as co-I). She has worked on two World University Network projects and collaborated extensively with scholars across the world.",
      "At the policy level, Professor Gu's publications have received policy citations across four countries/regions, including policy documents from UNESCO, World Bank, OECD, etc, showcasing the social impact of her research."
    ),
  },
  {
    id: 4,
    name: "Prof. CHIU, Ming Ming (PhD)",
    role: "Co-Investigator",
    subtitle: "Chair Professor of Analytics and Diversity",
    image: "/CHIU, Ming Ming.png",
    bio: bio(
      <>
        Professor Chiu is an analytics expert, integrating statistics, computer science and mathematics to develop theories and test them in diverse fields, including education, psychology, sociology, linguistics, criminology, economics, and management. Professor Chiu is a prolific researcher with 175 publications (97 refereed journal articles). He invented an artificial intelligence expert system, <em>Statistician</em>, and two statistical methods, <em>Multilevel Diffusion Analysis</em> and <em>Statistical Discourse Analysis</em>, which was recognised as one of the best 50 learning science ideas by the <em>International Society for the Learning Sciences</em>. He is also an outstanding academic leader; as Associate Chair of the Department of Learning and Instruction in University at Buffalo, he helped nearly triple his colleagues&apos; publications from 0.5 to 1.4 per year.
      </>
    ),
  },
  {
    id: 5,
    name: "Prof. Wen Yun (PhD)",
    role: "Co-Investigator",
    subtitle: "Associate Professor, National Institute of Education Nanyang Technological University, Singapore",
    image: "/Wen Yun.png",
    bio: bio(
      "Dr Wen Yun is a learning sciences researcher advancing technology-enhanced learning innovations in schools. Her research investigates how people learn through interaction and conversations in multimodal environments, and how to use emerging technologies, such as Augmented Reality (AR) or Artificial Intelligence (AI), to spark productive interactions and enhance learning. She leads interdisciplinary teams of researchers, developers, and educational practitioners, to make a profound impact on teaching and learning practice and shed light on theoretical perspectives on integrating emerging technologies into learning."
    ),
  },
  {
    id: 6,
    name: "Prof. MA, Qing Angel (PhD)",
    role: "Co-Investigator",
    subtitle: "Professor of Department of Linguistics and Modern Language Studies",
    image: "/MA, Qing Ange.png",
    bio: bio(
      "Professor Angel Ma Qing currently serves as Associate Dean (Research and Postgraduate Studies) at the Faculty of Humanities, EdUHK. Her main research interests include second language vocabulary acquisition, corpus linguistics, corpus-based literature studies, corpus-based language pedagogy (CBLP), computer-assisted language learning (CALL), mobile-assisted language learning (MALL), and AI in language education.",
      <>
        Professor Ma has made significant contributions to local, regional and international communities through a wide range of professional activities. Her work includes shaping language policy and reviewing Master of Arts programmes, as well as serving as a panel judge for many school-based competitions. She has conducted numerous seminars and has held roles as associate editor for five international journals, including <em>Computer Assisted Language Learning</em> and <em>Language Learning &amp; Technology</em>, <em>International Journal of Computer Assisted Language Learning and Teaching</em>, etc. Furthermore, she has reviewed articles for more than 50 international journals. Her commitment to advancing the field is further demonstrated by her leadership in organising over 18 international conferences. Through these diverse roles, she has had a sustained and far-reaching impact on language education and research communities worldwide.
      </>
    ),
  },
  {
    id: 7,
    name: "Prof. KONG, Siu Cheung (PhD)",
    role: "Co-Investigator",
    subtitle: "Chair Professor of Department of Mathematics and Information Technology",
    image: "/kongsiucheung.png",
    bio: bio(
      "Professor Kong Siu-cheung is Chair Professor at the Department of Mathematics and Information Technology and Director of the Artificial Intelligence and Digital Competency Education Centre at The Education University of Hong Kong (EdUHK).",
      <>
        Professor Kong serves as Editor-in-Chief of international journals <em>Research and Practice in Technology Enhanced Learning</em> and <em>Journal of Computers in Education</em>. He was President of the Asia-Pacific Society for Computers in Education from 2014 to 2015 and the Global Chinese Society for Computers in Education from July 2023 to June 2025.
      </>,
      "Professor Kong has been named on the Stanford list of the world's Top 2% Scientists in Education since 2019. His accolades include the 2019-2020 HKSAR University Grants Council Teaching Award (Team Award); the EdUHK President's Awards for Outstanding Performance in Knowledge Transfer (Team Award) in 2020 and for Outstanding Performance in Administration (Team Award) in 2021 and 2024; and the National Teaching Achievement Award 2022 (Higher Education - Undergraduate, Tier-Two Team Award) of the People's Republic of China. Currently, he is a member of the 7th Academic Committee of the China Association for Educational Technology and the National Expert Committee on Science Education for Primary and Secondary Schools."
    ),
  },
  {
    id: 8,
    name: "Dr. Ling Man Ho Alpha (PhD)",
    role: "Co-Investigator",
    subtitle: "Assistant Professor of Department of Mathematics and Information Technology",
    image: "/Ling Man Ho Alpha.png",
    bio: bio(
      "Dr. Alpha Ling Man Ho is Associate Professor and Chairperson of the Departmental Management Committee (DMC) and Departmental Research Committee (DRC) in the Department of Mathematics and Information Technology at The Education University of Hong Kong. He is a distinguished scholar in statistics and reliability engineering, internationally recognized for his specialized research on one-shot device testing, degradation data analysis, and statistical inference under censoring.",
      'As a researcher in mathematical statistics, Dr. Ling develops advanced probabilistic models to evaluate the reliability and lifetime of complex systems. His work is characterized by the integration of Bayesian inference, EM algorithms, and copula models to address real-world engineering challenges. He has pioneered methodologies for analyzing "one-shot" devices-components that can be tested only once-and has significantly advanced the field of accelerated life testing.',
      "Dr. Ling is a prolific scholar with an extensive publication record in premier journals such as IEEE Transactions on Reliability and Reliability Engineering & System Safety. He is a highly active researcher with a strong track record of securing research grants, serving as Principal Investigator on numerous projects involving big data analytics, STEM education, and AI-enhanced learning. His innovative work in assessment automation has earned him international acclaim, including a Silver Medal and Special Award at the International Invention Innovation Competition (iCAN). Beyond his research, he contributes to the global academic community as an Editorial Board Member for several international statistical journals."
    ),
  },
  {
    id: 9,
    name: "Dr. WONG, Ming Har Ruth (PhD)",
    role: "Co-Investigator",
    subtitle: "Associate Head of Department, Assistant Professor",
    image: "/ruth.webp",
    bio: bio(
      "Dr. Wong Ming Har (Ruth) is an Assistant Professor and Associate Head of the Department of English Language Education at The Education University of Hong Kong (EdUHK). Her research focuses on EFL (English as a Foreign Language) learning motivation, learner autonomy, and teacher training."
    ),
  },
  {
    id: 10,
    name: "Mr. LIU, Tong Tony",
    role: "Research Assistant",
    subtitle: "Graduate of AI & Educational Technology, EdUHK",
    image: "/Tony.webp",
    bio: bio("Graduate of AI & Educational Technology, EdUHK. Research interests in AI and design, robotics automation, and STEM."),
  },
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
    primary: isActive ? "bg-white scale-110 rotate-3 text-primary" : "bg-white/85 hover:bg-white text-primary",
    secondary: isActive ? "bg-white scale-110 -rotate-3 text-secondary" : "bg-white/85 hover:bg-white text-secondary",
    accent: isActive ? "bg-white scale-110 rotate-2 text-accent" : "bg-white/85 hover:bg-white text-accent",
  }
  return base[color as keyof typeof base] || base.primary
}

function SkyCloudBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <style>
        {`
          @keyframes aboutCloudDriftRight {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(65vw); }
          }
          @keyframes aboutCloudDriftLeft {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-58vw); }
          }
        `}
      </style>
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(180deg, #0D47A1 0%, #1565C0 15%, #1E88E5 35%, #42A5F5 55%, #64B5F6 75%, #90CAF9 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.02]"
        style={{
          background:
            "linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)",
          backgroundSize: "4px 4px",
        }}
      />
      <PixelSkyCloud className="absolute left-[8vw] top-[4%] z-[5] w-40 opacity-85" style={{ animation: "aboutCloudDriftRight 35s linear infinite" }} />
      <PixelSkyCloud className="absolute left-[68vw] top-[8%] z-[5] w-36 opacity-80" style={{ animation: "aboutCloudDriftLeft 32s linear infinite" }} />
      <PixelSkyCloud className="absolute left-[22vw] top-[36%] z-[15] w-48 opacity-88" style={{ animation: "aboutCloudDriftRight 28s linear infinite" }} />
      <PixelSkyCloud className="absolute left-[72vw] top-[50%] z-[15] w-40 opacity-85" style={{ animation: "aboutCloudDriftLeft 30s linear infinite" }} />
      <PixelSkyCloud className="absolute left-[36vw] top-[74%] z-[15] w-52 opacity-90" style={{ animation: "aboutCloudDriftRight 25s linear infinite" }} />
      <PixelSkyCloud className="absolute left-[10vw] top-[88%] z-[15] w-44 opacity-82" style={{ animation: "aboutCloudDriftRight 33s linear infinite" }} />
    </div>
  )
}

function PixelSkyCloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 32" className={className} style={{ imageRendering: "pixelated", ...style }} aria-hidden="true">
      <rect x="20" y="4" width="16" height="2" fill="white" />
      <rect x="16" y="6" width="26" height="2" fill="white" />
      <rect x="12" y="8" width="34" height="2" fill="white" />
      <rect x="8" y="10" width="42" height="2" fill="white" />
      <rect x="6" y="12" width="48" height="2" fill="white" />
      <rect x="6" y="14" width="50" height="2" fill="white" />
      <rect x="8" y="16" width="46" height="2" fill="white" />
      <rect x="12" y="18" width="38" height="2" fill="white" />
      <rect x="18" y="20" width="28" height="2" fill="white" />
      <rect x="6" y="16" width="2" height="2" fill="rgba(0,0,0,0.06)" />
      <rect x="54" y="16" width="2" height="2" fill="rgba(0,0,0,0.06)" />
    </svg>
  )
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
    <div className="about-new-theme relative min-h-screen overflow-hidden bg-background" style={{ paddingTop: showVisionPage ? "88px" : "0", paddingBottom: "0" }}>
      {showVisionPage && <SkyCloudBackdrop />}
      {/* ========== Opening：花紋頂到頂部無空白，左右超出 ========== */}
      <section className={`${showVisionPage ? "" : "hidden"} min-h-screen flex items-center justify-center relative overflow-hidden`} style={{ marginTop: "-88px", paddingTop: "88px" }}>
        <div className="relative z-20 max-w-5xl w-full mx-4 md:mx-8 rounded-[2rem] border border-white/70 bg-white/90 px-8 py-12 text-center shadow-[0_18px_40px_rgba(13,71,161,0.18)] backdrop-blur-sm md:px-16 md:py-16">
          <div className="relative z-10">
            <h1
              className="mb-7 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl md:text-8xl"
              style={{
                background: "linear-gradient(180deg, #0D47A1 0%, #1E88E5 52%, #00A86B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "0 3px 0 rgba(144,202,249,0.85), 0 8px 18px rgba(13,71,161,0.16)",
              }}
            >
              {t.openingH1a}
              <br />
              {t.openingH1b}
            </h1>
            <p className="mb-6 text-2xl font-black text-[#1565C0] md:text-3xl">{t.openingSub}</p>
            <div className="w-28 h-2 bg-[#E8FF72] mx-auto shadow-[3px_3px_0_rgba(13,71,161,0.16)] mb-7" />
            <p className="mx-auto max-w-4xl text-xl font-semibold leading-9 text-slate-700 md:text-2xl md:leading-10">{t.openingP}</p>
          </div>
        </div>
      </section>

      {/* ========== About CWrite（aboutusnewest about-cwrite）========== */}
      <section className={`${showVisionPage ? "" : "hidden"} py-12 px-4 relative overflow-visible`}>
        <div className="absolute inset-0 z-10">
          <div className="absolute top-20 right-20 w-40 h-40 bg-primary/20 rounded-[2rem] rotate-12 animate-morphing shadow-brutal" />
          <div className="absolute bottom-32 left-20 w-32 h-32 bg-secondary/30 rounded-[2rem] -rotate-12 animate-float shadow-brutal" />
          <div className="absolute left-[44%] top-[18%] h-24 w-44 rounded-[2rem] bg-white/20 rotate-6 shadow-[0_18px_40px_rgba(13,71,161,0.12)] animate-float-delayed" />
        </div>
        <div className="max-w-7xl mx-auto relative z-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-8 py-4 text-white font-black mb-4 drop-shadow-[0_4px_10px_rgba(13,71,161,0.55)] hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-6 h-6 mr-3 text-primary animate-pulse" />
              About Us
            </div>
            <h2
              className="text-5xl md:text-7xl font-black text-white mb-8"
              style={{ textShadow: "0 5px 0 #1565C0, 0 10px 18px rgba(13,71,161,0.35)" }}
            >
              {t.aboutTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {aboutFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="p-8 rounded-[2rem] border border-white/70 bg-white/90 backdrop-blur-sm transition-all duration-500 cursor-pointer group hover:scale-105 hover:-rotate-1 shadow-[0_18px_40px_rgba(13,71,161,0.18)] hover:shadow-xl relative overflow-hidden"
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
      <section className={`${showVisionPage ? "" : "hidden"} py-16 px-4 relative overflow-visible`}>
        <div className="absolute inset-0 z-10">
          <div className="absolute top-8 left-8 w-56 h-40 bg-primary/20 rounded-[2rem] -rotate-6 animate-morphing shadow-brutal" />
          <div className="absolute bottom-10 right-10 w-52 h-36 bg-secondary/30 rounded-[2rem] rotate-12 animate-float shadow-brutal" />
          <div className="absolute top-1/2 left-1/4 w-48 h-32 bg-accent/25 rounded-[2rem] rotate-12 animate-pulse shadow-brutal" />
          <div className="absolute right-[28%] top-[6%] h-20 w-36 rounded-[2rem] bg-white/20 -rotate-12 shadow-[0_18px_40px_rgba(13,71,161,0.12)] animate-float-delayed" />
        </div>
        <div className="max-w-7xl mx-auto relative z-20">
          <div className="flex justify-center mb-12">
            <Image src="/logobig.webp" alt="CWrite" width={400} height={200} className="object-contain group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-8 py-4 text-white font-black mb-4 drop-shadow-[0_4px_10px_rgba(13,71,161,0.55)] hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-6 h-6 mr-3 text-primary animate-spin" />
              Creative Writing
              <Zap className="w-6 h-6 ml-3 text-accent" />
            </div>
            <h2
              className="text-5xl md:text-7xl font-black text-white mb-8"
              style={{ textShadow: "0 5px 0 #1565C0, 0 10px 18px rgba(13,71,161,0.35)" }}
            >
              {t.enhanceTitle}
            </h2>
            <p className="text-xl text-white max-w-2xl mx-auto font-semibold drop-shadow-[0_3px_8px_rgba(13,71,161,0.55)]">{t.enhancePillar}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {methods.map((method, index) => {
              const Icon = method.icon
              return (
                <div
                  key={index}
                  className="p-8 rounded-[2rem] border border-white/70 bg-white/90 backdrop-blur-sm transition-all duration-500 cursor-pointer group hover:scale-105 hover:-rotate-1 shadow-[0_18px_40px_rgba(13,71,161,0.18)] hover:shadow-xl relative overflow-hidden"
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
      <section className={`${showVisionPage ? "" : "hidden"} py-12 px-4 relative overflow-visible`}>
        <div className="absolute inset-0 z-10">
          <div className="absolute left-[10%] top-[10%] h-20 w-40 rounded-[2rem] bg-white/20 rotate-6 shadow-[0_18px_40px_rgba(13,71,161,0.12)] animate-float" />
          <div className="absolute bottom-[12%] right-[12%] h-24 w-44 rounded-[2rem] bg-primary/20 -rotate-6 shadow-brutal animate-float-delayed" />
        </div>
        <div className="max-w-4xl mx-auto relative z-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-6 py-3 text-white font-black mb-4 drop-shadow-[0_4px_10px_rgba(13,71,161,0.55)] hover:scale-105 transition-transform duration-300">
              <Heart className="w-5 h-5 mr-2 text-accent animate-pulse" />
              Core Values
            </div>
            <h2
              className="text-4xl md:text-5xl font-black text-white mb-4"
              style={{ textShadow: "0 4px 0 #1565C0, 0 9px 18px rgba(13,71,161,0.35)" }}
            >
              {t.valuesTitle}
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {valuesList.map((value, index) => (
              <div
                key={index}
                className={`px-4 py-2 rounded-full border border-white/75 cursor-pointer font-bold text-sm shadow-[0_8px_18px_rgba(13,71,161,0.16)] transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 ${getColorClasses(value.color, activeValueIndex === index)}`}
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

      {/* ========== Philosophy：像素藍天白雲風格 ========== */}
      <section className={`${showVisionPage ? "" : "hidden"} relative overflow-visible px-4 py-16 md:py-20`}>
        <div className="absolute inset-0 z-10">
          <div className="absolute right-[9%] top-[18%] h-24 w-48 rounded-[2rem] bg-white/20 rotate-12 shadow-[0_18px_40px_rgba(13,71,161,0.12)] animate-float" />
          <div className="absolute bottom-[8%] left-[12%] h-20 w-36 rounded-[2rem] bg-secondary/25 -rotate-6 shadow-brutal animate-float-delayed" />
        </div>
        <div className="relative z-20 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center px-6 py-3 text-white drop-shadow-[0_4px_10px_rgba(13,71,161,0.55)]">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            <span className="font-black uppercase tracking-[0.16em]">Philosophy</span>
            <Sparkles className="ml-2 h-5 w-5 text-secondary" />
          </div>
          <h2
            className="mb-5 text-4xl font-black leading-tight text-white md:text-6xl"
            style={{ textShadow: "0 4px 0 #1565C0, 0 9px 18px rgba(13,71,161,0.35)" }}
          >
            {t.philosophyTitle}
          </h2>
          <div className="mx-auto mb-6 h-2 w-28 bg-[#E8FF72] shadow-[3px_3px_0_rgba(13,71,161,0.45)]" />
          <p className="mx-auto max-w-3xl text-2xl font-semibold leading-10 text-white drop-shadow-[0_3px_8px_rgba(13,71,161,0.55)] md:text-3xl md:leading-[3rem]">{t.philosophyText}</p>
        </div>
      </section>

      {/* ========== Vision：像素藍天白雲風格 ========== */}
      <section className={`${showVisionPage ? "" : "hidden"} relative overflow-visible px-4 py-16`}>
        <div className="absolute inset-0 z-10">
          <div className="absolute left-[7%] top-[18%] h-24 w-44 rounded-[2rem] bg-white/20 -rotate-12 shadow-[0_18px_40px_rgba(13,71,161,0.12)] animate-float" />
          <div className="absolute right-[8%] bottom-[10%] h-28 w-52 rounded-[2rem] bg-accent/20 rotate-6 shadow-brutal animate-float-delayed" />
        </div>
        <div className="max-w-6xl mx-auto relative z-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-8 py-4 text-white font-black mb-8 drop-shadow-[0_4px_10px_rgba(13,71,161,0.55)] hover:scale-105 transition-transform duration-300">
              <Eye className="w-6 h-6 mr-3 text-primary animate-pulse" />
              Our Vision
              <Sparkles className="w-6 h-6 ml-3 text-accent" />
            </div>
            <h2
              className="text-5xl md:text-7xl font-black text-white mb-8"
              style={{ textShadow: "0 5px 0 #1565C0, 0 10px 18px rgba(13,71,161,0.35)" }}
            >
              {t.visionTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8">
            <div className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_18px_40px_rgba(13,71,161,0.18)] backdrop-blur-sm transition-all duration-500 group relative overflow-hidden">
              <div className="relative z-10">
                <div className="mb-6 inline-flex items-center bg-gradient-to-r from-[#0D47A1] to-[#00A86B] bg-clip-text px-6 py-3 text-3xl font-black text-transparent">
                  <Users className="w-7 h-7 mr-3 text-[#00A86B]" />
                  For Writers
                </div>
                <p className="mb-7 text-xl font-semibold leading-8 text-slate-700 md:text-2xl md:leading-9">{t.writersP}</p>
                <ul className="space-y-5">
                  {writerItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-4 group/item hover:scale-105 transition-transform duration-300">
                      <div className="w-10 h-10 bg-[#E8FF72] flex items-center justify-center shadow-[2px_2px_0_rgba(13,71,161,0.45)]">
                        <CheckCircle className="w-5 h-5 text-[#1565C0]" />
                      </div>
                      <span className="text-lg font-bold text-slate-700 md:text-xl">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_18px_40px_rgba(13,71,161,0.18)] backdrop-blur-sm transition-all duration-500 group relative overflow-hidden">
              <div className="relative z-10">
                <div className="mb-6 inline-flex items-center bg-gradient-to-r from-[#0D47A1] to-[#7C3AED] bg-clip-text px-6 py-3 text-3xl font-black text-transparent">
                  <BookOpen className="w-7 h-7 mr-3 text-[#7C3AED]" />
                  For Research
                </div>
                <p className="mb-7 text-xl font-semibold leading-8 text-slate-700 md:text-2xl md:leading-9">{t.researchP}</p>
                <ul className="space-y-5">
                  {researchItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-4 group/item hover:scale-105 transition-transform duration-300">
                      <div className="w-10 h-10 bg-[#E8FF72] flex items-center justify-center shadow-[2px_2px_0_rgba(13,71,161,0.45)]">
                        <CheckCircle className="w-5 h-5 text-[#1565C0]" />
                      </div>
                      <span className="text-lg font-bold text-slate-700 md:text-xl">{item}</span>
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
        className={`${showResearchPage ? "" : "hidden"} pt-24 md:pt-28 pb-16 md:pb-24 px-4 relative overflow-hidden`}
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
                    <div className="max-h-full overflow-y-auto pr-1 text-left text-[11px] leading-relaxed text-white [scrollbar-width:thin]">{member.bio}</div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
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
                    <div className="max-h-full overflow-y-auto pr-1 text-left text-[11px] leading-relaxed text-white [scrollbar-width:thin]">{member.bio}</div>
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

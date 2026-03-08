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
}

const researchVision = {
  title: "Research Vision",
  paragraphs: [
    "We are committed to designing human-centered, AI-supported learning frameworks that integrate self-regulated learning and educational technology to improve the effectiveness and equity of language and interdisciplinary learning.",
    "We examine AI's role in teaching as an inspiration and feedback tool that helps learners remain agentic, develop critical digital literacy, and adopt sustainable learning strategies."
  ]
}

const leadTeam: Member[] = [
  {
    name: "Dr. YANG, Yin Nicole (PhD)",
    role: "Principal Investigator",
    titles: [
      "Research Assistant Professor"
    ],
    interests: [
      "AI in interdisciplinary education",
      "Digital literacy and competency",
      "Second language acquisition",
      "Cognitive science in learning",
      "Emerging technologies and pedagogical innovation"
    ],
    email: "yyin@eduhk.hk",
    scholar: "https://scholar.google.com/citations?user=bjITS38AAAAJ&hl=zh-CN&inst=9002373801639654337&oi=ao",
    photo: "/Nicole.png"
  },
  {
    name: "Prof. LEE, Chi Kin John, JP (PhD)",
    role: "Co-Principal Investigator & Advisor",
    titles: [
      "President",
      "Chair Professor of Curriculum and Instruction",
      "Director, Academy for Applied Policy Studies and Education Futures",
      "Director, Academy for Educational Development and Innovation"
    ],
    interests: [
      "Curriculum and instruction",
      "Geographical and environmental education",
      "School improvement",
      "Teacher development",
      "Life and values education"
    ],
    email: "poffice@eduhk.hk",
    photo: "/john.png"
  }
]

const team: Member[] = [
  {
    name: "Prof. GU, Ming Yue Michelle (PhD)",
    role: "Co-Investigator",
    titles: [
      "Professor",
      "Assistant Vice President (Research)"
    ],
    interests: [
      "Multilingualism and mobility",
      "Internationalization in higher education",
      "(Digital) citizenship and identity studies",
      "Minority education",
      "Family language policy"
    ],
    email: "mygu@eduhk.hk",
    scholar: "https://scholar.google.com/citations?user=PLuccV8AAAAJ&hl=en",
    photo: "/apple.png"
  },
  {
    name: "Dr. WONG, Ming Har Ruth (PhD)",
    role: "Co-Investigator",
    titles: [
      "Associate Head of Department",
      "Assistant Professor"
    ],
    interests: [
      "Motivation",
      "Task-based Learning",
      "Curriculum",
      "Language Arts",
      "Teacher Education"
    ],
    email: "wongmh@eduhk.hk",
    scholar: "https://scholar.google.com.hk/citations?user=LG0U99AAAAAJ&hl=en",
    photo: "/ruth.png"
  },
  {
    name: "Mr. LIU, Tong Tony",
    role: "Research Assistant",
    titles: [
      "Graduate of AI & Educational Technology, EdUHK"
    ],
    interests: [
      "AI and design",
      "Robotics automation",
      "STEM"
    ],
    email: "liut@eduhk.hk",
    photo: "https://museaiwrite.eduhk.hk/wp-content/uploads/2025/10/image-8-683x1024.png"
  }
]

function MemberCard({ member, highlight }: { member: Member; highlight?: boolean }) {
  return (
    <div
      className={`relative rounded-3xl p-8 border-4 shadow-2xl backdrop-blur-sm h-full flex flex-col gap-4 ${
        highlight
          ? "bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-purple-200"
          : "bg-white/85 border-amber-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-purple-300 flex-shrink-0">
          <Image
            src={member.photo}
            alt={member.name}
            fill
            className="object-cover"
            unoptimized={member.photo.startsWith("http")}
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-purple-800 leading-tight">{member.name}</h3>
          <p className="text-sm font-semibold text-purple-600">{member.role}</p>
          <div className="text-sm text-gray-700 leading-snug">
            {member.titles.map((t, i) => (
              <div key={i}>{t}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/80 border border-purple-100 p-4 shadow-inner">
        <p className="text-sm font-semibold text-purple-700 mb-2">Research interests</p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc pl-4">
          {member.interests.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
          <a href={`mailto:${member.email}`}>✉️ Email</a>
        </Button>
        {member.scholar && (
          <Button
            asChild
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <a href={member.scholar} target="_blank" rel="noopener">
              🎓 Google Scholar
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}

const translations = {
  en: {
    aboutTitle: "About CWrite",
    aboutText1: "An AI-powered writing platform grounded in self-regulated learning and learning sciences",
    enhanceTitle: "How We Enhance Creative Writing",
    aiPartnerTitle: "AI as a Writing Partner",
    aiPartnerItems: [
      "Thought-provoking prompts that stimulate imagination",
      "Context-aware revision and language support",
      "Keep personal voice"
    ],
    selfLearningTitle: "Self-Regulated Learning at the Core",
    selfLearningItems: [
      "Plan, monitor, and evaluate",
      "Develop independence, metacognition, and writing confidence",
      "Build reflective thinking"
    ],
    collaborationTitle: "Learning Through Collaboration",
    collaborationItems: [
      "Share writing in the Luminai Library",
      "Peer review and feedback",
      "Learn through comparison, dialogue, and revision"
    ],
    philosophyTitle: "The Philosophy behind LuminiAI",
    philosophyText1: "Derived from the Latin lumen—meaning light—<strong>LuminAI</strong> represents <strong>illumination rather than domination</strong>. We believe that AI is not an all-knowing authority. LuminAI is grounded in the belief that intelligence should <strong>guide, reveal, and amplify</strong>, not replace human agency.",
    philosophyText2: "<strong>LuminAI</strong> aligns with humanistic and constructivist traditions in education, where knowledge is actively constructed through reflection, dialogue, and experience. Intelligence is understood not as a static output, but as a <strong>dynamic process of meaning-making</strong>.",
    visionTitle: "Our Vision",
    visionItems: [
      "Reshape creative writing education for the digital age.",
      "Become a global innovator in creative writing education.",
      "Cultivate the next generation of creative leaders."
    ],
    question: "How can AI enhance creative writing for ESL learners while safeguarding originality, agency, and human imagination?",
    valuesTitle: "Values Education in Action",
    valuesItems: [
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
    ],
  },
  zh: {
    aboutTitle: "關於CWrite",
    aboutText1: "一個為高年級小學生設計的AI驅動平台。",
    enhanceTitle: "我們如何增強創意寫作",
    aiPartnerTitle: "AI夥伴",
    aiPartnerItems: [
      "啟發性問題與提示",
      "針對性修改建議",
      "保持你的個人風格"
    ],
    selfLearningTitle: "自主學習",
    selfLearningItems: [
      "計劃、監控、評估",
      "發展獨立技能",
      "建立反思思維"
    ],
    collaborationTitle: "協作",
    collaborationItems: [
      "在圖書館分享",
      "同儕評審與反饋",
      "持續改進"
    ],
    philosophyTitle: "LuminiAI背後的哲學",
    philosophyText1: "LuminAI源自拉丁語lumen（光），代表<strong>啟發而非支配</strong>。我們相信AI不是全知權威。<strong>LuminAI</strong>基於這樣的信念：智能應該<strong>引導、揭示和放大</strong>，而非取代人類的主動性。",
    philosophyText2: "<strong>LuminAI</strong>與教育中的人本主義和建構主義傳統一致，知識通過反思、對話和經驗積極建構。智能被理解為<strong>動態的意義建構過程</strong>，而非靜態輸出。",
    visionTitle: "我們的願景",
    visionItems: [
      "重塑數碼時代的創意寫作教育。",
      "成為創意寫作教育的全球創新者。",
      "培養下一代創意領袖。"
    ],
    question: "AI如何可以令創意寫作對ESL學習者更有吸引力，同時保持原創性？",
    valuesTitle: "价值观教育",
    valuesItems: [
      "坚毅",
      "尊重他人",
      "责任感",
      "国民身份认同",
      "承担精神",
      "诚信",
      "仁爱",
      "守法",
      "同理心",
      "勤奋",
      "孝亲",
      "团结",
    ],
  },
}

export default function AboutPage({ onBack, language = "en" }: { onBack?: () => void; language?: Language }) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [expandProgress, setExpandProgress] = useState(0)
  const featuresRef = useRef<HTMLDivElement>(null)
  const t = translations[language] || translations.en

  const features = [
    {
      id: 1,
      icon: "🤖",
      title: t.aiPartnerTitle,
      items: t.aiPartnerItems,
      borderColor: "border-purple-200",
      textColor: "text-purple-700",
      gradient: "from-purple-600/20"
    },
    {
      id: 2,
      icon: "📚",
      title: t.selfLearningTitle,
      items: t.selfLearningItems,
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      gradient: "from-blue-600/20"
    },
    {
      id: 3,
      icon: "🌟",
      title: t.collaborationTitle,
      items: t.collaborationItems,
      borderColor: "border-pink-200",
      textColor: "text-pink-700",
      gradient: "from-pink-600/20"
    },
  ]

  useEffect(() => {
    if (!featuresRef.current) return

    const handleScroll = () => {
      if (!featuresRef.current) return
      
      const rect = featuresRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportCenter = viewportHeight / 2
      const elementCenter = rect.top + rect.height / 2
      const distanceFromCenter = elementCenter - viewportCenter
      const maxDistance = 800
      const centerZone = 20
      const absDistance = Math.abs(distanceFromCenter)
      
      let progress = 0
      if (absDistance <= centerZone) {
        progress = 1
      } else if (absDistance < maxDistance) {
        const transitionRange = maxDistance - centerZone
        const distanceFromCenterZone = absDistance - centerZone
        progress = 1 - (distanceFromCenterZone / transitionRange)
        progress = Math.max(0, progress)
      } else {
        progress = 0
      }
      
      progress = Math.max(0, Math.min(1, progress))
      setExpandProgress(progress)
    }

    handleScroll()
    let rafId: number | null = null
    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          handleScroll()
          rafId = null
        })
      }
    }

    let ticking = false
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', throttledScroll)
      window.removeEventListener('resize', handleScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 via-pink-50 to-orange-50 px-4" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <div className="max-w-7xl mx-auto space-y-10">
        {/* About CWrite Section */}
        <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border-2 border-purple-200 shadow-xl max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-purple-700 mb-4 text-center">{t.aboutTitle}</h3>
            <div className="text-base md:text-lg text-gray-700 leading-relaxed text-center">
              <p>{t.aboutText1}</p>
              <div className="mt-6 space-y-3">
                <p className="flex items-center justify-center gap-3">
                  <span className="text-2xl">✨</span>
                  <span className="text-sm md:text-base text-gray-700 font-medium">
                    Support students' <span className="font-bold text-purple-600">creative writing</span> processes
                  </span>
                </p>
                <p className="flex items-center justify-center gap-3">
                  <span className="text-2xl">🪄</span>
                  <span className="text-sm md:text-base text-gray-700 font-medium">
                    Preserve students' <span className="font-bold text-green-600">personal voice</span>
                  </span>
                </p>
                <p className="flex items-center justify-center gap-3">
                  <span className="text-2xl">🧠</span>
                  <span className="text-sm md:text-base text-gray-700 font-medium">
                    Encourage metacognitive engagement
                  </span>
                </p>
                <p className="flex items-center justify-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <span className="text-sm md:text-base text-gray-700 font-medium">
                    Promote <span className="font-bold text-rose-600">responsible</span> AI use.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How We Enhance Creative Writing */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            {t.enhanceTitle}
          </h2>
          
          <div 
            ref={featuresRef}
            className="relative h-[500px] md:h-[450px] flex items-center justify-center mb-4"
          >
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                opacity: 1 - expandProgress,
                transform: `scale(${1 - expandProgress * 0.1}) translateY(${-expandProgress * 20}px)`,
                transition: 'none',
              }}
            >
              <div className="relative w-64 h-64 md:w-80 md:h-80 bg-white/90 backdrop-blur-lg rounded-3xl p-4 md:p-6 border-4 border-purple-300 shadow-2xl flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="CWrite Logo"
                  width={240}
                  height={240}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
            </div>

            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                opacity: expandProgress,
              }}
            >
              <div className="relative w-full max-w-7xl mx-auto h-full flex items-center justify-center px-4">
                {features.map((feature, index) => {
                  const isHovered = hoveredCard === feature.id
                  const cardWidth = 380
                  const cardGap = 80
                  const totalCardSpacing = cardWidth + cardGap
                  const centerOffsetX = (index - 1) * totalCardSpacing * expandProgress
                  const baseOffsetY = index === 1 ? -28 : index === 2 ? 28 : 0
                  const cardOffsetY = baseOffsetY * expandProgress
                  const minScale = 0.4
                  const maxScale = 1.0
                  const cardScale = minScale + expandProgress * (maxScale - minScale)
                  const cardZIndex = expandProgress > 0.3 
                    ? (index === 1 ? 12 : index === 0 ? 11 : 10)
                    : index
                  
                  return (
                    <div
                      key={feature.id}
                      className="absolute perspective-1000"
                      onMouseEnter={() => expandProgress > 0.2 && setHoveredCard(feature.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        left: `50%`,
                        top: `50%`,
                        transform: `translate(-50%, -50%) translateX(${centerOffsetX}px) translateY(${cardOffsetY}px) scale(${cardScale})`,
                        pointerEvents: expandProgress > 0.2 ? 'auto' : 'none',
                        width: `${cardWidth}px`,
                        zIndex: cardZIndex,
                      }}
                    >
                      <div 
                        className={`relative bg-white/95 backdrop-blur-md rounded-2xl p-8 border-2 ${feature.borderColor} shadow-2xl cursor-pointer ${
                          isHovered ? 'shadow-3xl' : ''
                        }`}
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: isHovered 
                            ? `perspective(1000px) rotateY(${index === 1 ? '12deg' : '-12deg'}) scale(1.05)` 
                            : 'perspective(1000px) rotateY(0deg) scale(1)',
                          transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
                        }}
                      >
                        <div 
                          className={`absolute inset-0 bg-gradient-to-l ${feature.gradient} to-transparent rounded-2xl`}
                          style={{
                            opacity: isHovered ? 0.3 : 0,
                            transition: 'opacity 0.3s ease-out',
                          }}
                        ></div>
                        
                        <div className="relative z-10">
                          <div 
                            className="text-6xl mb-5 text-center" 
                            style={{
                              transform: isHovered ? 'rotate(-5deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                              transition: 'transform 0.3s ease-out',
                            }}
                          >
                            {feature.icon}
                          </div>
                          <h3 className={`text-2xl font-bold mb-4 ${feature.textColor} text-center`}>
                            {feature.title}
                          </h3>
                          <div className="space-y-2 text-center">
                            {feature.items.map((item, i) => (
                              <p key={i} className="text-sm text-gray-700 font-medium">
                                {item}
                              </p>
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

        {/* Question Box */}
        <div className="mb-12 -mx-4 mt-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-2xl shadow-2xl">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: 'url(/background.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/70 via-pink-800/60 to-indigo-900/70"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 via-transparent to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center z-10 px-6">
              <div className="text-center max-w-4xl">
                <div className="text-6xl mb-6 animate-bounce-in" style={{ animationDelay: '0.1s' }}>💭</div>
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-relaxed drop-shadow-lg">
                  {t.question}
                </p>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-20 bg-black/60 backdrop-blur-md rounded-lg p-4 border border-white/20 shadow-xl max-w-xs">
              <p className="text-white text-sm leading-relaxed">
                <span className="font-bold">Primavera</span> (Botticelli)
                <br />
                <span className="text-xs opacity-90">Luna, the goddess of inspiration, guides creativity.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12 mt-6 animate-fade-in" style={{ animationDelay: "0.62s" }}>
          <div className="bg-white/85 backdrop-blur-lg rounded-3xl p-7 border-2 border-amber-200 shadow-xl max-w-6xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-center text-amber-700 mb-5">{t.valuesTitle}</h3>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {t.valuesItems.map((value, index) => (
                <span
                  key={`${value}-${index}`}
                  className="rounded-full px-4 py-2 text-sm md:text-base font-semibold bg-gradient-to-r from-purple-100 via-pink-100 to-amber-100 border border-purple-200 text-purple-800 shadow-sm hover:scale-105 transition-transform"
                  title={`${value}: nurtured through creative writing practice.`}
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Philosophy */}
        <div className="mb-16 mt-16 animate-fade-in" style={{ animationDelay: '0.65s' }}>
          <h2 className="text-4xl md:text-5xl font-black text-center mb-12 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            {t.philosophyTitle}
          </h2>
          <div className="max-w-6xl mx-auto px-4">
            <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl p-8 md:p-12 border-4 border-amber-200 shadow-2xl overflow-hidden">
              <div className="relative z-10">
                <div className="text-5xl mb-6 text-center opacity-80">📖</div>
                <p 
                  className="text-base md:text-lg lg:text-xl text-gray-800 leading-relaxed mb-6 font-serif"
                  dangerouslySetInnerHTML={{ __html: t.philosophyText1 }}
                />
                <p 
                  className="text-base md:text-lg lg:text-xl text-gray-800 leading-relaxed font-serif"
                  dangerouslySetInnerHTML={{ __html: t.philosophyText2 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vision */}
        <div className="mb-12 mt-16 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <h2 className="text-4xl md:text-5xl font-black text-center mb-8 text-black">
            {t.visionTitle}
          </h2>
          <div className="max-w-5xl mx-auto">
            <ul className="space-y-4 text-xl md:text-2xl lg:text-3xl font-bold text-black leading-relaxed">
              {t.visionItems.map((item, index) => (
                <li key={index} className="flex items-center justify-center gap-4">
                  <span className="text-purple-600">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Research Vision */}
        <section className="bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-900 text-white rounded-3xl p-10 shadow-2xl">
          <h1 className="text-4xl md:text-5xl font-black mb-6">{researchVision.title}</h1>
          <div className="space-y-4 text-lg leading-relaxed text-purple-50">
            {researchVision.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* Lead team */}
        <section className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-black text-purple-800">Research Team</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {leadTeam.map((m) => (
              <MemberCard key={m.name} member={m} highlight />
            ))}
          </div>
        </section>

        {/* Core team */}
        <section className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((m) => (
              <MemberCard key={m.name} member={m} />
            ))}
          </div>
        </section>

        <footer className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white py-6 rounded-2xl text-center shadow-lg">
          <p className="text-purple-200">© 2025 CWrite - The Education University of Hong Kong</p>
        </footer>
      </div>
    </div>
  )
}

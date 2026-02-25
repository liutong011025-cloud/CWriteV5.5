"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import type { Language } from "@/app/page"
import Aurora from "@/components/effects/aurora"
import BounceCards from "@/components/ui/bounce-cards"
import ShapeBlur from "@/components/effects/shape-blur"

interface HomePageProps {
  language?: Language
  user?: { username: string; role: 'teacher' | 'student'; noAi?: boolean }
  onStartStory?: () => void
  onStartBookReview?: () => void
  onStartLetter?: () => void
  onStartPlan?: () => void
  onStartWrite?: () => void
  onViewAbout?: () => void
}

const translations = {
  en: {
    welcome: "Welcome to",
    museAIWrite: "CWrite",
    futureTitle: "The Future of Creative Writing",
    inAIEra: "in the AI Era",
    unleashCreativity: "Unleash Creativity,",
    empowerExpression: "Empower Expression",
    aboutTitle: "About CWrite",
    aboutText1: "An AI-powered writing platform grounded in self-regulated learning and learning sciences",
    aboutText2: "",
    aboutText3: "",
    enhanceTitle: "How We Enhance Creative Writing",
    philosophyTitle: "The Philosophy behind LuminiAI",
    philosophyText1: "Derived from the Latin lumen—meaning light—<strong>LuminAI</strong> represents <strong>illumination rather than domination</strong>. We believe that AI is not an all-knowing authority. LuminAI is grounded in the belief that intelligence should <strong>guide, reveal, and amplify</strong>, not replace human agency.",
    philosophyText2: "<strong>LuminAI</strong> aligns with humanistic and constructivist traditions in education, where knowledge is actively constructed through reflection, dialogue, and experience. Intelligence is understood not as a static output, but as a <strong>dynamic process of meaning-making</strong>.",
    visionTitle: "Our Vision",
    visionItems: [
      "Reshape creative writing education for the digital age.",
      "Become a global innovator in creative writing education.",
      "Cultivate the next generation of creative leaders."
    ],
    startButton: "Start with a Plan",
    question: "How can AI enhance creative writing for ESL learners while safeguarding originality, agency, and human imagination?",
    storyTitle: "Story Writing",
    storyDesc: "Create magical stories with help from your AI mentor",
    bookTitle: "Book Review",
    bookDesc: "Write thoughtful book reviews with AI assistance",
    letterTitle: "Letter Writing",
    letterDesc: "Compose letters with creative writing support",
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
  },
  zh: {
    welcome: "歡迎來到",
    museAIWrite: "CWrite",
    futureTitle: "創意寫作的未來",
    inAIEra: "在AI時代",
    unleashCreativity: "釋放創意，",
    empowerExpression: "賦能表達",
    aboutTitle: "關於CWrite",
    aboutText1: "一個為高年級小學生設計的AI驅動平台。",
    aboutText2: "結合人工智能與自主學習原則。",
    aboutText3: "創造個人化、互動的寫作體驗。",
    enhanceTitle: "我們如何增強創意寫作",
    philosophyTitle: "LuminiAI背後的哲學",
    philosophyText1: "LuminAI源自拉丁語lumen（光），代表<strong>啟發而非支配</strong>。我們相信AI不是全知權威。<strong>LuminAI</strong>基於這樣的信念：智能應該<strong>引導、揭示和放大</strong>，而非取代人類的主動性。",
    philosophyText2: "<strong>LuminAI</strong>與教育中的人本主義和建構主義傳統一致，知識通過反思、對話和經驗積極建構。智能被理解為<strong>動態的意義建構過程</strong>，而非靜態輸出。",
    visionTitle: "我們的願景",
    visionItems: [
      "重塑數碼時代的創意寫作教育。",
      "成為創意寫作教育的全球創新者。",
      "培養下一代創意領袖。"
    ],
    startButton: "開始制定計劃",
    question: "AI如何可以令創意寫作對ESL學習者更有吸引力，同時保持原創性？",
    storyTitle: "故事寫作",
    storyDesc: "在AI導師的幫助下創造魔法故事",
    bookTitle: "書評",
    bookDesc: "在AI協助下寫出深思熟慮的書評",
    letterTitle: "書信寫作",
    letterDesc: "在創意寫作支援下撰寫書信",
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
  },
}

export default function HomePage({ 
  language = "en",
  user,
  onStartStory, 
  onStartBookReview, 
  onStartLetter,
  onStartPlan,
  onStartWrite,
  onViewAbout
}: HomePageProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [expandProgress, setExpandProgress] = useState(0) // 0 = 完全重叠, 1 = 完全展开
  const featuresRef = useRef<HTMLDivElement>(null)
  const introContainerRef = useRef<HTMLDivElement | null>(null)
  const [activeType, setActiveType] = useState<"story" | "review" | "letter" | "drama" | "poetry" | null>(null)

  const t = translations[language] || translations.en

  const cards = [
    {
      id: 1,
      title: t.storyTitle,
      description: t.storyDesc,
      icon: "📖",
      gradient: "from-purple-600 via-pink-600 to-orange-600",
      hoverGradient: "from-purple-700 via-pink-700 to-orange-700",
      onClick: onStartStory,
    },
    {
      id: 2,
      title: t.bookTitle,
      description: t.bookDesc,
      icon: "📝",
      gradient: "from-blue-600 to-cyan-600",
      hoverGradient: "from-blue-700 to-cyan-700",
      onClick: onStartBookReview,
    },
    {
      id: 3,
      title: t.letterTitle,
      description: t.letterDesc,
      icon: "✉️",
      gradient: "from-green-600 to-emerald-600",
      hoverGradient: "from-green-700 to-emerald-700",
      onClick: onStartLetter,
    },
  ]

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

  // 根据滚动位置计算展开进度（0-1之间的连续值）
  useEffect(() => {
    if (!featuresRef.current) return

    const handleScroll = () => {
      if (!featuresRef.current) return
      
      const rect = featuresRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportCenter = viewportHeight / 2
      
      // 计算元素中心点相对于视口的位置
      const elementCenter = rect.top + rect.height / 2
      const distanceFromCenter = elementCenter - viewportCenter
      
      // 重新设计展开逻辑：展开时间维持的短一些
      // 当元素在视口中心时，progress = 1
      // 当元素距离视口中心越远，progress 越小
      const maxDistance = 800 // 最大展开距离（像素）
      const centerZone = 20 // 中心区域，在此区域内 progress = 1（进一步减小中心区域，让展开时间更短）
      const absDistance = Math.abs(distanceFromCenter)
      
      let progress = 0
      
      // 计算基础进度（0-1），使用反向线性插值
      // 当 distanceFromCenter = 0 时，progress = 1
      // 当 absDistance = maxDistance 时，progress = 0
      if (absDistance <= centerZone) {
        // 在中心区域内，直接设置为1，但中心区域很小，所以展开时间短
        progress = 1
      } else if (absDistance < maxDistance) {
        // 使用线性插值，从 centerZone 到 maxDistance 平滑过渡
        const transitionRange = maxDistance - centerZone
        const distanceFromCenterZone = absDistance - centerZone
        progress = 1 - (distanceFromCenterZone / transitionRange)
        
        // 确保 progress 不会小于 0
        progress = Math.max(0, progress)
      } else {
        // 元素在展开区域外，完全重叠
        progress = 0
      }
      
      // 确保 progress 在 0-1 之间
      progress = Math.max(0, Math.min(1, progress))
      
      setExpandProgress(progress)
    }

    // 初始检查
    handleScroll()

    // 使用 requestAnimationFrame 优化滚动性能，确保每帧都更新
    let rafId: number | null = null
    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          handleScroll()
          rafId = null
        })
      }
    }

    // 监听滚动事件 - 使用节流优化性能
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 via-orange-50 to-yellow-50">
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-20 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      {/* Aurora特效叠加 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <Aurora 
          colorStops={['#FFD700', '#FF69B4', '#FFD700']}
          amplitude={1.0}
          blend={0.5}
        />
      </div>

      {/* 主要内容容器 - 从 header 下方开始，添加顶部 padding 避免被 header 遮挡 */}
      <div className="relative z-10 min-h-screen px-6 lg:px-12 pb-12 lg:pb-20" style={{ paddingTop: '128px', paddingBottom: '120px' }}>
        {/* 顶部标题区域 - 大号艺术字体 */}
        <div className="text-center mb-12 lg:mb-16 mt-16 lg:mt-24 animate-fade-in-up" style={{ animationDelay: '0s' }}>
          <h1 
            className="text-7xl md:text-8xl lg:text-9xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent"
            style={{
              letterSpacing: '-0.03em',
              lineHeight: '0.9',
              fontFamily: 'serif',
            }}
          >
            {t.welcome}
          </h1>
          <h1 
            className="text-8xl md:text-9xl lg:text-[12rem] font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent italic"
            style={{
              letterSpacing: '-0.02em',
              lineHeight: '0.9',
              fontFamily: 'serif',
            }}
          >
            {t.museAIWrite}
          </h1>
          <div className="w-40 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* 副标题 - 不同字体大小 */}
        <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
            {t.futureTitle}
          </p>
          <p className="text-xl md:text-2xl text-gray-600 font-medium">
            {t.inAIEra}
          </p>
        </div>

        {/* 核心标语 - 大号 */}
        <div className="text-center mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              {t.unleashCreativity}
            </span>
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              {' '}{t.empowerExpression}
            </span>
          </p>
        </div>

        {/* BounceCards - 文章类型卡片 */}
        <div className="flex justify-center mb-12 mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <BounceCards
            articles={[
              {
                emoji: "📖",
                title: language === "zh" ? "故事寫作" : "Story",
                gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              },
              {
                emoji: "📝",
                title: language === "zh" ? "書評" : "Book Review",
                gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              },
              {
                emoji: "✉️",
                title: language === "zh" ? "書信寫作" : "Letter",
                gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              },
              {
                emoji: "🎭",
                title: language === "zh" ? "戲劇" : "Drama",
                gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
              },
              {
                emoji: "📜",
                title: language === "zh" ? "詩歌" : "Poetry",
                gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              },
            ]}
            containerWidth={800}
            containerHeight={400}
            animationDelay={0.5}
            animationStagger={0.06}
            enableHover={true}
            onCardClick={(index) => {
              const mapping: Array<"story" | "review" | "letter" | "drama" | "poetry"> = [
                "story",
                "review",
                "letter",
                "drama",
                "poetry",
              ]
              setActiveType(mapping[index] ?? null)
            }}
          />
        </div>

        {/* 文章类型介绍区（使用 VariableProximity 字体特效） */}
        {activeType && (
          <div className="max-w-5xl mx-auto mb-20 animate-fade-in" style={{ animationDelay: "0.6s" }}>
            {/* 外层容器：专门放边框特效（参考 ReactBits ShapeBlur 用法） */}
            <div className="relative rounded-3xl overflow-hidden">
              {/* ShapeBlur 边框特效：作为绝对定位背景层 */}
              <ShapeBlur
                className="pointer-events-none absolute inset-0 z-0"
                variation={0}
                shapeSize={1}
                roundness={0.5}
                borderSize={0.08}
                circleSize={0.25}
                circleEdge={1}
              />

              {/* 内层实际卡片：用半透明背景，让边框和光感更明显 */}
              <div
                ref={introContainerRef}
                className="relative z-10 m-[10px] rounded-3xl bg-white/92 backdrop-blur-xl shadow-[0_25px_60px_rgba(148,27,153,0.25)] px-6 py-8 md:px-10 md:py-10"
              >
                <div className="space-y-6">
                {/* 返回按钮 */}
                <div className="flex justify-between items-center mb-4">
                  <Button
                    variant="outline"
                    className="bg-white/80 backdrop-blur-md border-2 border-gray-200 hover:bg-gray-50 text-gray-700 shadow-md"
                    onClick={() => setActiveType(null)}
                  >
                    ← Back
                  </Button>
                  <span className="text-sm uppercase tracking-[0.2em] text-purple-500 font-semibold">
                    Writing Genre Overview
                  </span>
                </div>

                  {/* 标题 + 一句话介绍（普通文本，可换行） */}
                  <div className="space-y-3">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                      {activeType === "story" && "Story Writing"}
                      {activeType === "review" && "Book Review"}
                      {activeType === "letter" && "Letter Writing"}
                      {activeType === "drama" && "Drama Script"}
                      {activeType === "poetry" && "Poetry"}
                    </h2>
                    <p className="text-lg md:text-2xl text-slate-800 leading-relaxed">
                      {activeType === "story" &&
                        "Build worlds, invent characters, and shape unforgettable plots."}
                      {activeType === "review" &&
                        "Think deeply, take a stance, and guide readers with your opinion."}
                      {activeType === "letter" &&
                        "Write with a real voice to connect hearts across distance."}
                      {activeType === "drama" &&
                        "Turn words into scenes, voices, and action on stage."}
                      {activeType === "poetry" &&
                        "Play with rhythm, images, and silence between the lines."}
                    </p>
                  </div>

                  {/* 简短说明 + 关键要点（普通文本，正常换行） */}
                  <div className="grid gap-6 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)] md:items-start">
                  <div className="space-y-3 text-base md:text-lg text-slate-700 leading-relaxed">
                    {activeType === "story" && (
                      <>
                        <p>
                          Story writing invites you to create characters with goals, place them in meaningful settings,
                          and let their choices drive a satisfying plot.
                        </p>
                        <p>
                          In CWrite, stories help you practise <strong>narrative structure</strong>,{" "}
                          <strong>description</strong>, and <strong>voice</strong> in a playful, low‑pressure way.
                        </p>
                      </>
                    )}
                    {activeType === "review" && (
                      <>
                        <p>
                          A book review is more than “I like it” or “I don&apos;t like it” — it explains{" "}
                          <strong>why</strong> with clear reasons and examples.
                        </p>
                        <p>
                          Here you practise <strong>argument, evidence, and evaluation</strong>, so your opinion can
                          genuinely help other readers.
                        </p>
                      </>
                    )}
                    {activeType === "letter" && (
                      <>
                        <p>
                          Letter writing keeps language close to real life: you write to someone specific, for a real
                          purpose and tone.
                        </p>
                        <p>
                          It is a powerful way to practise <strong>audience awareness</strong>,{" "}
                          <strong>clarity</strong>, and <strong>emotional expression</strong>.
                        </p>
                      </>
                    )}
                    {activeType === "drama" && (
                      <>
                        <p>
                          Drama turns stories into scripts with <strong>dialogue</strong>,{" "}
                          <strong>stage directions</strong>, and clear scene changes.
                        </p>
                        <p>
                          You learn to write for <strong>performance</strong> — imagining how words look and sound when
                          actors bring them to life.
                        </p>
                      </>
                    )}
                    {activeType === "poetry" && (
                      <>
                        <p>
                          Poetry uses <strong>condensed language</strong>, images, and rhythm to say a lot with very few
                          words.
                        </p>
                        <p>
                          It cultivates your sense of <strong>sound, metaphor, and line breaks</strong>, helping you see
                          how small changes in wording can change the whole feeling.
                        </p>
                      </>
                    )}
                  </div>

                  <div className="space-y-3 rounded-2xl bg-white/85 border border-purple-100 shadow-inner px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-purple-500 font-semibold">
                      In this genre you will practise
                    </p>
                    <ul className="space-y-1.5 text-sm md:text-base text-slate-800">
                      {activeType === "story" && (
                        <>
                          <li>• Designing characters, settings, and conflicts</li>
                          <li>• Organising events into a clear beginning, middle, and end</li>
                          <li>• Using detail to show rather than tell</li>
                        </>
                      )}
                      {activeType === "review" && (
                        <>
                          <li>• Stating a clear opinion about a text</li>
                          <li>• Supporting ideas with quotes, scenes, or examples</li>
                          <li>• Balancing summary with analysis</li>
                        </>
                      )}
                      {activeType === "letter" && (
                        <>
                          <li>• Matching tone to your relationship with the reader</li>
                          <li>• Explaining events and feelings clearly</li>
                          <li>• Organising real‑life details into a readable flow</li>
                        </>
                      )}
                      {activeType === "drama" && (
                        <>
                          <li>• Writing believable dialogue</li>
                          <li>• Using stage directions to guide actors</li>
                          <li>• Thinking in scenes, beats, and entrances/exits</li>
                        </>
                      )}
                      {activeType === "poetry" && (
                        <>
                          <li>• Choosing precise, image‑rich words</li>
                          <li>• Playing with rhythm, repetition, and line breaks</li>
                          <li>• Exploring different poetic forms and voices</li>
                        </>
                      )}
                    </ul>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Start with a Plan 按钮 */}
        <div className="text-center mb-12 mt-20 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <div className="mb-8">
            <span className="text-8xl md:text-9xl lg:text-[10rem] animate-wiggle" style={{ display: 'inline-block' }}>
              ✍️
            </span>
          </div>
          <Button
            onClick={() => {
              // 跳转到制定学习计划界面
              onStartPlan?.()
            }}
            size="lg"
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white border-0 shadow-2xl py-8 px-16 text-2xl md:text-3xl lg:text-4xl font-bold hover:scale-105 transition-all duration-300 rounded-full relative overflow-hidden group animate-gentle-bounce"
          >
            <span className="relative z-10">{t.startButton}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
          </Button>
        </div>
      </div>
    </div>
  )
}


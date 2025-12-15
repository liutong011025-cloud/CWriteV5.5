"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

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
    photo: "http://museaiwrite.eduhk.hk/wp-content/uploads/2025/05/图片11.png"
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
    photo: "/placeholder-user.jpg"
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
    photo: "/placeholder-user.jpg"
  },
  {
    name: "Dr LIU, Yiqi April (PhD)",
    role: "Co-Investigator",
    titles: [
      "Assistant Professor"
    ],
    interests: [
      "Classroom discourse",
      "Language and identity",
      "Content and Language Integrated Learning",
      "Translanguaging and trans-semiotizing"
    ],
    email: "liuyiqi@eduhk.hk",
    scholar: "https://scholar.google.com/citations?user=d_x9D8KvDlYC&hl=zh-TW",
    photo: "/placeholder-user.jpg"
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
    email: "tongliu@eduhk.hk",
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

export default function AboutPage({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 via-pink-50 to-orange-50 px-4" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <div className="max-w-7xl mx-auto space-y-10">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 via-pink-50 to-orange-50 px-4" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <div className="max-w-7xl mx-auto">
        {/* Hero / profile summary */}
        <header className="bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 py-12 border-b-2 border-purple-200 rounded-2xl mb-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="flex-shrink-0">
                <div className="relative w-56 h-56 rounded-2xl overflow-hidden border-4 border-purple-300 shadow-2xl">
                  <Image
                    src="http://museaiwrite.eduhk.hk/wp-content/uploads/2025/05/图片11.png"
                    alt={t.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                  {t.title}
                </h1>
                <div className="text-lg text-gray-600 font-semibold mb-4">{t.subtitle}</div>
                <p className="text-base text-gray-700 leading-relaxed mb-6">{t.description}</p>
                
                <div className="mb-4">
                  <div className="bg-white/80 backdrop-blur-lg rounded-xl px-6 py-4 border-2 border-purple-200 shadow-lg inline-flex gap-4 items-center">
                    <span className="text-2xl">🎓</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-purple-700">{t.degree}</span>
                      <span className="text-sm text-gray-600">{t.university}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
                  <a 
                    href="mailto:yyin@eduhk.hk" 
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <span>✉️</span> yyin@eduhk.hk
                  </a>
                  <a 
                    href="https://scholar.google.com/citations?user=bjITS38AAAAJ&hl=zh-CN&inst=9002373801639654337&oi=ao" 
                    target="_blank" 
                    rel="noopener"
                    className="px-6 py-3 bg-white hover:bg-purple-50 text-purple-700 border-2 border-purple-200 rounded-xl font-semibold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <span>🎓</span> Google Scholar
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Decorative marquee */}
        <div className="w-full overflow-hidden bg-gradient-to-r from-purple-100/50 via-pink-100/50 to-orange-100/50 py-4 my-8 border-y-2 border-purple-200 rounded-xl">
          <div className="flex animate-marquee whitespace-nowrap">
            <div className="flex gap-4 items-center px-8 font-serif text-xl text-purple-700">
              <span>⭐</span>
              <span>⭐</span>
              <span>⭐</span>
              <span>⭐</span>
              <span>⭐</span>
              <span className="ml-4">{t.marquee}</span>
            </div>
            <div className="flex gap-4 items-center px-8 font-serif text-xl text-purple-700" aria-hidden="true">
              <span>⭐</span>
              <span>⭐</span>
              <span>⭐</span>
              <span>⭐</span>
              <span>⭐</span>
              <span className="ml-4">{t.marquee}</span>
            </div>
          </div>
        </div>

        {/* Vision-like band */}
        <section className="bg-gradient-to-br from-purple-600 via-indigo-700 to-purple-800 text-white py-12 my-8 rounded-2xl mx-6 shadow-2xl">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-6">{t.visionTitle}</h2>
            <p className="text-lg leading-relaxed mb-4 text-purple-50">{t.visionText1}</p>
            <p className="text-lg leading-relaxed text-purple-50">{t.visionText2}</p>
          </div>
        </section>

        {/* Team */}
        <section className="py-12 bg-white/40 backdrop-blur-sm rounded-2xl">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-8 text-purple-700 border-b-4 border-purple-200 pb-4">
              {t.teamTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border-4 border-purple-200 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-purple-400">
                  <Image
                    src="http://museaiwrite.eduhk.hk/wp-content/uploads/2025/05/图片11.png"
                    alt={t.team1Name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="font-bold text-xl text-purple-700 mb-3">{t.team1Name}</div>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line">{t.team1Desc}</div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border-4 border-purple-200 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-purple-400">
                  <Image
                    src="https://museaiwrite.eduhk.hk/wp-content/uploads/2025/10/image-8-683x1024.png"
                    alt={t.team2Name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="font-bold text-xl text-purple-700 mb-3">{t.team2Name}</div>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line">{t.team2Desc}</div>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white py-8 mt-12 text-center rounded-2xl">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-purple-200">© 2025 CWrite - The Education University of Hong Kong</p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}


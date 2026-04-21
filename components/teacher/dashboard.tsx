"use client"

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react"
import { Cpu, FolderTree, LogOut, Monitor, RefreshCw, Terminal, User } from "lucide-react"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Textarea } from "@/ui/textarea"
import { toast } from "sonner"

type TeacherUser = {
  username: string
  role: "teacher" | "student"
}

interface DashboardProps {
  user?: TeacherUser
  onBack: () => void
}

interface ClassUser {
  id: string
  username: string
  role: string
  avatarUrl: string | null
  avatarEmoji: string | null
  grade: string | null
  totalWorks: number
  latestActiveAt: string | null
}

interface DashboardApiData {
  metrics: {
    registeredUsers: number
    activeUsers: number
    totalArticles: number
    totalApiCalls: number
  }
  analytics: {
    articleTypePie: Array<{ name: string; value: number }>
    tokenUsageDaily: Array<{ date: string; tokens: number }>
    tokenPeakHourly: Array<{ time: string; tokens: number }>
  }
  classGroups: Array<{ id: string; name: string; users: ClassUser[] }>
  updatedAt: string
}

interface WritingItem {
  id: string
  type: "story" | "review" | "letter" | "drama" | "poetry"
  title: string
  content: string
  createdAt: string
  updatedAt: string
  interactionId: string | null
}

interface ApiLogItem {
  id: string
  stage: string
  timestamp: string
  apiCalls: Array<{ endpoint?: string; request?: unknown; response?: unknown }>
}

interface UserDetailData {
  user: ClassUser
  writings: WritingItem[]
  apiLogs: ApiLogItem[]
}

type PanelType = "writings" | "api"

function formatTime(value: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleString("en-US", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function sizeOfText(value: string) {
  return `${new Blob([value]).size} B`
}

function splitSentences(value: string): string[] {
  const parts = value.match(/[^.!?\n]+[.!?]?|\n+/g) ?? []
  return parts.filter((part) => part.length > 0)
}

function parseSummarySections(text: string) {
  if (!text.trim()) return []
  const lines = text.split("\n")
  const sections: Array<{ title: string; points: string[] }> = []
  let current: { title: string; points: string[] } | null = null
  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    const title = trimmed.replace(/^#{1,4}\s*/, "")
    if (/^#{1,4}\s/.test(trimmed)) {
      current = { title, points: [] }
      sections.push(current)
      return
    }
    const point = trimmed.replace(/^[-*]\s*/, "")
    if (!current) {
      current = { title: "Insight", points: [] }
      sections.push(current)
    }
    current.points.push(point)
  })
  return sections
}

export default function Dashboard({ user, onBack }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardApiData | null>(null)
  const [activeClassId, setActiveClassId] = useState("class1")
  const [activeUsername, setActiveUsername] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<PanelType>("writings")

  const [userDetail, setUserDetail] = useState<UserDetailData | null>(null)
  const [activeWritingId, setActiveWritingId] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState("")

  const [selectedSentence, setSelectedSentence] = useState("")
  const [revisedSentence, setRevisedSentence] = useState("")
  const [teacherComment, setTeacherComment] = useState("")

  const [draftByWritingId, setDraftByWritingId] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadedClassFile, setUploadedClassFile] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    const res = await fetch("/api/teacher/dashboard", { cache: "no-store" })
    if (!res.ok) throw new Error("dashboard fetch failed")
    return (await res.json()) as DashboardApiData
  }, [])

  const fetchUserDetail = useCallback(async (username: string) => {
    const res = await fetch(`/api/teacher/dashboard/user/${encodeURIComponent(username)}`, {
      cache: "no-store",
    })
    if (!res.ok) throw new Error("user detail fetch failed")
    return (await res.json()) as UserDetailData
  }, [])

  const fetchAiSummary = useCallback(async (username: string) => {
    const res = await fetch("/api/teacher/dashboard/ai-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
    if (!res.ok) throw new Error("summary fetch failed")
    const data = (await res.json()) as { summary: string }
    return data.summary
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await fetchDashboard()
        if (!alive) return
        setDashboardData(data)
        const firstClass = data.classGroups.find((c: { id: string }) => c.id === "class1") ?? data.classGroups[0]
        const firstUser = firstClass?.users[0]?.username ?? null
        setActiveClassId(firstClass?.id ?? "class1")
        setActiveUsername(firstUser)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load dashboard.")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [fetchDashboard])

  useEffect(() => {
    if (!activeUsername) return
    let alive = true
    setLoadingDetail(true)
    setAiSummary("")
    setActiveWritingId(null)
    ;(async () => {
      try {
        const [detail, summary] = await Promise.all([fetchUserDetail(activeUsername), fetchAiSummary(activeUsername)])
        if (!alive) return
        setUserDetail(detail)
        setAiSummary(summary)
        if (detail.writings.length > 0) {
          setActiveWritingId(null)
          const map: Record<string, string> = {}
          detail.writings.forEach((item: WritingItem) => {
            map[item.id] = item.content ?? ""
          })
          setDraftByWritingId(map)
        } else {
          setDraftByWritingId({})
        }
        setSelectedSentence("")
        setRevisedSentence("")
        setTeacherComment("")
      } catch (error) {
        console.error(error)
        toast.error("Failed to load user data.")
      } finally {
        if (alive) setLoadingDetail(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [activeUsername, fetchAiSummary, fetchUserDetail])

  const activeWriting = useMemo(() => {
    if (!userDetail || !activeWritingId) return null
    return userDetail.writings.find((item: WritingItem) => item.id === activeWritingId) ?? null
  }, [userDetail, activeWritingId])

  const activeDraft = activeWriting ? draftByWritingId[activeWriting.id] ?? activeWriting.content : ""

  const sentenceParts = useMemo(() => splitSentences(activeDraft), [activeDraft])
  const summarySections = useMemo(() => parseSummarySections(aiSummary), [aiSummary])

  function applyRevision() {
    if (!activeWriting || !selectedSentence || !revisedSentence.trim()) {
      toast.error("Select one sentence and write revised text.")
      return
    }
    const current = draftByWritingId[activeWriting.id] ?? activeWriting.content
    const index = current.indexOf(selectedSentence)
    if (index < 0) {
      toast.error("Selected sentence no longer exists in current text.")
      return
    }
    const next = `${current.slice(0, index)}${revisedSentence}${current.slice(index + selectedSentence.length)}`
    setDraftByWritingId((prev: Record<string, string>) => ({ ...prev, [activeWriting.id]: next }))
    toast.success("Sentence revised in-place.")
  }

  async function sendCorrectionToBoard() {
    if (!activeWriting || !userDetail) return
    if (!selectedSentence.trim() || !revisedSentence.trim() || !teacherComment.trim()) {
      toast.error("Please complete selected sentence, revised sentence, and comment.")
      return
    }
    setSubmitting(true)
    try {
      const content = [
        "Sentence-level Revision",
        `Original: "${selectedSentence}"`,
        `Revised: "${revisedSentence}"`,
        `Teacher Comment: ${teacherComment}`,
      ].join("\n")

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          work_type: activeWriting.type,
          work_interaction_id: activeWriting.interactionId,
          author_username: userDetail.user.username,
          reviewer_username: user?.username ?? "Nicole",
          reviewer_role: "teacher",
          content,
          work_title: activeWriting.title,
          work_content: draftByWritingId[activeWriting.id] ?? activeWriting.content,
        }),
      })
      if (!res.ok) throw new Error("submit failed")
      toast.success("Revision note sent to student's writing board.")
    } catch (error) {
      console.error(error)
      toast.error("Failed to save revision.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#13231f] pt-32 pb-6 px-4 font-mono text-[#d9e8d8] md:pt-36">
      <div className="mx-auto w-full max-w-[1700px] rounded-lg border-2 border-[#5c7a6d] bg-[#1a2e28] shadow-[0_0_40px_rgba(94,173,156,0.2)] overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(112,184,168,0.045)_0,rgba(112,184,168,0.045)_1px,transparent_2px,transparent_4px)]" />

        <div className="relative z-10 flex items-center justify-between border-b border-[#5c7a6d] bg-[#2f4a42] px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Monitor className="h-4 w-4 text-[#78cab8]" />
            <span>CWRITE.EXE - Teacher Desktop</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 border-[#5c7a6d] bg-[#233932]" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 border-[#5c7a6d] bg-[#233932]" onClick={onBack}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="relative z-10 grid min-h-[78vh] grid-cols-12">
          <aside className="col-span-3 border-r border-[#5c7a6d] bg-[#203730] p-3">
            <div className="mb-3 text-xs text-[#8db6ab]">Directory Tree</div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-[#89c8b6]">
                <FolderTree className="h-4 w-4" />
                ROOT
              </div>
              {(dashboardData?.classGroups ?? [{ id: "class1", name: "Class 1", users: [] as ClassUser[] }]).map((cls: { id: string; name: string; users: ClassUser[] }) => (
                <div key={cls.id} className="ml-4 space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveClassId(cls.id)}
                    className={`block w-full rounded px-2 py-1 text-left ${
                      activeClassId === cls.id ? "bg-[#2e6359] text-[#b8f5e7]" : "hover:bg-[#2a4a42]"
                    }`}
                  >
                    ┣ {cls.name}
                  </button>
                  {activeClassId === cls.id &&
                    cls.users.map((u: ClassUser) => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => setActiveUsername(u.username)}
                        className={`ml-4 block w-[calc(100%-1rem)] rounded px-2 py-1 text-left ${
                          activeUsername === u.username ? "bg-[#3b8577] text-[#d2fff4]" : "hover:bg-[#2a4a42]"
                        }`}
                      >
                        ┣ {u.username}
                      </button>
                    ))}
                </div>
              ))}
            </div>

            <div className="mt-5 border border-[#5c7a6d] bg-[#1b2e28] p-2 text-xs space-y-1">
              <div>Registered: {dashboardData?.metrics.registeredUsers ?? 0}</div>
              <div>Active(24h): {dashboardData?.metrics.activeUsers ?? 0}</div>
              <div>Articles: {dashboardData?.metrics.totalArticles ?? 0}</div>
              <div>API Calls: {dashboardData?.metrics.totalApiCalls ?? 0}</div>
              <div>Updated: {formatTime(dashboardData?.updatedAt ?? null)}</div>
            </div>

            <div className="mt-3 border border-[#5c7a6d] bg-[#1b2e28] p-2 text-xs space-y-2">
              <div className="font-semibold text-[#b8e8d8]">Class Roster Upload (Demo)</div>
              <label className="block rounded border border-dashed border-[#6a9182] px-2 py-3 text-center hover:bg-[#24423a] cursor-pointer">
                Upload Excel / CSV
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    setUploadedClassFile(file.name)
                    toast.success(`Demo upload successful: ${file.name}`)
                  }}
                />
              </label>
              <div className="text-[#96b7ac]">Current file: {uploadedClassFile ?? "None"}</div>
            </div>
          </aside>

          <main className="col-span-9 bg-[#1a2e28] p-3">
            <div className="mb-3 grid grid-cols-12 gap-3">
              <div className="col-span-5 border border-[#5c7a6d] bg-[#13221d] p-3">
                <div className="mb-2 text-xs text-[#8eb7ab]">Article Type Distribution (Pie)</div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.analytics.articleTypePie ?? []}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={70}
                        innerRadius={30}
                        paddingAngle={2}
                      >
                        {(dashboardData?.analytics.articleTypePie ?? []).map((_: { name: string; value: number }, index: number) => (
                          <Cell
                            key={`pie-${index}`}
                            fill={["#6fd4bf", "#f2b874", "#9fbf8f", "#8ec1e8", "#d7a3e5"][index % 5]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-7 border border-[#5c7a6d] bg-[#13221d] p-3">
                <div className="mb-2 text-xs text-[#8eb7ab]">Token Usage Peak (Hourly Bar)</div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData?.analytics.tokenPeakHourly ?? []}>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#b9ddd0" }} interval={3} />
                      <YAxis tick={{ fontSize: 9, fill: "#b9ddd0" }} />
                      <Tooltip />
                      <Bar dataKey="tokens" fill="#6fd4bf" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between border border-[#5c7a6d] bg-[#273f37] px-3 py-2">
              <div className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-[#85d8c2]" />
                {activeUsername ?? "-"} / {activePanel === "writings" ? "Writings" : "AI API Interactions"}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 border-[#5c7a6d] ${activePanel === "writings" ? "bg-[#2f7e6e]" : "bg-[#203730]"}`}
                  onClick={() => setActivePanel("writings")}
                >
                  Writings
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 border-[#5c7a6d] ${activePanel === "api" ? "bg-[#2f7e6e]" : "bg-[#203730]"}`}
                  onClick={() => setActivePanel("api")}
                >
                  API Logs
                </Button>
              </div>
            </div>

            <div className="mb-3 border border-[#5c7a6d] bg-[#13221d] p-3">
              <div className="mb-2 text-xs text-[#8eb7ab] flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5" />
                AI Insight Summary
              </div>
              {loadingDetail ? (
                <div className="max-h-44 overflow-auto whitespace-pre-wrap text-sm leading-6 text-[#d5eadc]">
                  Loading student profile...
                </div>
              ) : summarySections.length === 0 ? (
                <div className="max-h-44 overflow-auto whitespace-pre-wrap text-sm leading-6 text-[#d5eadc]">
                  {aiSummary || "No summary."}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {summarySections.map((section: { title: string; points: string[] }) => (
                    <div key={section.title} className="rounded border border-[#4c6f64] bg-[#1b3029] p-2">
                      <div className="mb-1 text-xs font-semibold text-[#90d7c3]">{section.title}</div>
                      <ul className="space-y-1 text-xs text-[#d5eadc]">
                        {section.points.map((point: string) => (
                          <li key={point}>- {point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {loading || loadingDetail ? (
              <div className="border border-[#5c7a6d] bg-[#13221d] p-6 text-sm text-[#a5c7bd]">Loading...</div>
            ) : activePanel === "writings" ? (
              <div className="space-y-3">
                <div className="border border-[#5c7a6d] bg-[#13221d]">
                  <div className="grid grid-cols-12 border-b border-[#5c7a6d] bg-[#2a463d] px-3 py-2 text-xs text-[#bfe4d8]">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Size</div>
                    <div className="col-span-3">Modified</div>
                  </div>
                  <div className="max-h-52 overflow-auto">
                    {(userDetail?.writings ?? []).map((item: WritingItem) => {
                      const isSelected = activeWritingId === item.id
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setActiveWritingId(item.id)}
                          className={`grid w-full grid-cols-12 px-3 py-2 text-left text-xs border-b border-[#29453d] ${
                            isSelected ? "bg-[#2f7e6e] text-[#defcf2]" : "hover:bg-[#1f3a33]"
                          }`}
                        >
                          <div className="col-span-5 truncate">{item.title}</div>
                          <div className="col-span-2 uppercase">{item.type}</div>
                          <div className="col-span-2">{sizeOfText(item.content ?? "")}</div>
                          <div className="col-span-3">{formatTime(item.updatedAt)}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {!activeWriting && (
                  <div className="border border-dashed border-[#55796d] bg-[#13221d] p-4 text-xs text-[#a7cbc0]">
                    Select one article title in the file list to open full content.
                  </div>
                )}

                {activeWriting && (
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-7 border border-[#5c7a6d] bg-[#13221d] p-3">
                      <div className="mb-2 text-xs text-[#8eb7ab]">{activeWriting.title}</div>
                      <div className="max-h-72 overflow-auto border border-[#365a50] bg-[#1b2e27] p-3 text-sm leading-7">
                        {sentenceParts.map((part: string, idx: number) => {
                          const picked = part === selectedSentence
                          const isLineBreak = /^\n+$/.test(part)
                          if (isLineBreak) return <br key={`br-${idx}`} />
                          return (
                            <button
                              type="button"
                              key={`${part}-${idx}`}
                              onClick={() => {
                                setSelectedSentence(part)
                                setRevisedSentence(part)
                              }}
                              className={`mr-1 mb-1 inline rounded px-1 text-left ${
                                picked ? "bg-[#3cc7e3] text-[#0d2221]" : "hover:bg-[#2f5a52]"
                              }`}
                            >
                              {part}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="col-span-5 border border-[#5c7a6d] bg-[#13221d] p-3 space-y-2">
                      <div className="text-xs text-[#8eb7ab] flex items-center gap-2">
                        <Terminal className="h-3.5 w-3.5" />
                        Sentence-level Edit
                      </div>
                      <Input value={selectedSentence} readOnly className="border-[#486b61] bg-[#1b2f28] text-[#e4f4ee]" />
                      <Textarea
                        value={revisedSentence}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setRevisedSentence(e.target.value)}
                        placeholder="Revised sentence..."
                        className="min-h-20 border-[#486b61] bg-[#1b2f28] text-[#e4f4ee]"
                      />
                      <Textarea
                        value={teacherComment}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTeacherComment(e.target.value)}
                        placeholder="Teacher note..."
                        className="min-h-16 border-[#486b61] bg-[#1b2f28] text-[#e4f4ee]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-[#2f7e6e] hover:bg-[#389282]" onClick={applyRevision}>
                          Apply In-place
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#5c7a6d] bg-[#1c322c]"
                          disabled={submitting}
                          onClick={sendCorrectionToBoard}
                        >
                          {submitting ? "Saving..." : "Send to Board"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-[#5c7a6d] bg-[#13221d]">
                <div className="grid grid-cols-12 border-b border-[#5c7a6d] bg-[#2a463d] px-3 py-2 text-xs text-[#bfe4d8]">
                  <div className="col-span-4">Interaction ID</div>
                  <div className="col-span-3">Stage</div>
                  <div className="col-span-2">API Count</div>
                  <div className="col-span-3">Modified</div>
                </div>
                <div className="max-h-[28rem] overflow-auto">
                  {(userDetail?.apiLogs ?? []).map((log: ApiLogItem) => (
                    <details key={log.id} className="border-b border-[#29453d] text-xs">
                      <summary className="grid cursor-pointer grid-cols-12 px-3 py-2 hover:bg-[#1f3a33]">
                        <div className="col-span-4 truncate">{log.id}</div>
                        <div className="col-span-3">{log.stage}</div>
                        <div className="col-span-2">{log.apiCalls.length}</div>
                        <div className="col-span-3">{formatTime(log.timestamp)}</div>
                      </summary>
                      <div className="bg-[#10201b] p-3">
                        <pre className="max-h-52 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-[#d4e9de]">
                          {JSON.stringify(log.apiCalls, null, 2)}
                        </pre>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

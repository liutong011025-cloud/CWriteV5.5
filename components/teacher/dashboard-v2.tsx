"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Bot, ChevronDown, ChevronRight, LogOut, RefreshCw, Upload } from "lucide-react"
import { Button } from "@/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar"
import { Input } from "@/ui/input"
import { Textarea } from "@/ui/textarea"
import { toast } from "sonner"

interface DashboardProps {
  user?: { username: string; role: "teacher" | "student" }
  onBack: () => void
}

interface DashboardData {
  metrics: { registeredUsers: number; activeUsers: number; totalArticles: number; totalApiCalls: number }
  workDistribution: { stories: number; reviews: number; letters: number; dramas: number; poetries: number }
  trends: {
    dailyRegistrations: Array<{ date: string; count: number }>
    dailyTokenUsage: Array<{ date: string; tokens: number }>
    hourlyTokenPeaks: Array<{ hour: string; tokens: number }>
  }
  classGroups: Array<{
    id: string
    name: string
    users: Array<{ id: string; username: string; avatarUrl: string | null; avatarEmoji: string | null; grade: string | null; totalWorks: number; latestActiveAt: string | null }>
  }>
}

interface UserDetail {
  user: { username: string; grade: string | null; totalWorks: number; latestActiveAt: string | null }
  writings: Array<{ id: string; type: string; title: string; content: string; updatedAt: string; interactionId: string | null }>
  apiLogs: Array<{ id: string; stage: string; timestamp: string; tokenEstimate: number; apiCalls: Array<{ endpoint?: string }>; messages: Array<{ role: string; content: string }> }>
}

type Annotation = { id: string; quote: string; replaceWith: string; comment: string; saving: boolean }
type AnnotationMap = Record<string, Annotation[]>
const PIE = ["#6366f1", "#06b6d4", "#22c55e", "#f59e0b", "#ec4899"]

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。！？])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toDateLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function createAnnotation(quote: string): Annotation {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    quote,
    replaceWith: "",
    comment: "",
    saving: false,
  }
}

export default function DashboardV2({ user, onBack }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [summary, setSummary] = useState("")
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [panel, setPanel] = useState<"writings" | "api">("writings")
  const [openWriting, setOpenWriting] = useState<string | null>(null)
  const [openLog, setOpenLog] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<AnnotationMap>({})
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null)
  const [classFileName, setClassFileName] = useState("")
  const [classPreview, setClassPreview] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 15000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!selected) return
    void loadStudent(selected)
    void loadSummary(selected)
  }, [selected])

  async function refresh() {
    setLoadingDashboard(true)
    try {
      const res = await fetch("/api/teacher/dashboard", { cache: "no-store" })
      if (!res.ok) {
        toast.error("Failed to load dashboard data.")
        return
      }
      const json = (await res.json()) as DashboardData
      setData(json)
      if (!selected && json.classGroups[0]?.users[0]) setSelected(json.classGroups[0].users[0].username)
    } finally {
      setLoadingDashboard(false)
    }
  }

  async function loadStudent(username: string) {
    setLoadingDetail(true)
    setDetail(null)
    setPanel("writings")
    setOpenWriting(null)
    setOpenLog(null)
    try {
      const res = await fetch(`/api/teacher/dashboard/user/${encodeURIComponent(username)}`, { cache: "no-store" })
      if (!res.ok) {
        toast.error(`Failed to load ${username}'s records.`)
        return
      }
      setDetail((await res.json()) as UserDetail)
    } finally {
      setLoadingDetail(false)
    }
  }

  async function loadSummary(username: string) {
    setLoadingSummary(true)
    setSummary("")
    try {
      const res = await fetch("/api/teacher/dashboard/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      if (!res.ok) {
        setSummary("AI diagnosis is temporarily unavailable.")
        return
      }
      setSummary(((await res.json()) as { summary: string }).summary)
    } finally {
      setLoadingSummary(false)
    }
  }

  const pieData = useMemo(() => {
    if (!data) return []
    return [
      { name: "Story", value: data.workDistribution.stories },
      { name: "Review", value: data.workDistribution.reviews },
      { name: "Letter", value: data.workDistribution.letters },
      { name: "Drama", value: data.workDistribution.dramas },
      { name: "Poetry", value: data.workDistribution.poetries },
    ].filter((x) => x.value > 0)
  }, [data])

  const registrationChartData = useMemo(
    () => (data?.trends.dailyRegistrations ?? []).map((item) => ({ ...item, date: toDateLabel(item.date) })),
    [data],
  )

  async function saveCorrection(w: UserDetail["writings"][number], annotationId: string) {
    const item = (annotations[w.id] ?? []).find((annotation) => annotation.id === annotationId)
    if (!detail || !item?.quote || !item?.replaceWith || !item?.comment) return
    setAnnotations((prev) => ({
      ...prev,
      [w.id]: (prev[w.id] ?? []).map((annotation) =>
        annotation.id === annotationId ? { ...annotation, saving: true } : annotation,
      ),
    }))
    const content = `Teacher sentence-level correction\nOriginal sentence: "${item.quote}"\nSuggested revision: "${item.replaceWith}"\nTeacher note: ${item.comment}`
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        work_type: w.type,
        work_interaction_id: w.interactionId,
        author_username: detail.user.username,
        reviewer_username: user?.username ?? "Nicole",
        reviewer_role: "teacher",
        content,
        work_title: w.title,
        work_content: w.content,
      }),
    })
    if (res.ok) toast.success("Sentence-level correction saved.")
    setAnnotations((prev) => ({
      ...prev,
      [w.id]: (prev[w.id] ?? []).map((annotation) =>
        annotation.id === annotationId
          ? { ...annotation, quote: "", replaceWith: "", comment: "", saving: false }
          : annotation,
      ),
    }))
  }

  function captureSelection(w: UserDetail["writings"][number]) {
    const s = window.getSelection()?.toString().trim() ?? ""
    if (!s) return
    const next = createAnnotation(s)
    setAnnotations((prev) => ({ ...prev, [w.id]: [next, ...(prev[w.id] ?? [])] }))
    setActiveAnnotationId(next.id)
    toast.success("Sentence selected.")
  }

  function addSentenceAnnotation(writingId: string, sentence: string) {
    const next = createAnnotation(sentence)
    setAnnotations((prev) => ({ ...prev, [writingId]: [next, ...(prev[writingId] ?? [])] }))
    setActiveAnnotationId(next.id)
  }

  function updateAnnotation(writingId: string, annotationId: string, patch: Partial<Annotation>) {
    setAnnotations((prev) => ({
      ...prev,
      [writingId]: (prev[writingId] ?? []).map((annotation) =>
        annotation.id === annotationId ? { ...annotation, ...patch } : annotation,
      ),
    }))
  }

  function removeAnnotation(writingId: string, annotationId: string) {
    setAnnotations((prev) => ({
      ...prev,
      [writingId]: (prev[writingId] ?? []).filter((annotation) => annotation.id !== annotationId),
    }))
    if (activeAnnotationId === annotationId) setActiveAnnotationId(null)
  }

  function uploadDemo(file: File) {
    setClassFileName(file.name)
    if (!file.name.endsWith(".csv")) {
      setClassPreview(["Preview unavailable for this file type in demo mode."])
      return
    }
    const r = new FileReader()
    r.onload = () => setClassPreview(String(r.result ?? "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 12))
    r.readAsText(file)
  }

  const users = data?.classGroups[0]?.users ?? []
  const maxWorks = Math.max(...users.map((item) => item.totalWorks), 1)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eef2ff_35%,#f8fafc_75%)] pt-32 pb-10 px-4">
      <div className="mx-auto max-w-[1650px] space-y-5">
        <Card className="border-white/50 bg-white/65 backdrop-blur-xl">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Academic Teacher Dashboard</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void refresh()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
              <Button variant="outline" onClick={onBack}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Registered Users" value={data?.metrics.registeredUsers ?? 0} muted={loadingDashboard} />
            <Stat label="Active Users (24h)" value={data?.metrics.activeUsers ?? 0} muted={loadingDashboard} />
            <Stat label="Articles Collected" value={data?.metrics.totalArticles ?? 0} muted={loadingDashboard} />
            <Stat label="API Interactions" value={data?.metrics.totalApiCalls ?? 0} muted={loadingDashboard} />
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-3">
          <ChartCard title="Daily Registrations">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={registrationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Article Type Composition">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={95} label>
                  {pieData.map((item, i) => <Cell key={item.name} fill={PIE[i % PIE.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Token Usage Peak by Hour">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.trends.hourlyTokenPeaks ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="tokens" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <Card className="border-white/50 bg-white/65 backdrop-blur-xl">
          <CardHeader><CardTitle>Class File Manager</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button>Class 1</Button><Button variant="outline" disabled>Class 2</Button><Button variant="outline" disabled>Class 3</Button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDemo(f); e.currentTarget.value = "" }} />
              <Button variant="outline" className="ml-auto" onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Upload Class List (Demo)</Button>
            </div>
            {classFileName && <div className="rounded-xl border p-2 text-sm">Uploaded: {classFileName} {classPreview.length > 0 && `| Preview: ${classPreview.slice(0, 3).join(" ; ")}`}</div>}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {users.map((u) => (
                <button
                  key={u.id}
                  className={`rounded-lg border p-2 transition ${selected === u.username ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200"} ${
                    getUserHeatClass(u.totalWorks, maxWorks)
                  }`}
                  onClick={() => setSelected(u.username)}
                  type="button"
                >
                  <Avatar className="mx-auto mb-2 h-11 w-11">{u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={u.username} /> : null}<AvatarFallback>{u.avatarEmoji ?? u.username[0].toUpperCase()}</AvatarFallback></Avatar>
                  <p className="truncate text-xs">{u.username}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{u.totalWorks} works</p>
                </button>
              ))}
            </div>

            {(loadingDetail || detail) && (
              <div className="space-y-3 rounded-xl border bg-white/80 p-3">
                {loadingDetail || !detail ? (
                  <div className="py-10 text-center text-sm text-slate-500">Loading student records...</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{detail.user.username} | grade {detail.user.grade ?? "N/A"} | works {detail.user.totalWorks}</p>
                      <Button variant="outline" size="sm" onClick={() => void loadSummary(detail.user.username)}><Bot className="mr-2 h-4 w-4" />Refresh Summary</Button>
                    </div>
                    <Card className="border-indigo-100 bg-indigo-50/70">
                      <CardContent className="pt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">AI Diagnosis</p>
                        <p className="whitespace-pre-wrap text-sm">
                          {loadingSummary ? "AI diagnosis is generating, please wait..." : summary || "No summary available yet."}
                        </p>
                      </CardContent>
                    </Card>
                    <div className="flex gap-2">
                      <Button type="button" variant={panel === "writings" ? "default" : "outline"} onClick={() => setPanel("writings")}>Writings</Button>
                      <Button type="button" variant={panel === "api" ? "default" : "outline"} onClick={() => setPanel("api")}>AI Interactions</Button>
                    </div>

                {panel === "writings" && detail.writings.map((w) => {
                  const open = openWriting === w.id
                  const sentenceList = splitSentences(w.content || "")
                  const writingAnnotations = annotations[w.id] ?? []
                  return (
                    <Card key={w.id}>
                      <CardHeader className="py-3">
                        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpenWriting(open ? null : w.id)}>
                          <p className="text-sm font-medium">[{w.type.toUpperCase()}] {w.title}</p>{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </CardHeader>
                      {open && (
                        <CardContent className="space-y-3">
                          <div className="grid gap-3 lg:grid-cols-3">
                            <div className="rounded border bg-slate-50 p-3 lg:col-span-2">
                              <p className="mb-2 text-xs font-semibold text-slate-500">Original Text (click sentence to annotate)</p>
                              <div className="max-h-72 space-y-1 overflow-auto" onMouseUp={() => captureSelection(w)}>
                                {sentenceList.length === 0 ? (
                                  <p className="text-sm text-slate-400">(empty content)</p>
                                ) : (
                                  sentenceList.map((sentence, idx) => {
                                    const isActive = writingAnnotations.some(
                                      (annotation) => annotation.id === activeAnnotationId && annotation.quote === sentence,
                                    )
                                    const isAnnotated = writingAnnotations.some((annotation) => annotation.quote === sentence)
                                    return (
                                      <button
                                        key={`${w.id}-${idx}`}
                                        type="button"
                                        onClick={() => addSentenceAnnotation(w.id, sentence)}
                                        className={`block w-full rounded px-2 py-1 text-left text-sm leading-6 transition ${
                                          isActive
                                            ? "bg-amber-200"
                                            : isAnnotated
                                              ? "bg-amber-100"
                                              : "hover:bg-slate-200"
                                        }`}
                                      >
                                        {sentence}
                                      </button>
                                    )
                                  })
                                )}
                              </div>
                            </div>

                            <div className="rounded border bg-white p-3">
                              <p className="mb-2 text-xs font-semibold text-slate-500">Comments Sidebar</p>
                              <div className="max-h-72 space-y-2 overflow-auto">
                                {writingAnnotations.length === 0 ? (
                                  <p className="text-xs text-slate-400">Select a sentence from the text to create comments.</p>
                                ) : (
                                  writingAnnotations.map((annotation) => (
                                    <div
                                      key={annotation.id}
                                      className={`rounded border p-2 ${activeAnnotationId === annotation.id ? "border-indigo-400 bg-indigo-50" : "bg-slate-50"}`}
                                      onClick={() => setActiveAnnotationId(annotation.id)}
                                    >
                                      <p className="mb-2 line-clamp-2 text-xs text-slate-700">{annotation.quote}</p>
                                      <Input
                                        placeholder="Suggested revision"
                                        value={annotation.replaceWith}
                                        onChange={(event) =>
                                          updateAnnotation(w.id, annotation.id, { replaceWith: event.target.value })
                                        }
                                        className="mb-2 h-8 text-xs"
                                      />
                                      <Textarea
                                        placeholder="Teacher note"
                                        value={annotation.comment}
                                        onChange={(event) =>
                                          updateAnnotation(w.id, annotation.id, { comment: event.target.value })
                                        }
                                        className="mb-2 min-h-16 text-xs"
                                      />
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          className="h-7 px-2 text-xs"
                                          disabled={annotation.saving}
                                          onClick={() => void saveCorrection(w, annotation.id)}
                                        >
                                          {annotation.saving ? "Saving" : "Save"}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 px-2 text-xs"
                                          onClick={() => removeAnnotation(w.id, annotation.id)}
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}

                {panel === "api" && (
                  detail.apiLogs.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
                      No AI interaction records were found for this student.
                    </div>
                  ) : detail.apiLogs.map((log) => {
                  const open = openLog === log.id
                  return (
                    <Card key={log.id}>
                      <CardHeader className="py-3">
                        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpenLog(open ? null : log.id)}>
                          <p className="text-sm font-medium">{log.stage} | token {log.tokenEstimate} | {new Date(log.timestamp).toLocaleString("en-US")}</p>{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </CardHeader>
                      {open && <CardContent><div className="max-h-56 overflow-auto rounded border bg-slate-50 p-3 space-y-2">
                        {log.messages.length > 0 ? log.messages.map((m, i) => <div key={`${m.role}-${i}`} className="rounded border bg-white p-2"><p className="text-xs font-semibold uppercase text-slate-500">{m.role}</p><p className="whitespace-pre-wrap text-sm">{m.content}</p></div>) : <p className="text-sm text-slate-500">No parsed chat message.</p>}
                      </div></CardContent>}
                    </Card>
                  )
                }))}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

function Stat({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return <div className={`rounded-xl border bg-white/80 p-3 ${muted ? "opacity-70" : ""}`}><p className="text-xs text-slate-600">{label}</p><p className="text-2xl font-semibold">{value.toLocaleString()}</p></div>
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return <Card className="border-white/50 bg-white/65 backdrop-blur-xl"><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>
}

function getUserHeatClass(totalWorks: number, maxWorks: number) {
  const ratio = maxWorks <= 0 ? 0 : totalWorks / maxWorks
  if (ratio >= 0.75) return "bg-indigo-200 hover:bg-indigo-300"
  if (ratio >= 0.5) return "bg-indigo-100 hover:bg-indigo-200"
  if (ratio >= 0.25) return "bg-slate-100 hover:bg-indigo-100"
  return "bg-white hover:bg-slate-100"
}

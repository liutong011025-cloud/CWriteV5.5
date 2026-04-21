"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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

type Draft = Record<string, { quote: string; replaceWith: string; comment: string; saving: boolean }>
const PIE = ["#6366f1", "#06b6d4", "#22c55e", "#f59e0b", "#ec4899"]

function renderWithHighlight(text: string, quote: string) {
  if (!quote.trim() || !text.includes(quote)) return <pre className="whitespace-pre-wrap text-sm">{text}</pre>
  const idx = text.indexOf(quote)
  return (
    <pre className="whitespace-pre-wrap text-sm">
      <span>{text.slice(0, idx)}</span>
      <mark className="rounded bg-amber-200 px-1">{quote}</mark>
      <span>{text.slice(idx + quote.length)}</span>
    </pre>
  )
}

export default function DashboardV2({ user, onBack }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [summary, setSummary] = useState("")
  const [panel, setPanel] = useState<"writings" | "api">("writings")
  const [openWriting, setOpenWriting] = useState<string | null>(null)
  const [openLog, setOpenLog] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>({})
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
    const res = await fetch("/api/teacher/dashboard", { cache: "no-store" })
    if (!res.ok) return
    const json = (await res.json()) as DashboardData
    setData(json)
    if (!selected && json.classGroups[0]?.users[0]) setSelected(json.classGroups[0].users[0].username)
  }

  async function loadStudent(username: string) {
    const res = await fetch(`/api/teacher/dashboard/user/${encodeURIComponent(username)}`, { cache: "no-store" })
    if (!res.ok) return
    setDetail((await res.json()) as UserDetail)
    setOpenWriting(null)
    setOpenLog(null)
    setPanel("writings")
  }

  async function loadSummary(username: string) {
    const res = await fetch("/api/teacher/dashboard/ai-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
    if (!res.ok) return
    setSummary(((await res.json()) as { summary: string }).summary)
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

  async function saveCorrection(w: UserDetail["writings"][number]) {
    const item = draft[w.id]
    if (!detail || !item?.quote || !item?.replaceWith || !item?.comment) return
    setDraft((d) => ({ ...d, [w.id]: { ...item, saving: true } }))
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
    setDraft((d) => ({ ...d, [w.id]: { quote: "", replaceWith: "", comment: "", saving: false } }))
  }

  function captureSelection(w: UserDetail["writings"][number]) {
    const s = window.getSelection()?.toString().trim() ?? ""
    if (!s) return
    setDraft((d) => ({ ...d, [w.id]: { ...(d[w.id] ?? { quote: "", replaceWith: "", comment: "", saving: false }), quote: s } }))
    toast.success("Sentence selected.")
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
            <Stat label="Registered Users" value={data?.metrics.registeredUsers ?? 0} />
            <Stat label="Active Users (24h)" value={data?.metrics.activeUsers ?? 0} />
            <Stat label="Articles Collected" value={data?.metrics.totalArticles ?? 0} />
            <Stat label="API Interactions" value={data?.metrics.totalApiCalls ?? 0} />
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
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
                <button key={u.id} className={`rounded-lg border p-2 ${selected === u.username ? "bg-indigo-50 border-indigo-400" : "bg-white"}`} onClick={() => setSelected(u.username)}>
                  <Avatar className="mx-auto mb-2 h-11 w-11">{u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={u.username} /> : null}<AvatarFallback>{u.avatarEmoji ?? u.username[0].toUpperCase()}</AvatarFallback></Avatar>
                  <p className="truncate text-xs">{u.username}</p>
                </button>
              ))}
            </div>

            {detail && (
              <div className="space-y-3 rounded-xl border bg-white/80 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{detail.user.username} | grade {detail.user.grade ?? "N/A"} | works {detail.user.totalWorks}</p>
                  <Button variant="outline" size="sm" onClick={() => void loadSummary(detail.user.username)}><Bot className="mr-2 h-4 w-4" />Refresh Summary</Button>
                </div>
                <Card className="border-indigo-100 bg-indigo-50/70"><CardContent className="pt-4"><p className="whitespace-pre-wrap text-sm">{summary || "Loading summary..."}</p></CardContent></Card>
                <div className="flex gap-2">
                  <Button variant={panel === "writings" ? "default" : "outline"} onClick={() => setPanel("writings")}>Writings</Button>
                  <Button variant={panel === "api" ? "default" : "outline"} onClick={() => setPanel("api")}>AI Interactions</Button>
                </div>

                {panel === "writings" && detail.writings.map((w) => {
                  const open = openWriting === w.id
                  const d = draft[w.id] ?? { quote: "", replaceWith: "", comment: "", saving: false }
                  return (
                    <Card key={w.id}>
                      <CardHeader className="py-3">
                        <button className="flex w-full items-center justify-between text-left" onClick={() => setOpenWriting(open ? null : w.id)}>
                          <p className="text-sm font-medium">[{w.type.toUpperCase()}] {w.title}</p>{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </CardHeader>
                      {open && <CardContent className="space-y-2">
                        <div className="max-h-52 overflow-auto rounded border bg-slate-50 p-3" onMouseUp={() => captureSelection(w)}>
                          {renderWithHighlight(w.content, d.quote)}
                        </div>
                        <Input placeholder="Selected sentence" value={d.quote} onChange={(e) => setDraft((prev) => ({ ...prev, [w.id]: { ...d, quote: e.target.value } }))} />
                        <Input placeholder="Suggested revision" value={d.replaceWith} onChange={(e) => setDraft((prev) => ({ ...prev, [w.id]: { ...d, replaceWith: e.target.value } }))} />
                        <Textarea placeholder="Teacher note" value={d.comment} onChange={(e) => setDraft((prev) => ({ ...prev, [w.id]: { ...d, comment: e.target.value } }))} />
                        <Button disabled={d.saving} onClick={() => void saveCorrection(w)}>{d.saving ? "Saving..." : "Save sentence-level correction"}</Button>
                      </CardContent>}
                    </Card>
                  )
                })}

                {panel === "api" && detail.apiLogs.map((log) => {
                  const open = openLog === log.id
                  return (
                    <Card key={log.id}>
                      <CardHeader className="py-3">
                        <button className="flex w-full items-center justify-between text-left" onClick={() => setOpenLog(open ? null : log.id)}>
                          <p className="text-sm font-medium">{log.stage} | token {log.tokenEstimate} | {new Date(log.timestamp).toLocaleString("en-US")}</p>{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </CardHeader>
                      {open && <CardContent><div className="max-h-56 overflow-auto rounded border bg-slate-50 p-3 space-y-2">
                        {log.messages.length > 0 ? log.messages.map((m, i) => <div key={`${m.role}-${i}`} className="rounded border bg-white p-2"><p className="text-xs font-semibold uppercase text-slate-500">{m.role}</p><p className="whitespace-pre-wrap text-sm">{m.content}</p></div>) : <p className="text-sm text-slate-500">No parsed chat message.</p>}
                      </div></CardContent>}
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-white/80 p-3"><p className="text-xs text-slate-600">{label}</p><p className="text-2xl font-semibold">{value.toLocaleString()}</p></div>
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card className="border-white/50 bg-white/65 backdrop-blur-xl"><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>
}

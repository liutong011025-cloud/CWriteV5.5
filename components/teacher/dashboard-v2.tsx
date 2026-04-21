"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card"
import { Input } from "@/ui/input"
import { Textarea } from "@/ui/textarea"
import { toast } from "sonner"

type Panel = "writings" | "api"

export default function Dashboard({ user, onBack }: { user?: { username: string }; onBack: () => void }) {
  const [dashboard, setDashboard] = useState<any>(null)
  const [activeClass, setActiveClass] = useState("class1")
  const [activeUser, setActiveUser] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [summary, setSummary] = useState("")
  const [panel, setPanel] = useState<Panel>("writings")
  const [activeWritingId, setActiveWritingId] = useState<string | null>(null)
  const [selectedSentence, setSelectedSentence] = useState("")
  const [revisedSentence, setRevisedSentence] = useState("")
  const [comment, setComment] = useState("")

  useEffect(() => {
    ;(async () => {
      const res = await fetch("/api/teacher/dashboard", { cache: "no-store" })
      const data = await res.json()
      setDashboard(data)
      const first = data.classGroups?.[0]?.users?.[0]?.username ?? null
      setActiveUser(first)
    })()
  }, [])

  useEffect(() => {
    if (!activeUser) return
    ;(async () => {
      const [dRes, sRes] = await Promise.all([
        fetch(`/api/teacher/dashboard/user/${encodeURIComponent(activeUser)}`, { cache: "no-store" }),
        fetch("/api/teacher/dashboard/ai-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: activeUser }),
        }),
      ])
      setDetail(await dRes.json())
      setSummary((await sRes.json()).summary ?? "")
    })()
  }, [activeUser])

  const users = useMemo(() => dashboard?.classGroups?.find((x: any) => x.id === activeClass)?.users ?? [], [dashboard, activeClass])
  const writings = detail?.writings ?? []
  const writing = writings.find((w: any) => w.id === activeWritingId)
  const parts = (writing?.content?.match(/[^.!?\n]+[.!?]?|\n+/g) ?? []).filter(Boolean)

  async function submitRevision() {
    if (!writing || !selectedSentence || !revisedSentence || !comment) return toast.error("请先选择句子并填写修改意见")
    const updated = writing.content.replace(selectedSentence, revisedSentence)
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        work_type: writing.type,
        work_interaction_id: writing.interactionId,
        author_username: detail.user.username,
        reviewer_username: user?.username ?? "Nicole",
        reviewer_role: "teacher",
        content: `Original: "${selectedSentence}"\nRevised: "${revisedSentence}"\nTeacher Comment: ${comment}`,
        work_title: writing.title,
        work_content: updated,
      }),
    })
    if (!res.ok) return toast.error("提交失败")
    toast.success("已提交到 writing board")
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eef2ff_40%,#f8fafc_85%)] pt-24 pb-10 px-4">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <Card className="bg-white/65 backdrop-blur-xl border-white/60">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Academic Teacher Dashboard</h1>
              <p className="text-slate-600">Realtime analytics + writing feedback</p>
            </div>
            <Button variant="outline" onClick={onBack}>Logout</Button>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-4 gap-3">
          <Card className="bg-white/70"><CardContent className="p-4"><p>Registered Users</p><p className="text-3xl">{dashboard?.metrics?.registeredUsers ?? 0}</p></CardContent></Card>
          <Card className="bg-white/70"><CardContent className="p-4"><p>Active Users</p><p className="text-3xl">{dashboard?.metrics?.activeUsers ?? 0}</p></CardContent></Card>
          <Card className="bg-white/70"><CardContent className="p-4"><p>Articles</p><p className="text-3xl">{dashboard?.metrics?.totalArticles ?? 0}</p></CardContent></Card>
          <Card className="bg-white/70"><CardContent className="p-4"><p>API Calls</p><p className="text-3xl">{dashboard?.metrics?.totalApiCalls ?? 0}</p></CardContent></Card>
        </div>

        <div className="grid lg:grid-cols-12 gap-4">
          <Card className="lg:col-span-3 bg-white/65"><CardHeader><CardTitle>Class</CardTitle></CardHeader><CardContent className="space-y-2">{(dashboard?.classGroups ?? []).map((c: any) => <button key={c.id} className="w-full rounded border p-2 text-left bg-white" onClick={() => setActiveClass(c.id)}>{c.name}</button>)}
            <label className="block rounded border-dashed border p-2 text-center cursor-pointer bg-white">Upload Excel/CSV (Demo)<input type="file" className="hidden" accept=".xlsx,.xls,.csv" /></label>
          </CardContent></Card>

          <div className="lg:col-span-9 space-y-4">
            <Card className="bg-white/65"><CardHeader><CardTitle>Registered Users Table</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2">Username</th><th className="text-left">Role</th><th className="text-left">Works</th></tr></thead><tbody>{users.map((u: any) => <tr key={u.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setActiveUser(u.username)}><td className="py-2">{u.username}</td><td>{u.role}</td><td>{u.totalWorks}</td></tr>)}</tbody></table></CardContent></Card>

            <Card className="bg-white/65"><CardHeader><CardTitle>AI Writing Analysis (One Paragraph)</CardTitle></CardHeader><CardContent><p className="leading-7 text-slate-700">{summary || "Loading..."}</p></CardContent></Card>

            <Card className="bg-white/65">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{activeUser ?? "-"} Workspace</CardTitle>
                <div className="flex gap-2"><Button size="sm" variant={panel === "writings" ? "default" : "outline"} onClick={() => setPanel("writings")}>Writings</Button><Button size="sm" variant={panel === "api" ? "default" : "outline"} onClick={() => setPanel("api")}>API</Button></div>
              </CardHeader>
              <CardContent>
                {panel === "writings" ? (
                  <div className="space-y-3">
                    <table className="w-full text-sm border rounded bg-white"><thead><tr className="border-b"><th className="text-left p-2">Writing Name</th><th className="text-left">Type</th></tr></thead><tbody>{writings.map((w: any) => <tr key={w.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setActiveWritingId(w.id)}><td className="p-2">{w.title}</td><td>{w.type}</td></tr>)}</tbody></table>
                    {writing && <div className="grid lg:grid-cols-2 gap-3"><div className="border rounded p-3 bg-white max-h-72 overflow-auto">{parts.map((s: string, i: number) => /^\n+$/.test(s) ? <br key={i} /> : <button key={`${s}-${i}`} className={`mr-1 mb-1 rounded px-1 ${s === selectedSentence ? "bg-cyan-200" : "hover:bg-slate-100"}`} onClick={() => { setSelectedSentence(s); setRevisedSentence(s) }}>{s}</button>)}</div><div className="border rounded p-3 bg-white space-y-2"><Input value={selectedSentence} readOnly /><Textarea value={revisedSentence} onChange={(e) => setRevisedSentence(e.target.value)} /><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Teacher comment" /><Button onClick={submitRevision}>Submit Revision</Button></div></div>}
                  </div>
                ) : (
                  <div className="space-y-2">{(detail?.apiLogs ?? []).map((x: any) => <details key={x.id} className="border rounded p-2 bg-white"><summary>{x.stage} · {x.apiCalls.length} calls</summary><pre className="text-xs overflow-auto">{JSON.stringify(x.apiCalls, null, 2)}</pre></details>)}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

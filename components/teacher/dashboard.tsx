"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  FileText,
  LogOut,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card"
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

interface DashboardMetrics {
  registeredUsers: number
  activeUsers: number
  totalArticles: number
  totalApiCalls: number
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

interface ClassGroup {
  id: string
  name: string
  users: ClassUser[]
}

interface DashboardApiData {
  metrics: DashboardMetrics
  workDistribution: {
    stories: number
    reviews: number
    letters: number
    dramas: number
    poetries: number
  }
  trends: {
    dailyRegistrations: Array<{ date: string; count: number }>
    dailyApiCalls: Array<{ date: string; count: number }>
  }
  classGroups: ClassGroup[]
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

type DraftMap = Record<string, { quote: string; comment: string; saving: boolean }>

function getInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || "U"
}

function formatTime(time: string | null) {
  if (!time) return "No activity yet"
  return new Date(time).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function shorten(text: string, limit = 420) {
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}...`
}

export default function Dashboard({ user, onBack }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardApiData | null>(null)
  const [loadingDashboard, setLoadingDashboard] = useState(true)

  const [activeClassId, setActiveClassId] = useState("class1")
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)

  const [userDetail, setUserDetail] = useState<UserDetailData | null>(null)
  const [loadingUserDetail, setLoadingUserDetail] = useState(false)

  const [aiSummary, setAiSummary] = useState<string>("")
  const [loadingAiSummary, setLoadingAiSummary] = useState(false)

  const [activePanel, setActivePanel] = useState<"writings" | "api">("writings")
  const [drafts, setDrafts] = useState<DraftMap>({})

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/dashboard", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to fetch teacher dashboard")
      const data: DashboardApiData = await res.json()
      setDashboardData(data)

      const class1 = data.classGroups.find((group) => group.id === "class1")
      if (class1 && class1.users.length > 0 && !selectedUsername) {
        setSelectedUsername(class1.users[0].username)
      }
    } catch (error) {
      console.error(error)
      toast.error("Unable to load realtime dashboard data.")
    } finally {
      setLoadingDashboard(false)
    }
  }, [selectedUsername])

  const fetchUserDetail = useCallback(async (username: string) => {
    setLoadingUserDetail(true)
    setUserDetail(null)
    try {
      const res = await fetch(`/api/teacher/dashboard/user/${encodeURIComponent(username)}`, {
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Failed to fetch user detail")
      const data: UserDetailData = await res.json()
      setUserDetail(data)
      setActivePanel("writings")
      setDrafts({})
    } catch (error) {
      console.error(error)
      toast.error("Unable to load student details.")
    } finally {
      setLoadingUserDetail(false)
    }
  }, [])

  const fetchAiSummary = useCallback(async (username: string) => {
    setLoadingAiSummary(true)
    try {
      const res = await fetch("/api/teacher/dashboard/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      if (!res.ok) throw new Error("Failed to generate AI summary")
      const data = (await res.json()) as { summary: string }
      setAiSummary(data.summary)
    } catch (error) {
      console.error(error)
      toast.error("DeepSeek summary is unavailable now.")
      setAiSummary("Summary temporarily unavailable. Please retry.")
    } finally {
      setLoadingAiSummary(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    const timer = window.setInterval(fetchDashboard, 15000)
    return () => window.clearInterval(timer)
  }, [fetchDashboard])

  useEffect(() => {
    if (!selectedUsername) return
    setAiSummary("")
    void fetchUserDetail(selectedUsername)
    void fetchAiSummary(selectedUsername)
  }, [selectedUsername, fetchUserDetail, fetchAiSummary])

  const activeClassUsers = useMemo(() => {
    return dashboardData?.classGroups.find((group) => group.id === activeClassId)?.users ?? []
  }, [dashboardData, activeClassId])

  async function submitAnnotation(writing: WritingItem) {
    const draft = drafts[writing.id]
    const quote = draft?.quote?.trim() ?? ""
    const comment = draft?.comment?.trim() ?? ""

    if (!quote || !comment || !userDetail) {
      toast.error("Please provide both a quoted sentence and your comment.")
      return
    }

    setDrafts((prev) => ({
      ...prev,
      [writing.id]: { quote, comment, saving: true },
    }))

    try {
      const content = `Teacher Annotation\nQuoted sentence: "${quote}"\nComment: ${comment}`
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          work_type: writing.type,
          work_interaction_id: writing.interactionId,
          author_username: userDetail.user.username,
          reviewer_username: user?.username ?? "Nicole",
          reviewer_role: "teacher",
          content,
          work_title: writing.title,
          work_content: writing.content,
        }),
      })

      if (!res.ok) {
        throw new Error("Submit annotation failed")
      }

      toast.success("Annotation saved and synced to the student's writing board.")
      setDrafts((prev) => ({
        ...prev,
        [writing.id]: { quote: "", comment: "", saving: false },
      }))
    } catch (error) {
      console.error(error)
      toast.error("Failed to save annotation.")
      setDrafts((prev) => ({
        ...prev,
        [writing.id]: { quote, comment, saving: false },
      }))
    }
  }

  const workDistributionData = dashboardData
    ? [
        { name: "Story", value: dashboardData.workDistribution.stories },
        { name: "Review", value: dashboardData.workDistribution.reviews },
        { name: "Letter", value: dashboardData.workDistribution.letters },
        { name: "Drama", value: dashboardData.workDistribution.dramas },
        { name: "Poetry", value: dashboardData.workDistribution.poetries },
      ]
    : []

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eef2ff_35%,#f8fafc_75%)] pt-24 pb-10 px-4">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="rounded-3xl border border-white/50 bg-white/55 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Nicole Teacher Console
              </p>
              <h1 className="mt-2 text-4xl font-semibold text-slate-900">Academic Teacher Dashboard</h1>
              <p className="mt-2 text-sm text-slate-600">
                Realtime database analytics, learner files, AI insights, and sentence-level feedback.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchDashboard} className="bg-white/60">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" onClick={onBack} className="bg-white/60">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Last synced: {dashboardData ? formatTime(dashboardData.updatedAt) : "Loading..."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Registered Users",
              value: dashboardData?.metrics.registeredUsers ?? 0,
              icon: <Users className="h-5 w-5" />,
            },
            {
              label: "Active Users (24h)",
              value: dashboardData?.metrics.activeUsers ?? 0,
              icon: <Activity className="h-5 w-5" />,
            },
            {
              label: "Articles Collected",
              value: dashboardData?.metrics.totalArticles ?? 0,
              icon: <BookOpen className="h-5 w-5" />,
            },
            {
              label: "API Interactions",
              value: dashboardData?.metrics.totalApiCalls ?? 0,
              icon: <MessageSquare className="h-5 w-5" />,
            },
          ].map((item) => (
            <Card key={item.label} className="border-white/50 bg-white/65 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-slate-600">{item.label}</CardTitle>
                <div className="text-indigo-600">{item.icon}</div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-900">
                  {loadingDashboard ? "..." : item.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-white/50 bg-white/65 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                Registrations Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData?.trends.dailyRegistrations ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2.2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-white/50 bg-white/65 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-indigo-600" />
                Work Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/50 bg-white/65 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Class File Manager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {(dashboardData?.classGroups ?? []).map((group) => (
                <Button
                  key={group.id}
                  variant={group.id === activeClassId ? "default" : "outline"}
                  onClick={() => setActiveClassId(group.id)}
                >
                  {group.name}
                </Button>
              ))}
              <Button variant="outline" disabled>
                Class 2
              </Button>
              <Button variant="outline" disabled>
                Class 3
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
              <div className="mb-3 text-sm font-semibold text-slate-600">Students in {activeClassId.toUpperCase()}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
                {activeClassUsers.map((student) => (
                  <button
                    type="button"
                    key={student.username}
                    onClick={() => setSelectedUsername(student.username)}
                    className={`rounded-xl border p-2 text-left transition ${
                      selectedUsername === student.username
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-300"
                    }`}
                  >
                    <div className="mb-2 flex justify-center">
                      <Avatar className="h-12 w-12">
                        {student.avatarUrl ? <AvatarImage src={student.avatarUrl} alt={student.username} /> : null}
                        <AvatarFallback>{student.avatarEmoji ?? getInitial(student.username)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="truncate text-center text-xs font-medium text-slate-800">{student.username}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              {!selectedUsername || loadingUserDetail ? (
                <div className="py-10 text-center text-slate-500">Loading student dossier...</div>
              ) : !userDetail ? (
                <div className="py-10 text-center text-slate-500">No student selected.</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{userDetail.user.username} - Student Profile</h3>
                      <p className="text-xs text-slate-500">
                        Grade: {userDetail.user.grade ?? "N/A"} | Works: {userDetail.user.totalWorks} | Last active:{" "}
                        {formatTime(userDetail.user.latestActiveAt)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fetchAiSummary(userDetail.user.username)}
                      disabled={loadingAiSummary}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Regenerate AI Summary
                    </Button>
                  </div>

                  <Card className="border-indigo-100 bg-indigo-50/70">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Bot className="h-4 w-4 text-indigo-600" />
                        AI Academic Summary (English)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {loadingAiSummary ? "DeepSeek is generating insights..." : aiSummary || "No summary yet."}
                      </p>
                    </CardContent>
                  </Card>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={activePanel === "writings" ? "default" : "outline"}
                      onClick={() => setActivePanel("writings")}
                    >
                      Writings
                    </Button>
                    <Button
                      variant={activePanel === "api" ? "default" : "outline"}
                      onClick={() => setActivePanel("api")}
                    >
                      AI API Interactions
                    </Button>
                  </div>

                  {activePanel === "writings" && (
                    <div className="space-y-3">
                      {userDetail.writings.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">
                          This student has no submissions yet.
                        </div>
                      ) : (
                        userDetail.writings.map((writing) => {
                          const draft = drafts[writing.id] ?? { quote: "", comment: "", saving: false }
                          return (
                            <Card key={writing.id}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">
                                  [{writing.type.toUpperCase()}] {writing.title}
                                </CardTitle>
                                <p className="text-xs text-slate-500">Updated: {formatTime(writing.updatedAt)}</p>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="max-h-48 overflow-auto rounded-lg border bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                                  {shorten(writing.content || "(empty content)", 3000)}
                                </div>
                                <Input
                                  placeholder="Quoted sentence from this writing (for precise annotation)..."
                                  value={draft.quote}
                                  onChange={(event) =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [writing.id]: { ...draft, quote: event.target.value, saving: false },
                                    }))
                                  }
                                />
                                <Textarea
                                  placeholder="Teacher comment..."
                                  value={draft.comment}
                                  onChange={(event) =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [writing.id]: { ...draft, comment: event.target.value, saving: false },
                                    }))
                                  }
                                  className="min-h-20"
                                />
                                <Button disabled={draft.saving} onClick={() => submitAnnotation(writing)}>
                                  {draft.saving ? "Saving..." : "Save Annotation to Writing Board"}
                                </Button>
                              </CardContent>
                            </Card>
                          )
                        })
                      )}
                    </div>
                  )}

                  {activePanel === "api" && (
                    <div className="space-y-3">
                      {userDetail.apiLogs.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">
                          No API interaction records.
                        </div>
                      ) : (
                        userDetail.apiLogs.map((log) => (
                          <Card key={log.id}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{log.stage}</CardTitle>
                              <p className="text-xs text-slate-500">
                                {formatTime(log.timestamp)} | API calls: {log.apiCalls.length}
                              </p>
                            </CardHeader>
                            <CardContent>
                              <div className="max-h-56 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-200">
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(log.apiCalls, null, 2)}
                                </pre>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

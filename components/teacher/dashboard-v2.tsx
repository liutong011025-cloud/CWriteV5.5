"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowLeft, Bot, ChevronDown, ChevronRight, LogOut, Plus, RefreshCw, Trash2, Upload, UserPlus } from "lucide-react"
import { Button } from "@/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar"
import { Input } from "@/ui/input"
import { Textarea } from "@/ui/textarea"
import { toast } from "sonner"
import PixelPage from "@/components/pixel/pixel-page"

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
  allStudents?: Array<{ id: string; username: string; avatarUrl: string | null; avatarEmoji: string | null; grade: string | null; totalWorks: number; latestActiveAt: string | null }>
}

const UNASSIGNED_CLASS_ID = "__unassigned__"

type ClassGroup = DashboardData["classGroups"][number]

type ClassActionResponse = {
  error?: string
  class?: { id: string; name: string }
  classGroups?: ClassGroup[]
}

function isEditableClass(classId: string | null): boolean {
  return !!classId && classId !== UNASSIGNED_CLASS_ID
}

/** Prisma cuid — distinguishes TeacherClass rows from legacy grade slug ids. */
function isTeacherRosterClassId(classId: string): boolean {
  return classId !== UNASSIGNED_CLASS_ID && /^c[a-z0-9]{20,}$/i.test(classId)
}

function mergeClassGroups(prev: ClassGroup[], incoming: ClassGroup[]): ClassGroup[] {
  if (!prev.length) return incoming
  const prevTeacher = prev.filter((g) => isTeacherRosterClassId(g.id))
  if (!prevTeacher.length) return incoming

  const incomingById = new Map(incoming.map((g) => [g.id, g]))
  const keptTeacher = prevTeacher.map((g) => incomingById.get(g.id) ?? g)
  const incomingTeacherIds = new Set(incoming.filter((g) => isTeacherRosterClassId(g.id)).map((g) => g.id))
  const newFromIncoming = incoming.filter(
    (g) => isTeacherRosterClassId(g.id) && !prevTeacher.some((p) => p.id === g.id),
  )

  const unassigned = incoming.find((g) => g.id === UNASSIGNED_CLASS_ID)
    ?? prev.find((g) => g.id === UNASSIGNED_CLASS_ID)

  const teacherGroups = [...keptTeacher, ...newFromIncoming].sort((a, b) => a.name.localeCompare(b.name))
  if (unassigned) return [...teacherGroups, unassigned]
  return teacherGroups.length ? teacherGroups : incoming
}

function mergeDashboardPayload(prev: DashboardData | null, incoming: DashboardData): DashboardData {
  if (!prev?.classGroups?.length) return incoming
  const mergedGroups = mergeClassGroups(prev.classGroups, incoming.classGroups ?? [])
  return { ...incoming, classGroups: mergedGroups }
}

type DashboardUserListItem = DashboardData["classGroups"][number]["users"][number]

type WritingKind = "story" | "review" | "letter" | "drama" | "poetry"

const WRITING_KIND_ORDER: WritingKind[] = ["story", "review", "letter", "drama", "poetry"]

interface UserDetail {
  user: { username: string; grade: string | null; totalWorks: number; latestActiveAt: string | null }
  writings: Array<{
    id: string
    type: string
    title: string
    content: string
    updatedAt: string
    interactionId: string | null
    editRevisions?: Array<{ version: number; content: string; createdAt: string }>
  }>
  apiLogs: Array<{ id: string; stage: string; stageLabel: string; articleType: string; title: string; timestamp: string; tokenEstimate: number; apiCalls: Array<{ endpoint?: string }>; messages: Array<{ role: string; content: string }> }>
  diagnostics?: { storedWorks: number; recoveredWritings: number; interactionCount: number }
  degraded?: boolean
}

type Annotation = { id: string; quote: string; replaceWith: string; comment: string; saving: boolean }
type AnnotationMap = Record<string, Annotation[]>
const PIE = ["#6366f1", "#06b6d4", "#22c55e", "#f59e0b", "#ec4899"]
const TYPE_META: Record<string, { label: string; labelEn: string; badge: string; card: string }> = {
  story: {
    label: "Story",
    labelEn: "Story",
    badge: "pixel-chip text-[#5a4a2a] bg-[#f5e6c8]",
    card: "pixel-card border-[#8b6914] bg-[#f5e6c8]/95",
  },
  review: {
    label: "Book Review",
    labelEn: "Book Review",
    badge: "pixel-chip text-[#5a4a2a] bg-[#f5e6c8]",
    card: "pixel-card border-[#8b6914] bg-[#f5e6c8]/95",
  },
  letter: {
    label: "Letter",
    labelEn: "Letter",
    badge: "pixel-chip text-[#5a4a2a] bg-[#f5e6c8]",
    card: "pixel-card border-[#8b6914] bg-[#f5e6c8]/95",
  },
  drama: {
    label: "Drama",
    labelEn: "Drama",
    badge: "pixel-chip text-[#5a4a2a] bg-[#f5e6c8]",
    card: "pixel-card border-[#8b6914] bg-[#f5e6c8]/95",
  },
  poetry: {
    label: "Poetry",
    labelEn: "Poetry",
    badge: "pixel-chip text-[#5a4a2a] bg-[#f5e6c8]",
    card: "pixel-card border-[#8b6914] bg-[#f5e6c8]/95",
  },
}

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

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
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

function getSafeUsername(username: string | null | undefined): string {
  return typeof username === "string" ? username.trim() : ""
}

function getUserDisplayName(username: string | null | undefined): string {
  return getSafeUsername(username) || "Unnamed Student"
}

function getUserAvatarFallback(username: string | null | undefined, avatarEmoji?: string | null): string {
  if (avatarEmoji && avatarEmoji.trim()) return avatarEmoji
  const safeUsername = getSafeUsername(username)
  return safeUsername ? safeUsername.slice(0, 1).toUpperCase() : "?"
}

function writingRevisionMeta(
  w: {
    content: string
    editRevisions?: Array<{ version: number; content: string; createdAt: string }>
  },
  revisionTab: Record<string, number>,
  writingId: string,
): { displayContent: string; sortedRevisions: Array<{ version: number; content: string; createdAt: string }>; selectedVersion: number } {
  const revs = w.editRevisions ?? []
  const sortedRevisions = [...revs].sort((a, b) => a.version - b.version)
  if (sortedRevisions.length === 0) {
    return { displayContent: w.content ?? "", sortedRevisions: [], selectedVersion: 0 }
  }
  const latest = sortedRevisions[sortedRevisions.length - 1]!.version
  const selectedVersion = revisionTab[writingId] ?? latest
  const hit = sortedRevisions.find((r) => r.version === selectedVersion)
  return {
    displayContent: hit?.content ?? w.content ?? "",
    sortedRevisions,
    selectedVersion: hit ? selectedVersion : latest,
  }
}

function defaultTypeMeta(type: string) {
  return {
    label: type,
    labelEn: type,
    badge: "pixel-chip text-[#5a4a2a]",
    card: "pixel-card border-[#8b6914] bg-[#f5e6c8]/95",
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
  const [writingKind, setWritingKind] = useState<WritingKind | null>(null)
  const [revisionTab, setRevisionTab] = useState<Record<string, number>>({})
  const [classFileName, setClassFileName] = useState("")
  const [classPreview, setClassPreview] = useState<string[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [newClassName, setNewClassName] = useState("")
  const [showNewClassForm, setShowNewClassForm] = useState(false)
  const [renameClassName, setRenameClassName] = useState("")
  const [showRenameForm, setShowRenameForm] = useState(false)
  const [manageRosterOpen, setManageRosterOpen] = useState(false)
  const [rosterPick, setRosterPick] = useState<Set<string>>(new Set())
  const [savingRoster, setSavingRoster] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const selectedRef = useRef<string | null>(null)
  const detailRequestRef = useRef(0)
  const summaryRequestRef = useRef(0)
  const refreshSeqRef = useRef(0)

  useEffect(() => {
    document.documentElement.classList.add("teacher-dashboard-active")
    return () => document.documentElement.classList.remove("teacher-dashboard-active")
  }, [])

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  useEffect(() => {
    if (!user?.username) return
    void refresh()
    const timer = window.setInterval(() => void refresh(), 15000)
    return () => window.clearInterval(timer)
  }, [user?.username])

  useEffect(() => {
    setManageRosterOpen(false)
    setShowRenameForm(false)
    setShowNewClassForm(false)
  }, [selectedClassId])

  useEffect(() => {
    if (!selected) return
    void loadStudent(selected)
    void loadSummary(selected)
  }, [selected])

  function applyClassGroupsUpdate(classGroups: ClassGroup[] | undefined, preferClassId?: string | null) {
    if (!classGroups?.length) return
    setData((prev) => (prev ? { ...prev, classGroups } : prev))
    setSelectedClassId((current) => {
      const nextId = preferClassId ?? current
      if (nextId && classGroups.some((g) => g.id === nextId)) return nextId
      const firstReal = classGroups.find((g) => g.id !== UNASSIGNED_CLASS_ID)
      if (firstReal) return firstReal.id
      return classGroups[0]?.id ?? null
    })
  }

  async function refresh(preferClassId?: string | null) {
    if (!user?.username) return
    const seq = ++refreshSeqRef.current
    setLoadingDashboard(true)
    try {
      const res = await fetch(
        `/api/teacher/dashboard?teacher=${encodeURIComponent(user.username)}&t=${Date.now()}`,
        { cache: "no-store" },
      )
      if (seq !== refreshSeqRef.current) return
      if (!res.ok) {
        toast.error("Failed to load dashboard data.")
        return
      }
      const json = (await res.json()) as DashboardData
      if (seq !== refreshSeqRef.current) return
      let mergedGroups = json.classGroups ?? []
      setData((prev) => {
        const merged = mergeDashboardPayload(prev, json)
        mergedGroups = merged.classGroups ?? mergedGroups
        return merged
      })
      setSelectedClassId((current) => {
        const nextId = preferClassId ?? current
        if (nextId && mergedGroups.some((g) => g.id === nextId)) return nextId
        const firstReal = mergedGroups.find((g) => g.id !== UNASSIGNED_CLASS_ID)
        if (firstReal) return firstReal.id
        return mergedGroups[0]?.id ?? null
      })
    } finally {
      if (seq === refreshSeqRef.current) setLoadingDashboard(false)
    }
  }

  const activeClassGroup = useMemo(() => {
    if (!data?.classGroups?.length) return null
    if (selectedClassId && data.classGroups.some((g) => g.id === selectedClassId)) {
      return data.classGroups.find((g) => g.id === selectedClassId) ?? data.classGroups[0]
    }
    return data.classGroups[0]
  }, [data, selectedClassId])

  useEffect(() => {
    if (!activeClassGroup) return
    const availableUsers = activeClassGroup.users.filter(
      (item) => getSafeUsername(item.username).length > 0,
    )
    setSelected((current) => {
      if (current && availableUsers.some((item) => item.username === current)) return current
      return availableUsers[0]?.username ?? null
    })
  }, [activeClassGroup])

  async function classDashboardPost(body: Record<string, unknown>) {
    const res = await fetch("/api/teacher/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    return { res, json: json as ClassActionResponse }
  }

  async function createClass() {
    if (!user?.username) return
    const name = newClassName.trim()
    if (!name) {
      toast.error("Please enter a class name.")
      return
    }
    try {
      const { res, json } = await classDashboardPost({
        action: "createClass",
        teacherUsername: user.username,
        name,
      })
      if (!res.ok) {
        toast.error(json.error || "Failed to create class.")
        return
      }
      toast.success(`Class "${name}" created.`)
      setNewClassName("")
      setShowNewClassForm(false)
      applyClassGroupsUpdate(json.classGroups, json.class?.id)
    } catch {
      toast.error("Failed to create class.")
    }
  }

  async function renameClass() {
    if (!user?.username || !selectedClassId || !isEditableClass(selectedClassId)) return
    const name = renameClassName.trim()
    if (!name) {
      toast.error("Please enter a class name.")
      return
    }
    try {
      const { res, json } = await classDashboardPost({
        action: "renameClass",
        teacherUsername: user.username,
        classId: selectedClassId,
        name,
      })
      if (!res.ok) {
        toast.error(json.error || "Failed to rename class.")
        return
      }
      toast.success("Class renamed.")
      setShowRenameForm(false)
      applyClassGroupsUpdate(json.classGroups, selectedClassId)
    } catch {
      toast.error("Failed to rename class.")
    }
  }

  async function deleteClass() {
    if (!user?.username || !selectedClassId || !isEditableClass(selectedClassId)) return
    const cls = classGroups.find((g) => g.id === selectedClassId)
    if (!window.confirm(`Delete class "${cls?.name ?? ""}"? Students will move to Unassigned.`)) return
    try {
      const { res, json } = await classDashboardPost({
        action: "deleteClass",
        teacherUsername: user.username,
        classId: selectedClassId,
      })
      if (!res.ok) {
        toast.error(json.error || "Failed to delete class.")
        return
      }
      toast.success("Class deleted.")
      applyClassGroupsUpdate(json.classGroups)
    } catch {
      toast.error("Failed to delete class.")
    }
  }

  function openRosterManager() {
    if (!activeClassGroup || !isEditableClass(selectedClassId)) return
    const current = new Set(
      activeClassGroup.users.map((u) => u.username).filter((name) => getSafeUsername(name)),
    )
    setRosterPick(current)
    setManageRosterOpen(true)
  }

  async function saveRoster() {
    if (!user?.username || !selectedClassId || !isEditableClass(selectedClassId) || !activeClassGroup) return
    setSavingRoster(true)
    try {
      const { res, json } = await classDashboardPost({
        action: "updateRoster",
        teacherUsername: user.username,
        classId: selectedClassId,
        studentUsernames: [...rosterPick],
        currentUsernames: activeClassGroup.users.map((u) => u.username),
      })
      if (!res.ok) {
        toast.error(json.error || "Failed to update roster.")
        return
      }

      toast.success("Class roster updated.")
      setManageRosterOpen(false)
      applyClassGroupsUpdate(json.classGroups, selectedClassId)
    } catch {
      toast.error("Failed to update roster.")
    } finally {
      setSavingRoster(false)
    }
  }

  async function loadStudent(username: string) {
    const requestId = ++detailRequestRef.current
    setSummary("")
    setLoadingDetail(true)
    setDetail(null)
    setPanel("writings")
    setOpenWriting(null)
    setOpenLog(null)
    setWritingKind(null)
    setRevisionTab({})
    try {
      const res = await fetch(`/api/teacher/dashboard/user/${encodeURIComponent(username)}`, { cache: "no-store" })
      if (!res.ok) {
        toast.error(`Failed to load ${username}'s records.`)
        return
      }
      const json = (await res.json()) as UserDetail
      if (detailRequestRef.current !== requestId || selectedRef.current !== username) return
      setDetail(json)
    } finally {
      if (detailRequestRef.current === requestId) {
        setLoadingDetail(false)
      }
    }
  }

  async function loadSummary(username: string) {
    const requestId = ++summaryRequestRef.current
    setLoadingSummary(true)
    setSummary("")
    try {
      const res = await fetch("/api/teacher/dashboard/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      if (!res.ok) {
        if (summaryRequestRef.current === requestId && selectedRef.current === username) {
          setSummary("AI diagnosis is temporarily unavailable.")
        }
        return
      }
      const json = (await res.json()) as { summary: string }
      if (summaryRequestRef.current !== requestId || selectedRef.current !== username) return
      setSummary(json.summary)
    } finally {
      if (summaryRequestRef.current === requestId) {
        setLoadingSummary(false)
      }
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

  const writingKindCounts = useMemo(() => {
    const map: Record<WritingKind, number> = {
      story: 0,
      review: 0,
      letter: 0,
      drama: 0,
      poetry: 0,
    }
    if (!detail?.writings) return map
    for (const w of detail.writings) {
      if (w.type in map) map[w.type as WritingKind] += 1
    }
    return map
  }, [detail?.writings])

  const filteredWritings = useMemo(() => {
    if (!detail?.writings || !writingKind) return []
    return detail.writings.filter((w) => w.type === writingKind)
  }, [detail?.writings, writingKind])

  const filteredApiLogs = useMemo(() => {
    if (!detail?.apiLogs || !writingKind) return []
    return detail.apiLogs.filter((log) => log.articleType === writingKind)
  }, [detail?.apiLogs, writingKind])

  async function saveCorrection(w: UserDetail["writings"][number], annotationId: string, workSnapshotContent: string) {
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
        work_content: workSnapshotContent,
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

  const users = activeClassGroup?.users ?? []
  const maxWorks = Math.max(...users.map((item) => item.totalWorks), 1)
  const classGroups = data?.classGroups ?? []
  const allStudents = data?.allStudents ?? []
  const editableSelectedClass = isEditableClass(selectedClassId)
  const hasRealClasses = classGroups.some((g) => g.id !== UNASSIGNED_CLASS_ID)
  const realClassGroups = classGroups.filter((g) => g.id !== UNASSIGNED_CLASS_ID)
  const unassignedGroup = classGroups.find((g) => g.id === UNASSIGNED_CLASS_ID)

  return (
    <PixelPage
      data-teacher-dashboard="v2-kind-gate"
      className="pb-10 px-4 pt-32"
      style={{ fontFamily: "var(--font-press-start-2p), ui-monospace, monospace" }}
    >
      <div className="mx-auto max-w-[1650px] space-y-5 text-[13px] leading-relaxed sm:text-sm">
        <div className="pixel-panel rounded-lg p-4 sm:p-6">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="pixel-title text-[11px] font-black uppercase tracking-wide text-[#f5e6c8] drop-shadow-md sm:text-sm md:text-base">
                Luminai · TEACHER HQ
              </h2>
              <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-[#fffaf0]/80 sm:text-[10px]">
                Kind gate v2 · Pick Story / Review / Letter… then view writings & AI logs for that type only
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="pixel-btn pixel-btn-blue text-sm font-bold" onClick={() => void refresh()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button className="pixel-btn pixel-btn-wood text-sm font-bold" variant="outline" onClick={onBack}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
          <div className="relative z-10 mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Registered Users" value={data?.metrics.registeredUsers ?? 0} muted={loadingDashboard} />
            <Stat label="Active Users (24h)" value={data?.metrics.activeUsers ?? 0} muted={loadingDashboard} />
            <Stat label="Articles Collected" value={data?.metrics.totalArticles ?? 0} muted={loadingDashboard} />
            <Stat label="API Interactions" value={data?.metrics.totalApiCalls ?? 0} muted={loadingDashboard} />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <ChartCard title="Daily Registrations">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={registrationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#5a9a32" radius={[4, 4, 0, 0]} />
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
                <Bar dataKey="tokens" fill="#8b6914" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <Card className="pixel-card border-[#6b5210] shadow-[6px_6px_0_rgba(0,0,0,0.2)]">
          <CardHeader className="space-y-3">
            <div>
              <CardTitle className="pixel-text text-lg font-bold text-[#5a4a2a]">Class file manager</CardTitle>
              <p className="mt-1 text-[11px] font-semibold leading-snug text-[#6b5210] sm:text-xs">
                Tile shade vs class max: more saved pieces → darker green (same roster heat map idea).
              </p>
            </div>

            {/* 班级选择栏 — 始终在热力图上方 */}
            <div className="rounded-lg border-[3px] border-[#8b6914] bg-[#f5e6c8]/95 p-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wide text-[#5a4a2a] mr-1">Classes</span>
                <Button
                  type="button"
                  className="pixel-btn pixel-btn-green font-bold shrink-0"
                  onClick={() => {
                    setShowNewClassForm(true)
                    setShowRenameForm(false)
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  New class
                </Button>
                {realClassGroups.map((group) => (
                  <Button
                    key={group.id}
                    type="button"
                    className={`pixel-btn font-bold ${selectedClassId === group.id ? "pixel-btn-green" : "pixel-btn-wood"}`}
                    variant={selectedClassId === group.id ? "default" : "outline"}
                    onClick={() => setSelectedClassId(group.id)}
                  >
                    {group.name} ({group.users.length})
                  </Button>
                ))}
                {unassignedGroup && (
                  <Button
                    type="button"
                    className={`pixel-btn font-bold ${selectedClassId === unassignedGroup.id ? "pixel-btn-green" : "pixel-btn-wood"}`}
                    variant={selectedClassId === unassignedGroup.id ? "default" : "outline"}
                    onClick={() => setSelectedClassId(unassignedGroup.id)}
                  >
                    {unassignedGroup.name} ({unassignedGroup.users.length})
                  </Button>
                )}
              </div>

              {!hasRealClasses && (
                <p className="text-xs font-semibold text-[#6b5210]">
                  No custom classes yet — click <strong>New class</strong> above, then use{" "}
                  <strong>Manage students</strong> to add students from Unassigned.
                </p>
              )}

              {showNewClassForm && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-dashed border-[#5a9a32] bg-white/60 p-3">
                  <Input
                    placeholder="Class name"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="min-w-[200px] flex-1 border-2 border-[#8b6914]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void createClass()
                    }}
                  />
                  <Button type="button" className="pixel-btn pixel-btn-green font-bold" onClick={() => void createClass()}>
                    Create class
                  </Button>
                  <Button
                    type="button"
                    className="pixel-btn pixel-btn-wood font-bold"
                    variant="outline"
                    onClick={() => {
                      setShowNewClassForm(false)
                      setNewClassName("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {editableSelectedClass && activeClassGroup && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" className="pixel-btn pixel-btn-green font-bold" onClick={openRosterManager}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Manage students
                  </Button>
                  <Button
                    type="button"
                    className="pixel-btn pixel-btn-wood font-bold"
                    variant="outline"
                    onClick={() => {
                      setRenameClassName(activeClassGroup.name)
                      setShowRenameForm((v) => !v)
                      setShowNewClassForm(false)
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    type="button"
                    className="pixel-btn pixel-btn-wood font-bold text-red-900"
                    variant="outline"
                    onClick={() => void deleteClass()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete class
                  </Button>
                </div>
              )}

              {showRenameForm && editableSelectedClass && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-[#8b6914] bg-white/60 p-3">
                  <Input
                    placeholder="New class name"
                    value={renameClassName}
                    onChange={(e) => setRenameClassName(e.target.value)}
                    className="min-w-[200px] max-w-xs border-2 border-[#8b6914]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void renameClass()
                    }}
                  />
                  <Button type="button" className="pixel-btn pixel-btn-green font-bold" onClick={() => void renameClass()}>
                    Save name
                  </Button>
                  <Button
                    type="button"
                    className="pixel-btn pixel-btn-wood font-bold"
                    variant="outline"
                    onClick={() => setShowRenameForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {manageRosterOpen && editableSelectedClass && (
                <div className="space-y-3 rounded-lg border-[3px] border-[#5a9a32] bg-white/70 p-4">
                  <p className="text-sm font-bold text-[#5a4a2a]">
                    Select students for <span className="text-[#3d5a1f]">{activeClassGroup?.name}</span>
                  </p>
                  <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {allStudents.map((student) => {
                      const safe = getSafeUsername(student.username)
                      if (!safe) return null
                      const checked = rosterPick.has(student.username)
                      return (
                        <label
                          key={student.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-2 py-2 text-xs font-semibold ${
                            checked ? "border-[#5a9a32] bg-[#d4f5b8]" : "border-[#8b6914] bg-white/80"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setRosterPick((prev) => {
                                const next = new Set(prev)
                                if (next.has(student.username)) next.delete(student.username)
                                else next.add(student.username)
                                return next
                              })
                            }}
                          />
                          <span className="truncate">{getUserDisplayName(student.username)}</span>
                        </label>
                      )
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="pixel-btn pixel-btn-green font-bold"
                      disabled={savingRoster}
                      onClick={() => void saveRoster()}
                    >
                      {savingRoster ? "Saving…" : "Save roster"}
                    </Button>
                    <Button
                      type="button"
                      className="pixel-btn pixel-btn-wood font-bold"
                      variant="outline"
                      onClick={() => setManageRosterOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-[11px] font-semibold text-[#6b5210]">
                Viewing roster: <strong className="text-[#3d5a1f]">{activeClassGroup?.name ?? "—"}</strong>
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDemo(f); e.currentTarget.value = "" }} />
              <Button className="pixel-btn pixel-btn-blue ml-auto font-bold" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Upload Class List (Demo)</Button>
            </div>
            {classFileName && <div className="pixel-input rounded-lg p-2 text-sm text-[#5a4a2a]">Uploaded: {classFileName} {classPreview.length > 0 && `| Preview: ${classPreview.slice(0, 3).join(" ; ")}`}</div>}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  title={`${u.totalWorks} saved pieces · shade vs class max (${maxWorks})`}
                  className={`rounded-lg border-[3px] border-[#6b5210] p-2 shadow-[3px_3px_0_rgba(0,0,0,0.2)] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${selected === u.username ? "pixel-selected ring-[#e8c547]" : ""} ${
                    getUserHeatClass(u.totalWorks, maxWorks)
                  } ${getSafeUsername(u.username) ? "" : "cursor-not-allowed opacity-60"}`}
                  onClick={() => {
                    const safeUsername = getSafeUsername(u.username)
                    if (!safeUsername) return
                    setSelected(safeUsername)
                  }}
                  disabled={!getSafeUsername(u.username)}
                >
                  <Avatar className="mx-auto mb-2 h-11 w-11">
                    {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={getUserDisplayName(u.username)} /> : null}
                    <AvatarFallback>{getUserAvatarFallback(u.username, u.avatarEmoji)}</AvatarFallback>
                  </Avatar>
                  <p className="truncate text-xs font-semibold opacity-95">{getUserDisplayName(u.username)}</p>
                  <p className="mt-1 text-[10px] font-bold opacity-85">{u.totalWorks} works</p>
                </button>
              ))}
            </div>

            {(loadingDetail || detail) && (
              <div className="space-y-3 rounded-lg border-[3px] border-[#8b6914] bg-[#f5e6c8]/90 p-3 shadow-[4px_4px_0_rgba(0,0,0,0.15)]">
                {loadingDetail || !detail ? (
                  <div className="py-10 text-center text-sm text-slate-500">Loading student records...</div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="pixel-text text-sm font-bold text-[#5a4a2a]">
                        {detail.user.username} · grade {detail.user.grade ?? "N/A"} · {detail.user.totalWorks} works
                      </p>
                      <Button className="pixel-btn pixel-btn-blue h-8 text-xs font-bold" size="sm" onClick={() => void loadSummary(detail.user.username)}>
                        <Bot className="mr-2 h-4 w-4" />
                        Refresh summary
                      </Button>
                    </div>

                    <div className="pixel-panel rounded-lg border-2 border-[#6b5210] bg-[#5a4a32]/90 p-5 shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#f5e6c8]/90">Overall AI diagnosis · all types</p>
                      <p
                        className="whitespace-pre-wrap text-base font-semibold leading-relaxed text-[#fffef8] sm:text-lg md:text-xl"
                        style={{ textShadow: "1px 1px 0 #2a1810" }}
                      >
                        {loadingSummary ? "Generating overall diagnosis…" : summary || "No summary yet for this student."}
                      </p>
                    </div>

                    {writingKind === null ? (
                      <div className="pixel-panel relative z-10 rounded-xl border-4 border-[#5a4a32] p-6 shadow-[6px_6px_0_rgba(0,0,0,0.22)] sm:p-8">
                        <p className="mb-2 text-center text-[11px] font-black uppercase leading-snug text-[#f5e6c8] sm:text-xs" style={{ textShadow: "2px 2px 0 #3d2914" }}>
                          Step 1 · Choose a writing type
                        </p>
                        <p className="mx-auto mb-6 max-w-xl text-center text-[10px] leading-relaxed text-[#fffaf0]/95 sm:text-[11px]">
                          Below is an <strong className="text-[#e8c547]">overall</strong> diagnosis for this student. Then pick{" "}
                          <strong className="text-[#e8c547]">Story</strong>, <strong className="text-[#e8c547]">Book Review</strong>,{" "}
                          <strong className="text-[#e8c547]">Letter</strong>, <strong className="text-[#e8c547]">Drama</strong>, or{" "}
                          <strong className="text-[#e8c547]">Poetry</strong> to view only that type&apos;s writings and AI logs.
                        </p>
                        {detail.degraded && (
                          <div className="mb-4 rounded-lg border-2 border-[#c94b4b] bg-black/25 px-4 py-3 text-center text-[11px] text-[#ffcccc]">
                            Database degraded — writings and logs may be empty.
                          </div>
                        )}
                        {!detail.degraded && detail.diagnostics && detail.diagnostics.recoveredWritings > 0 && (
                          <div className="mb-4 rounded-lg border-2 border-[#5bc0de] bg-black/20 px-4 py-3 text-center text-[10px] text-[#e0f7ff]">
                            Recovered {detail.diagnostics.recoveredWritings} writing row(s) from interaction history.
                          </div>
                        )}
                        {detail.writings.length === 0 && !detail.degraded ? (
                          <p className="mb-4 text-center text-[10px] text-[#f5e6c8]/90">
                            Tip: Even without saved drafts, you can still open AI logs after choosing a type.
                          </p>
                        ) : null}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                          {WRITING_KIND_ORDER.map((kind) => {
                            const meta = TYPE_META[kind]
                            const count = writingKindCounts[kind]
                            return (
                              <button
                                key={kind}
                                type="button"
                                className={`relative z-10 flex min-h-[118px] flex-col items-center justify-center gap-2 rounded-lg border-4 border-[#6b5210] bg-gradient-to-b from-[#d4b896] to-[#b8956a] p-4 text-center shadow-[4px_4px_0_rgba(0,0,0,0.28)] transition hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${count === 0 ? "opacity-[0.58]" : ""}`}
                                onClick={() => {
                                  setWritingKind(kind)
                                  setOpenWriting(null)
                                  setOpenLog(null)
                                  setPanel("writings")
                                }}
                              >
                                <span className="text-[11px] font-black uppercase tracking-wide text-[#2c1810]" style={{ textShadow: "1px 1px 0 rgba(255,255,255,0.35)" }}>
                                  {meta.labelEn}
                                </span>
                                <span className="mt-1 rounded border-2 border-[#5a4a2a] bg-[#f5e6c8] px-3 py-1 text-[11px] font-black text-[#5a4a2a] shadow-[2px_2px_0_rgba(0,0,0,0.15)]">
                                  {count} {count === 1 ? "piece" : "pieces"}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            className="pixel-btn pixel-btn-wood font-bold"
                            variant="outline"
                            onClick={() => {
                              setWritingKind(null)
                              setOpenWriting(null)
                              setOpenLog(null)
                            }}
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to types
                          </Button>
                          <span className="rounded border-2 border-[#5a9a32] bg-[#7ec850] px-3 py-1.5 text-[10px] font-black uppercase text-white shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
                            {(TYPE_META[writingKind] ?? defaultTypeMeta(writingKind)).labelEn}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            className={`pixel-btn font-bold ${panel === "writings" ? "pixel-btn-green" : "pixel-btn-wood"}`}
                            variant={panel === "writings" ? "default" : "outline"}
                            onClick={() => setPanel("writings")}
                          >
                            Writings
                          </Button>
                          <Button
                            type="button"
                            className={`pixel-btn font-bold ${panel === "api" ? "pixel-btn-green" : "pixel-btn-wood"}`}
                            variant={panel === "api" ? "default" : "outline"}
                            onClick={() => setPanel("api")}
                          >
                            AI logs
                          </Button>
                        </div>

                        {panel === "writings" && (
                          <>
                            {detail.degraded && (
                              <div className="rounded-lg border-2 border-[#c94b4b] bg-[#f5e6c8] px-4 py-3 text-sm text-[#6b5210]">
                                Teacher dashboard is in database fallback mode — writings and logs may be empty.
                              </div>
                            )}
                            {!detail.degraded && detail.diagnostics && detail.diagnostics.recoveredWritings > 0 && (
                              <div className="rounded-lg border-2 border-[#5bc0de] bg-[#f5e6c8] px-4 py-3 text-sm text-[#5a4a2a]">
                                Recovered {detail.diagnostics.recoveredWritings} writing row(s) from interaction history.
                              </div>
                            )}
                            {filteredWritings.length === 0 ? (
                              <div className="rounded-lg border-2 border-dashed border-[#8b6914] bg-[#f5e6c8]/60 p-6 text-center text-sm text-[#5a4a2a]">
                                {detail.degraded
                                  ? "Database unavailable — cannot load writings."
                                  : detail.writings.length === 0 && detail.diagnostics && detail.diagnostics.interactionCount > 0
                                    ? `Found ${detail.diagnostics.interactionCount} interaction(s), but no recoverable draft text yet.`
                                    : detail.writings.length === 0
                                      ? "No writings on file for this student."
                                      : `No ${(TYPE_META[writingKind] ?? defaultTypeMeta(writingKind)).label} pieces for this student (other types are hidden).`}
                              </div>
                            ) : (
                              filteredWritings.map((w) => {
                            const open = openWriting === w.id
                            const { displayContent, sortedRevisions, selectedVersion } = writingRevisionMeta(w, revisionTab, w.id)
                            const sentenceList = splitSentences(displayContent || "")
                            const writingAnnotations = annotations[w.id] ?? []
                            const typeMeta = TYPE_META[w.type] ?? defaultTypeMeta(w.type)
                            return (
                              <Card key={w.id} className={typeMeta.card}>
                                <CardHeader className="py-3">
                                  <button
                                    type="button"
                                    className="flex w-full items-center justify-between text-left"
                                    onClick={() => {
                                      if (open) {
                                        setOpenWriting(null)
                                        return
                                      }
                                      setOpenWriting(w.id)
                                      if (sortedRevisions.length > 0) {
                                        const latest = sortedRevisions[sortedRevisions.length - 1]!.version
                                        setRevisionTab((prev) => ({ ...prev, [w.id]: latest }))
                                      }
                                    }}
                                  >
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex px-2 py-0.5 text-xs font-bold ${typeMeta.badge}`}>{typeMeta.label}</span>
                                        <p className="truncate text-sm font-bold text-[#5a4a2a]">{w.title}</p>
                                      </div>
                                      <p className="mt-1 text-xs font-medium text-[#6b5210]/80">{formatDateTime(w.updatedAt)}</p>
                                    </div>
                                    {open ? <ChevronDown className="h-4 w-4 shrink-0 text-[#5a4a2a]" /> : <ChevronRight className="h-4 w-4 shrink-0 text-[#5a4a2a]" />}
                                  </button>
                                </CardHeader>
                                {open && (
                                  <CardContent className="space-y-3">
                                    {sortedRevisions.length > 0 && (
                                      <div className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-[#8b6914] bg-[#fffaf0] p-2">
                                        <span className="text-xs font-bold text-[#5a4a2a]">Saved edit revisions:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {sortedRevisions.map((rev) => (
                                            <button
                                              key={`${w.id}-v${rev.version}`}
                                              type="button"
                                              className={`pixel-chip px-3 py-1 text-xs font-black transition ${selectedVersion === rev.version ? "bg-[#7ec850] text-white ring-2 ring-[#5a9a32]" : "bg-[#f5e6c8] text-[#5a4a2a]"}`}
                                              onClick={() => setRevisionTab((prev) => ({ ...prev, [w.id]: rev.version }))}
                                            >
                                              V{rev.version}
                                            </button>
                                          ))}
                                        </div>
                                        <span className="ml-auto text-[10px] text-[#6b5210]/80">
                                          {formatDateTime(sortedRevisions.find((r) => r.version === selectedVersion)?.createdAt ?? w.updatedAt)}
                                        </span>
                                      </div>
                                    )}
                                    <div className="grid gap-3 lg:grid-cols-3">
                                      <div className="rounded-lg border-2 border-[#c4a574] bg-[#fffaf0] p-3 lg:col-span-2">
                                        <p className="mb-2 text-xs font-bold text-[#6b5210]">Current draft · Click a sentence to annotate</p>
                                        <div className="max-h-72 space-y-1 overflow-auto" onMouseUp={() => captureSelection(w)}>
                                          {sentenceList.length === 0 ? (
                                            <p className="text-sm text-[#9a7b4f]">(empty content)</p>
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
                                                    isActive ? "bg-[#e8c547]" : isAnnotated ? "bg-[#f5e6c8]" : "hover:bg-[#f5e6c8]/80"
                                                  }`}
                                                >
                                                  {sentence}
                                                </button>
                                              )
                                            })
                                          )}
                                        </div>
                                      </div>

                                      <div className="rounded-lg border-2 border-[#8b6914] bg-[#f5e6c8]/90 p-3">
                                        <p className="mb-2 text-xs font-bold text-[#6b5210]">Teacher feedback</p>
                                        <div className="max-h-72 space-y-2 overflow-auto">
                                          {writingAnnotations.length === 0 ? (
                                            <p className="text-xs text-[#9a7b4f]">Select a sentence from the draft to add a comment.</p>
                                          ) : (
                                            writingAnnotations.map((annotation) => (
                                              <div
                                                key={annotation.id}
                                                className={`rounded-lg border-2 p-2 ${activeAnnotationId === annotation.id ? "border-[#7ec850] bg-[#fffaf0]" : "border-[#c4a574] bg-[#fffaf0]"}`}
                                                onClick={() => setActiveAnnotationId(annotation.id)}
                                              >
                                                <p className="mb-2 line-clamp-2 text-xs text-[#5a4a2a]">{annotation.quote}</p>
                                                <Input
                                                  placeholder="Suggested revision"
                                                  value={annotation.replaceWith}
                                                  onChange={(event) =>
                                                    updateAnnotation(w.id, annotation.id, { replaceWith: event.target.value })
                                                  }
                                                  className="pixel-input mb-2 h-8 text-xs"
                                                />
                                                <Textarea
                                                  placeholder="Teacher note"
                                                  value={annotation.comment}
                                                  onChange={(event) =>
                                                    updateAnnotation(w.id, annotation.id, { comment: event.target.value })
                                                  }
                                                  className="pixel-input mb-2 min-h-16 text-xs"
                                                />
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="sm"
                                                    className="pixel-btn pixel-btn-green h-7 px-2 text-xs font-bold"
                                                    disabled={annotation.saving}
                                                    onClick={() => void saveCorrection(w, annotation.id, displayContent)}
                                                  >
                                                    {annotation.saving ? "Saving" : "Save"}
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="pixel-btn pixel-btn-wood h-7 px-2 text-xs font-bold"
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
                          })
                        )}
                          </>
                        )}

                        {panel === "api" && (
                          filteredApiLogs.length === 0 ? (
                            <div className="rounded-lg border-2 border-dashed border-[#8b6914] bg-[#f5e6c8]/60 p-6 text-center text-sm text-[#5a4a2a]">
                              {detail.degraded
                                ? "Database unavailable — cannot load AI logs."
                                : detail.apiLogs.length === 0 && detail.diagnostics && detail.diagnostics.interactionCount > 0
                                  ? `${detail.diagnostics.interactionCount} interaction(s) on file, but none could be parsed into AI chat rows.`
                                  : detail.apiLogs.length === 0
                                    ? "No AI interaction logs for this student."
                                    : `No AI logs for ${(TYPE_META[writingKind] ?? defaultTypeMeta(writingKind)).label} (other types hidden).`}
                            </div>
                          ) : filteredApiLogs.map((log) => {
                            const open = openLog === log.id
                            const typeMeta = TYPE_META[log.articleType] ?? defaultTypeMeta(log.articleType)
                            return (
                              <Card key={log.id} className={typeMeta.card}>
                                <CardHeader className="py-3">
                                  <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpenLog(open ? null : log.id)}>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${typeMeta.badge}`}>{typeMeta.label}</span>
                                        <p className="truncate text-sm font-medium text-[#5a4a2a]">{log.title}</p>
                                      </div>
                                      <p className="mt-1 text-xs text-[#6b5210]/80">{formatDateTime(log.timestamp)} | token {log.tokenEstimate}</p>
                                    </div>
                                    {open ? <ChevronDown className="h-4 w-4 shrink-0 text-[#5a4a2a]" /> : <ChevronRight className="h-4 w-4 shrink-0 text-[#5a4a2a]" />}
                                  </button>
                                </CardHeader>
                                {open && (
                                  <CardContent>
                                    <div className="mb-3 text-xs text-[#6b5210]/90">{log.stage}</div>
                                    <div className="max-h-56 space-y-2 overflow-auto rounded border-2 border-[#c4a574] bg-[#fffaf0] p-3">
                                      {log.apiCalls.length > 0 && (
                                        <div className="rounded border-2 border-[#e8d9b8] bg-[#f5e6c8]/80 p-2">
                                          <p className="mb-2 text-xs font-semibold uppercase text-[#5a4a2a]">Endpoints</p>
                                          <div className="flex flex-wrap gap-2">
                                            {log.apiCalls.map((apiCall, index) => (
                                              <span key={`${log.id}-endpoint-${index}`} className="rounded-full border border-[#8b6914] bg-[#fffaf0] px-2 py-1 text-xs text-[#5a4a2a]">
                                                {apiCall.endpoint || "(unknown endpoint)"}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {log.messages.length > 0 ? (
                                        log.messages.map((m, i) => (
                                          <div key={`${m.role}-${i}`} className="rounded border-2 border-[#e8d9b8] bg-white p-2">
                                            <p className="text-xs font-semibold uppercase text-[#6b5210]">{m.role}</p>
                                            <p className="whitespace-pre-wrap text-sm text-[#3d2914]">{m.content}</p>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-sm text-[#9a7b4f]">This log row has no parseable chat text.</p>
                                      )}
                                    </div>
                                  </CardContent>
                                )}
                              </Card>
                            )
                          })
                          )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </PixelPage>
  )
}

function Stat({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className={`pixel-card rounded-lg border-[#8b6914] p-3 ${muted ? "opacity-70" : ""}`}>
      <p className="text-xs font-semibold text-[#6b5210]">{label}</p>
      <p className="pixel-text text-2xl font-black text-[#5a4a2a]">{value.toLocaleString()}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="pixel-card border-[#6b5210] shadow-[4px_4px_0_rgba(0,0,0,0.18)]">
      <CardHeader>
        <CardTitle className="pixel-text text-base font-bold text-[#5a4a2a]">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function getUserHeatClass(totalWorks: number, maxWorks: number) {
  if (totalWorks <= 0) return "bg-[#f7fff2] text-[#42623a] hover:bg-[#ecf8e6]"
  const ratio = maxWorks <= 0 ? 0 : totalWorks / maxWorks
  if (ratio >= 0.85) return "bg-[#24551c] text-[#f4fff0] hover:brightness-110"
  if (ratio >= 0.65) return "bg-[#367a29] text-[#f4fff0] hover:brightness-110"
  if (ratio >= 0.45) return "bg-[#58a43c] text-[#10240c] hover:brightness-105"
  if (ratio >= 0.25) return "bg-[#8fd06a] text-[#1e2e14] hover:brightness-105"
  return "bg-[#c8eeb4] text-[#24401c] hover:brightness-105"
}

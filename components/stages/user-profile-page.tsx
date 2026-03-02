"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  FileText,
  Mail,
  MessageCircle,
  User as UserIcon,
  Settings,
  ChevronLeft,
  Sparkles,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface WorkItem {
  id: string
  type: "story" | "review" | "letter"
  title: string
  content: string
  timestamp: number
  interactionId?: string
}

export interface ReviewItem {
  id: string
  workType: string
  workTitle: string | null
  workContent: string | null
  reviewerUsername: string
  reviewerRole: string
  content: string
  readAt: number | null
  createdAt: number
}

interface UserProfilePageProps {
  userId: string
  userRole: string
  avatarUrl?: string | null
  avatarEmoji?: string | null
  onBack: () => void
  onOpenSettings: () => void
}

export default function UserProfilePage({
  userId,
  userRole,
  avatarUrl,
  avatarEmoji,
  onBack,
  onOpenSettings,
}: UserProfilePageProps) {
  const [works, setWorks] = useState<WorkItem[]>([])
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/user-works?user_id=${userId}&type=all`).then((r) => r.json()),
      fetch(`/api/reviews?user_id=${userId}`).then((r) => r.json()),
    ])
      .then(([worksRes, reviewsRes]) => {
        const list: WorkItem[] = []
        if (worksRes.stories) {
          worksRes.stories.forEach((s: any) =>
            list.push({
              id: s.id,
              type: "story",
              title: s.character?.name ? `${s.character.name}'s Adventure` : "Story",
              content: s.content || "",
              timestamp: s.timestamp ? new Date(s.timestamp).getTime() : new Date(s.updatedAt || 0).getTime(),
              interactionId: s.interactionId,
            })
          )
        }
        if (worksRes.reviews) {
          worksRes.reviews.forEach((r: any) =>
            list.push({
              id: r.id,
              type: "review",
              title: `Review: ${r.bookTitle || "Book"}`,
              content: r.content || "",
              timestamp: r.timestamp ? new Date(r.timestamp).getTime() : new Date(r.updatedAt || 0).getTime(),
              interactionId: r.interactionId,
            })
          )
        }
        if (worksRes.letters) {
          worksRes.letters.forEach((l: any) =>
            list.push({
              id: l.id,
              type: "letter",
              title: `Letter to ${l.recipient || "Someone"}`,
              content: l.content || "",
              timestamp: l.timestamp ? new Date(l.timestamp).getTime() : new Date(l.updatedAt || 0).getTime(),
              interactionId: l.interactionId,
            })
          )
        }
        list.sort((a, b) => b.timestamp - a.timestamp)
        setWorks(list)
        setReviews(reviewsRes.reviews || [])
        setUnreadCount(reviewsRes.unreadCount ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId])

  const teacherReviews = reviews.filter((r) => r.reviewerRole === "teacher")
  const peerReviews = reviews.filter((r) => r.reviewerRole === "student")

  const handleReviewClick = (r: ReviewItem) => {
    setSelectedReview(r)
    fetch("/api/reviews/mark-read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, review_ids: [r.id] }),
    })
      .then(() => {
        setUnreadCount((c) => Math.max(0, c - 1))
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("headerRefreshUserInfo"))
        }
      })
      .catch(console.error)
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-amber-50/90 via-white to-purple-50/80"
      style={{ paddingTop: "128px", paddingBottom: "120px" }}
      data-stage="userProfile"
    >
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Top bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 rounded-xl font-hand text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded-2xl border-2 border-primary/20 shadow-lg">
              <AvatarImage src={avatarUrl || undefined} alt={userId} />
              <AvatarFallback className="rounded-2xl bg-primary/10 text-lg text-primary">
                {avatarEmoji || userId.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-hand text-lg font-bold text-foreground">{userId}</p>
              <p className="font-hand text-xs text-muted-foreground">My writings & reviews</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSettings}
              className="gap-1.5 rounded-xl font-hand border-primary/30"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* My works - main column */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border-2 border-amber-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-amber-600" />
                <h2 className="font-hand text-xl font-bold text-foreground">My Writings</h2>
              </div>
              {loading ? (
                <p className="font-hand text-sm text-muted-foreground">Loading...</p>
              ) : works.length === 0 ? (
                <p className="font-hand text-sm text-muted-foreground">
                  No writings yet. Start writing from the map!
                </p>
              ) : (
                <ul className="space-y-3">
                  {works.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 font-hand"
                    >
                      {w.type === "story" && <BookOpen className="h-5 w-5 text-amber-600" />}
                      {w.type === "review" && <FileText className="h-5 w-5 text-blue-600" />}
                      {w.type === "letter" && <Mail className="h-5 w-5 text-green-600" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-foreground">{w.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(w.timestamp).toLocaleDateString("en-US")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Teacher reviews & Peer reviews - side column */}
          <div className="space-y-6">
            <div className="rounded-2xl border-2 border-blue-200/60 bg-white/80 p-5 shadow-lg backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-blue-600" />
                <h3 className="font-hand font-bold text-foreground">Teacher Reviews</h3>
              </div>
              {teacherReviews.length === 0 ? (
                <p className="font-hand text-xs text-muted-foreground">
                  No teacher reviews yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {teacherReviews.slice(0, 5).map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => handleReviewClick(r)}
                        className={`w-full rounded-xl border px-3 py-2 text-left font-hand text-sm transition hover:border-blue-300 ${
                          !r.readAt ? "border-blue-300 bg-blue-50/50 font-semibold" : "border-blue-100 bg-white"
                        }`}
                      >
                        <span className="block truncate text-foreground">{r.workTitle || "Review"}</span>
                        <span className="text-xs text-muted-foreground">by {r.reviewerUsername}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl border-2 border-green-200/60 bg-white/80 p-5 shadow-lg backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-hand font-bold text-foreground">Peer Reviews</h3>
              </div>
              {peerReviews.length === 0 ? (
                <p className="font-hand text-xs text-muted-foreground">No peer reviews yet.</p>
              ) : (
                <ul className="space-y-2">
                  {peerReviews.slice(0, 5).map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => handleReviewClick(r)}
                        className={`w-full rounded-xl border px-3 py-2 text-left font-hand text-sm transition hover:border-green-300 ${
                          !r.readAt ? "border-green-300 bg-green-50/50 font-semibold" : "border-green-100 bg-white"
                        }`}
                      >
                        <span className="block truncate text-foreground">{r.workTitle || "Review"}</span>
                        <span className="text-xs text-muted-foreground">by {r.reviewerUsername}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Modal: selected review + work content */}
        {selectedReview && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedReview(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border-2 border-primary/20 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-hand text-lg font-bold text-foreground">
                  {selectedReview.workTitle || "Review"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReview(null)}
                  className="rounded-xl"
                >
                  Close
                </Button>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <p className="mb-1 font-hand text-xs font-bold text-muted-foreground">Review by {selectedReview.reviewerUsername}</p>
                  <p className="whitespace-pre-wrap font-hand text-sm text-foreground">
                    {selectedReview.content}
                  </p>
                </div>
                {selectedReview.workContent && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="mb-1 font-hand text-xs font-bold text-muted-foreground">Your work</p>
                    <pre className="whitespace-pre-wrap font-hand text-sm text-foreground">
                      {selectedReview.workContent}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

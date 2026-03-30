"use client"

import { useEffect, useState } from "react"

interface CopywritingChangeItem {
  id: string
  userId: string
  username: string | null
  timestamp: string
  stage: string | null
  changesCount: number | null
  payload: any
}

export default function CopywritingReviewPage() {
  const [items, setItems] = useState<CopywritingChangeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterUser, setFilterUser] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const qs = new URLSearchParams()
        if (filterUser.trim()) {
          qs.set("userId", filterUser.trim())
        }
        qs.set("limit", "100")
        const res = await fetch(`/api/copywriting-changes/list?${qs.toString()}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load changes")
        }
        setItems(data.items || [])
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        console.error("Failed to load copywriting changes:", err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [filterUser])

  const handleCopyJson = (payload: any) => {
    const text = JSON.stringify(payload, null, 2)
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text)
      alert("已複製這筆修改的 JSON，到剪貼簿了，可以直接貼給我。")
    } else {
      alert(text)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("確定要刪除這筆修改記錄嗎？刪除後無法恢復。")) return
    try {
      const res = await fetch(`/api/copywriting-changes/${id}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete change")
      }
      setItems((prev) => prev.filter((it) => it.id !== id))
    } catch (err) {
      console.error("Failed to delete copywriting change:", err)
      alert("刪除失敗，請稍後再試。")
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Copywriting 修改記錄</h1>
          <p className="text-sm text-muted-foreground">
            這裡會顯示所有通過「完成修改」提交到後端的文案變更。你可以按每一項旁邊的按鈕，把 JSON 內容複製給我。
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/"
            }
          }}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:bg-accent"
        >
          返回寫作首頁
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
        <span className="font-semibold">篩選使用者：</span>
        <input
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          placeholder="例如 copywriting，留空 = 全部"
          className="min-w-[220px] rounded border border-input bg-background px-2 py-1 text-sm"
        />
      </div>

      {loading && <p className="text-sm">載入中...</p>}
      {error && <p className="text-sm text-red-500">載入失敗：{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-muted-foreground">暫時沒有任何 copywriting 修改記錄。</p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const createdAt = new Date(item.timestamp)
          const displayStage = item.stage || item.payload?.stage || "未知頁面"
          const count = item.changesCount ?? (Array.isArray(item.payload?.changes) ? item.payload.changes.length : 0)

          return (
            <div
              key={item.id}
              className="rounded-md border border-border bg-background/80 px-3 py-2 text-sm shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div>
                    <span className="font-semibold">使用者：</span>
                    <span>{item.username || item.userId}</span>
                  </div>
                  <div>
                    <span className="font-semibold">頁面 / stage：</span>
                    <span>{displayStage}</span>
                  </div>
                  <div>
                    <span className="font-semibold">修改條數：</span>
                    <span>{count}</span>
                  </div>
                  <div>
                    <span className="font-semibold">時間：</span>
                    <span>{createdAt.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyJson(item.payload)}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                  >
                    複製這筆 JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center justify-center rounded-md border border-red-500 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10"
                  >
                    刪除這筆
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


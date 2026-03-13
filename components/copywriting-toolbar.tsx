"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface CopywritingToolbarProps {
  username: string
  stage: string
}

interface TextSnapshot {
  original: string
  selector: string
}

type SnapshotMap = Record<string, TextSnapshot>

// 給 copywriting 帳號用的前端工具：
// - 自動掃描當前 <main data-stage="..."> 下面的文字節點
// - 讓這些文字可以直接在頁面上編輯（contentEditable）
// - 點擊「完成修改」後，比對原文與現文，把 diff 傳到 /api/copywriting-changes

export default function CopywritingToolbar({ username, stage }: CopywritingToolbarProps) {
  const [isSaving, setIsSaving] = useState(false)
  const snapshotsRef = useRef<SnapshotMap>({})

  // 為元素生成一個盡量穩定的 CSS 路徑，方便之後你/我定位
  const getCssPath = (el: HTMLElement): string => {
    const path: string[] = []
    let current: HTMLElement | null = el
    while (current && current.nodeType === Node.ELEMENT_NODE && current.tagName.toLowerCase() !== "html") {
      let selector = current.tagName.toLowerCase()
      if (current.id) {
        selector += `#${current.id}`
        path.unshift(selector)
        break
      } else {
        let sibIndex = 1
        let sib = current.previousElementSibling
        while (sib) {
          if (sib.tagName === current.tagName) sibIndex += 1
          sib = sib.previousElementSibling
        }
        selector += `:nth-of-type(${sibIndex})`
      }
      path.unshift(selector)
      current = current.parentElement
    }
    return path.join(" > ")
  }

  // 掃描並標記可編輯文字
  useEffect(() => {
    if (typeof window === "undefined") return
    const main = document.querySelector("main[data-stage]") as HTMLElement | null
    if (!main) return

    // 清理舊的標記
    const cleanup = () => {
      const prev = main.querySelectorAll<HTMLElement>("[data-copy-node-id]")
      prev.forEach((el) => {
        el.removeAttribute("data-copy-node-id")
        el.contentEditable = "false"
        el.style.outline = ""
        el.style.outlineOffset = ""
        el.style.backgroundColor = ""
      })
      snapshotsRef.current = {}
    }

    cleanup()

    const snapshots: SnapshotMap = {}
    let idCounter = 0

    // 只處理「葉節點」元素，避免重複標記父子
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_ELEMENT)
    while (walker.nextNode()) {
      const el = walker.currentNode as HTMLElement

      // 跳過明顯不適合編輯的元素
      const tag = el.tagName.toLowerCase()
      if (["input", "textarea", "select", "option", "script", "style", "svg", "path"].includes(tag)) continue

      if (el.children.length === 0) {
        const text = el.textContent?.trim() || ""
        if (!text) continue

        const id = `n${idCounter++}`
        el.dataset.copyNodeId = id
        el.contentEditable = "true"
        el.style.outline = "1px dashed rgba(59,130,246,0.9)"
        el.style.outlineOffset = "2px"
        el.style.backgroundColor = "rgba(59,130,246,0.04)"

        snapshots[id] = {
          original: text,
          selector: getCssPath(el),
        }
      }
    }

    snapshotsRef.current = snapshots

    return () => {
      cleanup()
    }
  }, [stage])

  const handleSave = useCallback(async () => {
    if (typeof window === "undefined") return
    const main = document.querySelector("main[data-stage]") as HTMLElement | null
    if (!main) return

    const snapshots = snapshotsRef.current
    const changes: {
      nodeId: string
      pageStage?: string
      original: string
      updated: string
      cssPath?: string
    }[] = []

    Object.entries(snapshots).forEach(([id, snap]) => {
      const el = main.querySelector<HTMLElement>(`[data-copy-node-id="${id}"]`)
      if (!el) return
      const current = el.textContent?.trim() || ""
      if (current !== snap.original) {
        changes.push({
          nodeId: id,
          pageStage: main.dataset.stage || stage,
          original: snap.original,
          updated: current,
          cssPath: snap.selector,
        })
      }
    })

    if (changes.length === 0) {
      // 簡單提示（用 alert，避免額外引入 toast）
      window.alert("目前沒有任何文字被修改。")
      return
    }

    try {
      setIsSaving(true)
      const res = await fetch("/api/copywriting-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: username,
          stage,
          changes,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean
        file?: string | null
        count?: number
        payload?: unknown
        error?: string
      }

      if (!res.ok || !data.success) {
        console.error("Failed to save copywriting changes:", data)
        if (data && (data as any).payload) {
          // 後端已經把完整 payload 返回，仍然給你一個可以複製的 JSON
          const json = JSON.stringify((data as any).payload, null, 2)
          window.alert(
            `伺服器寫檔失敗，但已回傳修改內容。\n\n請打開開發者工具 Network，查詢 /api/copywriting-changes 的 Response，或複製以下 JSON 給我：\n\n${json}`,
          )
        } else {
          window.alert("保存修改失敗，請稍後再試。")
        }
        return
      }

      const msgFile = data.file ? `\n\n伺服器路徑：${data.file}` : ""
      const msgJson = data.payload
        ? "\n\n同時已把完整 JSON 返回給前端，你可在 Network 裡打開這次請求的 Response，直接複製發給我。"
        : ""

      window.alert(
        `已保存 ${changes.length} 條修改。${msgFile}${msgJson}`,
      )
    } catch (error) {
      console.error("Error saving copywriting changes:", error)
      window.alert("保存修改時出現錯誤，請稍後重試。")
    } finally {
      setIsSaving(false)
    }
  }, [stage, username])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] bg-black/80 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pointer-events-auto">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        <span>
          Copywriting 模式：當前帳號 <strong>{username}</strong>，本頁所有文字可直接點擊編輯。
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.open("/copywriting-review", "_blank", "noopener,noreferrer")
            }
          }}
          className="inline-flex items-center justify-center rounded-md border border-emerald-400/70 bg-transparent px-3 py-1.5 text-xs sm:text-sm font-semibold text-emerald-200 hover:bg-emerald-600/20"
        >
          查看修改列表
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/60 px-3 py-1.5 text-xs sm:text-sm font-semibold shadow"
        >
          {isSaving ? "保存中..." : "完成修改（匯出變更）"}
        </button>
      </div>
    </div>
  )
}


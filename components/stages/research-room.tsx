"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ResearchRoomProps {
  onBack?: () => void
}

interface ResearchBook {
  id: number
  title: string
  description: string
  fileName: string
}

export default function ResearchRoom({ onBack }: ResearchRoomProps) {
  const [books, setBooks] = useState<ResearchBook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadBooks = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const res = await fetch("/api/research/list")
        if (!res.ok) {
          throw new Error(`Failed to load research books (${res.status})`)
        }
        const data = await res.json()
        if (!cancelled) {
          setBooks(data.books || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError("Unable to load research books. Please contact your teacher.")
          console.error(err)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadBooks()

    return () => {
      cancelled = true
    }
  }, [])

  const handleOpen = (fileName: string) => {
    if (typeof window !== "undefined") {
      // 直接打開靜態 PDF，等同於用瀏覽器 PDF 閱讀器查看
      const url = `/research/${encodeURIComponent(fileName)}`
      window.open(url, "_blank")
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      style={{ paddingTop: "128px", paddingBottom: "120px" }}
      data-stage="research"
    >
      {/* 背景：柔和的閲覽室燈光 + 書架剪影 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.12),_transparent_60%)]" />
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
        <Image
          src="/library.png"
          alt="Reading room background"
          fill
          priority
          unoptimized
          className="object-cover mix-blend-multiply opacity-40"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
        {/* 返回 */}
        {onBack && (
          <div className="mb-6 mt-4">
            <Button
              onClick={onBack}
              variant="ghost"
              className="transition-transform duration-200 hover:scale-110 bg-transparent hover:bg-transparent active:bg-transparent data-[state=pressed]:bg-transparent p-0 h-auto w-auto"
              title="Back"
            >
              <img src="/back.png" alt="Back" className="h-24 w-24 object-contain lg:h-28 lg:w-28" />
            </Button>
          </div>
        )}

        {/* 標題區 */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(250,250,210,0.35)]">
            Research Reading Room
          </h1>
          <p className="mt-3 text-base md:text-lg text-slate-200/90 max-w-2xl mx-auto">
            Choose one of the research books below. Click a book to open the PDF and flip through the pages like a real
            reading room.
          </p>
        </div>

        {/* 狀態提示 */}
        {isLoading && (
          <div className="mt-10 text-center text-slate-200/80">
            Loading research books...
          </div>
        )}
        {error && !isLoading && (
          <div className="mt-10 text-center text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* 書架區域 */}
        {!isLoading && !error && books.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => handleOpen(book.fileName)}
                className="group relative h-72 md:h-80 w-full max-w-sm mx-auto"
              >
                {/* 書本陰影 */}
                <div className="absolute inset-x-6 bottom-0 h-5 rounded-full bg-black/40 blur-lg opacity-0 group-hover:opacity-80 transition-opacity duration-300" />

                {/* 書本本體 */}
                <div className="relative h-full w-full">
                  <div className="absolute inset-0 rounded-[18px] bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 shadow-2xl border border-amber-500/60 transform origin-left group-hover:-rotate-y-6 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform duration-500 ease-out">
                    {/* 書脊 */}
                    <div className="absolute inset-y-3 left-0 w-7 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800 rounded-l-[18px] shadow-inner">
                      <div className="h-full flex items-center justify-center">
                        <span className="text-[11px] font-semibold tracking-[0.18em] text-amber-100 rotate-180 [writing-mode:vertical-rl]">
                          RESEARCH
                        </span>
                      </div>
                    </div>

                    {/* 封面內容 */}
                    <div className="ml-7 h-full flex flex-col justify-between p-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-amber-800/80 mb-1">
                          Book {book.id.toString().padStart(2, "0")}
                        </p>
                        <h2 className="text-lg md:text-xl font-bold text-amber-950 leading-tight line-clamp-2">
                          {book.title}
                        </h2>
                      </div>
                      <div className="text-xs md:text-sm text-amber-900/90 line-clamp-3">
                        {book.description}
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-amber-900/80">
                        <span>Click to open PDF</span>
                        <span className="font-semibold group-hover:text-amber-950">Flip ▶</span>
                      </div>
                    </div>
                  </div>

                  {/* 模擬翻頁效果的「內頁」 */}
                  <div className="absolute inset-1 ml-6 rounded-[14px] bg-gradient-to-br from-white via-amber-50 to-amber-100 shadow-md opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-500 ease-out" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


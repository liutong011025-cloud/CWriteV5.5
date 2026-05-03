"use client"

import { useState, useRef, useEffect } from "react"
import { getLevelDetail, type LevelDetail } from "@/lib/level-details"

interface LevelBadgeProps {
  level: number
  className?: string
}

export default function LevelBadge({ level, className = "" }: LevelBadgeProps) {
  const [open, setOpen] = useState(false)
  const detail = getLevelDetail(level)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onOutside)
    return () => document.removeEventListener("mousedown", onOutside)
  }, [open])

  if (!detail) return null

  return (
    <div className={`relative z-40 ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-xl border-2 border-amber-400/90 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-2 md:px-3 md:py-1.5 xl:px-5 xl:py-3 font-bold text-amber-900 shadow-lg transition hover:from-amber-200 hover:to-yellow-200 focus:outline-none focus:ring-2 focus:ring-amber-500 ${className}`}
        aria-label={`Level ${level} - ${detail.subtitle}`}
      >
        <span className="whitespace-nowrap text-sm md:text-sm xl:text-lg">Level {level}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(88vw,360px)] xl:w-[min(90vw,420px)] rounded-2xl border-2 border-amber-200 bg-white p-4 xl:p-5 shadow-2xl">
          <LevelDetailContent detail={detail} />
        </div>
      )}
    </div>
  )
}

function LevelDetailContent({ detail }: { detail: LevelDetail }) {
  return (
    <div className="space-y-3 text-left text-sm">
      <div className="border-b border-amber-200 pb-2">
        <h3 className="text-base font-bold text-amber-900">
          {detail.title} — {detail.subtitle}
        </h3>
        <p className="text-xs text-amber-700 mt-0.5">
          {detail.scoreRange} · Typical grade: {detail.gradeRange}
        </p>
      </div>
      <div>
        <p className="mb-1 font-semibold text-amber-800">Goals</p>
        <p className="text-amber-900/90">{detail.goals}</p>
      </div>
      <div>
        <p className="mb-1 font-semibold text-amber-800">Can do</p>
        <ul className="list-inside list-disc space-y-0.5 text-amber-900/90">
          {detail.canDo.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1 font-semibold text-amber-800">Teaching tips</p>
        <p className="text-amber-900/90">{detail.teachingTips}</p>
      </div>
      {detail.assessmentFocus && (
        <div>
          <p className="mb-1 font-semibold text-amber-800">Assessment focus</p>
          <p className="text-amber-900/90">{detail.assessmentFocus}</p>
        </div>
      )}
      {detail.theory && (
        <div>
          <p className="mb-1 font-semibold text-amber-800">Theory</p>
          <p className="text-amber-900/90 text-xs">{detail.theory}</p>
        </div>
      )}
    </div>
  )
}

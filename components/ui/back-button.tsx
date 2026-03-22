"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const VARIANT_CLASSES: Record<string, string> = {
  default:
    "border-border bg-background/90 text-foreground hover:bg-muted hover:border-muted-foreground/30 shadow-lg shadow-black/15 ring-2 ring-black/5 hover:shadow-xl hover:ring-black/10",
  purple:
    "border-purple-300 bg-purple-50/95 text-purple-800 hover:bg-purple-100 hover:border-purple-400 shadow-lg shadow-purple-900/20 ring-2 ring-purple-900/10 hover:shadow-xl",
  amber:
    "border-amber-300 bg-amber-50/95 text-amber-800 hover:bg-amber-100 hover:border-amber-400 shadow-lg shadow-amber-900/20 ring-2 ring-amber-900/10 hover:shadow-xl",
  blue:
    "border-blue-300 bg-blue-50/95 text-blue-800 hover:bg-blue-100 hover:border-blue-400 shadow-lg shadow-blue-900/20 ring-2 ring-blue-900/10 hover:shadow-xl",
  teal:
    "border-teal-300 bg-teal-50/95 text-teal-800 hover:bg-teal-100 hover:border-teal-400 shadow-lg shadow-teal-900/20 ring-2 ring-teal-900/10 hover:shadow-xl",
  indigo:
    "border-indigo-300 bg-indigo-50/95 text-indigo-800 hover:bg-indigo-100 hover:border-indigo-400 shadow-lg shadow-indigo-900/20 ring-2 ring-indigo-900/10 hover:shadow-xl",
  slate:
    "border-slate-300 bg-slate-100/95 text-slate-800 hover:bg-slate-200 hover:border-slate-400 shadow-lg shadow-slate-900/20 ring-2 ring-slate-900/10 hover:shadow-xl",
}

export interface BackButtonProps {
  onClick?: () => void
  /** 若提供則渲染為 Link，用於返回首頁 */
  href?: string
  /** 視覺風格，依頁面主題選擇 */
  variant?: keyof typeof VARIANT_CLASSES
  className?: string
  /** 不包 fixed 定位，由父層控制（如 navigation 的 % 定位） */
  noFixed?: boolean
  "aria-label"?: string
}

export function BackButton({
  onClick,
  href,
  variant = "default",
  className = "",
  noFixed = false,
  "aria-label": ariaLabel = "Back",
}: BackButtonProps) {
  const v = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.default
  const baseClass = `rounded-full border-2 p-0 w-16 h-16 sm:w-[4.25rem] sm:h-[4.25rem] transition-transform duration-200 hover:scale-105 active:scale-95 inline-flex items-center justify-center ${v} ${className}`
  const icon = <ArrowLeft className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={2.5} />
  const btn = href ? (
    <Link href={href} aria-label={ariaLabel} className={baseClass}>
      {icon}
    </Link>
  ) : (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={ariaLabel}
      className={baseClass}
    >
      {icon}
    </Button>
  )
  if (noFixed) return btn
  return (
    <div className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-50" aria-hidden="false">
      {btn}
    </div>
  )
}

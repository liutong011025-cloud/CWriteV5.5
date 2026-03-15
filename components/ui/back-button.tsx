"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const VARIANT_CLASSES: Record<string, string> = {
  default:
    "border-border bg-background/80 text-foreground hover:bg-muted hover:border-muted-foreground/30",
  purple:
    "border-purple-300 bg-purple-50/90 text-purple-800 hover:bg-purple-100 hover:border-purple-400",
  amber:
    "border-amber-300 bg-amber-50/90 text-amber-800 hover:bg-amber-100 hover:border-amber-400",
  blue: "border-blue-300 bg-blue-50/90 text-blue-800 hover:bg-blue-100 hover:border-blue-400",
  teal: "border-teal-300 bg-teal-50/90 text-teal-800 hover:bg-teal-100 hover:border-teal-400",
  indigo:
    "border-indigo-300 bg-indigo-50/90 text-indigo-800 hover:bg-indigo-100 hover:border-indigo-400",
  slate:
    "border-slate-300 bg-slate-100/90 text-slate-800 hover:bg-slate-200 hover:border-slate-400",
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
  const baseClass = `rounded-full border-2 p-0 w-12 h-12 transition-transform duration-200 hover:scale-110 inline-flex items-center justify-center ${v} ${className}`
  const icon = <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
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
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50" aria-hidden="false">
      {btn}
    </div>
  )
}

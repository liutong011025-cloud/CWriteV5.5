"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

const NAV = [
  { href: "/my-farm", label: "My Farm" },
  { href: "/writing", label: "Writing" },
  { href: "/library", label: "Library" },
] as const

export default function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex flex-col" data-student-shell>
      <nav className="sticky top-0 z-40 border-b border-white/20 bg-slate-900/85 backdrop-blur-md text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-3 py-2 md:gap-4">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/my-farm" && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition md:px-5 md:text-base ${
                  active
                    ? "bg-amber-400/90 text-slate-900"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  )
}

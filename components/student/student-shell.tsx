"use client"

import type { ReactNode } from "react"

/** 学生区布局壳：导航改回全局 Header，这里只包一层容器 */
export default function StudentShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" data-student-shell>
      {children}
    </div>
  )
}

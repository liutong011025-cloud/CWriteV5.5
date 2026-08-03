import type { ReactNode } from "react"
import RoleGate from "@/components/auth/role-gate"
import StudentShell from "@/components/student/student-shell"

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate allow="student">
      <StudentShell>{children}</StudentShell>
    </RoleGate>
  )
}

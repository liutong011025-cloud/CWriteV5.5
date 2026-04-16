import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

// Simple wrapper layout — auth is handled by each route group
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar + Header are injected per route via sub-layouts */}
      {children}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  StickyNote,
  Shield,
  Settings,
  LogOut,
  PenLine,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="h-4 w-4" /> },
  { label: 'Works', href: '/admin/works', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Reviews', href: '/admin/reviews', icon: <MessageSquare className="h-4 w-4" /> },
  { label: 'Notes', href: '/admin/notes', icon: <StickyNote className="h-4 w-4" /> },
  { label: 'Audit Log', href: '/admin/audit-logs', icon: <Shield className="h-4 w-4" />, adminOnly: true },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="h-4 w-4" />, adminOnly: true },
]

interface AdminSidebarProps {
  role: 'admin' | 'teacher'
  name: string
  username: string
}

export function AdminSidebar({ role, name }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || role === 'admin'
  )

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="flex w-56 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PenLine className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">CWrite</p>
          <p className="text-xs text-muted-foreground">Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info + logout */}
      <div className="border-t p-4">
        <div className="mb-3">
          <p className="text-sm font-medium leading-none">{name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {role === 'admin' ? 'System Admin' : 'Teacher'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </Button>
      </div>
    </aside>
  )
}

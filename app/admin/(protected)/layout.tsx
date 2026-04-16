import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

// Protected layout — requires valid admin session
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) {
    redirect('/admin/login')
  }

  const payload = await verifyAdminToken(token)
  if (!payload) {
    redirect('/admin/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar
        role={payload.role as 'admin' | 'teacher'}
        name={payload.name ?? payload.username}
        username={payload.username}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          role={payload.role as 'admin' | 'teacher'}
          name={payload.name ?? payload.username}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

import { Badge } from '@/ui/badge'

interface AdminHeaderProps {
  role: 'admin' | 'teacher'
  name: string
}

export function AdminHeader({ role, name }: AdminHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{name}</span>
        <Badge
          variant={role === 'admin' ? 'default' : 'secondary'}
          className="text-xs"
        >
          {role === 'admin' ? 'Admin' : 'Teacher'}
        </Badge>
      </div>
    </header>
  )
}

'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Search, Pencil, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Badge } from '@/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Label } from '@/ui/label'
import { toast } from '@/hooks/use-toast'

interface User {
  id: string
  username: string
  role: string
  noAi: boolean
  grade: string | null
  avatarEmoji: string | null
  createdAt: string
  totalWorks: number
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filterRole, setFilterRole] = useState(searchParams.get('role') ?? 'all')
  const [filterNoAi, setFilterNoAi] = useState(searchParams.get('noAi') ?? 'all')
  const [filterGrade, setFilterGrade] = useState(searchParams.get('grade') ?? 'all')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, startDelete] = useTransition()

  // Edit dialog
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editGrade, setEditGrade] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchUsers = useCallback(
    async (pageToFetch: number = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(pageToFetch),
          pageSize: String(pageSize),
          ...(filterRole !== 'all' && { role: filterRole }),
          ...(filterNoAi !== 'all' && { noAi: filterNoAi }),
          ...(filterGrade !== 'all' && { grade: filterGrade }),
          ...(search && { search }),
        })

        const res = await fetch(`/api/admin/users?${params}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const result: UsersResponse = await res.json()
        setData(result)
        setPage(pageToFetch)
      } catch {
        toast({ title: 'Failed to load users', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    },
    [filterRole, filterNoAi, filterGrade, search, pageSize]
  )

  // Initial fetch on mount
  useEffect(() => {
    fetchUsers(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchUsers(1)
  }

  function handleEdit(user: User) {
    setEditTarget(user)
    setEditRole(user.role)
    setEditGrade(user.grade ?? '')
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole,
          grade: editGrade || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'User updated' })
      setEditTarget(null)
      fetchUsers(page)
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete(user: User) {
    setDeleteTarget(user)
  }

  function handleDelete() {
    if (!deleteTarget) return
    startDelete(async () => {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        toast({ title: 'Delete failed', variant: 'destructive' })
        setDeleteTarget(null)
        return
      }
      toast({ title: 'User deleted' })
      setDeleteTarget(null)
      fetchUsers(page)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          {data && (
            <p className="text-muted-foreground text-sm mt-1">
              {data.total} users total
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4 px-6 pt-6">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Role filter */}
            <Select value={filterRole} onValueChange={(v: string) => { setFilterRole(v); setPage(1); fetchUsers(1) }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>

            {/* AI mode */}
            <Select value={filterNoAi} onValueChange={(v: string) => { setFilterNoAi(v); setPage(1); fetchUsers(1) }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="AI Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="false">AI Mode</SelectItem>
                <SelectItem value="true">No AI</SelectItem>
              </SelectContent>
            </Select>

            {/* Grade */}
            <Select value={filterGrade} onValueChange={(v: string) => { setFilterGrade(v); setPage(1); fetchUsers(1) }}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {['P1','P2','P3','P4','P5','P6'].map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" size="sm">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>AI Mode</TableHead>
                <TableHead>Works</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                data?.users.map((user, idx) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-muted-foreground text-xs">
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {user.avatarEmoji ?? user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'teacher' ? 'default' : 'secondary'} className="text-xs">
                        {user.role === 'teacher' ? 'Teacher' : 'Student'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{user.grade ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={user.noAi ? 'outline' : 'secondary'} className="text-xs">
                        {user.noAi ? 'No AI' : 'AI'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{user.totalWorks}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(user.createdAt), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                          onClick={() => confirmDelete(user)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Page {data.page} of {data.totalPages} — {data.total} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => fetchUsers(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">
                {page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => fetchUsers(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              You are about to delete user <strong>{deleteTarget?.username}</strong>.
              This will permanently remove all their works.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Edit user <strong>{editTarget?.username}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select value={editGrade} onValueChange={setEditGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Not set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not set</SelectItem>
                  {['P1','P2','P3','P4','P5','P6'].map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
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
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'

interface AuditLog {
  id: string
  action: string
  targetType: string | null
  targetId: string | null
  details: Record<string, unknown> | null
  createdAt: string
  admin: { username: string; name: string | null; role: string }
}

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  view_user: 'View User List',
  view_user_detail: 'View User Detail',
  update_user: 'Update User',
  delete_user: 'Delete User',
  create_user: 'Create User',
  export_data: 'Export Data',
  change_role: 'Change Role',
  change_setting: 'Change Setting',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(30)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [actionFilter, setActionFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchLogs = useCallback(async (pageToFetch: number = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pageToFetch),
        pageSize: String(pageSize),
        ...(actionFilter !== 'all' && { action: actionFilter }),
      })
      const res = await fetch(`/api/admin/audit-logs?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setPage(pageToFetch)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [actionFilter, pageSize])

  // Initial fetch on mount
  useEffect(() => {
    fetchLogs(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const actionColors: Record<string, string> = {
    login: 'bg-green-100 text-green-800',
    logout: 'bg-gray-100 text-gray-700',
    delete_user: 'bg-red-100 text-red-800',
    export_data: 'bg-blue-100 text-blue-800',
    update_user: 'bg-yellow-100 text-yellow-800',
    view_user: 'bg-purple-100 text-purple-800',
    view_user_detail: 'bg-purple-50 text-purple-700',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Admin operation history ({total} entries)
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-4 px-6 pt-6">
          <CardTitle className="text-base">Records</CardTitle>
          <Select value={actionFilter} onValueChange={(v: string) => { setActionFilter(v); fetchLogs(1) }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Type</TableHead>
                <TableHead>Target ID</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(log.createdAt), 'MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{log.admin.name ?? log.admin.username}</p>
                        <p className="text-xs text-muted-foreground">{log.admin.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${actionColors[log.action] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.targetType ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {log.targetId ? (
                        <span className="truncate max-w-20 block">{log.targetId.slice(0, 8)}...</span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.details && (
                        <button
                          className="text-xs text-primary hover:underline"
                          onClick={() => setSelectedLog(log)}
                        >
                          View
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} — {total} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => fetchLogs(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => fetchLogs(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Action Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Actor</span>
              <span>{selectedLog?.admin.username}</span>
              <span className="text-muted-foreground">Action</span>
              <span>{selectedLog?.action}</span>
              <span className="text-muted-foreground">Target Type</span>
              <span>{selectedLog?.targetType ?? '—'}</span>
              <span className="text-muted-foreground">Target ID</span>
              <span className="font-mono text-xs">{selectedLog?.targetId ?? '—'}</span>
            </div>
            {selectedLog?.details && (
              <>
                <p className="text-muted-foreground pt-2">Additional Info:</p>
                <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-64">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

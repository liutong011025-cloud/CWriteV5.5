import { format } from 'date-fns'
import {
  Users,
  BookOpen,
  MessageCircle,
  TrendingUp,
  PenLine,
  BookMarked,
  Mail,
  Drama,
  Feather,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'
import { DashboardChart } from '@/components/admin/dashboard-chart'
import { getDashboardData } from '@/lib/admin-actions'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const data = await getDashboardData()

  const statCards = [
    {
      label: 'Total Users',
      value: data.totalUsers,
      sub: `+${data.newThisMonth} this month`,
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-600',
    },
    {
      label: 'New Today',
      value: data.newToday,
      sub: `${data.newThisMonth} this month`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-green-600',
    },
    {
      label: 'Total Works',
      value: data.totalWorks,
      sub: 'Stories, Reviews, Letters, Dramas, Poems',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-purple-600',
    },
    {
      label: 'Interactions (Month)',
      value: data.interactionsThisMonth,
      sub: 'AI chats + creative sessions',
      icon: <MessageCircle className="h-5 w-5" />,
      color: 'text-orange-600',
    },
  ]

  const workItems = [
    { label: 'Stories', count: data.workDistribution.stories, icon: <PenLine className="h-4 w-4" />, color: 'bg-blue-500' },
    { label: 'Reviews', count: data.workDistribution.reviews, icon: <BookMarked className="h-4 w-4" />, color: 'bg-purple-500' },
    { label: 'Letters', count: data.workDistribution.letters, icon: <Mail className="h-4 w-4" />, color: 'bg-green-500' },
    { label: 'Dramas', count: data.workDistribution.dramas, icon: <Drama className="h-4 w-4" />, color: 'bg-orange-500' },
    { label: 'Poems', count: data.workDistribution.poetries, icon: <Feather className="h-4 w-4" />, color: 'bg-pink-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          CWrite learning platform overview
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <div className={`${card.color}`}>{card.icon}</div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-3xl font-bold">{card.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Daily signups chart */}
        <Card>
          <CardHeader className="px-6 pt-6 pb-4">
            <CardTitle className="text-base">Daily Signups (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <DashboardChart dailySignups={data.dailySignups} workDistribution={data.workDistribution} />
          </CardContent>
        </Card>

        {/* Work distribution */}
        <Card>
          <CardHeader className="px-6 pt-6 pb-4">
            <CardTitle className="text-base">Work Type Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-3">
              {workItems.map((item) => {
                const pct = data.totalWorks > 0
                  ? Math.round((item.count / data.totalWorks) * 100)
                  : 0
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${item.color}`} />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.count.toLocaleString()}</span>
                        <Badge variant="secondary" className="text-xs">
                          {pct}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent users */}
      <Card>
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-base">Recently Registered Users</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {data.recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available</p>
          ) : (
            <div className="space-y-3">
              {data.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.role === 'teacher' ? 'default' : 'secondary'} className="text-xs">
                      {user.role === 'teacher' ? 'Teacher' : 'Student'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {user.totalWorks} works
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

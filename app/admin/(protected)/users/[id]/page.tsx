import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import {
  User,
  BookOpen,
  Mail,
  Drama,
  Feather,
  PenLine,
  TrendingUp,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import Link from 'next/link'
import { Button } from '@/ui/button'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

const HK_VALUES = [
  'Resilience', 'Respect for Others', 'Responsibility', 'National Identity',
  'Commitment', 'Integrity', 'Care', 'Law-Abiding',
  'Empathy', 'Diligence', 'Filial Piety', 'Unity',
]

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      role: true,
      noAi: true,
      createdAt: true,
      updatedAt: true,
      profile: {
        select: {
          grade: true,
          gender: true,
          birthday: true,
          email: true,
          avatarEmoji: true,
          avatarUrl: true,
          trees: true,
          lastMetrics: true,
        },
      },
      stories: {
        orderBy: { updatedAt: 'desc' },
        select: { id: true, content: true, character: true, createdAt: true, updatedAt: true },
      },
      reviews: {
        orderBy: { updatedAt: 'desc' },
        select: { id: true, content: true, bookTitle: true, reviewType: true, createdAt: true, updatedAt: true },
      },
      letters: {
        orderBy: { updatedAt: 'desc' },
        select: { id: true, content: true, recipient: true, occasion: true, createdAt: true, updatedAt: true },
      },
      dramas: {
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
      },
      poetries: {
        orderBy: { updatedAt: 'desc' },
        select: { id: true, form: true, topic: true, content: true, createdAt: true, updatedAt: true },
      },
      interactions: {
        orderBy: { timestamp: 'desc' },
        take: 50,
        select: { id: true, stage: true, timestamp: true },
      },
      _count: {
        select: {
          stories: true,
          reviews: true,
          letters: true,
          dramas: true,
          poetries: true,
          interactions: true,
        },
      },
    },
  })

  if (!user) notFound()

  const trees = (user.profile?.trees as Array<{ id: number; stage: number }> | null) ?? []
  const metrics = user.profile?.lastMetrics as {
    vocabRichness?: number
    descriptiveAccuracy?: number
    logicalCoherence?: number
  } | null

  const totalWorks =
    user._count.stories +
    user._count.reviews +
    user._count.letters +
    user._count.dramas +
    user._count.poetries

  const metricItems = [
    { label: 'Vocabulary Richness', key: 'vocabRichness', value: metrics?.vocabRichness },
    { label: 'Descriptive Accuracy', key: 'descriptiveAccuracy', value: metrics?.descriptiveAccuracy },
    { label: 'Logical Coherence', key: 'logicalCoherence', value: metrics?.logicalCoherence },
  ]

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/admin/users">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
          {user.profile?.avatarEmoji ?? user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.username}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={user.role === 'teacher' ? 'default' : 'secondary'}>
              {user.role === 'teacher' ? 'Teacher' : 'Student'}
            </Badge>
            <Badge variant={user.noAi ? 'outline' : 'secondary'}>
              {user.noAi ? 'No AI' : 'AI Mode'}
            </Badge>
            {user.profile?.grade && (
              <Badge variant="outline">{user.profile.grade}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Joined {format(user.createdAt, 'MMM dd, yyyy')}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Works', value: totalWorks, icon: <BookOpen className="h-4 w-4" /> },
          { label: 'Stories', value: user._count.stories, icon: <PenLine className="h-4 w-4" /> },
          { label: 'Reviews', value: user._count.reviews, icon: <BookOpen className="h-4 w-4" /> },
          { label: 'Letters', value: user._count.letters, icon: <Mail className="h-4 w-4" /> },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex-row items-center justify-between pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="text-muted-foreground">{stat.icon}</div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="works">Works</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="trees">Values Trees</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Username', value: user.username },
                  { label: 'Role', value: user.role === 'teacher' ? 'Teacher' : 'Student' },
                  { label: 'Grade', value: user.profile?.grade ?? 'Not set' },
                  { label: 'Gender', value: user.profile?.gender ?? 'Not set' },
                  { label: 'Birthday', value: user.profile?.birthday ?? 'Not set' },
                  { label: 'Email', value: user.profile?.email ?? 'Not set' },
                  { label: 'AI Mode', value: user.noAi ? 'Off' : 'On' },
                  { label: 'Last Updated', value: format(user.updatedAt, 'yyyy-MM-dd HH:mm') },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <dt className="text-xs text-muted-foreground">{item.label}</dt>
                    <dd className="text-sm font-medium">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Works tab */}
        <TabsContent value="works" className="mt-4">
          <div className="space-y-4">
            {/* Stories */}
            {user.stories.length > 0 && (
              <Card>
                <CardHeader className="px-6 pt-4 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PenLine className="h-4 w-4" /> Stories ({user.stories.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-4">
                  <div className="space-y-3">
                    {user.stories.slice(0, 5).map((s) => (
                      <div key={s.id} className="rounded-lg border p-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{format(s.updatedAt, 'yyyy-MM-dd')}</span>
                          <span>{s.content.length} chars</span>
                        </div>
                        <p className="text-sm line-clamp-2">{s.content || '(empty)'}</p>
                      </div>
                    ))}
                    {user.stories.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        {user.stories.length - 5} more stories...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {user.reviews.length > 0 && (
              <Card>
                <CardHeader className="px-6 pt-4 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Reviews ({user.reviews.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-4">
                  <div className="space-y-3">
                    {user.reviews.slice(0, 5).map((r) => (
                      <div key={r.id} className="rounded-lg border p-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{r.bookTitle ?? 'Untitled'}</span>
                          <span>{format(r.updatedAt, 'yyyy-MM-dd')}</span>
                        </div>
                        <p className="text-sm line-clamp-2">{r.content || '(empty)'}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Letters */}
            {user.letters.length > 0 && (
              <Card>
                <CardHeader className="px-6 pt-4 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Letters ({user.letters.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-4">
                  <div className="space-y-3">
                    {user.letters.slice(0, 5).map((l) => (
                      <div key={l.id} className="rounded-lg border p-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>To: {l.recipient ?? 'Not set'}</span>
                          <span>{format(l.updatedAt, 'yyyy-MM-dd')}</span>
                        </div>
                        <p className="text-sm line-clamp-2">{l.content || '(empty)'}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {user.stories.length === 0 && user.reviews.length === 0 && user.letters.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No works yet
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Metrics tab */}
        <TabsContent value="metrics" className="mt-4">
          <Card>
            <CardHeader className="px-6 pt-4 pb-2">
              <CardTitle className="text-base">Writing Metrics</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {metrics ? (
                <div className="space-y-4">
                  {metricItems.map((m) => {
                    const val = m.value ?? 0
                    return (
                      <div key={m.key} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{m.label}</span>
                          <span className="font-medium">{val} / 100</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No metrics data
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Values trees tab */}
        <TabsContent value="trees" className="mt-4">
          <Card>
            <CardHeader className="px-6 pt-4 pb-2">
              <CardTitle className="text-base">Values Education Trees</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {trees.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {trees.map((tree) => {
                    const valueName = HK_VALUES[tree.id - 1] ?? `Value #${tree.id}`
                    return (
                      <div key={tree.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{'\u{1F331}'}</span>
                          <span className="text-sm font-medium">{valueName}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < tree.stage ? 'opacity-100' : 'opacity-25'
                              }`}
                            >
                              {'\u{1F333}'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No value tree records
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity tab */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader className="px-6 pt-4 pb-2">
              <CardTitle className="text-base">Activity Log (Last 50 Interactions)</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {user.interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No interaction records</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(
                    user.interactions.reduce<Record<string, number>>((acc, i) => {
                      acc[i.stage] = (acc[i.stage] ?? 0) + 1
                      return acc
                    }, {})
                  )
                    .sort(([, a], [, b]) => b - a)
                    .map(([stage, count]) => (
                      <div key={stage} className="flex items-center justify-between rounded-lg border px-4 py-2.5">
                        <span className="text-sm font-medium">{stage}</span>
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${Math.round((count / user.interactions.length) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {count}x
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

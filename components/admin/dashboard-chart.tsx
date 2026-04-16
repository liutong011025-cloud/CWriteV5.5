'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

interface DailySignup {
  date: string
  count: number
}

interface WorkDistribution {
  stories: number
  reviews: number
  letters: number
  dramas: number
  poetries: number
}

interface DashboardChartProps {
  dailySignups: DailySignup[]
  workDistribution: WorkDistribution
}

const chartColors = {
  stories: 'hsl(264, 70%, 50%)',
  reviews: 'hsl(262, 60%, 45%)',
  letters: 'hsl(46, 90%, 45%)',
  dramas: 'hsl(24, 90%, 52%)',
  poetries: 'hsl(330, 70%, 55%)',
}

const barColors = [
  chartColors.stories,
  chartColors.reviews,
  chartColors.letters,
  chartColors.dramas,
  chartColors.poetries,
]

export function DashboardChart({ dailySignups, workDistribution }: DashboardChartProps) {
  const barData = [
    { name: 'Stories', value: workDistribution.stories },
    { name: 'Reviews', value: workDistribution.reviews },
    { name: 'Letters', value: workDistribution.letters },
    { name: 'Dramas', value: workDistribution.dramas },
    { name: 'Poems', value: workDistribution.poetries },
  ]

  // Fill in missing dates with 0
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })

  const signupMap = new Map(dailySignups.map((s) => [s.date, s.count]))
  const lineData = last30Days.map((date) => ({
    date,
    count: signupMap.get(date) ?? 0,
  }))

  return (
    <div className="space-y-6">
      {/* Daily signups line chart */}
      {dailySignups.length > 0 ? (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={lineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => v.slice(5)}
              interval={4}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              allowDecimals={false}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--card))',
              }}
              labelStyle={{ fontWeight: 600 }}
              formatter={(value: number) => [`${value}`, 'New Users']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(264, 70%, 50%)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      )}

      {/* Work distribution bar chart */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            allowDecimals={false}
            className="text-muted-foreground"
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--card))',
            }}
            formatter={(value: number) => [`${value}`, 'Works']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {barData.map((_, i) => (
              <Cell key={i} fill={barColors[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

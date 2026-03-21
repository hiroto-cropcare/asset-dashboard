'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { DashboardSummary } from '@/types'

interface SummaryCardsProps {
  summary: DashboardSummary
}

const CATEGORY_LABELS: Record<string, string> = {
  stock: '株式',
  cash: '現金・預金',
  realestate: '不動産',
  crypto: '暗号資産',
}

const CATEGORY_COLORS: Record<string, string> = {
  stock: '#00D4A0',
  cash: '#F5B731',
  realestate: '#7C6FFF',
  crypto: '#FF6B6B',
}

function fmt(n: number): string {
  return n.toLocaleString('ja-JP', { maximumFractionDigits: 0 })
}

interface TooltipPayload {
  name: string
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0]
    return (
      <div className="rounded-lg border border-panel bg-surface px-3 py-2 text-sm shadow-lg">
        <p className="font-medium text-text-primary">{item.name}</p>
        <p className="text-accent">¥{fmt(item.value)}</p>
      </div>
    )
  }
  return null
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const pieData = Object.entries(summary.byCategory)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: CATEGORY_LABELS[key] ?? key,
      value,
      color: CATEGORY_COLORS[key] ?? '#888',
    }))

  const isPnLPositive = summary.totalPnL >= 0

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Assets Card */}
      <div className="col-span-1 flex flex-col justify-between rounded-xl border border-panel bg-surface p-6 lg:col-span-1">
        <div>
          <p className="mb-1 text-sm text-text-muted">総資産（円換算）</p>
          <p className="text-3xl font-bold text-text-primary">
            ¥{fmt(summary.totalJPY)}
          </p>
        </div>
        <div className="mt-4">
          <p className="mb-1 text-sm text-text-muted">評価損益</p>
          <p
            className={`text-2xl font-semibold ${
              isPnLPositive ? 'text-up' : 'text-down'
            }`}
          >
            {isPnLPositive ? '+' : ''}¥{fmt(summary.totalPnL)}
          </p>
          <p
            className={`mt-1 text-sm font-medium ${
              isPnLPositive ? 'text-up' : 'text-down'
            }`}
          >
            {isPnLPositive ? '+' : ''}
            {summary.totalPnLPct.toFixed(2)}%
          </p>
        </div>
        <div className="mt-4 border-t border-panel pt-3">
          <p className="text-xs text-text-muted">
            最終更新:{' '}
            {new Date(summary.lastUpdated).toLocaleString('ja-JP', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="col-span-1 flex items-center justify-center rounded-xl border border-panel bg-surface p-4 md:col-span-2 lg:col-span-1">
        <div className="w-full">
          <p className="mb-2 text-center text-sm text-text-muted">資産配分</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-text-muted">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="col-span-1 grid grid-cols-2 gap-3 md:col-span-2 lg:col-span-1">
        {Object.entries(summary.byCategory).map(([key, value]) => (
          <div
            key={key}
            className="flex flex-col justify-between rounded-xl border border-panel bg-surface p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[key] ?? '#888' }}
              />
              <p className="text-xs font-medium text-text-muted">
                {CATEGORY_LABELS[key] ?? key}
              </p>
            </div>
            <p className="text-lg font-bold text-text-primary">
              ¥{fmt(value)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {summary.totalJPY > 0
                ? ((value / summary.totalJPY) * 100).toFixed(1)
                : '0.0'}
              %
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

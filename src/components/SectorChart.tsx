'use client'

import { X } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export const SECTOR_LIST = [
  '情報技術',
  '一般消費財',
  '生活必需品',
  'ヘルスケア',
  '金融',
  '資本財',
  '素材',
  'エネルギー',
  '公益事業',
  '通信サービス',
  '不動産',
  'その他',
] as const

export const SECTOR_COLORS: Record<string, string> = {
  '情報技術':     '#6366F1',
  '一般消費財':   '#F59E0B',
  '生活必需品':   '#10B981',
  'ヘルスケア':   '#EC4899',
  '金融':         '#3B82F6',
  '資本財':       '#8B5CF6',
  '素材':         '#84CC16',
  'エネルギー':   '#F97316',
  '公益事業':     '#06B6D4',
  '通信サービス': '#EF4444',
  '不動産':       '#14B8A6',
  'その他':       '#6B7280',
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
        <p style={{ color: SECTOR_COLORS[item.name] ?? '#888' }}>
          ¥{item.value.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}
        </p>
      </div>
    )
  }
  return null
}

interface SectorChartProps {
  bySector: Record<string, number>
  stockTotal: number
  onClose: () => void
}

export default function SectorChart({ bySector, stockTotal, onClose }: SectorChartProps) {
  const entries = Object.entries(bySector)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)

  if (entries.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-panel bg-surface p-5 text-center text-sm text-text-muted">
        銘柄を追加するとセクター配分が表示されます
      </div>
    )
  }

  const pieData = entries.map(([sector, value]) => ({
    name: sector,
    value,
    color: SECTOR_COLORS[sector] ?? '#6B7280',
  }))

  return (
    <div className="mb-6 rounded-xl border border-panel bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">株式セクター配分</p>
        <button
          onClick={onClose}
          className="rounded p-1 text-text-muted transition-colors hover:bg-panel hover:text-text-primary"
          title="閉じる"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Donut */}
        <div className="h-[180px] w-full flex-shrink-0 sm:w-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={`sc-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-panel">
                <th className="pb-2 text-left text-xs text-text-muted">セクター</th>
                <th className="pb-2 text-right text-xs text-text-muted">評価額</th>
                <th className="pb-2 text-right text-xs text-text-muted">比率</th>
              </tr>
            </thead>
            <tbody>
              {pieData.map((entry) => (
                <tr key={entry.name} className="border-b border-panel/50 last:border-0">
                  <td className="py-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-text-primary">{entry.name}</span>
                    </div>
                  </td>
                  <td className="py-1.5 text-right text-text-primary">
                    ¥{entry.value.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-1.5 text-right font-medium" style={{ color: entry.color }}>
                    {stockTotal > 0
                      ? ((entry.value / stockTotal) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Trash2, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { StockHolding } from '@/types'
import { USD_JPY } from '@/lib/calc'
import { SECTOR_LIST, SECTOR_COLORS } from '@/components/SectorChart'

interface StockTableProps {
  stocks: StockHolding[]
  onAdd: (s: StockHolding) => void
  onDelete: (id: string) => void
}

function fmt(n: number): string {
  return n.toLocaleString('ja-JP', { maximumFractionDigits: 0 })
}

function fmtDec(n: number, d = 2): string {
  return n.toLocaleString('ja-JP', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
}

const defaultForm = {
  code: '',
  name: '',
  market: 'JP' as 'JP' | 'US',
  shares: '',
  buyPrice: '',
  annualDividend: '',
  alertDropPct: '10',
  alertYieldBelow: '3',
  sector: '',
}

export default function StockTable({ stocks, onAdd, onDelete }: StockTableProps) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState<Partial<typeof defaultForm>>({})

  function getPnL(s: StockHolding): number | null {
    if (s.currentPrice === null) return null
    const pnlPerShare = s.currentPrice - s.buyPrice
    if (s.market === 'US') return pnlPerShare * s.shares * USD_JPY
    return pnlPerShare * s.shares
  }

  function getDropPct(s: StockHolding): number | null {
    if (s.currentPrice === null) return null
    return ((s.currentPrice - s.buyPrice) / s.buyPrice) * 100
  }

  function getAlertLevel(s: StockHolding): 'danger' | 'warning' | null {
    if (s.currentPrice === null) return null
    const dropPct = ((s.buyPrice - s.currentPrice) / s.buyPrice) * 100
    if (dropPct >= s.alertDropPct * 1.5) return 'danger'
    if (dropPct >= s.alertDropPct) return 'warning'
    return null
  }

  const CODE_RE = /^[A-Z0-9.\-]{1,20}$/

  function validate(): boolean {
    const e: Partial<typeof defaultForm> = {}
    const code = form.code.trim().toUpperCase()
    if (!code) e.code = '必須'
    else if (!CODE_RE.test(code)) e.code = '英数字・ . ・- のみ（20文字以内）'
    if (!form.name.trim()) e.name = '必須'
    else if (form.name.trim().length > 50) e.name = '50文字以内'
    const shares = Number(form.shares)
    if (!form.shares || !isFinite(shares) || shares <= 0 || shares > 1e9)
      e.shares = '1〜1,000,000,000'
    const buyPrice = Number(form.buyPrice)
    if (!form.buyPrice || !isFinite(buyPrice) || buyPrice <= 0 || buyPrice > 1e12)
      e.buyPrice = '正の数'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleAdd() {
    if (!validate()) return
    const newStock: StockHolding = {
      id: `stock-${Date.now()}`,
      category: 'stock',
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      market: form.market,
      shares: Number(form.shares),
      buyPrice: Number(form.buyPrice),
      currentPrice: null,
      annualDividend: Number(form.annualDividend) || 0,
      alertDropPct: Number(form.alertDropPct) || 10,
      alertYieldBelow: Number(form.alertYieldBelow) || 3,
      sector: form.sector || undefined,
    }
    onAdd(newStock)
    setForm(defaultForm)
    setShowForm(false)
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-panel bg-surface">
              <th className="px-4 py-3 text-text-muted font-medium">コード</th>
              <th className="px-4 py-3 text-text-muted font-medium">銘柄名</th>
              <th className="px-4 py-3 text-text-muted font-medium text-center">市場</th>
              <th className="px-4 py-3 text-text-muted font-medium">セクター</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">株数</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">買値</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">現在値</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">騰落率(%)</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">配当利回り(%)</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">評価損益(円)</th>
              <th className="px-4 py-3 text-text-muted font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {stocks.length === 0 && (
              <tr>
                <td colSpan={11} className="py-10 text-center text-text-muted">
                  株式データがありません
                </td>
              </tr>
            )}
            {stocks.map((s) => {
              const pnl = getPnL(s)
              const dropPct = getDropPct(s)
              const alertLevel = getAlertLevel(s)

              return (
                <tr
                  key={s.id}
                  className={`border-b border-panel transition-colors last:border-0 ${
                    alertLevel === 'danger'
                      ? 'bg-danger/10 hover:bg-danger/15'
                      : alertLevel === 'warning'
                      ? 'bg-gold/10 hover:bg-gold/15'
                      : 'hover:bg-surface'
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-accent">{s.code}</td>
                  <td className="px-4 py-3 text-text-primary">{s.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        s.market === 'JP'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {s.market}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.sector ? (
                      <span
                        className="rounded px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${SECTOR_COLORS[s.sector] ?? '#6B7280'}20`,
                          color: SECTOR_COLORS[s.sector] ?? '#6B7280',
                        }}
                      >
                        {s.sector}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">---</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    {fmt(s.shares)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted">
                    {s.market === 'US' ? '$' : '¥'}
                    {fmtDec(s.buyPrice, s.market === 'US' ? 2 : 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    {s.currentPrice === null
                      ? <span className="text-text-muted">---</span>
                      : <>
                          {s.market === 'US' ? '$' : '¥'}
                          {fmtDec(s.currentPrice, s.market === 'US' ? 2 : 0)}
                        </>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    {dropPct === null ? (
                      <span className="text-text-muted">---</span>
                    ) : (
                      <span
                        className={`flex items-center justify-end gap-1 font-medium ${
                          dropPct >= 0 ? 'text-up' : 'text-down'
                        }`}
                      >
                        {dropPct >= 0 ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        {dropPct >= 0 ? '+' : ''}
                        {fmtDec(dropPct)}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.annualDividend === 0 ? (
                      <span className="text-text-muted">---</span>
                    ) : s.currentPrice === null ? (
                      <span className="text-text-muted">---</span>
                    ) : (() => {
                      const yieldPct = (s.annualDividend / s.currentPrice) * 100
                      const isLow = yieldPct < s.alertYieldBelow
                      return (
                        <span className={`font-medium ${isLow ? 'text-gold' : 'text-accent'}`}>
                          {fmtDec(yieldPct)}%
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {pnl === null ? (
                      <span className="text-text-muted">---</span>
                    ) : (
                      <span
                        className={`font-medium ${pnl >= 0 ? 'text-up' : 'text-down'}`}
                      >
                        {pnl >= 0 ? '+' : ''}¥{fmt(pnl)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onDelete(s.id)}
                      className="rounded p-1.5 text-text-muted transition-colors hover:bg-danger/20 hover:text-danger"
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="mt-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
      >
        <PlusCircle className="h-4 w-4" />
        {showForm ? 'キャンセル' : '銘柄を追加'}
      </button>

      {/* Add Form */}
      {showForm && (
        <div className="mt-4 rounded-xl border border-panel bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">新規銘柄追加</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-text-muted">コード *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="7203.T"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.code ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.code && (
                <p className="mt-0.5 text-xs text-danger">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">銘柄名 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="トヨタ自動車"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.name ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.name && (
                <p className="mt-0.5 text-xs text-danger">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">市場</label>
              <select
                value={form.market}
                onChange={(e) =>
                  setForm({ ...form, market: e.target.value as 'JP' | 'US' })
                }
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="JP">JP</option>
                <option value="US">US</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">株数 *</label>
              <input
                type="number"
                value={form.shares}
                onChange={(e) => setForm({ ...form, shares: e.target.value })}
                placeholder="100"
                min="1"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.shares ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.shares && (
                <p className="mt-0.5 text-xs text-danger">{errors.shares}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">買値 *</label>
              <input
                type="number"
                value={form.buyPrice}
                onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
                placeholder="2500"
                min="0"
                step="0.01"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.buyPrice ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.buyPrice && (
                <p className="mt-0.5 text-xs text-danger">{errors.buyPrice}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">年間配当</label>
              <input
                type="number"
                value={form.annualDividend}
                onChange={(e) =>
                  setForm({ ...form, annualDividend: e.target.value })
                }
                placeholder="60"
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">下落アラート(%)</label>
              <input
                type="number"
                value={form.alertDropPct}
                onChange={(e) =>
                  setForm({ ...form, alertDropPct: e.target.value })
                }
                placeholder="10"
                min="1"
                max="100"
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">利回り警告(%以下)</label>
              <input
                type="number"
                value={form.alertYieldBelow}
                onChange={(e) =>
                  setForm({ ...form, alertYieldBelow: e.target.value })
                }
                placeholder="3"
                min="0"
                step="0.1"
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">セクター</label>
              <select
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="">未設定</option>
                {SECTOR_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleAdd}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-accent/80"
            >
              追加する
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setForm(defaultForm)
                setErrors({})
              }}
              className="rounded-lg border border-panel px-5 py-2 text-sm text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

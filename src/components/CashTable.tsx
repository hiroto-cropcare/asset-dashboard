'use client'

import { useState } from 'react'
import { Trash2, PlusCircle } from 'lucide-react'
import type { CashHolding } from '@/types'
import { USD_JPY } from '@/lib/calc'

interface CashTableProps {
  cash: CashHolding[]
  onAdd: (c: CashHolding) => void
  onDelete: (id: string) => void
}

function fmt(n: number): string {
  return n.toLocaleString('ja-JP', { maximumFractionDigits: 0 })
}

const defaultForm = {
  name: '',
  amount: '',
  currency: 'JPY' as 'JPY' | 'USD',
  institution: '',
  annualRate: '',
  note: '',
}

export default function CashTable({ cash, onAdd, onDelete }: CashTableProps) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState<Partial<typeof defaultForm>>({})

  function validate(): boolean {
    const e: Partial<typeof defaultForm> = {}
    if (!form.name.trim()) e.name = '必須'
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) < 0)
      e.amount = '0以上の数値'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleAdd() {
    if (!validate()) return
    const newCash: CashHolding = {
      id: `cash-${Date.now()}`,
      category: 'cash',
      name: form.name.trim(),
      amount: Number(form.amount),
      currency: form.currency,
      institution: form.institution.trim() || undefined,
      annualRate: form.annualRate ? Number(form.annualRate) : undefined,
      note: form.note.trim() || undefined,
    }
    onAdd(newCash)
    setForm(defaultForm)
    setShowForm(false)
  }

  const totalJPY = cash.reduce((acc, c) => {
    return acc + (c.currency === 'USD' ? c.amount * USD_JPY : c.amount)
  }, 0)

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-panel bg-surface">
              <th className="px-4 py-3 text-text-muted font-medium">名称</th>
              <th className="px-4 py-3 text-text-muted font-medium">金融機関</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">残高</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">円換算</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">金利(%)</th>
              <th className="px-4 py-3 text-text-muted font-medium">メモ</th>
              <th className="px-4 py-3 text-text-muted font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {cash.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-text-muted">
                  現金・預金データがありません
                </td>
              </tr>
            )}
            {cash.map((c) => {
              const jpyEquiv =
                c.currency === 'USD' ? c.amount * USD_JPY : c.amount
              return (
                <tr
                  key={c.id}
                  className="border-b border-panel transition-colors last:border-0 hover:bg-surface"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {c.institution ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    {c.currency === 'USD' ? '$' : '¥'}
                    {fmt(c.amount)}
                    <span className="ml-1 text-xs text-text-muted">
                      {c.currency}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    {c.currency === 'USD' ? (
                      <span>
                        ¥{fmt(jpyEquiv)}
                        <span className="ml-1 text-xs text-text-muted">
                          (@{USD_JPY})
                        </span>
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted">
                    {c.annualRate !== undefined ? `${c.annualRate}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {c.note ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onDelete(c.id)}
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
          {cash.length > 0 && (
            <tfoot>
              <tr className="border-t border-panel bg-surface">
                <td
                  colSpan={3}
                  className="px-4 py-3 text-sm font-medium text-text-muted"
                >
                  合計（円換算）
                </td>
                <td className="px-4 py-3 text-right text-base font-bold text-accent">
                  ¥{fmt(totalJPY)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="mt-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
      >
        <PlusCircle className="h-4 w-4" />
        {showForm ? 'キャンセル' : '現金・預金を追加'}
      </button>

      {/* Add Form */}
      {showForm && (
        <div className="mt-4 rounded-xl border border-panel bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">
            新規現金・預金追加
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-text-muted">名称 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="普通預金"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.name ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.name && (
                <p className="mt-0.5 text-xs text-danger">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">残高 *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="1000000"
                min="0"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.amount ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.amount && (
                <p className="mt-0.5 text-xs text-danger">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">通貨</label>
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm({
                    ...form,
                    currency: e.target.value as 'JPY' | 'USD',
                  })
                }
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="JPY">JPY</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">金融機関</label>
              <input
                type="text"
                value={form.institution}
                onChange={(e) =>
                  setForm({ ...form, institution: e.target.value })
                }
                placeholder="みずほ銀行"
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">金利(%)</label>
              <input
                type="number"
                value={form.annualRate}
                onChange={(e) =>
                  setForm({ ...form, annualRate: e.target.value })
                }
                placeholder="0.1"
                min="0"
                step="0.001"
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">メモ</label>
              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="生活費口座"
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
              />
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

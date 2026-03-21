'use client'

import { useState } from 'react'
import { Trash2, PlusCircle } from 'lucide-react'
import type { BondHolding } from '@/types'
import { USD_JPY } from '@/lib/calc'

interface BondTableProps {
  bonds: BondHolding[]
  onAdd: (b: BondHolding) => void
  onDelete: (id: string) => void
}

const BOND_TYPES = ['国債', '社債', '外債', 'ETF'] as const

function fmt(n: number) {
  return n.toLocaleString('ja-JP', { maximumFractionDigits: 0 })
}
function fmtDec(n: number, d = 2) {
  return n.toLocaleString('ja-JP', { minimumFractionDigits: d, maximumFractionDigits: d })
}

/** 評価額（円） */
function calcValue(b: BondHolding) {
  const jpy = b.faceValue * b.quantity * b.currentPrice / 100
  return b.currency === 'USD' ? jpy * USD_JPY : jpy
}

/** 取得原価（円） */
function calcCost(b: BondHolding) {
  const jpy = b.faceValue * b.quantity * b.purchasePrice / 100
  return b.currency === 'USD' ? jpy * USD_JPY : jpy
}

/** 残存年数 */
function yearsToMaturity(maturityDate: string): number {
  const now = new Date()
  const mat = new Date(maturityDate)
  return Math.max(0, (mat.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365))
}

/** 最終利回り概算（単利） */
function calcYTM(b: BondHolding): number | null {
  const years = yearsToMaturity(b.maturityDate)
  if (years <= 0) return null
  const redemptionGain = (100 - b.purchasePrice) / years
  return (b.couponRate + redemptionGain) / b.purchasePrice * 100
}

const defaultForm = {
  name: '',
  issuer: '',
  bondType: '国債' as BondHolding['bondType'],
  faceValue: '',
  quantity: '1',
  couponRate: '',
  purchasePrice: '100',
  currentPrice: '100',
  maturityDate: '',
  currency: 'JPY' as 'JPY' | 'USD',
  note: '',
}

export default function BondTable({ bonds, onAdd, onDelete }: BondTableProps) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState<Partial<typeof defaultForm>>({})

  function validate(): boolean {
    const e: Partial<typeof defaultForm> = {}
    if (!form.name.trim()) e.name = '必須'
    if (!form.issuer.trim()) e.issuer = '必須'
    const fv = Number(form.faceValue)
    if (!form.faceValue || !isFinite(fv) || fv <= 0) e.faceValue = '正の数'
    const qty = Number(form.quantity)
    if (!form.quantity || !isFinite(qty) || qty <= 0) e.quantity = '正の数'
    if (!form.couponRate || !isFinite(Number(form.couponRate)) || Number(form.couponRate) < 0)
      e.couponRate = '0以上の数値'
    if (!form.maturityDate) e.maturityDate = '必須'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleAdd() {
    if (!validate()) return
    const b: BondHolding = {
      id: `bond-${Date.now()}`,
      category: 'bond',
      name: form.name.trim(),
      issuer: form.issuer.trim(),
      bondType: form.bondType,
      faceValue: Number(form.faceValue),
      quantity: Number(form.quantity),
      couponRate: Number(form.couponRate),
      purchasePrice: Number(form.purchasePrice) || 100,
      currentPrice: Number(form.currentPrice) || 100,
      maturityDate: form.maturityDate,
      currency: form.currency,
      note: form.note.trim() || undefined,
    }
    onAdd(b)
    setForm(defaultForm)
    setShowForm(false)
  }

  const BOND_TYPE_COLORS: Record<string, string> = {
    '国債': 'bg-accent/10 text-accent',
    '社債': 'bg-blue-500/10 text-blue-400',
    '外債': 'bg-purple-500/10 text-purple-400',
    'ETF':  'bg-gold/10 text-gold',
  }

  return (
    <div className="mt-8">
      <h3 className="mb-3 text-sm font-semibold text-text-muted">債券</h3>

      <div className="overflow-x-auto rounded-xl border border-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-panel bg-surface">
              <th className="px-4 py-3 text-left text-text-muted font-medium">銘柄名</th>
              <th className="px-4 py-3 text-left text-text-muted font-medium">発行体</th>
              <th className="px-4 py-3 text-center text-text-muted font-medium">種別</th>
              <th className="px-4 py-3 text-right text-text-muted font-medium">額面×口数</th>
              <th className="px-4 py-3 text-right text-text-muted font-medium">利率(%)</th>
              <th className="px-4 py-3 text-right text-text-muted font-medium">購入価格</th>
              <th className="px-4 py-3 text-right text-text-muted font-medium">現在価格</th>
              <th className="px-4 py-3 text-right text-text-muted font-medium">評価損益</th>
              <th className="px-4 py-3 text-right text-text-muted font-medium">最終利回り</th>
              <th className="px-4 py-3 text-right text-text-muted font-medium">満期日</th>
              <th className="px-4 py-3 text-center text-text-muted font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {bonds.length === 0 && (
              <tr>
                <td colSpan={11} className="py-10 text-center text-text-muted">
                  債券データがありません
                </td>
              </tr>
            )}
            {bonds.map((b) => {
              const value = calcValue(b)
              const cost  = calcCost(b)
              const pnl   = value - cost
              const ytm   = calcYTM(b)
              const years = yearsToMaturity(b.maturityDate)

              return (
                <tr key={b.id} className="border-b border-panel last:border-0 hover:bg-surface transition-colors">
                  <td className="px-4 py-3 text-text-primary font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-text-muted">{b.issuer}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${BOND_TYPE_COLORS[b.bondType] ?? ''}`}>
                      {b.bondType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    ¥{fmt(b.faceValue * b.quantity)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    {fmtDec(b.couponRate)}%
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted">
                    {fmtDec(b.purchasePrice)}円
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    {fmtDec(b.currentPrice)}円
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${pnl >= 0 ? 'text-up' : 'text-down'}`}>
                      {pnl >= 0 ? '+' : ''}¥{fmt(pnl)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {ytm === null ? (
                      <span className="text-text-muted">満期済</span>
                    ) : (
                      <span className="text-accent">{fmtDec(ytm)}%</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted">
                    <div>{b.maturityDate}</div>
                    {years > 0 && (
                      <div className="text-xs text-text-muted/60">残{fmtDec(years, 1)}年</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onDelete(b.id)}
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
        {showForm ? 'キャンセル' : '債券を追加'}
      </button>

      {/* Add Form */}
      {showForm && (
        <div className="mt-4 rounded-xl border border-panel bg-surface p-5">
          <h4 className="mb-4 text-sm font-semibold text-text-primary">新規債券追加</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {/* 銘柄名 */}
            <div>
              <label className="mb-1 block text-xs text-text-muted">銘柄名 *</label>
              <input type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="利付国債10年"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${errors.name ? 'border-danger' : 'border-panel'}`}
              />
              {errors.name && <p className="mt-0.5 text-xs text-danger">{errors.name}</p>}
            </div>

            {/* 発行体 */}
            <div>
              <label className="mb-1 block text-xs text-text-muted">発行体 *</label>
              <input type="text" value={form.issuer}
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                placeholder="日本国"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${errors.issuer ? 'border-danger' : 'border-panel'}`}
              />
              {errors.issuer && <p className="mt-0.5 text-xs text-danger">{errors.issuer}</p>}
            </div>

            {/* 種別 */}
            <div>
              <label className="mb-1 block text-xs text-text-muted">種別</label>
              <select value={form.bondType}
                onChange={(e) => setForm({ ...form, bondType: e.target.value as BondHolding['bondType'] })}
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
              >
                {BOND_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* 通貨 */}
            <div>
              <label className="mb-1 block text-xs text-text-muted">通貨</label>
              <select value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value as 'JPY' | 'USD' })}
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="JPY">JPY</option>
                <option value="USD">USD</option>
              </select>
            </div>

            {/* 額面金額 */}
            <div>
              <label className="mb-1 block text-xs text-text-muted">額面金額（円） *</label>
              <input type="number" value={form.faceValue}
                onChange={(e) => setForm({ ...form, faceValue: e.target.value })}
                placeholder="1000000"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${errors.faceValue ? 'border-danger' : 'border-panel'}`}
              />
              {errors.faceValue && <p className="mt-0.5 text-xs text-danger">{errors.faceValue}</p>}
            </div>

            {/* 保有口数 */}
            <div>
              <label className="mb-1 block text-xs text-text-muted">保有口数 *</label>
              <input type="number" value={form.quantity} min="1"
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="1"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${errors.quantity ? 'border-danger' : 'border-panel'}`}
              />
              {errors.quantity && <p className="mt-0.5 text-xs text-danger">{errors.quantity}</p>}
            </div>

            {/* 表面利率 */}
            <div>
              <label className="mb-1 block text-xs text-text-muted">表面利率（%） *</label>
              <input type="number" value={form.couponRate} min="0" step="0.01"
                onChange={(e) => setForm({ ...form, couponRate: e.target.value })}
                placeholder="0.8"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${errors.couponRate ? 'border-danger' : 'border-panel'}`}
              />
              {errors.couponRate && <p className="mt-0.5 text-xs text-danger">{errors.couponRate}</p>}
            </div>

            {/* 満期日 */}
            <div>
              <label className="mb-1 block text-xs text-text-muted">満期日 *</label>
              <input type="date" value={form.maturityDate}
                onChange={(e) => setForm({ ...form, maturityDate: e.target.value })}
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent ${errors.maturityDate ? 'border-danger' : 'border-panel'}`}
              />
              {errors.maturityDate && <p className="mt-0.5 text-xs text-danger">{errors.maturityDate}</p>}
            </div>

            {/* 購入価格 */}
            <div>
              <label className="mb-1 block text-xs text-text-muted">購入価格（100円当たり）</label>
              <input type="number" value={form.purchasePrice} min="0" step="0.01"
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                placeholder="99.5"
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* 現在価格 */}
            <div>
              <label className="mb-1 block text-xs text-text-muted">現在価格（100円当たり）</label>
              <input type="number" value={form.currentPrice} min="0" step="0.01"
                onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
                placeholder="99.8"
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* メモ */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-text-muted">メモ</label>
              <input type="text" value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="特定口座"
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={handleAdd}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-accent/80"
            >
              追加する
            </button>
            <button onClick={() => { setShowForm(false); setForm(defaultForm); setErrors({}) }}
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

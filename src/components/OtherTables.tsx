'use client'

import { useState } from 'react'
import { Trash2, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { RealEstateHolding, CryptoHolding } from '@/types'

interface OtherTablesProps {
  realestate: RealEstateHolding[]
  cryptos: CryptoHolding[]
  activeTab: 'realestate' | 'crypto'
  onAddRealestate: (r: RealEstateHolding) => void
  onDeleteRealestate: (id: string) => void
  onAddCrypto: (c: CryptoHolding) => void
  onDeleteCrypto: (id: string) => void
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

const defaultREForm = {
  name: '',
  location: '',
  purchasePrice: '',
  currentValue: '',
  monthlyRent: '',
  mortgageBalance: '',
  note: '',
}

const defaultCryptoForm = {
  symbol: '',
  name: '',
  amount: '',
  buyPrice: '',
  alertDropPct: '20',
}

// ────────────────────────────────────────────────
// Real Estate Table
// ────────────────────────────────────────────────
function RealEstateTable({
  realestate,
  onAdd,
  onDelete,
}: {
  realestate: RealEstateHolding[]
  onAdd: (r: RealEstateHolding) => void
  onDelete: (id: string) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultREForm)
  const [errors, setErrors] = useState<Partial<typeof defaultREForm>>({})

  function validate(): boolean {
    const e: Partial<typeof defaultREForm> = {}
    if (!form.name.trim()) e.name = '必須'
    if (!form.location.trim()) e.location = '必須'
    const purchasePrice = Number(form.purchasePrice)
    if (!form.purchasePrice || !isFinite(purchasePrice) || purchasePrice <= 0 || purchasePrice > 1e15)
      e.purchasePrice = '正の数'
    const currentValue = Number(form.currentValue)
    if (!form.currentValue || !isFinite(currentValue) || currentValue <= 0 || currentValue > 1e15)
      e.currentValue = '正の数'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleAdd() {
    if (!validate()) return
    const r: RealEstateHolding = {
      id: `re-${Date.now()}`,
      category: 'realestate',
      name: form.name.trim(),
      location: form.location.trim(),
      purchasePrice: Number(form.purchasePrice),
      currentValue: Number(form.currentValue),
      monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : undefined,
      mortgageBalance: form.mortgageBalance
        ? Number(form.mortgageBalance)
        : undefined,
      note: form.note.trim() || undefined,
    }
    onAdd(r)
    setForm(defaultREForm)
    setShowForm(false)
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-panel bg-surface">
              <th className="px-4 py-3 text-text-muted font-medium">物件名</th>
              <th className="px-4 py-3 text-text-muted font-medium">所在地</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">取得価格</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">現在価値</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">評価益</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">月額賃料</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">ローン残高</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">純資産</th>
              <th className="px-4 py-3 text-text-muted font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {realestate.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-text-muted">
                  不動産データがありません
                </td>
              </tr>
            )}
            {realestate.map((r) => {
              const gain = r.currentValue - r.purchasePrice
              const netAsset = r.currentValue - (r.mortgageBalance ?? 0)
              return (
                <tr
                  key={r.id}
                  className="border-b border-panel transition-colors last:border-0 hover:bg-surface"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{r.location}</td>
                  <td className="px-4 py-3 text-right text-text-muted">
                    ¥{fmt(r.purchasePrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    ¥{fmt(r.currentValue)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-medium ${gain >= 0 ? 'text-up' : 'text-down'}`}
                    >
                      {gain >= 0 ? '+' : ''}¥{fmt(gain)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    {r.monthlyRent !== undefined
                      ? `¥${fmt(r.monthlyRent)}`
                      : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted">
                    {r.mortgageBalance !== undefined
                      ? `¥${fmt(r.mortgageBalance)}`
                      : <span>—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-bold ${netAsset >= 0 ? 'text-up' : 'text-down'}`}
                    >
                      ¥{fmt(netAsset)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onDelete(r.id)}
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

      <button
        onClick={() => setShowForm(!showForm)}
        className="mt-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
      >
        <PlusCircle className="h-4 w-4" />
        {showForm ? 'キャンセル' : '不動産を追加'}
      </button>

      {showForm && (
        <div className="mt-4 rounded-xl border border-panel bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">
            新規不動産追加
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-text-muted">物件名 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="〇〇マンション"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.name ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.name && (
                <p className="mt-0.5 text-xs text-danger">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">所在地 *</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="東京都渋谷区"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.location ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.location && (
                <p className="mt-0.5 text-xs text-danger">{errors.location}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">取得価格 *</label>
              <input
                type="number"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm({ ...form, purchasePrice: e.target.value })
                }
                placeholder="25000000"
                min="0"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.purchasePrice ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.purchasePrice && (
                <p className="mt-0.5 text-xs text-danger">
                  {errors.purchasePrice}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">現在価値 *</label>
              <input
                type="number"
                value={form.currentValue}
                onChange={(e) =>
                  setForm({ ...form, currentValue: e.target.value })
                }
                placeholder="28000000"
                min="0"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.currentValue ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.currentValue && (
                <p className="mt-0.5 text-xs text-danger">
                  {errors.currentValue}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">月額賃料</label>
              <input
                type="number"
                value={form.monthlyRent}
                onChange={(e) =>
                  setForm({ ...form, monthlyRent: e.target.value })
                }
                placeholder="80000"
                min="0"
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">ローン残高</label>
              <input
                type="number"
                value={form.mortgageBalance}
                onChange={(e) =>
                  setForm({ ...form, mortgageBalance: e.target.value })
                }
                placeholder="15000000"
                min="0"
                className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="col-span-2 sm:col-span-3">
              <label className="mb-1 block text-xs text-text-muted">メモ</label>
              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="区分マンション投資"
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
                setForm(defaultREForm)
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

// ────────────────────────────────────────────────
// Crypto Table
// ────────────────────────────────────────────────
function CryptoTable({
  cryptos,
  onAdd,
  onDelete,
}: {
  cryptos: CryptoHolding[]
  onAdd: (c: CryptoHolding) => void
  onDelete: (id: string) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultCryptoForm)
  const [errors, setErrors] = useState<Partial<typeof defaultCryptoForm>>({})

  function validate(): boolean {
    const e: Partial<typeof defaultCryptoForm> = {}
    const CRYPTO_SYMBOL_RE = /^[A-Z0-9\-]{1,20}$/
    const symbol = form.symbol.trim().toUpperCase()
    if (!symbol) e.symbol = '必須'
    else if (!CRYPTO_SYMBOL_RE.test(symbol)) e.symbol = '英数字・- のみ（20文字以内）'
    if (!form.name.trim()) e.name = '必須'
    const amount = Number(form.amount)
    if (!form.amount || !isFinite(amount) || amount <= 0 || amount > 1e15)
      e.amount = '正の数'
    const buyPrice = Number(form.buyPrice)
    if (!form.buyPrice || !isFinite(buyPrice) || buyPrice <= 0 || buyPrice > 1e15)
      e.buyPrice = '正の数'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleAdd() {
    if (!validate()) return
    const c: CryptoHolding = {
      id: `crypto-${Date.now()}`,
      category: 'crypto',
      symbol: form.symbol.trim().toUpperCase(),
      name: form.name.trim(),
      amount: Number(form.amount),
      buyPrice: Number(form.buyPrice),
      currentPrice: null,
      alertDropPct: Number(form.alertDropPct) || 20,
    }
    onAdd(c)
    setForm(defaultCryptoForm)
    setShowForm(false)
  }

  function getDropPct(c: CryptoHolding): number | null {
    if (c.currentPrice === null) return null
    return ((c.currentPrice - c.buyPrice) / c.buyPrice) * 100
  }

  function getPnL(c: CryptoHolding): number | null {
    if (c.currentPrice === null) return null
    return (c.currentPrice - c.buyPrice) * c.amount
  }

  function isAlert(c: CryptoHolding): boolean {
    if (c.currentPrice === null) return false
    const drop = ((c.buyPrice - c.currentPrice) / c.buyPrice) * 100
    return drop >= c.alertDropPct
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-panel bg-surface">
              <th className="px-4 py-3 text-text-muted font-medium">シンボル</th>
              <th className="px-4 py-3 text-text-muted font-medium">名称</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">保有数量</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">買値(¥)</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">現在値(¥)</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">騰落率(%)</th>
              <th className="px-4 py-3 text-text-muted font-medium text-right">評価損益(¥)</th>
              <th className="px-4 py-3 text-text-muted font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {cryptos.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-text-muted">
                  暗号資産データがありません
                </td>
              </tr>
            )}
            {cryptos.map((c) => {
              const dropPct = getDropPct(c)
              const pnl = getPnL(c)
              const alert = isAlert(c)

              return (
                <tr
                  key={c.id}
                  className={`border-b border-panel transition-colors last:border-0 ${
                    alert
                      ? 'bg-danger/10 hover:bg-danger/15'
                      : 'hover:bg-surface'
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-accent">{c.symbol}</td>
                  <td className="px-4 py-3 text-text-primary">{c.name}</td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    {c.amount.toLocaleString('ja-JP', {
                      maximumFractionDigits: 8,
                    })}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted">
                    ¥{fmt(c.buyPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    {c.currentPrice === null ? (
                      <span className="text-text-muted">---</span>
                    ) : (
                      `¥${fmt(c.currentPrice)}`
                    )}
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
        </table>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="mt-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
      >
        <PlusCircle className="h-4 w-4" />
        {showForm ? 'キャンセル' : '暗号資産を追加'}
      </button>

      {showForm && (
        <div className="mt-4 rounded-xl border border-panel bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">
            新規暗号資産追加
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-text-muted">シンボル *</label>
              <input
                type="text"
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                placeholder="BTC-JPY"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.symbol ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.symbol && (
                <p className="mt-0.5 text-xs text-danger">{errors.symbol}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">名称 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Bitcoin"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.name ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.name && (
                <p className="mt-0.5 text-xs text-danger">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">保有数量 *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.5"
                min="0"
                step="0.00000001"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.amount ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.amount && (
                <p className="mt-0.5 text-xs text-danger">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">買値(¥) *</label>
              <input
                type="number"
                value={form.buyPrice}
                onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
                placeholder="8000000"
                min="0"
                className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
                  errors.buyPrice ? 'border-danger' : 'border-panel'
                }`}
              />
              {errors.buyPrice && (
                <p className="mt-0.5 text-xs text-danger">{errors.buyPrice}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">下落アラート(%)</label>
              <input
                type="number"
                value={form.alertDropPct}
                onChange={(e) =>
                  setForm({ ...form, alertDropPct: e.target.value })
                }
                placeholder="20"
                min="1"
                max="100"
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
                setForm(defaultCryptoForm)
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

// ────────────────────────────────────────────────
// Main export
// ────────────────────────────────────────────────
export default function OtherTables({
  realestate,
  cryptos,
  activeTab,
  onAddRealestate,
  onDeleteRealestate,
  onAddCrypto,
  onDeleteCrypto,
}: OtherTablesProps) {
  if (activeTab === 'realestate') {
    return (
      <RealEstateTable
        realestate={realestate}
        onAdd={onAddRealestate}
        onDelete={onDeleteRealestate}
      />
    )
  }
  return (
    <CryptoTable
      cryptos={cryptos}
      onAdd={onAddCrypto}
      onDelete={onDeleteCrypto}
    />
  )
}

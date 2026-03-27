'use client'

import { useState, useMemo } from 'react'
import { Trash2, PlusCircle, TrendingUp, CalendarDays } from 'lucide-react'
import type { DividendRecord, StockHolding, BondHolding } from '@/types'
import { USD_JPY } from '@/lib/calc'

interface Props {
  dividends: DividendRecord[]
  stocks: StockHolding[]
  bonds: BondHolding[]
  onAdd: (d: DividendRecord) => void
  onDelete: (id: string) => void
}

function fmt(n: number): string {
  return n.toLocaleString('ja-JP', { maximumFractionDigits: 0 })
}

function fmtDec(n: number, d = 2): string {
  return n.toLocaleString('ja-JP', { minimumFractionDigits: d, maximumFractionDigits: d })
}

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const defaultForm = {
  stockCode: '',
  stockName: '',
  receivedDate: new Date().toISOString().slice(0, 10),
  amountPerShare: '',
  shares: '',
  currency: 'JPY' as 'JPY' | 'USD',
  note: '',
}

export default function DividendTable({ dividends, stocks, bonds, onAdd, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof defaultForm, string>>>({})
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())

  const currentYear = new Date().getFullYear()

  function toJPY(amount: number, currency: 'JPY' | 'USD') {
    return currency === 'USD' ? amount * USD_JPY : amount
  }

  // ── 年間予定配当（株式から自動計算） ──────────────────────────────────────
  const expectedFromStocks = useMemo(() =>
    stocks
      .filter((s) => s.annualDividend > 0)
      .map((s) => {
        const annualJPY = s.market === 'US'
          ? s.annualDividend * s.shares * USD_JPY
          : s.annualDividend * s.shares
        return {
          code: s.code,
          name: s.name,
          annualDividend: s.annualDividend,
          shares: s.shares,
          currency: s.market === 'US' ? 'USD' as const : 'JPY' as const,
          annualJPY,
          yieldPct: s.currentPrice ? (s.annualDividend / s.currentPrice) * 100 : null,
        }
      })
      .sort((a, b) => b.annualJPY - a.annualJPY),
    [stocks]
  )

  // 債券クーポン（年間）
  const expectedFromBonds = useMemo(() =>
    bonds.map((b) => {
      const annualJPY = (b.faceValue * b.quantity / 100) * b.couponRate
      return { code: b.name, name: b.issuer, annualJPY }
    }).filter((b) => b.annualJPY > 0),
    [bonds]
  )

  const totalExpectedJPY = useMemo(
    () => expectedFromStocks.reduce((s, r) => s + r.annualJPY, 0)
        + expectedFromBonds.reduce((s, r) => s + r.annualJPY, 0),
    [expectedFromStocks, expectedFromBonds]
  )

  // ── 受取済み配当（手動記録） ──────────────────────────────────────────────
  const years = useMemo(() => {
    const set = new Set<number>([currentYear])
    for (const d of dividends) set.add(new Date(d.receivedDate).getFullYear())
    return Array.from(set).sort((a, b) => b - a)
  }, [dividends, currentYear])

  const filtered = useMemo(
    () => dividends.filter((d) => new Date(d.receivedDate).getFullYear() === filterYear),
    [dividends, filterYear]
  )

  const totalAllJPY = useMemo(
    () => dividends.reduce((sum, d) => sum + toJPY(d.totalAmount, d.currency), 0),
    [dividends]
  )
  const totalYearJPY = useMemo(
    () => filtered.reduce((sum, d) => sum + toJPY(d.totalAmount, d.currency), 0),
    [filtered]
  )

  // 月別集計
  const monthly = useMemo(() => {
    const arr = Array(12).fill(0) as number[]
    for (const d of filtered) {
      const month = new Date(d.receivedDate).getMonth()
      arr[month] += toJPY(d.totalAmount, d.currency)
    }
    return arr
  }, [filtered])
  const maxMonthly = Math.max(...monthly, 1)

  // フォーム: 銘柄選択で自動入力
  function handleStockSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value
    const s = stocks.find((s) => s.code === code)
    if (s) {
      setForm((prev) => ({
        ...prev,
        stockCode: s.code,
        stockName: s.name,
        shares: String(s.shares),
        amountPerShare: s.annualDividend > 0 ? String(s.annualDividend) : prev.amountPerShare,
        currency: s.market === 'US' ? 'USD' : 'JPY',
      }))
    } else {
      setForm((prev) => ({ ...prev, stockCode: '', stockName: '' }))
    }
  }

  function validate(): boolean {
    const e: Partial<Record<keyof typeof defaultForm, string>> = {}
    if (!form.stockCode.trim()) e.stockCode = '必須'
    if (!form.stockName.trim()) e.stockName = '必須'
    if (!form.receivedDate) e.receivedDate = '必須'
    const aps = Number(form.amountPerShare)
    if (!form.amountPerShare || !isFinite(aps) || aps <= 0) e.amountPerShare = '正の数'
    const sh = Number(form.shares)
    if (!form.shares || !isFinite(sh) || sh <= 0) e.shares = '正の数'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleAdd() {
    if (!validate()) return
    const aps = Number(form.amountPerShare)
    const sh = Number(form.shares)
    const record: DividendRecord = {
      id: `div-${Date.now()}`,
      stockCode: form.stockCode.trim().toUpperCase(),
      stockName: form.stockName.trim(),
      receivedDate: form.receivedDate,
      amountPerShare: aps,
      shares: sh,
      totalAmount: aps * sh,
      currency: form.currency,
      note: form.note.trim() || undefined,
    }
    onAdd(record)
    setForm(defaultForm)
    setShowForm(false)
    setErrors({})
  }

  const inputCls = (field: keyof typeof defaultForm) =>
    `w-full rounded-lg border bg-ink px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent ${
      errors[field] ? 'border-danger' : 'border-panel'
    }`

  return (
    <div className="space-y-6">

      {/* ══ 年間予定配当（自動） ══════════════════════════════════════════════ */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <TrendingUp className="h-4 w-4 text-accent" />
          年間予定配当
          <span className="text-xs font-normal text-text-muted">（保有株式・債券から自動計算）</span>
        </h3>

        <div className="mb-4 flex items-end gap-6">
          <div>
            <p className="text-xs text-text-muted">年間合計（予定）</p>
            <p className="text-3xl font-bold text-accent">¥{fmt(totalExpectedJPY)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">月平均</p>
            <p className="text-xl font-semibold text-text-primary">¥{fmt(totalExpectedJPY / 12)}</p>
          </div>
        </div>

        {expectedFromStocks.length === 0 && expectedFromBonds.length === 0 ? (
          <p className="text-xs text-text-muted">配当金が設定された銘柄がありません</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-panel">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-panel bg-surface/50">
                  <th className="px-3 py-2 text-left text-xs text-text-muted font-medium">コード</th>
                  <th className="px-3 py-2 text-left text-xs text-text-muted font-medium">銘柄名</th>
                  <th className="px-3 py-2 text-right text-xs text-text-muted font-medium">1株配当</th>
                  <th className="px-3 py-2 text-right text-xs text-text-muted font-medium">株数</th>
                  <th className="px-3 py-2 text-right text-xs text-text-muted font-medium">年間受取（予定）</th>
                  <th className="px-3 py-2 text-right text-xs text-text-muted font-medium">利回り</th>
                </tr>
              </thead>
              <tbody>
                {expectedFromStocks.map((r) => (
                  <tr key={r.code} className="border-b border-panel last:border-0 hover:bg-surface/50 transition-colors">
                    <td className="px-3 py-2 font-mono text-accent text-xs">{r.code}</td>
                    <td className="px-3 py-2 text-text-primary">{r.name}</td>
                    <td className="px-3 py-2 text-right text-text-muted text-xs">
                      {r.currency === 'USD' ? '$' : '¥'}{fmtDec(r.annualDividend, r.currency === 'USD' ? 2 : 0)}
                    </td>
                    <td className="px-3 py-2 text-right text-text-muted text-xs">{fmt(r.shares)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-accent">
                      ¥{fmt(r.annualJPY)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      {r.yieldPct !== null
                        ? <span className="text-text-primary">{fmtDec(r.yieldPct)}%</span>
                        : <span className="text-text-muted">---</span>}
                    </td>
                  </tr>
                ))}
                {expectedFromBonds.map((r) => (
                  <tr key={r.code} className="border-b border-panel last:border-0 hover:bg-surface/50 transition-colors">
                    <td className="px-3 py-2 font-mono text-text-muted text-xs">債券</td>
                    <td className="px-3 py-2 text-text-primary">{r.code} <span className="text-xs text-text-muted">{r.name}</span></td>
                    <td className="px-3 py-2 text-right text-text-muted text-xs">クーポン</td>
                    <td className="px-3 py-2 text-right text-text-muted text-xs">---</td>
                    <td className="px-3 py-2 text-right font-semibold text-accent">¥{fmt(r.annualJPY)}</td>
                    <td className="px-3 py-2 text-right text-xs text-text-muted">---</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ 受取済み配当（手動記録） ═════════════════════════════════════════ */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <CalendarDays className="h-4 w-4 text-text-muted" />
          受取履歴
          <span className="text-xs font-normal text-text-muted">（実際の受取を記録）</span>
        </h3>

        {/* サマリーカード */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-panel bg-surface p-4">
            <p className="text-xs text-text-muted">累計受取配当</p>
            <p className="mt-1 text-xl font-bold text-text-primary">¥{fmt(totalAllJPY)}</p>
          </div>
          <div className="rounded-xl border border-panel bg-surface p-4">
            <p className="text-xs text-text-muted">{filterYear}年 受取合計</p>
            <p className="mt-1 text-xl font-bold text-text-primary">¥{fmt(totalYearJPY)}</p>
          </div>
          <div className="rounded-xl border border-panel bg-surface p-4">
            <p className="text-xs text-text-muted">達成率（{filterYear}年）</p>
            <p className="mt-1 text-xl font-bold text-text-primary">
              {totalExpectedJPY > 0
                ? `${fmtDec((totalYearJPY / totalExpectedJPY) * 100, 1)}%`
                : '---'}
            </p>
          </div>
        </div>

        {/* 月別棒グラフ */}
        <div className="mb-4 rounded-xl border border-panel bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-text-muted">月別受取額</p>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="rounded-lg border border-panel bg-ink px-2 py-1 text-xs text-text-primary focus:border-accent"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-1" style={{ height: '72px' }}>
            {monthly.map((amount, i) => {
              const height = maxMonthly > 0 ? (amount / maxMonthly) * 100 : 0
              return (
                <div key={i} className="group relative flex flex-1 flex-col items-center">
                  {amount > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-surface px-1.5 py-0.5 text-xs text-accent opacity-0 shadow group-hover:opacity-100 transition-opacity z-10">
                      ¥{fmt(amount)}
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t transition-all ${amount > 0 ? 'bg-accent/60 hover:bg-accent' : 'bg-panel'}`}
                    style={{ height: `${Math.max(height, amount > 0 ? 4 : 2)}%` }}
                  />
                  <span className="mt-1 text-[10px] text-text-muted">{MONTHS[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 受取履歴テーブル */}
        <div className="overflow-x-auto rounded-xl border border-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-panel bg-surface">
                <th className="px-4 py-3 text-left text-text-muted font-medium">受取日</th>
                <th className="px-4 py-3 text-left text-text-muted font-medium">コード</th>
                <th className="px-4 py-3 text-left text-text-muted font-medium">銘柄名</th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">1株配当</th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">株数</th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">受取合計</th>
                <th className="px-4 py-3 text-left text-text-muted font-medium">メモ</th>
                <th className="px-4 py-3 text-center text-text-muted font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {dividends.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-text-muted">
                    受取済み配当の記録がありません
                  </td>
                </tr>
              )}
              {[...dividends]
                .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))
                .map((d) => (
                  <tr key={d.id} className="border-b border-panel last:border-0 hover:bg-surface transition-colors">
                    <td className="px-4 py-3 text-text-muted">{d.receivedDate}</td>
                    <td className="px-4 py-3 font-mono text-accent">{d.stockCode}</td>
                    <td className="px-4 py-3 text-text-primary">{d.stockName}</td>
                    <td className="px-4 py-3 text-right text-text-muted">
                      {d.currency === 'USD' ? '$' : '¥'}{fmtDec(d.amountPerShare, d.currency === 'USD' ? 2 : 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-text-primary">{fmt(d.shares)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-accent">
                      {d.currency === 'USD' ? '$' : '¥'}{fmtDec(d.totalAmount, d.currency === 'USD' ? 2 : 0)}
                      {d.currency === 'USD' && (
                        <span className="ml-1 text-xs text-text-muted">(¥{fmt(d.totalAmount * USD_JPY)})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">{d.note ?? '---'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onDelete(d.id)}
                        className="rounded p-1.5 text-text-muted transition-colors hover:bg-danger/20 hover:text-danger"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* 受取記録ボタン */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="mt-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
        >
          <PlusCircle className="h-4 w-4" />
          {showForm ? 'キャンセル' : '受取を記録'}
        </button>

        {/* 追加フォーム */}
        {showForm && (
          <div className="mt-4 rounded-xl border border-panel bg-surface p-5">
            <h4 className="mb-4 text-sm font-semibold text-text-primary">受取を記録</h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">保有銘柄から選択</label>
                <select
                  onChange={handleStockSelect}
                  className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  <option value="">--- 選択または手入力 ---</option>
                  {stocks.filter((s) => s.annualDividend > 0).map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.code} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-muted">コード *</label>
                <input type="text" value={form.stockCode}
                  onChange={(e) => setForm({ ...form, stockCode: e.target.value })}
                  placeholder="7203.T" className={inputCls('stockCode')} />
                {errors.stockCode && <p className="mt-0.5 text-xs text-danger">{errors.stockCode}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-muted">銘柄名 *</label>
                <input type="text" value={form.stockName}
                  onChange={(e) => setForm({ ...form, stockName: e.target.value })}
                  placeholder="トヨタ自動車" className={inputCls('stockName')} />
                {errors.stockName && <p className="mt-0.5 text-xs text-danger">{errors.stockName}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-muted">受取日 *</label>
                <input type="date" value={form.receivedDate}
                  onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
                  className={inputCls('receivedDate')} />
                {errors.receivedDate && <p className="mt-0.5 text-xs text-danger">{errors.receivedDate}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-muted">1株あたり配当金 *</label>
                <input type="number" value={form.amountPerShare}
                  onChange={(e) => setForm({ ...form, amountPerShare: e.target.value })}
                  placeholder="60" min="0" step="0.01" className={inputCls('amountPerShare')} />
                {errors.amountPerShare && <p className="mt-0.5 text-xs text-danger">{errors.amountPerShare}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-muted">株数 *</label>
                <input type="number" value={form.shares}
                  onChange={(e) => setForm({ ...form, shares: e.target.value })}
                  placeholder="100" min="1" className={inputCls('shares')} />
                {errors.shares && <p className="mt-0.5 text-xs text-danger">{errors.shares}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-muted">通貨</label>
                <select value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value as 'JPY' | 'USD' })}
                  className="w-full rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary focus:border-accent">
                  <option value="JPY">JPY</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-muted">メモ</label>
                <input type="text" value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="中間配当 など" className={inputCls('note')} />
              </div>

              {form.amountPerShare && form.shares && (
                <div className="flex items-center rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
                  <div>
                    <p className="text-xs text-text-muted">受取合計（予定）</p>
                    <p className="text-lg font-bold text-accent">
                      {form.currency === 'USD' ? '$' : '¥'}
                      {fmtDec(Number(form.amountPerShare) * Number(form.shares), form.currency === 'USD' ? 2 : 0)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={handleAdd}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-accent/80">
                記録する
              </button>
              <button onClick={() => { setShowForm(false); setForm(defaultForm); setErrors({}) }}
                className="rounded-lg border border-panel px-5 py-2 text-sm text-text-muted transition-colors hover:bg-surface hover:text-text-primary">
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { RefreshCw, TrendingUp, Wallet, Home, Bitcoin, DollarSign } from 'lucide-react'
import type { PortfolioData, DashboardSummary } from '@/types'
import { calcSummary } from '@/lib/calc'
import { sampleData } from '@/lib/sampleData'
import { supabase } from '@/lib/supabase'
import { loadPortfolio, savePortfolio, migrateLocalToSupabase } from '@/lib/db'
import ToastNotifications from '@/components/ToastNotifications'
import SummaryCards from '@/components/SummaryCards'
import StockTable from '@/components/StockTable'
import CashTable from '@/components/CashTable'
import OtherTables from '@/components/OtherTables'
import SectorChart from '@/components/SectorChart'
import BondTable from '@/components/BondTable'
import AuthBar from '@/components/AuthBar'
import DividendTable from '@/components/DividendTable'
import type { StockHolding, CashHolding, RealEstateHolding, CryptoHolding, BondHolding, DividendRecord } from '@/types'

type ActiveTab = 'stock' | 'cash' | 'realestate' | 'crypto' | 'dividend'

const TAB_CONFIG: {
  id: ActiveTab
  label: string
  icon: React.ElementType
}[] = [
  { id: 'stock', label: '株式・債券', icon: TrendingUp },
  { id: 'cash', label: '現金・預金', icon: Wallet },
  { id: 'realestate', label: '不動産', icon: Home },
  { id: 'crypto', label: '暗号資産', icon: Bitcoin },
  { id: 'dividend', label: '配当金', icon: DollarSign },
]

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<PortfolioData>(sampleData)
  const [summary, setSummary] = useState<DashboardSummary>(() =>
    calcSummary(sampleData)
  )
  const [activeTab, setActiveTab] = useState<ActiveTab>('stock')
  const [isUpdating, setIsUpdating] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [showSectorChart, setShowSectorChart] = useState(true)
  const [updateKey, setUpdateKey] = useState(0)
  const [updateSource, setUpdateSource] = useState<'alphavantage' | 'yfinance' | 'mock' | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // 初期化: 匿名ログイン → データ読み込み
  useEffect(() => {
    async function init() {
      try {
        // 既存セッション確認
        const { data: { session } } = await supabase.auth.getSession()
        let currentUser = session?.user ?? null

        // セッションなければ匿名ログイン
        if (!currentUser) {
          const { data, error } = await supabase.auth.signInAnonymously()
          if (error) {
            console.warn('匿名ログイン失敗（localStorageで続行）:', error.message)
          } else {
            currentUser = data.user ?? null
          }
        }

        setUser(currentUser)

        // ポートフォリオ読み込み
        const saved = await loadPortfolio()
        if (saved) {
          const migrated = { ...saved, bonds: saved.bonds ?? [], dividends: saved.dividends ?? [] }
          setPortfolio(migrated)
          setSummary(calcSummary(migrated))
        }
      } catch (err) {
        console.error('初期化エラー:', err)
      } finally {
        setLoaded(true)
      }
    }

    init()

    // 認証状態の変化を監視（メール確認後のリダイレクト時など）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null
      setUser(u)
      // メール確認後に自動サインインされた際、ローカルデータをSupabaseへ移行する
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && u && !u.is_anonymous) {
        await migrateLocalToSupabase(u.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ポートフォリオ変更時に保存
  useEffect(() => {
    if (!loaded) return
    savePortfolio(portfolio)
    setSummary(calcSummary(portfolio))
  }, [portfolio, loaded])

  // Fetch real-time prices
  const handleUpdatePrices = useCallback(async () => {
    setIsUpdating(true)
    setUpdateSource(null)

    try {
      const stockSymbols = portfolio.stocks.map((s) => s.code)
      const cryptoSymbols = portfolio.cryptos.map((c) => c.symbol)
      const allSymbols = [...stockSymbols, ...cryptoSymbols]

      if (allSymbols.length === 0) {
        setIsUpdating(false)
        return
      }

      const params = new URLSearchParams({ symbols: allSymbols.join(',') })
      const res = await fetch(`/api/prices?${params.toString()}`)
      const data = await res.json() as {
        prices: Record<string, number | null>
        source: 'alphavantage' | 'yfinance' | 'mock'
      }

      const now = new Date().toISOString()

      setPortfolio((prev) => ({
        ...prev,
        stocks: prev.stocks.map((s) => ({
          ...s,
          currentPrice:
            data.prices[s.code] !== undefined
              ? data.prices[s.code]
              : s.currentPrice,
          lastUpdated: now,
        })),
        cryptos: prev.cryptos.map((c) => ({
          ...c,
          currentPrice:
            data.prices[c.symbol] !== undefined
              ? data.prices[c.symbol]
              : c.currentPrice,
        })),
      }))

      setUpdateSource(data.source)
      setUpdateKey((k) => k + 1)
    } catch (err) {
      console.error('Price update failed:', err)
    } finally {
      setIsUpdating(false)
    }
  }, [portfolio.stocks, portfolio.cryptos])

  // ── Portfolio mutation handlers ──

  function handleAddStock(s: StockHolding) {
    setPortfolio((prev) => ({ ...prev, stocks: [...prev.stocks, s] }))
  }

  function handleDeleteStock(id: string) {
    setPortfolio((prev) => ({
      ...prev,
      stocks: prev.stocks.filter((s) => s.id !== id),
    }))
  }

  function handleAddBond(b: BondHolding) {
    setPortfolio((prev) => ({ ...prev, bonds: [...(prev.bonds ?? []), b] }))
  }

  function handleDeleteBond(id: string) {
    setPortfolio((prev) => ({ ...prev, bonds: (prev.bonds ?? []).filter((b) => b.id !== id) }))
  }

  function handleAddCash(c: CashHolding) {
    setPortfolio((prev) => ({ ...prev, cash: [...prev.cash, c] }))
  }

  function handleDeleteCash(id: string) {
    setPortfolio((prev) => ({
      ...prev,
      cash: prev.cash.filter((c) => c.id !== id),
    }))
  }

  function handleAddRealestate(r: RealEstateHolding) {
    setPortfolio((prev) => ({
      ...prev,
      realestate: [...prev.realestate, r],
    }))
  }

  function handleDeleteRealestate(id: string) {
    setPortfolio((prev) => ({
      ...prev,
      realestate: prev.realestate.filter((r) => r.id !== id),
    }))
  }

  function handleAddCrypto(c: CryptoHolding) {
    setPortfolio((prev) => ({ ...prev, cryptos: [...prev.cryptos, c] }))
  }

  function handleDeleteCrypto(id: string) {
    setPortfolio((prev) => ({
      ...prev,
      cryptos: prev.cryptos.filter((c) => c.id !== id),
    }))
  }

  function handleAddDividend(d: DividendRecord) {
    setPortfolio((prev) => ({ ...prev, dividends: [...(prev.dividends ?? []), d] }))
  }

  function handleDeleteDividend(id: string) {
    setPortfolio((prev) => ({
      ...prev,
      dividends: (prev.dividends ?? []).filter((d) => d.id !== id),
    }))
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="text-text-muted">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <header className="border-b border-panel bg-surface">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Asset Dashboard
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">資産管理ダッシュボード</p>
          </div>
          <div className="flex items-center gap-3">
            {updateSource && (
              <span
                className={`text-xs ${
                  updateSource === 'mock' ? 'text-text-muted' : 'text-accent'
                }`}
              >
                {updateSource === 'alphavantage' && '✓ Alpha Vantage から取得'}
                {updateSource === 'yfinance' && '✓ yfinance から取得'}
                {updateSource === 'mock' && '※ モックデータ'}
              </span>
            )}
            <AuthBar user={user} onUserChange={setUser} />
            <button
              onClick={handleUpdatePrices}
              disabled={isUpdating}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink transition-all hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`}
              />
              株価更新
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
        {/* Toast Notifications */}
        <ToastNotifications alerts={summary.alerts} updateKey={updateKey} />

        {/* Summary Cards */}
        <SummaryCards summary={summary} />

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-1 rounded-xl border border-panel bg-surface p-1">
          {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-accent text-ink shadow'
                  : 'text-text-muted hover:bg-panel hover:text-text-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'stock' && (
            <>
              {showSectorChart ? (
                <SectorChart
                  bySector={summary.bySector}
                  stockTotal={summary.byCategory.stock}
                  onClose={() => setShowSectorChart(false)}
                />
              ) : (
                <button
                  onClick={() => setShowSectorChart(true)}
                  className="mb-6 text-xs text-text-muted underline hover:text-text-primary"
                >
                  セクター配分を表示
                </button>
              )}
              <StockTable
                stocks={portfolio.stocks}
                onAdd={handleAddStock}
                onDelete={handleDeleteStock}
              />
              <BondTable
                bonds={portfolio.bonds ?? []}
                onAdd={handleAddBond}
                onDelete={handleDeleteBond}
              />
            </>
          )}

          {activeTab === 'cash' && (
            <CashTable
              cash={portfolio.cash}
              onAdd={handleAddCash}
              onDelete={handleDeleteCash}
            />
          )}

          {(activeTab === 'realestate' || activeTab === 'crypto') && (
            <OtherTables
              realestate={portfolio.realestate}
              cryptos={portfolio.cryptos}
              activeTab={activeTab}
              onAddRealestate={handleAddRealestate}
              onDeleteRealestate={handleDeleteRealestate}
              onAddCrypto={handleAddCrypto}
              onDeleteCrypto={handleDeleteCrypto}
            />
          )}

          {activeTab === 'dividend' && (
            <DividendTable
              dividends={portfolio.dividends ?? []}
              stocks={portfolio.stocks}
              bonds={portfolio.bonds ?? []}
              onAdd={handleAddDividend}
              onDelete={handleDeleteDividend}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-panel py-4 text-center text-xs text-text-muted">
        Asset Dashboard — {user && !user.is_anonymous ? `${user.email} でログイン中` : 'ログインするとデータがクラウドに同期されます'}
      </footer>
    </div>
  )
}

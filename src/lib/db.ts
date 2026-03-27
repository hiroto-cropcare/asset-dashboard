import { supabase } from './supabase'
import type { PortfolioData } from '@/types'

const STORAGE_KEY = 'asset_dashboard_v1'

// ── localStorage helpers ──────────────────────────────────────────────────────

function isValidPortfolioData(obj: unknown): obj is PortfolioData {
  if (!obj || typeof obj !== 'object') return false
  const d = obj as Record<string, unknown>
  return (
    Array.isArray(d.stocks) &&
    Array.isArray(d.cash) &&
    Array.isArray(d.realestate) &&
    Array.isArray(d.cryptos) &&
    Array.isArray(d.bonds ?? []) &&
    Array.isArray(d.dividends ?? [])
  )
}

function readLocalStorage(): PortfolioData | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidPortfolioData(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeLocalStorage(data: PortfolioData): void {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

export async function loadPortfolio(): Promise<PortfolioData | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return readLocalStorage()

  const { data, error } = await supabase
    .from('portfolios')
    .select('data')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return readLocalStorage()

  const portfolio = data.data as unknown
  return isValidPortfolioData(portfolio) ? portfolio : null
}

export async function savePortfolio(portfolio: PortfolioData): Promise<void> {
  writeLocalStorage(portfolio)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('portfolios')
    .upsert({ user_id: user.id, data: portfolio, updated_at: new Date().toISOString() })
}

// 匿名ユーザーをメール認証にアップグレードする際、既存DBデータを引き継ぐ
export async function migrateLocalToSupabase(userId: string): Promise<void> {
  const local = readLocalStorage()
  if (!local) return

  // すでにDBにデータがある場合は上書きしない
  const { data } = await supabase
    .from('portfolios')
    .select('user_id')
    .eq('user_id', userId)
    .single()

  if (data) return

  await supabase
    .from('portfolios')
    .insert({ user_id: userId, data: local })
}

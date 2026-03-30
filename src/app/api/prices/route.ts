import { NextRequest, NextResponse } from 'next/server'
import { SYMBOL_RE } from '@/lib/symbols'

const AV_API_KEY = process.env.NEXT_ALPHAVANTAGE_API_KEY
const AV_BASE = 'https://www.alphavantage.co/query'

async function fetchPriceAV(symbol: string): Promise<number | null> {
  try {
    const url = `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${AV_API_KEY}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    // Rate limit or quota exceeded
    if (data['Note'] || data['Information']) {
      console.warn('Alpha Vantage rate limit hit:', data['Note'] ?? data['Information'])
      return null
    }
    const price = data['Global Quote']?.['05. price']
    return price ? parseFloat(price) : null
  } catch (e) {
    console.error('Alpha Vantage fetch error:', e)
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get('symbols') ?? ''
  const symbols = symbolsParam
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0 && SYMBOL_RE.test(s))
    .slice(0, 50)

  if (symbols.length === 0) {
    return NextResponse.json({ prices: {}, source: 'none' })
  }

  if (!AV_API_KEY) {
    return NextResponse.json(
      { error: 'NEXT_ALPHAVANTAGE_API_KEY is not set' },
      { status: 503 }
    )
  }

  // Alpha Vantage: free tier = 25 req/day, 5 req/min
  // サーバーレス環境のタイムアウトを考慮し、1バッチ（5銘柄）のみ処理する。
  // 超過分は prices に含めないが truncated: true で呼び出し元に通知する。
  const BATCH = 5
  const batch = symbols.slice(0, BATCH)
  const truncated = symbols.length > BATCH

  const results = await Promise.all(batch.map(fetchPriceAV))
  const prices: Record<string, number | null> = {}
  batch.forEach((sym, idx) => {
    prices[sym] = results[idx]
  })

  return NextResponse.json({ prices, source: 'alphavantage', truncated })
}

import { NextRequest, NextResponse } from 'next/server'
import { SYMBOL_RE, toTwelvedataSymbol, detectMarket } from '@/lib/symbols'

const TD_API_KEY = process.env.NEXT_TWELVEDATA_API_KEY
const TD_BASE = 'https://api.twelvedata.com'

async function fetchStockInfoTD(symbol: string): Promise<Record<string, unknown> | null> {
  if (!TD_API_KEY) return null
  const market = detectMarket(symbol)

  // 日本株は Twelve Data 無料枠で非対応のため、市場・通貨のみ返す
  if (market === 'JP') {
    return {
      name: symbol,
      market,
      sector: null,
      currentPrice: null,
      annualDividend: 0,
      currency: 'JPY',
    }
  }

  const tdSymbol = toTwelvedataSymbol(symbol)

  try {
    const res = await fetch(
      `${TD_BASE}/quote?symbol=${encodeURIComponent(tdSymbol)}&apikey=${TD_API_KEY}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null

    const data = await res.json()

    if (data.status === 'error' || data.code) {
      console.warn('Twelve Data quote error:', data.message)
      return null
    }

    const currency: string = data.currency ?? 'USD'
    const currentPrice = data.close ? parseFloat(data.close) : null

    return {
      name: data.name ?? symbol,
      market,
      // セクター情報は Twelve Data 無料枠では取得不可（手動入力）
      sector: null,
      currentPrice,
      annualDividend: 0,
      currency,
    }
  } catch (e) {
    console.error('Twelve Data stockinfo error:', e)
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.trim().toUpperCase() ?? ''

  if (!symbol || !SYMBOL_RE.test(symbol)) {
    return NextResponse.json({ error: 'invalid symbol' }, { status: 400 })
  }

  if (!TD_API_KEY) {
    return NextResponse.json({ error: 'NEXT_TWELVEDATA_API_KEY is not set' }, { status: 503 })
  }

  const info = await fetchStockInfoTD(symbol)
  if (info) {
    return NextResponse.json(info)
  }

  return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
}

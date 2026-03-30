import { NextRequest, NextResponse } from 'next/server'
import { SYMBOL_RE } from '@/lib/symbols'

const AV_API_KEY = process.env.NEXT_ALPHAVANTAGE_API_KEY
const AV_BASE = 'https://www.alphavantage.co/query'

const SECTOR_MAP: Record<string, string> = {
  Technology: '情報技術',
  'Information Technology': '情報技術',
  'Consumer Cyclical': '一般消費財',
  'Consumer Discretionary': '一般消費財',
  'Consumer Defensive': '生活必需品',
  'Consumer Staples': '生活必需品',
  Healthcare: 'ヘルスケア',
  'Health Care': 'ヘルスケア',
  'Financial Services': '金融',
  Financials: '金融',
  Industrials: '資本財',
  'Basic Materials': '素材',
  Materials: '素材',
  Energy: 'エネルギー',
  Utilities: '公益事業',
  'Communication Services': '通信サービス',
  'Real Estate': '不動産',
}

function detectMarket(symbol: string): 'JP' | 'US' {
  return symbol.endsWith('.T') || symbol.endsWith('.OS') ? 'JP' : 'US'
}

async function fetchStockInfoAV(symbol: string): Promise<Record<string, unknown> | null> {
  if (!AV_API_KEY) return null
  try {
    // Fetch OVERVIEW and GLOBAL_QUOTE in parallel
    const [overviewRes, quoteRes] = await Promise.all([
      fetch(`${AV_BASE}?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${AV_API_KEY}`, {
        cache: 'no-store',
      }),
      fetch(`${AV_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${AV_API_KEY}`, {
        cache: 'no-store',
      }),
    ])

    if (!overviewRes.ok || !quoteRes.ok) return null

    const [overview, quoteData] = await Promise.all([overviewRes.json(), quoteRes.json()])

    // Rate limit check
    if (overview['Note'] || overview['Information']) {
      console.warn('Alpha Vantage rate limit:', overview['Note'] ?? overview['Information'])
      return null
    }

    // OVERVIEW returns empty object for unknown symbols
    if (!overview['Symbol']) return null

    const priceStr = quoteData['Global Quote']?.['05. price']
    const currentPrice = priceStr ? parseFloat(priceStr) : null

    const englishSector: string = overview['Sector'] ?? ''
    const sector = SECTOR_MAP[englishSector] ?? 'その他'
    const market = detectMarket(symbol)
    const currency = market === 'JP' ? 'JPY' : 'USD'

    const dividendPerShare = parseFloat(overview['DividendPerShare'] ?? '0') || 0

    return {
      name: overview['Name'] ?? symbol,
      market,
      sector,
      currentPrice,
      annualDividend: dividendPerShare,
      currency,
    }
  } catch (e) {
    console.error('Alpha Vantage stockinfo error:', e)
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.trim().toUpperCase() ?? ''

  if (!symbol || !SYMBOL_RE.test(symbol)) {
    return NextResponse.json({ error: 'invalid symbol' }, { status: 400 })
  }

  if (!AV_API_KEY) {
    return NextResponse.json({ error: 'NEXT_ALPHAVANTAGE_API_KEY is not set' }, { status: 503 })
  }

  const info = await fetchStockInfoAV(symbol)
  if (info) {
    return NextResponse.json(info)
  }

  return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
}

import { NextRequest, NextResponse } from 'next/server'
import { SYMBOL_RE, toTwelvedataSymbol, detectMarket } from '@/lib/symbols'

const TD_API_KEY = process.env.NEXT_TWELVEDATA_API_KEY
const TD_BASE = 'https://api.twelvedata.com'

async function fetchPricesTD(symbols: string[]): Promise<Record<string, number | null>> {
  // 日本株は Twelve Data 無料枠で非対応のため除外（null を返す）
  const usSymbols = symbols.filter((s) => detectMarket(s) === 'US')
  const jpResult = Object.fromEntries(
    symbols.filter((s) => detectMarket(s) === 'JP').map((s) => [s, null])
  )

  if (usSymbols.length === 0) return jpResult

  const tdSymbols = usSymbols.map(toTwelvedataSymbol)
  // TD シンボル → アプリ内シンボルの逆引きマップ
  const tdToOriginal = Object.fromEntries(tdSymbols.map((td, i) => [td, usSymbols[i]]))

  try {
    const url = `${TD_BASE}/price?symbol=${tdSymbols.join(',')}&apikey=${TD_API_KEY}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return { ...jpResult, ...Object.fromEntries(usSymbols.map((s) => [s, null])) }

    const data = await res.json()
    const result: Record<string, number | null> = {}

    if (usSymbols.length === 1) {
      // 単一シンボル: {"price": "150.00"} または {"code": 400, "status": "error"}
      result[usSymbols[0]] = data.price ? parseFloat(data.price) : null
    } else {
      // 複数シンボル: {"AAPL": {"price": "150.00"}, "TSLA": {"price": "200.00"}, ...}
      for (const [tdSym, entry] of Object.entries(data)) {
        const originalSym = tdToOriginal[tdSym]
        if (!originalSym) continue
        const e = entry as Record<string, unknown>
        result[originalSym] = e.price ? parseFloat(e.price as string) : null
      }
    }

    // バッチでエラーになったシンボルを null で補完
    for (const sym of usSymbols) {
      if (!(sym in result)) result[sym] = null
    }

    return { ...jpResult, ...result }
  } catch (e) {
    console.error('Twelve Data fetch error:', e)
    return { ...jpResult, ...Object.fromEntries(usSymbols.map((s) => [s, null])) }
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

  if (!TD_API_KEY) {
    return NextResponse.json(
      { error: 'NEXT_TWELVEDATA_API_KEY is not set' },
      { status: 503 }
    )
  }

  const prices = await fetchPricesTD(symbols)
  return NextResponse.json({ prices, source: 'twelvedata' })
}

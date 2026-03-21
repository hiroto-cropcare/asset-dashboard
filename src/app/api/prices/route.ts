import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import path from 'path'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get('symbols') ?? ''
  const SYMBOL_RE = /^[A-Z0-9.\-]{1,20}$/
  const symbols = symbolsParam
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0 && SYMBOL_RE.test(s))
    .slice(0, 50) // 最大50銘柄

  if (symbols.length === 0) {
    return NextResponse.json({ prices: {}, source: 'mock' })
  }

  const scriptPath = path.join(process.cwd(), 'scripts', 'fetch_prices.py')

  try {
    const prices = await new Promise<Record<string, number | null>>(
      (resolve, reject) => {
        execFile(
          'python3',
          [scriptPath, ...symbols],
          { timeout: 30000 },
          (error, stdout, stderr) => {
            if (error) {
              reject(error)
              return
            }
            try {
              const result = JSON.parse(stdout.trim())
              resolve(result)
            } catch {
              console.error('Failed to parse Python output:', stdout, stderr)
              reject(new Error('Failed to parse price data'))
            }
          }
        )
      }
    )

    return NextResponse.json({ prices, source: 'yfinance' })
  } catch {
    // Python unavailable or errored — return all null with mock source
    const nullPrices: Record<string, null> = {}
    for (const sym of symbols) {
      nullPrices[sym] = null
    }
    return NextResponse.json({ prices: nullPrices, source: 'mock' })
  }
}

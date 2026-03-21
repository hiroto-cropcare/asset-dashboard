import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import path from 'path'

const SYMBOL_RE = /^[A-Z0-9.\-]{1,20}$/

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.trim().toUpperCase() ?? ''

  if (!symbol || !SYMBOL_RE.test(symbol)) {
    return NextResponse.json({ error: 'invalid symbol' }, { status: 400 })
  }

  const scriptPath = path.join(process.cwd(), 'scripts', 'fetch_stock_info.py')

  try {
    const info = await new Promise<Record<string, unknown>>((resolve, reject) => {
      execFile(
        'python3',
        [scriptPath, symbol],
        { timeout: 15000 },
        (error, stdout, stderr) => {
          if (error) {
            console.error('fetch_stock_info error:', stderr)
            reject(error)
            return
          }
          try {
            resolve(JSON.parse(stdout.trim()))
          } catch {
            console.error('Failed to parse stock info output:', stdout)
            reject(new Error('Failed to parse response'))
          }
        }
      )
    })

    if ('error' in info) {
      return NextResponse.json({ error: info.error }, { status: 404 })
    }

    return NextResponse.json(info)
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}

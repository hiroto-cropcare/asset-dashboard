/** ティッカーシンボルのバリデーション正規表現（最大20文字の英数字・ドット・ハイフン） */
export const SYMBOL_RE = /^[A-Z0-9.\-]{1,20}$/

/** アプリ内シンボル（Yahoo Finance 形式）を Twelve Data 形式に変換する */
export function toTwelvedataSymbol(symbol: string): string {
  if (symbol.endsWith('.T')) return symbol.slice(0, -2)   // 7203.T  → 7203
  if (symbol.endsWith('.OS')) return symbol.slice(0, -3)  // 7203.OS → 7203
  return symbol
}

/** シンボルの市場を判定する */
export function detectMarket(symbol: string): 'JP' | 'US' {
  return symbol.endsWith('.T') || symbol.endsWith('.OS') ? 'JP' : 'US'
}

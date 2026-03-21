import type {
  PortfolioData,
  DashboardSummary,
  Alert,
  StockHolding,
  CryptoHolding,
} from '@/types'

export const USD_JPY = 155

function toJPY(amount: number, currency: 'JPY' | 'USD'): number {
  return currency === 'USD' ? amount * USD_JPY : amount
}

function calcStockAlerts(stock: StockHolding): Alert[] {
  const alerts: Alert[] = []
  if (stock.currentPrice === null) return alerts

  const dropPct = ((stock.buyPrice - stock.currentPrice) / stock.buyPrice) * 100

  if (dropPct >= stock.alertDropPct * 1.5) {
    alerts.push({
      id: `drop-danger-${stock.id}`,
      assetId: stock.id,
      assetName: stock.name,
      type: 'drop',
      message: `${stock.name}(${stock.code}) が買値から ${dropPct.toFixed(1)}% 下落しています`,
      severity: 'danger',
    })
  } else if (dropPct >= stock.alertDropPct) {
    alerts.push({
      id: `drop-warning-${stock.id}`,
      assetId: stock.id,
      assetName: stock.name,
      type: 'drop',
      message: `${stock.name}(${stock.code}) が買値から ${dropPct.toFixed(1)}% 下落しています`,
      severity: 'warning',
    })
  }

  if (stock.annualDividend > 0) {
    const yieldPct = (stock.annualDividend / stock.currentPrice) * 100
    if (yieldPct < stock.alertYieldBelow) {
      alerts.push({
        id: `yield-${stock.id}`,
        assetId: stock.id,
        assetName: stock.name,
        type: 'yield',
        message: `${stock.name}(${stock.code}) の配当利回りが ${yieldPct.toFixed(2)}% (閾値: ${stock.alertYieldBelow}%) を下回っています`,
        severity: 'warning',
      })
    }
  }

  return alerts
}

function calcCryptoAlerts(crypto: CryptoHolding): Alert[] {
  const alerts: Alert[] = []
  if (crypto.currentPrice === null) return alerts

  const dropPct = ((crypto.buyPrice - crypto.currentPrice) / crypto.buyPrice) * 100

  if (dropPct >= crypto.alertDropPct) {
    alerts.push({
      id: `crypto-drop-${crypto.id}`,
      assetId: crypto.id,
      assetName: crypto.name,
      type: 'drop',
      message: `${crypto.name}(${crypto.symbol}) が買値から ${dropPct.toFixed(1)}% 下落しています`,
      severity: 'danger',
    })
  }

  return alerts
}

export function calcSummary(data: PortfolioData): DashboardSummary {
  const alerts: Alert[] = []

  // --- Stock totals ---
  let stockTotal = 0
  let stockCost = 0
  const bySector: Record<string, number> = {}

  for (const s of data.stocks) {
    const price = s.currentPrice ?? s.buyPrice
    const valueJPY =
      s.market === 'US' ? price * s.shares * USD_JPY : price * s.shares
    const costJPY =
      s.market === 'US'
        ? s.buyPrice * s.shares * USD_JPY
        : s.buyPrice * s.shares
    stockTotal += valueJPY
    stockCost += costJPY
    const sectorKey = s.sector || 'その他'
    bySector[sectorKey] = (bySector[sectorKey] ?? 0) + valueJPY
    alerts.push(...calcStockAlerts(s))
  }

  // --- Cash totals ---
  let cashTotal = 0
  for (const c of data.cash) {
    cashTotal += toJPY(c.amount, c.currency)
  }

  // --- Real estate totals ---
  let realestateTotal = 0
  for (const r of data.realestate) {
    realestateTotal += r.currentValue - (r.mortgageBalance ?? 0)
  }

  // --- Crypto totals ---
  let cryptoTotal = 0
  let cryptoCost = 0

  for (const cr of data.cryptos) {
    const price = cr.currentPrice ?? cr.buyPrice
    cryptoTotal += price * cr.amount
    cryptoCost += cr.buyPrice * cr.amount
    alerts.push(...calcCryptoAlerts(cr))
  }

  const totalJPY = stockTotal + cashTotal + realestateTotal + cryptoTotal
  const totalCost = stockCost + cashTotal + realestateTotal + cryptoCost
  const totalPnL = (stockTotal - stockCost) + (cryptoTotal - cryptoCost)
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

  return {
    totalJPY,
    bySector,
    byCategory: {
      stock: stockTotal,
      cash: cashTotal,
      realestate: realestateTotal,
      crypto: cryptoTotal,
    },
    totalPnL,
    totalPnLPct,
    alerts,
    lastUpdated: new Date().toISOString(),
  }
}

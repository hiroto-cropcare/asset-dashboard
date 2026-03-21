export interface StockHolding {
  id: string
  category: 'stock'
  code: string
  name: string
  market: 'JP' | 'US'
  shares: number
  buyPrice: number
  currentPrice: number | null
  annualDividend: number
  alertDropPct: number
  alertYieldBelow: number
  sector?: string
  lastUpdated?: string
}

export interface CashHolding {
  id: string
  category: 'cash'
  name: string
  amount: number
  currency: 'JPY' | 'USD'
  institution?: string
  annualRate?: number
  note?: string
}

export interface RealEstateHolding {
  id: string
  category: 'realestate'
  name: string
  location: string
  purchasePrice: number
  currentValue: number
  monthlyRent?: number
  mortgageBalance?: number
  note?: string
}

export interface CryptoHolding {
  id: string
  category: 'crypto'
  symbol: string
  name: string
  amount: number
  buyPrice: number
  currentPrice: number | null
  alertDropPct: number
}

export interface Alert {
  id: string
  assetId: string
  assetName: string
  type: 'drop' | 'yield' | 'info'
  message: string
  severity: 'warning' | 'danger'
}

export interface DashboardSummary {
  totalJPY: number
  byCategory: {
    stock: number
    cash: number
    realestate: number
    crypto: number
  }
  totalPnL: number
  totalPnLPct: number
  bySector: Record<string, number>
  alerts: Alert[]
  lastUpdated: string
}

export interface PortfolioData {
  stocks: StockHolding[]
  cash: CashHolding[]
  realestate: RealEstateHolding[]
  cryptos: CryptoHolding[]
}

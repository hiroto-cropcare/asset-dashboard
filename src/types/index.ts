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

export interface BondHolding {
  id: string
  category: 'bond'
  name: string           // 銘柄名
  issuer: string         // 発行体
  bondType: '国債' | '社債' | '外債' | 'ETF'
  faceValue: number      // 額面金額（円）
  quantity: number       // 保有口数
  couponRate: number     // 表面利率（%）
  purchasePrice: number  // 購入価格（額面100円当たり）
  currentPrice: number   // 現在価格（額面100円当たり、手動入力）
  maturityDate: string   // 満期日 YYYY-MM-DD
  currency: 'JPY' | 'USD'
  note?: string
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

export interface DividendRecord {
  id: string
  stockCode: string
  stockName: string
  receivedDate: string   // YYYY-MM-DD
  amountPerShare: number // 1株あたり配当金
  shares: number
  totalAmount: number    // 合計受取額
  currency: 'JPY' | 'USD'
  note?: string
}

export interface PortfolioData {
  stocks: StockHolding[]
  bonds: BondHolding[]
  cash: CashHolding[]
  realestate: RealEstateHolding[]
  cryptos: CryptoHolding[]
  dividends: DividendRecord[]
}

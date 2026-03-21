import sys
import json
import yfinance as yf

SECTOR_MAP = {
    'Technology':             '情報技術',
    'Consumer Cyclical':      '一般消費財',
    'Consumer Defensive':     '生活必需品',
    'Healthcare':             'ヘルスケア',
    'Financial Services':     '金融',
    'Industrials':            '資本財',
    'Basic Materials':        '素材',
    'Energy':                 'エネルギー',
    'Utilities':              '公益事業',
    'Communication Services': '通信サービス',
    'Real Estate':            '不動産',
}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'symbol required'}))
        return

    symbol = sys.argv[1]
    try:
        t = yf.Ticker(symbol)
        info = t.info

        exchange = info.get('exchange', '')
        market = 'JP' if exchange in ('TYO', 'JPX', 'OSA', 'JNB') else 'US'

        sector_en = info.get('sector', '')
        sector = SECTOR_MAP.get(sector_en) if sector_en else None

        price = (
            info.get('currentPrice')
            or info.get('regularMarketPrice')
            or info.get('previousClose')
        )

        name = info.get('longName') or info.get('shortName') or symbol
        dividend = info.get('dividendRate') or 0

        result = {
            'name': name,
            'market': market,
            'sector': sector,
            'currentPrice': float(price) if price is not None else None,
            'annualDividend': float(dividend),
            'currency': info.get('currency', 'JPY'),
        }
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({'error': str(e)}))

if __name__ == '__main__':
    main()

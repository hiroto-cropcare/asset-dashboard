import sys, json
import yfinance as yf

symbols = sys.argv[1:]
result = {}
for s in symbols:
    try:
        t = yf.Ticker(s)
        info = t.info
        price = (
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or info.get("previousClose")
        )
        result[s] = float(price) if price is not None else None
    except Exception:
        result[s] = None

print(json.dumps(result))

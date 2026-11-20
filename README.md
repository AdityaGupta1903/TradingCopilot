# TradingCopilot

A local-first trading dashboard and simulation workspace focused on a 5 EMA strategy. The project includes a TypeScript backend for market-data access and strategy execution, and a React + TypeScript frontend for charting and testing.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment template:
   ```bash
   cp .env.example .env
   ```
3. Start the backend:
   ```bash
   npm run backend:dev
   ```
4. Start the frontend:
   ```bash
   npm run frontend:dev
   ```

The frontend uses `http://localhost:4000/api` by default.

## Features

- Symbol lookup and market loading for multiple timeframes
- Historical candle downloads from a free public market-data provider
- Live polling updates for the active symbol/timeframe
- 5 EMA strategy backtesting and forward-test simulation
- Provider abstraction for swapping in a different data source later

## Notes

- Live market access uses actual public OKX endpoints by default, including the `XAU-USDT-SWAP` instrument. Set `MARKET_DATA_PROVIDER=binance` to use Binance instead.
- Demo mode exists only if explicitly enabled in the backend configuration; it is not the default path for critical functions.
- No Azure deployment is performed in this repository.

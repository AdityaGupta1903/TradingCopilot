# Integration hand-off artifact

## Backend
- Project folder: services/backend
- Run command: npm --prefix services/backend run dev
- Build command: npm --prefix services/backend run build
- Health endpoint: http://localhost:4000/api/health
- API base: http://localhost:4000/api

## Frontend
- Project folder: services/frontend
- Build command: npm --prefix services/frontend run build
- Dev command: npm --prefix services/frontend run dev
- API seam: services/frontend/src/api/client.ts
- Remove mock path only if replacing with a different live provider: none required by default

## API routes
- GET /api/health
- GET /api/market/symbols
- GET /api/market/candles
- GET /api/market/quote
- POST /api/simulation/backtest
- POST /api/simulation/forward-test

## Database
- Type: none required for this local-first scaffold
- Migration tool: not applicable
- Connection env vars: not applicable
- Seed data requirement: none

## Shared types
- Shared contract is local to backend and frontend but can be moved to a package later

## Services
- Data provider: Binance public endpoints
- Strategy engine: 5 EMA trend-breakout simulation
- UI: responsive React dashboard
- Essential: market loading, strategy engine, charting
- Enhancement: provider abstraction and Azure-ready configuration

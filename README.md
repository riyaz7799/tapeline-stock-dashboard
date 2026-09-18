# Tapeline - Real-Time Stock Ticker Dashboard

A resilient, real-time stock ticker dashboard built with React, TypeScript, and TanStack Query.
Ships with a built-in realistic mock market feed (random-walk prices + simulated rate-limit
failures) so the app, including the circuit breaker, works fully offline with zero API keys.
Swap in a real provider (Finnhub, Alpha Vantage, Twelve Data) at any time via .env.

## Features

- 5 default tickers (AAPL, GOOG, MSFT, AMZN, TSLA) polling every 10s via TanStack Query
- Add/remove tickers, with a 500ms debounced input
- Per-card loading and error states, one ticker failing never affects the others
- Global loading skeleton and global unreachable banner
- Client-side circuit breaker (CLOSED to OPEN to HALF_OPEN) shared across all API calls,
  with a live status banner
- Responsive line chart per card (Recharts)
- Keyboard-accessible, visible focus states throughout
- Jest unit tests for the debounce and circuit breaker utilities
- Multi-stage Docker build (Vite to Nginx) plus docker-compose

## Getting started

    npm install
    npm run dev

Then open http://localhost:5173. No .env setup needed, it runs on the mock feed out of the box.
To use a real API, fill in VITE_STOCK_API_BASE_URL and VITE_STOCK_API_KEY in .env.

## Testing

    npm test

## Docker

    docker compose up --build

Then open http://localhost:8080. Pass real API credentials as build args by exporting
VITE_STOCK_API_BASE_URL and VITE_STOCK_API_KEY in your shell before building, since Vite
bakes env vars in at build time, not runtime.

## Project structure

    src/api/stockService.ts     circuit-breaker-wrapped fetcher (real or mock)
    src/api/mockStockApi.ts     realistic mock feed with simulated failures
    src/components/StockDashboard.tsx   orchestrator: ticker list, global states
    src/components/StockCard.tsx        per-ticker query, price, chart
    src/components/AddTickerForm.tsx    debounced add-ticker input
    src/components/CircuitStatus.tsx    circuit breaker status banner
    src/components/Chart.tsx            responsive trend chart
    src/utils/debounce.ts
    src/utils/circuitBreaker.ts
    tests/debounce.test.ts
    tests/circuitBreaker.test.ts

## Tuning the demo

VITE_MOCK_FAILURE_RATE (default 0.18) controls how often the mock feed simulates a failed
request. Raise it, e.g. 0.5, in .env to trip the circuit breaker faster for a demo.

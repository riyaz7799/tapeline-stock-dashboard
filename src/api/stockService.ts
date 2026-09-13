import { createCircuitBreaker, CircuitState } from '../utils/circuitBreaker';
import { fetchMockQuote, type StockQuote } from './mockStockApi';

export type { StockQuote };
export { CircuitState };

const API_KEY = import.meta.env.VITE_STOCK_API_KEY as string | undefined;
const BASE_URL = import.meta.env.VITE_STOCK_API_BASE_URL as string | undefined;
const USE_REAL_API = Boolean(API_KEY && BASE_URL);

// Finnhub's /quote payload shape: c=current, d=change, dp=percent change,
// h/l/o/pc = high/low/open/previous close, t=unix timestamp.
interface FinnhubQuote {
  c: number;
  d: number | null;
  dp: number | null;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

// Finnhub's free tier does not include the /stock/candle endpoint (it
// returns 403 for US equities), so there is no historical series to fetch.
// Instead we build a short rolling history client-side out of successive
// 10s polls, per symbol, so the chart still has something to draw.
const realHistory = new Map<string, { t: number; price: number }[]>();

function appendHistory(symbol: string, price: number) {
  const series = realHistory.get(symbol) ?? [];
  const next = [...series.slice(-29), { t: Date.now(), price }];
  realHistory.set(symbol, next);
  return next;
}

async function fetchStockDataRaw(symbol: string): Promise<StockQuote> {
  if (!USE_REAL_API) {
    // No API credentials configured: fall back to a realistic mock feed so
    // the dashboard (and its resilience patterns) can be demoed end to end.
    return fetchMockQuote(symbol);
  }

  const response = await fetch(`${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const raw = (await response.json()) as FinnhubQuote;

  if (raw.c === undefined || raw.c === null) {
    throw new Error(`No data returned for ${symbol}`);
  }

  return {
    symbol,
    price: raw.c,
    change: raw.d ?? 0,
    changePercent: raw.dp ?? 0,
    historical: appendHistory(symbol, raw.c),
  };
}

type StateListener = (state: CircuitState) => void;
const listeners = new Set<StateListener>();

export function subscribeToCircuitState(listener: StateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Singleton circuit breaker shared by every ticker so the whole app reacts
// consistently to upstream health (matches "wrap all outgoing API calls").
export const fetchStockData = createCircuitBreaker(fetchStockDataRaw, {
  failureThreshold: 3,
  resetTimeoutMs: 30000,
  onStateChange: (state) => listeners.forEach((l) => l(state)),
});

export function getCircuitState(): CircuitState {
  return (fetchStockData as unknown as { getState: () => CircuitState }).getState();
}

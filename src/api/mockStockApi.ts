export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  historical: { t: number; price: number }[];
}

interface SymbolState {
  price: number;
  openPrice: number;
  historical: { t: number; price: number }[];
}

const SEED_PRICES: Record<string, number> = {
  AAPL: 228.5,
  GOOG: 178.2,
  MSFT: 421.3,
  AMZN: 186.4,
  TSLA: 254.1,
};

const symbolStates = new Map<string, SymbolState>();

function getOrInitState(symbol: string): SymbolState {
  let s = symbolStates.get(symbol);
  if (!s) {
    const base = SEED_PRICES[symbol] ?? 50 + Math.random() * 450;
    const historical = Array.from({ length: 20 }, (_, i) => ({
      t: Date.now() - (20 - i) * 60_000,
      price: Number((base * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)),
    }));
    s = { price: base, openPrice: base, historical };
    symbolStates.set(symbol, s);
  }
  return s;
}

// Failure simulation: mimics a flaky free-tier API (rate limiting / outages)
// so the circuit breaker has real conditions to react to. Toggle off by
// setting VITE_MOCK_FAILURE_RATE=0 in .env.
const FAILURE_RATE = Number(import.meta.env.VITE_MOCK_FAILURE_RATE ?? 0.18);

function randomLatency() {
  return 150 + Math.random() * 350;
}

/**
 * Simulates a third-party stock quote endpoint. Produces a random-walk
 * price series per symbol and randomly throws to emulate rate limiting
 * or upstream outages, exercising the circuit breaker in realistic ways.
 */
export function fetchMockQuote(symbol: string): Promise<StockQuote> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < FAILURE_RATE) {
        reject(new Error('Upstream rate limit exceeded (429)'));
        return;
      }

      const state = getOrInitState(symbol);
      const drift = (Math.random() - 0.5) * (state.price * 0.006);
      state.price = Math.max(0.5, Number((state.price + drift).toFixed(2)));
      state.historical = [...state.historical.slice(-29), { t: Date.now(), price: state.price }];

      const change = Number((state.price - state.openPrice).toFixed(2));
      const changePercent = Number(((change / state.openPrice) * 100).toFixed(2));

      resolve({
        symbol,
        price: state.price,
        change,
        changePercent,
        historical: state.historical,
      });
    }, randomLatency());
  });
}

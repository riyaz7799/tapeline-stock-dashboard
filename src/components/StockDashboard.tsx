import { useEffect, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import StockCard from './StockCard';
import AddTickerForm, { type TrackedTicker } from './AddTickerForm';
import CircuitStatus from './CircuitStatus';
import { fetchStockData, getCircuitState, subscribeToCircuitState } from '../api/stockService';
import { CircuitState } from '../utils/circuitBreaker';
import { getCompanyName } from '../utils/companyNames';

const DEFAULT_TICKERS: TrackedTicker[] = ['AAPL', 'GOOG', 'MSFT', 'AMZN', 'TSLA'].map((symbol) => ({
  symbol,
  name: getCompanyName(symbol),
}));

const STORAGE_KEY = 'tapeline:tickers';

function loadStoredTickers(): TrackedTicker[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TICKERS;
    const parsed = JSON.parse(raw) as TrackedTicker[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TICKERS;
  } catch {
    return DEFAULT_TICKERS;
  }
}

export default function StockDashboard() {
  const [tickers, setTickers] = useState<TrackedTicker[]>(() => loadStoredTickers());
  const [circuitState, setCircuitState] = useState<CircuitState>(getCircuitState());

  useEffect(() => subscribeToCircuitState(setCircuitState), []);

  // Persist whatever the user is tracking, so tickers they add survive a
  // refresh or restart instead of resetting to the 5 defaults every time.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickers));
    } catch {
      // Storage unavailable (private browsing, quota) — fail silently,
      // the dashboard still works for the current session.
    }
  }, [tickers]);

  const symbols = tickers.map((t) => t.symbol);

  // Mirrors each StockCard's own useQuery (same queryKey => shared cache,
  // no duplicate network traffic) purely to derive dashboard-wide state.
  const queries = useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: ['stock', symbol],
      queryFn: () => fetchStockData(symbol),
      refetchInterval: 10000,
    })),
  });

  const allLoading = tickers.length > 0 && queries.every((q) => q.isLoading);
  const allErrored = tickers.length > 0 && queries.length > 0 && queries.every((q) => q.isError);

  const handleAdd = (ticker: TrackedTicker) => {
    setTickers((prev) => (prev.some((t) => t.symbol === ticker.symbol) ? prev : [...prev, ticker]));
  };

  const handleRemove = (symbol: string) => {
    setTickers((prev) => prev.filter((t) => t.symbol !== symbol));
  };

  const handleReset = () => setTickers(DEFAULT_TICKERS);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-ink-600 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-blue/15 text-signal-blue">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M2 13L6.5 8.5L9.5 11.5L16 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M11.5 5H16V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-mist-100">Tapeline</h1>
            <p className="text-xs text-mist-500">Live market ticker dashboard</p>
          </div>
        </div>
        <CircuitStatus state={circuitState} />
      </header>

      <section className="mt-6" aria-label="Add a new ticker">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <AddTickerForm existingSymbols={symbols} onAdd={handleAdd} />
          <button
            type="button"
            onClick={handleReset}
            className="self-start text-xs text-mist-500 underline decoration-ink-500 underline-offset-4 hover:text-mist-300"
          >
            Reset to defaults
          </button>
        </div>
      </section>

      <section className="mt-8" aria-label="Tracked stock tickers">
        {allErrored && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-signal-red/30 bg-signal-red/10 p-4 text-sm text-signal-red"
          >
            Every tracked ticker is currently unreachable. Check your connection — the dashboard will
            recover automatically once the market data feed responds again.
          </div>
        )}

        {allLoading ? (
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Loading dashboard"
            aria-live="polite"
          >
            {tickers.map((t) => (
              <div key={t.symbol} className="h-48 animate-pulse rounded-xl border border-ink-600 bg-ink-800/60" />
            ))}
          </div>
        ) : tickers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-600 p-10 text-center text-sm text-mist-500">
            No tickers tracked yet. Search above to start streaming quotes.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tickers.map((t) => (
              <StockCard key={t.symbol} symbol={t.symbol} name={t.name} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

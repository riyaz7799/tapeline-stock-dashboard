import { useQuery } from '@tanstack/react-query';
import { fetchStockData } from '../api/stockService';
import { getCompanyName } from '../utils/companyNames';
import Chart from './Chart';

interface StockCardProps {
  symbol: string;
  name?: string;
  onRemove: (symbol: string) => void;
}

function formatCurrency(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return 'N/A';
  return `$${value.toFixed(2)}`;
}

function formatChange(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

function formatPercent(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export default function StockCard({ symbol, name, onRemove }: StockCardProps) {
  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => fetchStockData(symbol),
    refetchInterval: 10000,
  });

  const isPositive = (data?.change ?? 0) >= 0;
  const displayName = name ?? getCompanyName(symbol);

  return (
    <article
      aria-label={`Stock data for ${symbol}`}
      className="group relative flex flex-col rounded-xl border border-ink-600 bg-ink-800/80 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition-colors hover:border-ink-500"
    >
      <header className="flex items-start justify-between">
        <div className="min-w-0">
          <h2 className="font-mono text-lg font-semibold tracking-tight text-mist-100">{symbol}</h2>
          {displayName && (
            <p className="truncate text-xs text-mist-300" title={displayName}>
              {displayName}
            </p>
          )}
          <p className="mt-0.5 text-xs text-mist-500">
            {dataUpdatedAt ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}` : 'Awaiting first tick'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(symbol)}
          aria-label={`Remove ${symbol} from dashboard`}
          className="rounded-md p-1.5 text-mist-500 transition-colors hover:bg-ink-700 hover:text-signal-red"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {isLoading && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <div className="h-8 w-24 animate-pulse rounded bg-ink-700" />
          <div className="h-20 w-full animate-pulse rounded bg-ink-700" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3" role="alert">
          <p className="text-sm font-medium text-signal-red">Couldn&apos;t load {symbol}</p>
          <p className="mt-1 text-xs text-mist-500">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {data && !isLoading && (
        <>
          <div className="mt-3 flex items-baseline gap-2 tabular">
            <span className="font-mono text-3xl font-semibold text-mist-100">
              {formatCurrency(data.price)}
            </span>
            <span
              className={`font-mono text-sm font-medium ${
                isPositive ? 'text-signal-green' : 'text-signal-red'
              }`}
            >
              {formatChange(data.change)} ({formatPercent(data.changePercent)})
            </span>
          </div>
          <div className="mt-4">
            <Chart data={data.historical} positive={isPositive} />
          </div>
        </>
      )}
    </article>
  );
}

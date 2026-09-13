import { useEffect, useRef, useState } from 'react';
import { debounce } from '../utils/debounce';
import { searchSymbols, type SymbolResult } from '../api/stockSearch';

export interface TrackedTicker {
  symbol: string;
  name?: string;
}

interface AddTickerFormProps {
  existingSymbols: string[];
  onAdd: (ticker: TrackedTicker) => void;
}

export default function AddTickerForm({ existingSymbols, onAdd }: AddTickerFormProps) {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<SymbolResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState('');
  const requestIdRef = useRef(0);

  // Always holds the latest prop, so the debounced search below never
  // filters against a stale ticker list from an earlier render.
  const existingSymbolsRef = useRef(existingSymbols);
  existingSymbolsRef.current = existingSymbols;

  const runSearch = async (raw: string) => {
    const query = raw.trim();
    if (!query) {
      setResults([]);
      setFeedback('');
      setIsSearching(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsSearching(true);
    try {
      const matches = await searchSymbols(query);
      if (requestId !== requestIdRef.current) return; // stale response, ignore
      const filtered = matches.filter(
        (m) => !existingSymbolsRef.current.includes(m.symbol.toUpperCase())
      );
      setResults(filtered);
      setFeedback(filtered.length === 0 ? `No worldwide matches for "${query}"` : '');
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setResults([]);
      setFeedback(err instanceof Error ? err.message : 'Search failed — try again');
    } finally {
      if (requestId === requestIdRef.current) setIsSearching(false);
    }
  };

  // 500ms debounce: the search (and any resulting API evaluation) only
  // fires once the user has paused typing, as required.
  const debouncedRef = useRef(debounce(runSearch, 500));

  useEffect(() => {
    const d = debouncedRef.current;
    return () => d.cancel();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setResults([]);
    setFeedback('');
    debouncedRef.current(value);
  };

  const handleSelect = (result: SymbolResult) => {
    onAdd({ symbol: result.symbol.toUpperCase(), name: result.name });
    setInputValue('');
    setResults([]);
    setFeedback('');
  };

  return (
    <div className="relative">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            placeholder="Search worldwide, e.g. Netflix or NFLX"
            aria-label="Search for a stock by name or ticker symbol"
            className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3.5 py-2.5 font-mono text-sm text-mist-100 placeholder:font-sans placeholder:text-mist-500"
          />
        </div>
        <p className="min-h-[1.25rem] text-xs text-mist-500" aria-live="polite">
          {isSearching ? 'Searching…' : feedback}
        </p>
      </div>

      {results.length > 0 && (
        <ul
          role="listbox"
          aria-label="Matching stocks"
          className="absolute z-10 mt-2 w-full max-w-sm overflow-hidden rounded-lg border border-ink-600 bg-ink-800 shadow-xl"
        >
          {results.map((r) => (
            <li key={r.symbol}>
              <button
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => handleSelect(r)}
                className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-ink-700"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-mist-100">{r.name}</span>
                  <span className="block font-mono text-xs text-mist-500">{r.symbol}</span>
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0 text-signal-blue">
                  <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

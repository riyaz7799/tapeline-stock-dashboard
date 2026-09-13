import { COMPANY_NAMES } from '../utils/companyNames';

export interface SymbolResult {
  symbol: string;
  name: string;
  exchange?: string;
}

const API_KEY = import.meta.env.VITE_STOCK_API_KEY as string | undefined;
const BASE_URL = import.meta.env.VITE_STOCK_API_BASE_URL as string | undefined;
const USE_REAL_API = Boolean(API_KEY && BASE_URL);

interface FinnhubSearchResult {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
}

interface FinnhubSearchResponse {
  count: number;
  result: FinnhubSearchResult[];
}

/**
 * Looks up matching ticker symbols worldwide by company name or symbol
 * fragment. Finnhub's /search endpoint covers every exchange it supports
 * (not just US), returning both the symbol and the full company name.
 */
export async function searchSymbols(query: string): Promise<SymbolResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (!USE_REAL_API) {
    // Mock fallback: fuzzy-match against a small built-in company list so
    // the search box is still usable without an API key.
    const upper = trimmed.toUpperCase();
    return Object.entries(COMPANY_NAMES)
      .filter(([symbol, name]) => symbol.includes(upper) || name.toUpperCase().includes(upper))
      .slice(0, 8)
      .map(([symbol, name]) => ({ symbol, name }));
  }

  const response = await fetch(
    `${BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${API_KEY}`
  );
  if (!response.ok) {
    throw new Error(`Symbol search failed: ${response.status}`);
  }
  const data = (await response.json()) as FinnhubSearchResponse;

  return (data.result ?? [])
    .filter((r) => r.type === 'Common Stock' || r.type === 'ADR' || r.type === 'REIT')
    .slice(0, 10)
    .map((r) => ({
      symbol: r.displaySymbol || r.symbol,
      name: r.description,
    }));
}

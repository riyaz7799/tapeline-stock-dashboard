// Finnhub's /quote endpoint returns only numbers, no company name (that
// lives behind a separate /stock/profile2 call, which would burn through
// the free-tier rate limit fast if fired per card per poll). A static
// lookup covers the common tickers people actually track without any
// extra network calls.
export const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  GOOG: 'Alphabet Inc. (Class C)',
  GOOGL: 'Alphabet Inc. (Class A)',
  MSFT: 'Microsoft Corporation',
  AMZN: 'Amazon.com, Inc.',
  TSLA: 'Tesla, Inc.',
  META: 'Meta Platforms, Inc.',
  NVDA: 'NVIDIA Corporation',
  NFLX: 'Netflix, Inc.',
  AMD: 'Advanced Micro Devices, Inc.',
  INTC: 'Intel Corporation',
  DIS: 'The Walt Disney Company',
  KO: 'The Coca-Cola Company',
  PEP: 'PepsiCo, Inc.',
  NKE: 'Nike, Inc.',
  PYPL: 'PayPal Holdings, Inc.',
  UBER: 'Uber Technologies, Inc.',
  BA: 'The Boeing Company',
  JPM: 'JPMorgan Chase & Co.',
  V: 'Visa Inc.',
  MA: 'Mastercard Incorporated',
  WMT: 'Walmart Inc.',
  ORCL: 'Oracle Corporation',
  CSCO: 'Cisco Systems, Inc.',
  ADBE: 'Adobe Inc.',
  CRM: 'Salesforce, Inc.',
  IBM: 'International Business Machines Corporation',
  QCOM: 'QUALCOMM Incorporated',
  T: 'AT&T Inc.',
  SBUX: 'Starbucks Corporation',
};

export function getCompanyName(symbol: string): string | undefined {
  return COMPANY_NAMES[symbol.toUpperCase()];
}

import { TickerSearchResult } from '../models/stock-tracker.models';
import { MOCK_STOCKS } from '../data/stock-prices.generated';

export interface MockStock {
  symbol: string;
  shortname: string;
  longname: string;
  exchange: string;
  /** Adj. Close prices by year (keyed by year number) */
  priceHistory: Record<number, number>;
  currentPrice: number;
}

export {
  MOCK_STOCKS,
  REFRESHED_AT,
  REFRESHED_AT_DISPLAY,
} from '../data/stock-prices.generated';

/** Search mock stocks by name or ticker */
export function mockSearchTickers(query: string): TickerSearchResult[] {
  const q = query.toLowerCase();
  return MOCK_STOCKS
    .filter(s =>
      s.symbol.toLowerCase().includes(q) ||
      s.shortname.toLowerCase().includes(q) ||
      s.longname.toLowerCase().includes(q)
    )
    .slice(0, 6)
    .map(s => ({
      symbol: s.symbol,
      shortname: s.shortname,
      longname: s.longname,
      exchange: s.exchange,
      quoteType: 'EQUITY',
    }));
}

/** Get mock price on a given date */
export function mockGetPriceOnDate(ticker: string, targetDate: Date): {
  ticker: string;
  companyName: string;
  adjClose: number;
  dateUsed: Date;
} | null {
  const stock = MOCK_STOCKS.find(s => s.symbol === ticker);
  if (!stock) return null;

  const year = targetDate.getFullYear();
  const price = stock.priceHistory[year];
  if (price === undefined) return null;

  // Simulate nearest trading day (back up from weekends)
  const dateUsed = new Date(targetDate);
  while (dateUsed.getDay() === 0 || dateUsed.getDay() === 6) {
    dateUsed.setDate(dateUsed.getDate() - 1);
  }

  return {
    ticker: stock.symbol,
    companyName: stock.shortname,
    adjClose: price,
    dateUsed,
  };
}

/** Generate mock annual data for a stock */
export function mockGetAnnualPrices(
  ticker: string,
  birthdayMonth: number,
  birthdayDay: number,
  startYear: number,
  birthYear: number,
): { annualData: { year: number; age: number; dateUsed: Date; adjClose: number; valueOf100Shares: number; yearOverYearChange: number }[]; currentPrice: number; companyName: string } | null {
  const stock = MOCK_STOCKS.find(s => s.symbol === ticker);
  if (!stock) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const annualData: { year: number; age: number; dateUsed: Date; adjClose: number; valueOf100Shares: number; yearOverYearChange: number }[] = [];
  let previousPrice = 0;

  for (let year = startYear; year <= currentYear; year++) {
    const price = stock.priceHistory[year];
    if (price === undefined) continue;

    const targetDate = new Date(year, birthdayMonth, birthdayDay);
    if (targetDate > now) break;

    // Simulate nearest trading day
    const dateUsed = new Date(targetDate);
    while (dateUsed.getDay() === 0 || dateUsed.getDay() === 6) {
      dateUsed.setDate(dateUsed.getDate() - 1);
    }

    const yoyChange = previousPrice > 0
      ? Math.round(((price - previousPrice) / previousPrice) * 1000) / 10
      : 0;

    annualData.push({
      year,
      age: year - birthYear,
      dateUsed,
      adjClose: price,
      valueOf100Shares: Math.round(price * 100 * 100) / 100,
      yearOverYearChange: yoyChange,
    });

    previousPrice = price;
  }

  if (annualData.length === 0) return null;

  return {
    annualData,
    currentPrice: stock.currentPrice,
    companyName: stock.shortname,
  };
}

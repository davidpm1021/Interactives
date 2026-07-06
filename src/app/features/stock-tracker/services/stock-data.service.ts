import { Injectable, signal } from '@angular/core';
import { AnnualDataPoint, PriceOnDateResult, TickerSearchResult } from '../models/stock-tracker.models';
import { CalculationService } from './calculation.service';
import { mockSearchTickers, mockGetPriceOnDate, mockGetAnnualPrices } from './mock-data';

interface YahooChartResponse {
  chart: {
    result: {
      meta: {
        currency: string;
        symbol: string;
        regularMarketPrice: number;
        shortName: string;
      };
      timestamp: number[];
      indicators: {
        quote: { close: number[]; open: number[]; high: number[]; low: number[]; volume: number[] }[];
        adjclose: { adjclose: number[] }[];
      };
    }[] | null;
    error: { code: string; description: string } | null;
  };
}

interface YahooSearchResponse {
  quotes: {
    symbol: string;
    shortname: string;
    longname: string;
    exchange: string;
    quoteType: string;
  }[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CHART_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const SEARCH_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Production: Deploy the Lambda function in proxy/lambda.js to AWS,
 * then set this to the Function URL (e.g., 'https://abc123.lambda-url.us-east-1.on.aws').
 * Also set useMock = false below.
 *
 * Development: Use '/api' with the local dev proxy
 * (node src/app/features/stock-tracker/scripts/dev-proxy.js)
 */
const PROXY_URL = '/api';

@Injectable()
export class StockDataService {
  /**
   * Set to true to use mock data (no proxy needed).
   * Set to false for production with a real proxy.
   */
  useMock = true;

  private proxyBaseUrl = PROXY_URL;
  private chartCache = new Map<string, CacheEntry<YahooChartResponse>>();
  private searchCache = new Map<string, CacheEntry<TickerSearchResult[]>>();

  readonly lastError = signal<string | null>(null);

  constructor(private calcService: CalculationService) {
    if (this.useMock) {
      console.info(
        '%c[Stock Tracker] Using mock data. Set StockDataService.useMock = false and configure PROXY_URL for live data.',
        'color: #e67e22; font-weight: bold;'
      );
    }
  }

  /** Configure the proxy base URL (for environment switching) */
  setProxyUrl(url: string): void {
    this.proxyBaseUrl = url;
  }

  /** Search for tickers by company name or symbol */
  async searchTickers(query: string): Promise<TickerSearchResult[]> {
    if (!query || query.trim().length < 1) return [];

    if (this.useMock) {
      await this.delay(200); // Simulate network latency
      return mockSearchTickers(query);
    }

    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = this.getFromCache(this.searchCache, cacheKey, SEARCH_CACHE_TTL);
    if (cached) return cached;

    try {
      const url = `${this.proxyBaseUrl}/search?q=${encodeURIComponent(query)}`;
      const response = await this.fetchWithRetry(url);
      const data: YahooSearchResponse = await response.json();

      const results: TickerSearchResult[] = (data.quotes || [])
        .filter(q => q.quoteType === 'EQUITY')
        .map(q => ({
          symbol: q.symbol,
          shortname: q.shortname || '',
          longname: q.longname || q.shortname || '',
          exchange: q.exchange || '',
          quoteType: q.quoteType,
        }));

      this.searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
      this.lastError.set(null);
      return results;
    } catch (error) {
      const message = this.toUserMessage(error);
      this.lastError.set(message);
      throw new Error(message);
    }
  }

  /** Get the Adj. Close price on or nearest to a specific date */
  async getPriceOnDate(ticker: string, targetDate: Date): Promise<PriceOnDateResult> {
    if (this.useMock) {
      await this.delay(300);
      const result = mockGetPriceOnDate(ticker, targetDate);
      if (!result) {
        throw new Error(`No trading data available for ${ticker} on ${this.formatDateSimple(targetDate)}. This may mean the stock hadn't gone public yet.`);
      }
      return result;
    }

    // Fetch a 2-week window around the target date to find the nearest trading day
    const start = new Date(targetDate);
    start.setDate(start.getDate() - 10);
    const end = new Date(targetDate);
    end.setDate(end.getDate() + 3);

    const chartData = await this.fetchChart(ticker, start, end, '1d');
    const result = chartData.chart.result;

    if (!result || result.length === 0 || !result[0].timestamp?.length) {
      throw new Error(`No trading data available for ${ticker} on ${this.formatDateSimple(targetDate)}. This may mean the stock hadn't gone public yet or was temporarily delisted.`);
    }

    const entry = result[0];
    const tradingDay = this.calcService.findNearestPriorTradingDay(targetDate, entry.timestamp);
    const tradingDayUnix = Math.floor(tradingDay.getTime() / 1000);
    const index = entry.timestamp.indexOf(tradingDayUnix);

    if (index < 0 || !entry.indicators.adjclose?.[0]?.adjclose?.[index]) {
      throw new Error(`No adjusted close price available for ${ticker} near ${this.formatDateSimple(targetDate)}.`);
    }

    const adjClose = entry.indicators.adjclose[0].adjclose[index];

    return {
      ticker: entry.meta.symbol,
      companyName: entry.meta.shortName || ticker,
      adjClose: Math.round(adjClose * 100) / 100,
      dateUsed: tradingDay,
    };
  }

  /**
   * Get annual Adj. Close prices for a ticker on the student's birthday
   * each year from startYear to current year.
   * Fetches the full range in a single API call.
   */
  async getAnnualBirthdayPrices(
    ticker: string,
    birthdayMonth: number,
    birthdayDay: number,
    startYear: number,
    birthYear: number,
  ): Promise<{ annualData: AnnualDataPoint[]; currentPrice: number; companyName: string }> {
    if (this.useMock) {
      await this.delay(500 + Math.random() * 500); // Simulate variable latency
      const result = mockGetAnnualPrices(ticker, birthdayMonth, birthdayDay, startYear, birthYear);
      if (!result) {
        throw new Error(`No historical data available for ${ticker}.`);
      }
      return result;
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // Fetch full range with daily intervals
    const start = new Date(startYear, birthdayMonth, birthdayDay - 14);
    const end = new Date(currentYear, now.getMonth(), now.getDate());

    const chartData = await this.fetchChart(ticker, start, end, '1d');
    const result = chartData.chart.result;

    if (!result || result.length === 0 || !result[0].timestamp?.length) {
      throw new Error(`No historical data available for ${ticker}.`);
    }

    const entry = result[0];
    const timestamps = entry.timestamp;
    const adjCloses = entry.indicators.adjclose?.[0]?.adjclose || [];
    const companyName = entry.meta.shortName || ticker;
    const currentPrice = Math.round((entry.meta.regularMarketPrice || adjCloses[adjCloses.length - 1]) * 100) / 100;

    const annualData: AnnualDataPoint[] = [];
    let previousPrice = 0;

    for (let year = startYear; year <= currentYear; year++) {
      const targetDate = new Date(year, birthdayMonth, birthdayDay);

      // Don't include future dates
      if (targetDate > now) break;

      const tradingDay = this.calcService.findNearestPriorTradingDay(targetDate, timestamps);

      // Skip if the nearest trading day is more than 14 days from the target
      // (means no data exists for this year)
      const daysDiff = Math.abs(targetDate.getTime() - tradingDay.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 14) continue;

      const tradingDayUnix = Math.floor(tradingDay.getTime() / 1000);
      const index = timestamps.indexOf(tradingDayUnix);

      if (index < 0 || adjCloses[index] == null) continue;

      const adjClose = Math.round(adjCloses[index] * 100) / 100;
      const age = year - birthYear;
      const yoyChange = previousPrice > 0
        ? this.calcService.calculateYoYChange(previousPrice, adjClose)
        : 0;

      annualData.push({
        year,
        age,
        dateUsed: tradingDay,
        adjClose,
        valueOf100Shares: Math.round(adjClose * 100 * 100) / 100,
        yearOverYearChange: Math.round(yoyChange * 10) / 10,
      });

      previousPrice = adjClose;
    }

    if (annualData.length === 0) {
      throw new Error(`No price data found for ${ticker} in the expected date range.`);
    }

    return { annualData, currentPrice, companyName };
  }

  /** Validate that a ticker existed as a public equity on a given date */
  async validateTickerOnDate(ticker: string, date: Date): Promise<boolean> {
    try {
      await this.getPriceOnDate(ticker, date);
      return true;
    } catch {
      return false;
    }
  }

  // ── Internal helpers ──

  private async fetchChart(
    ticker: string,
    start: Date,
    end: Date,
    interval: string,
  ): Promise<YahooChartResponse> {
    const period1 = Math.floor(start.getTime() / 1000);
    const period2 = Math.floor(end.getTime() / 1000);
    const cacheKey = `chart:${ticker}:${period1}:${period2}:${interval}`;

    const cached = this.getFromCache(this.chartCache, cacheKey, CHART_CACHE_TTL);
    if (cached) return cached;

    try {
      const url = `${this.proxyBaseUrl}/chart/${encodeURIComponent(ticker)}?period1=${period1}&period2=${period2}&interval=${interval}`;
      const response = await this.fetchWithRetry(url);
      const data: YahooChartResponse = await response.json();

      if (data.chart.error) {
        throw new Error(data.chart.error.description || `Error fetching data for ${ticker}`);
      }

      this.chartCache.set(cacheKey, { data, timestamp: Date.now() });
      this.lastError.set(null);
      return data;
    } catch (error) {
      const message = this.toUserMessage(error);
      this.lastError.set(message);
      throw new Error(message);
    }
  }

  private async fetchWithRetry(url: string, retries = 1): Promise<Response> {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (error) {
      if (retries > 0 && !(error instanceof Error && error.message === 'RATE_LIMITED')) {
        await this.delay(2000);
        return this.fetchWithRetry(url, retries - 1);
      }
      throw error;
    }
  }

  private getFromCache<T>(cache: Map<string, CacheEntry<T>>, key: string, ttl: number): T | null {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < ttl) {
      return entry.data;
    }
    if (entry) cache.delete(key);
    return null;
  }

  private toUserMessage(error: unknown): string {
    if (error instanceof Error) {
      if (error.message === 'RATE_LIMITED') {
        return 'We\'ve made too many requests. Please wait a moment and try again.';
      }
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed')) {
        return 'We\'re having trouble connecting to our stock data service. Please try again in a moment.';
      }
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private formatDateSimple(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

import { describe, expect, it } from 'vitest';
import { MOCK_STOCKS, REFRESHED_AT } from './stock-prices.generated';

/**
 * Data-integrity checks for the generated stock-price dataset.
 *
 * If these start failing after a refresh, the upstream Yahoo data is
 * off (split not applied, ticker renamed, etc.) and we should not
 * ship the build. Run via:  npx ng test --no-watch
 */

const MIN_STOCKS = 200; // Sanity floor. We currently have ~516.
const MIN_YEARS_PER_STOCK = 3; // Anything less is unusable for the activity.
const MIN_YEAR = 1980;
// 50x year-over-year is the canary for unadjusted splits or Yahoo ghost data.
// Real historical events do approach this: AIG -97% in 2008-2009 = 39x, GME 2020-2021
// short squeeze = 40x. Anything above 50x is almost certainly bad data.
const MAX_YOY_MULTIPLIER = 50;

const CURRENT_YEAR = new Date().getFullYear();

const REQUIRED_TICKERS = ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'DIS', 'KO', 'WMT'];

describe('stock-prices.generated data integrity', () => {
  it('was refreshed at a parseable ISO timestamp', () => {
    expect(REFRESHED_AT).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(new Date(REFRESHED_AT).toString()).not.toBe('Invalid Date');
  });

  it(`contains at least ${MIN_STOCKS} stocks`, () => {
    expect(MOCK_STOCKS.length).toBeGreaterThanOrEqual(MIN_STOCKS);
  });

  it('has no duplicate ticker symbols', () => {
    const symbols = MOCK_STOCKS.map((s) => s.symbol);
    const unique = new Set(symbols);
    expect(unique.size).toBe(symbols.length);
  });

  it('includes the must-have well-known tickers', () => {
    const symbols = new Set(MOCK_STOCKS.map((s) => s.symbol));
    for (const req of REQUIRED_TICKERS) {
      expect(symbols.has(req), `missing required ticker ${req}`).toBe(true);
    }
  });

  describe('per-stock structural checks', () => {
    for (const stock of MOCK_STOCKS) {
      describe(stock.symbol, () => {
        it('has non-empty symbol, shortname, longname, exchange', () => {
          expect(stock.symbol).toBeTruthy();
          expect(stock.shortname).toBeTruthy();
          expect(stock.longname).toBeTruthy();
          expect(stock.exchange).toBeTruthy();
        });

        it(`has at least ${MIN_YEARS_PER_STOCK} years of price history`, () => {
          const yearCount = Object.keys(stock.priceHistory).length;
          expect(yearCount).toBeGreaterThanOrEqual(MIN_YEARS_PER_STOCK);
        });

        it(`year keys are integers in [${MIN_YEAR}, ${CURRENT_YEAR}]`, () => {
          for (const key of Object.keys(stock.priceHistory)) {
            const year = Number(key);
            expect(Number.isInteger(year)).toBe(true);
            expect(year).toBeGreaterThanOrEqual(MIN_YEAR);
            expect(year).toBeLessThanOrEqual(CURRENT_YEAR);
          }
        });

        it('all historical prices are positive finite numbers', () => {
          for (const [year, price] of Object.entries(stock.priceHistory)) {
            expect(Number.isFinite(price), `${stock.symbol} ${year}: ${price}`).toBe(true);
            expect(price, `${stock.symbol} ${year}: ${price}`).toBeGreaterThan(0);
          }
        });

        it('currentPrice is a positive finite number', () => {
          expect(Number.isFinite(stock.currentPrice)).toBe(true);
          expect(stock.currentPrice).toBeGreaterThan(0);
        });

        it(`year-over-year multiplier never exceeds ${MAX_YOY_MULTIPLIER}x (catches missing split adjustments)`, () => {
          const years = Object.keys(stock.priceHistory).map(Number).sort();
          for (let i = 1; i < years.length; i++) {
            const prev = stock.priceHistory[years[i - 1]];
            const curr = stock.priceHistory[years[i]];
            if (!prev || !curr) continue;
            const ratio = Math.max(curr / prev, prev / curr);
            expect(
              ratio,
              `${stock.symbol} ${years[i - 1]}->${years[i]}: ${prev}->${curr} (${ratio.toFixed(1)}x)`,
            ).toBeLessThanOrEqual(MAX_YOY_MULTIPLIER);
          }
        });

        it('has a price for the current or previous year (still actively traded)', () => {
          const years = Object.keys(stock.priceHistory).map(Number);
          const mostRecent = Math.max(...years);
          expect(mostRecent).toBeGreaterThanOrEqual(CURRENT_YEAR - 1);
        });
      });
    }
  });
});

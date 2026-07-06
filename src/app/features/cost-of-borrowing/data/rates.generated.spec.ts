import { RATE_SERIES, REFRESHED_AT } from './rates.generated';

/**
 * Data-integrity checks for the generated FRED rate data.
 * If these fail after a refresh, spot-check the questions in questions.ts
 * against the new values.
 */

const REQUIRED_IDS = ['credit-card', 'personal-loan', 'auto-loan', 'mortgage'];
const CURRENT_YEAR = new Date().getFullYear();

describe('rates.generated data integrity', () => {
  it('was refreshed at a parseable ISO timestamp', () => {
    expect(REFRESHED_AT).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(new Date(REFRESHED_AT).toString()).not.toBe('Invalid Date');
  });

  it('contains all required series', () => {
    const ids = new Set(RATE_SERIES.map((s) => s.id));
    for (const req of REQUIRED_IDS) {
      expect(ids.has(req), `missing series ${req}`).toBe(true);
    }
  });

  it('every series has positive current rate and 20-year average', () => {
    for (const s of RATE_SERIES) {
      expect(s.currentRate, `${s.id} currentRate`).toBeGreaterThan(0);
      expect(s.twentyYearAverage, `${s.id} twentyYearAverage`).toBeGreaterThan(0);
      expect(Number.isFinite(s.currentRate)).toBe(true);
      expect(Number.isFinite(s.twentyYearAverage)).toBe(true);
    }
  });

  it('current APRs are within a plausible range (0-40%)', () => {
    for (const s of RATE_SERIES) {
      expect(s.currentRate, `${s.id} currentRate too low`).toBeGreaterThan(0);
      expect(s.currentRate, `${s.id} currentRate too high`).toBeLessThan(40);
    }
  });

  it('history spans a reasonable window', () => {
    for (const s of RATE_SERIES) {
      expect(s.history.length, `${s.id} history length`).toBeGreaterThanOrEqual(10);
      const mostRecentYear = Math.max(...s.history.map((h) => h.year));
      // At least somewhat current (within the last 2 years)
      expect(mostRecentYear).toBeGreaterThanOrEqual(CURRENT_YEAR - 2);
    }
  });

  it('all history values are positive finite numbers under 40%', () => {
    for (const s of RATE_SERIES) {
      for (const h of s.history) {
        expect(Number.isFinite(h.value), `${s.id} ${h.year} value not finite`).toBe(true);
        expect(h.value, `${s.id} ${h.year}`).toBeGreaterThan(0);
        expect(h.value, `${s.id} ${h.year}`).toBeLessThan(40);
      }
    }
  });

  it('credit card rate is the highest of the four (a defining data pattern the questions rely on)', () => {
    const rates = Object.fromEntries(RATE_SERIES.map((s) => [s.id, s.currentRate]));
    expect(rates['credit-card']).toBeGreaterThan(rates['personal-loan']);
    expect(rates['credit-card']).toBeGreaterThan(rates['auto-loan']);
    expect(rates['credit-card']).toBeGreaterThan(rates['mortgage']);
  });

  it('currentAsOf on each series is a valid YYYY-MM string within the last year', () => {
    for (const s of RATE_SERIES) {
      expect(s.currentAsOf).toMatch(/^\d{4}-\d{2}$/);
      const year = parseInt(s.currentAsOf.slice(0, 4), 10);
      expect(year).toBeGreaterThanOrEqual(CURRENT_YEAR - 1);
    }
  });

  it('every series carries source metadata so "Behind the numbers" can render', () => {
    for (const s of RATE_SERIES) {
      expect(s.fredTitle, `${s.id} fredTitle`).toMatch(/.+/);
      expect(s.fredUrl, `${s.id} fredUrl`).toMatch(/^https:\/\/fred\.stlouisfed\.org\/series\//);
      expect(s.sourcePublisher, `${s.id} sourcePublisher`).toMatch(/.+/);
      expect(s.units, `${s.id} units`).toMatch(/Percent/);
      expect(s.frequency, `${s.id} frequency`).toMatch(/Quarterly|Weekly|Monthly|Daily|Annual/);
      expect(s.methodology, `${s.id} methodology`).toMatch(/.{20}/);
    }
  });
});

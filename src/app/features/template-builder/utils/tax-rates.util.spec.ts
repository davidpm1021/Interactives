import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  STATES_WITH_INCOME_TAX,
  effectiveFederalRate,
  effectiveStateRate,
  hasStateIncomeTax,
} from './tax-rates.util';

/** Every US state, so coverage gaps show up as a failing test. */
const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL',
  'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT',
  'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

/** States with no income tax on wages. */
const NO_TAX_STATES = ['AK', 'FL', 'NH', 'NV', 'SD', 'TN', 'TX', 'WA', 'WY'];

/** Flat-rate states and their published rates. */
const FLAT_STATES: [string, number][] = [
  ['AZ', 0.025], ['CO', 0.044], ['IA', 0.038], ['ID', 0.053], ['IL', 0.0495],
  ['IN', 0.0315], ['KY', 0.04], ['LA', 0.03], ['MA', 0.05], ['MI', 0.0425],
  ['NC', 0.045], ['PA', 0.0307], ['UT', 0.0485],
];

/** States whose lowest band is zero because a first slice of income is exempt. */
const ZERO_FLOOR_STATES = ['ND', 'OH'];

/** Pinning Math.random at 0.5 zeroes the state jitter term. */
function pinRandom(value = 0.5): void {
  vi.spyOn(Math, 'random').mockReturnValue(value);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('hasStateIncomeTax', () => {
  it('is false for every state that does not tax wages', () => {
    for (const state of NO_TAX_STATES) {
      expect(hasStateIncomeTax(state)).toBe(false);
    }
  });

  it('is true for flat-rate states', () => {
    for (const [state] of FLAT_STATES) {
      expect(hasStateIncomeTax(state)).toBe(true);
    }
  });

  it('is false for a state the table does not know', () => {
    expect(hasStateIncomeTax('ZZ')).toBe(false);
    expect(hasStateIncomeTax('')).toBe(false);
  });
});

describe('effectiveStateRate', () => {
  it('is exactly zero in no-tax states, with no jitter applied', () => {
    for (const state of NO_TAX_STATES) {
      for (const random of [0, 0.25, 0.5, 0.75, 0.999]) {
        vi.restoreAllMocks();
        pinRandom(random);
        expect(effectiveStateRate(state, 45000)).toBe(0);
      }
    }
  });

  it('returns the published rate for flat states', () => {
    pinRandom();
    for (const [state, rate] of FLAT_STATES) {
      expect(effectiveStateRate(state, 45000)).toBeCloseTo(rate, 10);
    }
  });

  it('charges a flat state the same rate at every income', () => {
    pinRandom();
    for (const [state] of FLAT_STATES) {
      const low = effectiveStateRate(state, 12000);
      const high = effectiveStateRate(state, 250000);
      expect(low).toBeCloseTo(high, 10);
    }
  });

  it('never moves a rate more than 0.3 points from its base', () => {
    // Jitter must stay small enough that two stubs from one employer differ in
    // the cents without the rate itself looking wrong.
    for (const random of [0, 0.1, 0.5, 0.9, 0.999]) {
      vi.restoreAllMocks();
      pinRandom(random);
      for (const [state, base] of FLAT_STATES) {
        // Half the 0.6-point jitter window, plus room for float error: the
        // sum lands on 0.0030000000000000027 at the extremes.
        expect(Math.abs(effectiveStateRate(state, 45000) - base)).toBeLessThanOrEqual(0.003 + 1e-9);
      }
    }
  });

  it('never returns a negative rate', () => {
    for (const random of [0, 0.001, 0.5, 0.999]) {
      vi.restoreAllMocks();
      pinRandom(random);
      for (const state of [...NO_TAX_STATES, ...FLAT_STATES.map(([s]) => s), 'CA', 'NY', 'OR']) {
        expect(effectiveStateRate(state, 30000)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('never charges more as income falls, in progressive states', () => {
    pinRandom();
    const incomes = [5000, 12000, 24000, 40000, 60000, 90000, 130000, 240000, 600000];
    for (const state of ['CA', 'NY', 'OR', 'WI', 'VT', 'MN', 'NJ', 'CT', 'GA', 'MT']) {
      const rates = incomes.map((i) => effectiveStateRate(state, i));
      for (let i = 1; i < rates.length; i++) {
        expect(rates[i]).toBeGreaterThanOrEqual(rates[i - 1]);
      }
    }
  });

  it('returns zero for a state the table does not know', () => {
    pinRandom();
    expect(effectiveStateRate('ZZ', 45000)).toBe(0);
    expect(effectiveStateRate('', 45000)).toBe(0);
  });
});

describe('effectiveFederalRate', () => {
  it('never charges a lower rate as income rises', () => {
    pinRandom();
    const incomes = [5000, 14999, 15000, 24999, 25000, 39999, 40000, 59999, 60000, 89999, 90000];
    const rates = incomes.map((i) => effectiveFederalRate(i));
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeGreaterThanOrEqual(rates[i - 1]);
    }
  });

  it('stays inside the band documented for each income level', () => {
    const bands: [number, number, number][] = [
      [10000, 0.01, 0.03],
      [20000, 0.03, 0.05],
      [30000, 0.06, 0.08],
      [50000, 0.09, 0.11],
      [70000, 0.11, 0.13],
      [120000, 0.13, 0.15],
    ];
    for (const random of [0, 0.5, 0.999]) {
      vi.restoreAllMocks();
      pinRandom(random);
      for (const [income, min, max] of bands) {
        const rate = effectiveFederalRate(income);
        expect(rate).toBeGreaterThanOrEqual(min);
        expect(rate).toBeLessThanOrEqual(max);
      }
    }
  });

  it('always withholds something, even on a very small income', () => {
    for (const random of [0, 0.5, 0.999]) {
      vi.restoreAllMocks();
      pinRandom(random);
      expect(effectiveFederalRate(1)).toBeGreaterThan(0);
      expect(effectiveFederalRate(0)).toBeGreaterThan(0);
    }
  });

  /**
   * The top band is open-ended: everything at or above $90k draws the same
   * 13-15%. Random generation cannot reach far past it today, since W-2 wages
   * top out near $69k, but PaystubRandomOptions.annualIncomeTarget lets a
   * teacher type any figure. At $500k this understates withholding badly.
   *
   * Pinned as current behavior so that capping or extending the bands is a
   * deliberate change rather than an accident.
   */
  it('applies the same rate at $90k and at $500k', () => {
    pinRandom();
    expect(effectiveFederalRate(500000)).toBe(effectiveFederalRate(90000));
  });
});

describe('state coverage', () => {
  it('knows every US state, so nobody has to borrow a neighbour rate', () => {
    const missing = ALL_STATES.filter(
      (s) => !hasStateIncomeTax(s) && effectiveStateRate(s, 50000) === 0 && !isKnown(s),
    );
    expect(missing).toEqual([]);
  });

  it('offers every taxing state in the picker and no others', () => {
    const expected = ALL_STATES.filter((s) => hasStateIncomeTax(s)).sort();
    expect([...STATES_WITH_INCOME_TAX]).toEqual(expected);
  });

  it('leaves the nine genuine no-income-tax states out of the picker', () => {
    for (const state of NO_TAX_STATES) {
      expect(STATES_WITH_INCOME_TAX).not.toContain(state);
    }
    expect(ALL_STATES.filter((s) => !hasStateIncomeTax(s)).sort()).toEqual([...NO_TAX_STATES].sort());
  });

  it('charges every taxing state a plausible classroom rate at a normal wage', () => {
    pinRandom();
    // Sampled at $60k, above the exempt slice North Dakota and Ohio shelter.
    // At $45k North Dakota correctly withholds nothing, which is the point of
    // the zero-floor test below rather than a gap in the table.
    for (const state of STATES_WITH_INCOME_TAX) {
      const rate = effectiveStateRate(state, 60000);
      expect(rate, `${state} withholds nothing at $60k`).toBeGreaterThan(0);
      // Nothing near a real state rate sits above 12%.
      expect(rate, `${state} rate looks implausible`).toBeLessThan(0.12);
    }
  });

  it('exempts a low wage in states that shelter a first slice of income', () => {
    pinRandom();
    for (const state of ZERO_FLOOR_STATES) {
      expect(effectiveStateRate(state, 20000)).toBe(0);
      expect(effectiveStateRate(state, 60000)).toBeGreaterThan(0);
      // Still belongs in the picker: the state does tax wages, just not these.
      expect(STATES_WITH_INCOME_TAX).toContain(state);
    }
  });

  it('never charges more as income falls, in any state', () => {
    pinRandom();
    const incomes = [5000, 12000, 24000, 40000, 60000, 90000, 130000, 240000, 600000];
    for (const state of ALL_STATES) {
      const rates = incomes.map((i) => effectiveStateRate(state, i));
      for (let i = 1; i < rates.length; i++) {
        expect(rates[i]).toBeGreaterThanOrEqual(rates[i - 1]);
      }
    }
  });
});

/** A state is known if the table has an entry, taxing or not. */
function isKnown(stateAbbr: string): boolean {
  return NO_TAX_STATES.includes(stateAbbr) || STATES_WITH_INCOME_TAX.includes(stateAbbr);
}

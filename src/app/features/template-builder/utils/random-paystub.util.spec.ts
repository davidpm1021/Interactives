import { describe, expect, it } from 'vitest';
import { EMPLOYER_STATES, randomPaystub } from './random-paystub.util';
import { earningCurrent } from '../models/paystub.model';
import { hasStateIncomeTax } from './tax-rates.util';

/**
 * Invariants over many generated stubs. The teacher-facing options are the
 * part most worth pinning: a pinned state or a forced-off overtime line that
 * quietly does nothing produces a worksheet that contradicts the lesson it
 * was generated for.
 */
const RUNS = 200;
const REFERENCE_DATE = new Date(2026, 5, 15);

function sample(opts = {}, runs = RUNS) {
  return Array.from({ length: runs }, () => randomPaystub(REFERENCE_DATE, opts));
}

function grossPerPeriod(p: { earnings: Parameters<typeof earningCurrent>[0][] }): number {
  return p.earnings.reduce((s, e) => s + earningCurrent(e), 0);
}

describe('randomPaystub earnings', () => {
  it('always leads with a regular-hours line', () => {
    for (const p of sample()) {
      expect(p.earnings[0].description).toBe('Regular');
      expect([72, 76, 80]).toContain(p.earnings[0].hours);
      expect(p.earnings[0].rate).toBeGreaterThan(0);
    }
  });

  it('prices overtime at one and a half times the regular rate', () => {
    for (const p of sample({ includeOvertime: true })) {
      const regular = p.earnings[0];
      const overtime = p.earnings.find((e) => e.description === 'Overtime');
      expect(overtime).toBeDefined();
      const expected = Math.round(regular.rate! * 1.5 * 100) / 100;
      expect(overtime!.rate).toBe(expected);
      expect(overtime!.hours).toBeGreaterThan(0);
    }
  });

  it('omits the overtime line entirely when asked to', () => {
    for (const p of sample({ includeOvertime: false })) {
      expect(p.earnings.some((e) => e.description === 'Overtime')).toBe(false);
      expect(p.earnings).toHaveLength(1);
    }
  });

  it('produces a positive gross every time', () => {
    for (const p of sample()) {
      expect(grossPerPeriod(p)).toBeGreaterThan(0);
    }
  });
});

describe('randomPaystub teacher-pinned options', () => {
  it('hits the requested annual income within a rounding cent per hour', () => {
    for (const target of [18000, 32000, 45500, 60000]) {
      for (const p of sample({ annualIncomeTarget: target, includeOvertime: false }, 25)) {
        const annual = grossPerPeriod(p) * 26;
        // The hourly rate is rounded to cents, so the annual figure can drift
        // by up to one cent per hour worked across the year.
        const tolerance = p.earnings[0].hours! * 26 * 0.01;
        expect(Math.abs(annual - target)).toBeLessThanOrEqual(tolerance);
      }
    }
  });

  it('only picks employers in the requested state', () => {
    for (const state of EMPLOYER_STATES) {
      for (const p of sample({ state }, 20)) {
        expect(p.employer.addressLine2).toContain(state);
      }
    }
  });

  it('never adds a 401(k) deduction when restricted to small employers', () => {
    for (const p of sample({ smallEmployerOnly: true })) {
      expect(p.deductions.some((d) => d.description.includes('401(k)'))).toBe(false);
    }
  });

  it('falls back to the full employer pool rather than failing on an impossible filter', () => {
    // Texas only has a 401(k)-offering employer, so small-only cannot be met.
    const stubs = sample({ state: 'TX', smallEmployerOnly: true }, 20);
    for (const p of stubs) {
      expect(p.employer.name.length).toBeGreaterThan(0);
      expect(grossPerPeriod(p)).toBeGreaterThan(0);
    }
  });
});

describe('randomPaystub pay period', () => {
  it('always pays on a Friday', () => {
    for (const p of sample()) {
      expect(new Date(`${p.period.payDate}T00:00:00`).getDay()).toBe(5);
    }
  });

  it('covers a two-week period ending four days before payday', () => {
    for (const p of sample()) {
      const start = new Date(`${p.period.start}T00:00:00`);
      const end = new Date(`${p.period.end}T00:00:00`);
      const pay = new Date(`${p.period.payDate}T00:00:00`);
      const day = 1000 * 60 * 60 * 24;
      expect(Math.round((pay.getTime() - end.getTime()) / day)).toBe(4);
      expect(Math.round((end.getTime() - start.getTime()) / day)).toBe(13);
    }
  });

  it('keeps periods-to-date inside a single year of biweekly pay', () => {
    for (const p of sample()) {
      expect(p.periodsYTD).toBeGreaterThanOrEqual(1);
      expect(p.periodsYTD).toBeLessThanOrEqual(26);
      expect(Number.isInteger(p.periodsYTD)).toBe(true);
    }
  });
});

describe('randomPaystub withholding flags', () => {
  it('leaves state tax off for employers in states that do not tax wages', () => {
    for (const p of sample()) {
      if (p.stateForTax === '') continue;
      expect(hasStateIncomeTax(p.stateForTax)).toBe(true);
    }
  });

  it('turns FICA and federal tax on, since both apply in every state', () => {
    for (const p of sample(undefined, 50)) {
      expect(p.includeFICA).toBe(true);
      expect(p.includeFederalTax).toBe(true);
    }
  });

  it('never emits a negative deduction', () => {
    for (const p of sample()) {
      for (const d of p.deductions) {
        expect(d.current).toBeGreaterThanOrEqual(0);
      }
    }
  });

  // Without the flag the deduction still prints, but silently stops lowering
  // the income tax, which is the behavior this pairing exists to prevent.
  it('marks a generated 401(k) as pre-tax and leaves insurance post-tax', () => {
    for (const p of sample()) {
      for (const d of p.deductions) {
        if (d.description.includes('401(k)')) {
          expect(d.preTax).toBe(true);
        } else {
          expect(d.preTax).toBeFalsy();
        }
      }
    }
  });
});

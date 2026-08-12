import { describe, expect, it } from 'vitest';
import { randomW2 } from './random-w2.util';
import { hasStateIncomeTax } from './tax-rates.util';

/**
 * The generator is random by design, so these check invariants that must hold
 * for every form it can produce rather than pinning one sampled output. A
 * teacher hands these numbers to students as fact, and a wrong Box 1 or a
 * miscomputed FICA line is not something a glance at the page would catch.
 */
const RUNS = 300;
const REFERENCE_DATE = new Date(2026, 5, 15);

function sample(runs = RUNS) {
  return Array.from({ length: runs }, () => randomW2(REFERENCE_DATE));
}

/** Cents, so comparisons don't trip over floating point. */
function cents(n: number): number {
  return Math.round(n * 100);
}

describe('randomW2 money math', () => {
  it('withholds Social Security at 6.2% of Social Security wages', () => {
    for (const w2 of sample()) {
      expect(cents(w2.ssTaxWithheld)).toBe(cents(Math.round(w2.ssWages * 0.062 * 100) / 100));
    }
  });

  it('withholds Medicare at 1.45% of Medicare wages', () => {
    for (const w2 of sample()) {
      expect(cents(w2.medicareTaxWithheld)).toBe(
        cents(Math.round(w2.medicareWages * 0.0145 * 100) / 100),
      );
    }
  });

  it('reports the same wage figure for Social Security and Medicare', () => {
    for (const w2 of sample()) {
      expect(w2.medicareWages).toBe(w2.ssWages);
    }
  });

  it('reduces Box 1 wages by exactly the 401(k) deferral', () => {
    for (const w2 of sample()) {
      const deferral = w2.box12.find((b) => b.code === 'D')?.amount ?? 0;
      expect(cents(w2.wages)).toBe(cents(Math.round((w2.ssWages - deferral) * 100) / 100));
    }
  });

  it('keeps Box 1 at or below Social Security wages', () => {
    for (const w2 of sample()) {
      expect(w2.wages).toBeLessThanOrEqual(w2.ssWages);
    }
  });

  it('never emits a negative or non-finite money figure', () => {
    for (const w2 of sample()) {
      const amounts = [
        w2.wages, w2.fedTaxWithheld, w2.ssWages, w2.ssTaxWithheld,
        w2.medicareWages, w2.medicareTaxWithheld, w2.stateWages, w2.stateTaxWithheld,
        ...w2.box12.map((b) => b.amount),
      ];
      for (const a of amounts) {
        expect(Number.isFinite(a)).toBe(true);
        expect(a).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('withholds less federal tax than the wages it is computed on', () => {
    for (const w2 of sample()) {
      expect(w2.fedTaxWithheld).toBeLessThan(w2.wages);
    }
  });
});

describe('randomW2 state handling', () => {
  it('leaves every state field blank in a state with no wage income tax', () => {
    for (const w2 of sample()) {
      if (hasStateIncomeTax(w2.stateAbbr)) continue;
      expect(w2.stateTaxWithheld).toBe(0);
      expect(w2.stateWages).toBe(0);
      expect(w2.employerStateIdNumber).toBe('');
    }
  });

  it('reports state wages equal to Box 1 where the state taxes wages', () => {
    for (const w2 of sample()) {
      if (!hasStateIncomeTax(w2.stateAbbr)) continue;
      expect(w2.stateWages).toBe(w2.wages);
      expect(w2.employerStateIdNumber).toContain(w2.stateAbbr);
    }
  });
});

describe('randomW2 identifiers stay obviously fake', () => {
  // The repeated-digit convention is what keeps a generated form from
  // resembling a real person's SSN. Worth a test: it is a deliberate safety
  // property, not a formatting preference.
  it('builds every SSN from a single repeated non-zero digit', () => {
    for (const w2 of sample()) {
      expect(w2.employeeSSN).toMatch(/^(\d)\1\1-\1\1-\1\1\1\1$/);
      expect(w2.employeeSSN.startsWith('0')).toBe(false);
    }
  });

  it('builds every EIN from a single repeated non-zero digit', () => {
    for (const w2 of sample()) {
      expect(w2.employerEIN).toMatch(/^(\d)\1-\1\1\1\1\1\1\1$/);
      expect(w2.employerEIN.startsWith('0')).toBe(false);
    }
  });
});

describe('randomW2 form consistency', () => {
  it('reports the prior year, since a W-2 arrives after the year it covers', () => {
    expect(randomW2(new Date(2026, 0, 31)).taxYear).toBe(2025);
    expect(randomW2(new Date(2030, 11, 1)).taxYear).toBe(2029);
  });

  it('ticks the retirement-plan box exactly when a 401(k) deferral is reported', () => {
    for (const w2 of sample()) {
      const hasDeferral = w2.box12.some((b) => b.code === 'D' && b.amount > 0);
      expect(w2.retirementPlan).toBe(hasDeferral);
    }
  });

  it('never repeats a Box 12 code on one form', () => {
    for (const w2 of sample()) {
      const codes = w2.box12.map((b) => b.code);
      expect(new Set(codes).size).toBe(codes.length);
    }
  });

  it('omits Box 12 lines rather than reporting them as zero', () => {
    for (const w2 of sample()) {
      for (const entry of w2.box12) {
        expect(entry.amount).toBeGreaterThan(0);
      }
    }
  });

  it('always names an employee and an employer', () => {
    for (const w2 of sample(50)) {
      expect(w2.employee.firstName.length).toBeGreaterThan(0);
      expect(w2.employee.lastName.length).toBeGreaterThan(0);
      expect(w2.employer.name.length).toBeGreaterThan(0);
    }
  });
});

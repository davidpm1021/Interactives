import { afterEach, describe, expect, it, vi } from 'vitest';
import { Paystub } from '../models/paystub.model';
import * as math from './paystub-math.util';

/**
 * A paystub with no earnings, no taxes and no deductions. Each test turns on
 * only the parts it cares about, so a failure points at one calculation.
 */
function paystub(overrides: Partial<Paystub> = {}): Paystub {
  return {
    employer: { name: 'Riverside Coffee Co.', addressLine1: '', addressLine2: '' },
    employee: { name: 'Alex Morgan', addressLine1: '', addressLine2: '', employeeId: 'EMP-1' },
    period: { start: '2026-06-08', end: '2026-06-21', payDate: '2026-06-26', checkNumber: '1' },
    periodsYTD: 1,
    earnings: [],
    includeFICA: false,
    includeFederalTax: false,
    stateForTax: '',
    otherTaxes: [],
    deductions: [],
    // Mid-window, so rates land exactly on their published value.
    taxJitter: 0.5,
    ...overrides,
  };
}

/** 40 hours at $20 = $800 per period. Round numbers keep assertions readable. */
function withGross800(overrides: Partial<Paystub> = {}): Paystub {
  return paystub({
    earnings: [{ description: 'Regular', hours: 40, rate: 20, amount: 0 }],
    ...overrides,
  });
}

/**
 * Rates are positioned by the paystub's own taxJitter, which the factory above
 * fixes at 0.5: the state offset is then exactly zero and the federal band
 * midpoint is used, so expected figures are computable by hand.
 *
 * Math.random is pinned too, belt and braces, so a rate that ever stopped
 * taking the paystub's value would surface as a failure here rather than as
 * flakiness.
 */
function pinRandom(value = 0.5): void {
  vi.spyOn(Math, 'random').mockReturnValue(value);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('gross', () => {
  it('multiplies hours by rate for each earning line', () => {
    const p = paystub({
      earnings: [
        { description: 'Regular', hours: 76, rate: 18.5, amount: 0 },
        { description: 'Overtime', hours: 4, rate: 27.75, amount: 0 },
      ],
    });
    expect(math.grossCurrent(p)).toBeCloseTo(76 * 18.5 + 4 * 27.75, 10);
  });

  it('falls back to the flat amount when hours and rate are absent', () => {
    const p = paystub({
      earnings: [{ description: 'Bonus', hours: null, rate: null, amount: 250 }],
    });
    expect(math.grossCurrent(p)).toBe(250);
  });

  it('is zero with no earnings', () => {
    expect(math.grossCurrent(paystub())).toBe(0);
  });

  it('scales YTD by the number of periods', () => {
    expect(math.grossYTD(withGross800({ periodsYTD: 13 }))).toBe(800 * 13);
  });
});

describe('FICA', () => {
  it('withholds 6.2% for Social Security and 1.45% for Medicare', () => {
    const p = withGross800({ includeFICA: true });
    expect(math.socialSecurityCurrent(p)).toBeCloseTo(49.6, 10);
    expect(math.medicareCurrent(p)).toBeCloseTo(11.6, 10);
  });

  it('withholds nothing when FICA is switched off', () => {
    const p = withGross800({ includeFICA: false });
    expect(math.socialSecurityCurrent(p)).toBe(0);
    expect(math.medicareCurrent(p)).toBe(0);
  });

  it('scales both YTD by the number of periods', () => {
    const p = withGross800({ includeFICA: true, periodsYTD: 10 });
    expect(math.socialSecurityYTD(p)).toBeCloseTo(496, 10);
    expect(math.medicareYTD(p)).toBeCloseTo(116, 10);
  });
});

describe('federal withholding', () => {
  it('looks the rate up from annualized gross, then applies it to the period', () => {
    pinRandom();
    // $800 x 26 = $20,800 a year, which lands in the under-$25k band:
    // 0.03 + 0.5 x 0.02 = 4%. 4% of the $800 period gross is $32.
    const p = withGross800({ includeFederalTax: true });
    expect(math.federalCurrent(p)).toBe(32);
  });

  it('withholds nothing when federal tax is switched off', () => {
    pinRandom();
    expect(math.federalCurrent(withGross800({ includeFederalTax: false }))).toBe(0);
  });

  it('withholds nothing when there is no gross to tax', () => {
    pinRandom();
    expect(math.federalCurrent(paystub({ includeFederalTax: true }))).toBe(0);
  });

  it('rounds to whole cents', () => {
    pinRandom();
    const p = paystub({
      earnings: [{ description: 'Regular', hours: 37, rate: 19.37, amount: 0 }],
      includeFederalTax: true,
    });
    const cents = Math.round(math.federalCurrent(p) * 100);
    expect(math.federalCurrent(p)).toBeCloseTo(cents / 100, 10);
  });
});

describe('state withholding', () => {
  it('applies the state rate when a state is set', () => {
    pinRandom(); // zero jitter, so Pennsylvania's flat 3.07% is exact
    const p = withGross800({ stateForTax: 'PA' });
    expect(math.stateCurrent(p)).toBeCloseTo(800 * 0.0307, 2);
  });

  it('withholds nothing when no state is set', () => {
    pinRandom();
    expect(math.stateCurrent(withGross800({ stateForTax: '' }))).toBe(0);
  });

  it('withholds nothing in a state with no income tax on wages', () => {
    pinRandom();
    expect(math.stateCurrent(withGross800({ stateForTax: 'TX' }))).toBe(0);
  });
});

describe('line items', () => {
  it('resolves a percent-of-gross item against gross', () => {
    const p = withGross800({
      deductions: [{ description: '401(k)', current: 0, percentOfGross: 5 }],
    });
    expect(math.lineItemCurrent(p.deductions[0], p)).toBe(40);
  });

  it('uses the flat amount when no percentage is set', () => {
    const p = withGross800({
      deductions: [{ description: 'Health', current: 45, percentOfGross: null }],
    });
    expect(math.lineItemCurrent(p.deductions[0], p)).toBe(45);
  });

  it('re-derives a percentage item when gross changes', () => {
    const item = { description: '401(k)', current: 0, percentOfGross: 5 };
    const small = paystub({
      earnings: [{ description: 'Regular', hours: 10, rate: 20, amount: 0 }],
      deductions: [item],
    });
    const large = withGross800({ deductions: [item] });
    expect(math.lineItemCurrent(item, small)).toBe(10);
    expect(math.lineItemCurrent(item, large)).toBe(40);
  });

  it('sums all deductions', () => {
    const p = withGross800({
      deductions: [
        { description: '401(k)', current: 0, percentOfGross: 5 },
        { description: 'Health', current: 45, percentOfGross: null },
        { description: 'Dental', current: 12, percentOfGross: null },
      ],
    });
    expect(math.deductionsCurrent(p)).toBe(40 + 45 + 12);
  });
});

describe('totals', () => {
  it('adds every withholding line into the tax total', () => {
    pinRandom();
    const p = withGross800({
      includeFICA: true,
      includeFederalTax: true,
      stateForTax: 'PA',
      otherTaxes: [{ description: 'Local', current: 8, percentOfGross: null }],
    });
    const expected =
      math.socialSecurityCurrent(p) +
      math.medicareCurrent(p) +
      math.federalCurrent(p) +
      math.stateCurrent(p) +
      8;
    expect(math.taxesCurrent(p)).toBeCloseTo(expected, 10);
  });

  it('takes both taxes and deductions off gross to reach net', () => {
    pinRandom();
    const p = withGross800({
      includeFICA: true,
      includeFederalTax: true,
      deductions: [{ description: 'Health', current: 45, percentOfGross: null }],
    });
    expect(math.netCurrent(p)).toBeCloseTo(800 - math.taxesCurrent(p) - 45, 10);
  });

  it('keeps gross whole: net plus taxes plus deductions comes back to gross', () => {
    pinRandom();
    const p = withGross800({
      includeFICA: true,
      includeFederalTax: true,
      stateForTax: 'CA',
      deductions: [
        { description: '401(k)', current: 0, percentOfGross: 4 },
        { description: 'Health', current: 55, percentOfGross: null },
      ],
    });
    const recombined = math.netCurrent(p) + math.taxesCurrent(p) + math.deductionsCurrent(p);
    expect(recombined).toBeCloseTo(math.grossCurrent(p), 10);
  });

  it('equals net for the period times periods for net YTD', () => {
    pinRandom();
    const p = withGross800({ includeFICA: true, periodsYTD: 13 });
    expect(math.netYTD(p)).toBeCloseTo(math.netCurrent(p) * 13, 10);
  });
});

describe('pre-tax deductions and the income tax base', () => {
  const traditional401k = {
    description: '401(k) Contribution',
    current: 0,
    percentOfGross: 6,
    preTax: true,
  };
  const roth401k = {
    description: 'Roth 401(k)',
    current: 0,
    percentOfGross: 6,
    preTax: false,
  };

  it('taxes wages net of anything deferred before tax', () => {
    const p = withGross800({ deductions: [traditional401k] });
    expect(math.preTaxDeductionsCurrent(p)).toBe(48);
    expect(math.taxableGrossCurrent(p)).toBe(752);
  });

  it('ignores post-tax deductions when working out taxable wages', () => {
    const p = withGross800({
      deductions: [roth401k, { description: 'Health', current: 45, percentOfGross: null }],
    });
    expect(math.preTaxDeductionsCurrent(p)).toBe(0);
    expect(math.taxableGrossCurrent(p)).toBe(800);
  });

  it('withholds less income tax when the employee defers into a traditional 401(k)', () => {
    pinRandom();
    const without = withGross800({ includeFederalTax: true, stateForTax: 'PA' });
    const with401k = withGross800({
      includeFederalTax: true,
      stateForTax: 'PA',
      deductions: [traditional401k],
    });

    expect(math.federalCurrent(with401k)).toBeLessThan(math.federalCurrent(without));
    expect(math.stateCurrent(with401k)).toBeLessThan(math.stateCurrent(without));
    // Pennsylvania is flat, so the state figure is exactly the rate on $752.
    expect(math.stateCurrent(with401k)).toBeCloseTo(752 * 0.0307, 2);
  });

  /**
   * The distinction the tool exists to show: same money out of the same
   * paycheck, but only the traditional contribution lowers income tax.
   */
  it('gives a Roth contribution no income tax break, unlike a traditional one', () => {
    pinRandom();
    const traditional = withGross800({
      includeFederalTax: true,
      stateForTax: 'PA',
      deductions: [traditional401k],
    });
    const roth = withGross800({
      includeFederalTax: true,
      stateForTax: 'PA',
      deductions: [roth401k],
    });
    const neither = withGross800({ includeFederalTax: true, stateForTax: 'PA' });

    expect(math.federalCurrent(roth)).toBe(math.federalCurrent(neither));
    expect(math.federalCurrent(traditional)).toBeLessThan(math.federalCurrent(roth));
    // Both still cost the employee the same amount out of pocket.
    expect(math.deductionsCurrent(roth)).toBe(math.deductionsCurrent(traditional));
  });

  /**
   * A 401(k) defers income tax, not payroll tax. A W-2 shows this as Box 1
   * sitting below Box 3, and the paystub has to agree or the two documents
   * contradict each other.
   */
  it('still charges FICA on the full gross, including the deferred amount', () => {
    const with401k = withGross800({ includeFICA: true, deductions: [traditional401k] });
    const without = withGross800({ includeFICA: true });

    expect(math.socialSecurityCurrent(with401k)).toBe(math.socialSecurityCurrent(without));
    expect(math.medicareCurrent(with401k)).toBe(math.medicareCurrent(without));
    expect(math.socialSecurityCurrent(with401k)).toBeCloseTo(800 * 0.062, 10);
  });

  it('withholds nothing rather than crediting money back when deferrals exceed gross', () => {
    pinRandom();
    const p = withGross800({
      includeFederalTax: true,
      stateForTax: 'PA',
      deductions: [{ description: 'Oversized', current: 900, percentOfGross: null, preTax: true }],
    });
    expect(math.taxableGrossCurrent(p)).toBe(0);
    expect(math.federalCurrent(p)).toBe(0);
    expect(math.stateCurrent(p)).toBe(0);
  });

  it('sums several pre-tax rows together', () => {
    const p = withGross800({
      deductions: [
        traditional401k,
        { description: 'HSA', current: 100, percentOfGross: null, preTax: true },
        { description: 'Health', current: 45, percentOfGross: null },
      ],
    });
    expect(math.preTaxDeductionsCurrent(p)).toBe(48 + 100);
    expect(math.taxableGrossCurrent(p)).toBe(800 - 148);
  });
});

describe('withholding is stable for a given paystub', () => {
  /**
   * Withholding is derived on every render. When the rate functions rolled
   * their own random offset, a paystub's tax moved on each change-detection
   * pass: editing the employee's name swung federal tax by nine dollars on an
   * unchanged gross, and printing the same sheet twice could give two answers.
   * The offset now travels on the paystub, so reads are repeatable.
   */
  it('returns the same figures however many times it is read', () => {
    const p = withGross800({ includeFederalTax: true, stateForTax: 'CA', taxJitter: 0.83 });
    const federal = Array.from({ length: 25 }, () => math.federalCurrent(p));
    const state = Array.from({ length: 25 }, () => math.stateCurrent(p));
    expect(new Set(federal).size).toBe(1);
    expect(new Set(state).size).toBe(1);
  });

  it('is unaffected by edits that do not touch a tax base', () => {
    const before = withGross800({ includeFederalTax: true, stateForTax: 'CA', taxJitter: 0.2 });
    const renamed = { ...before, employee: { ...before.employee, name: 'Someone Else' } };
    expect(math.federalCurrent(renamed)).toBe(math.federalCurrent(before));
    expect(math.stateCurrent(renamed)).toBe(math.stateCurrent(before));
  });

  it('still lets two separately generated stubs differ in the cents', () => {
    const low = withGross800({ includeFederalTax: true, taxJitter: 0 });
    const high = withGross800({ includeFederalTax: true, taxJitter: 1 });
    expect(math.federalCurrent(low)).not.toBe(math.federalCurrent(high));
  });

  it('tracks the gross it is given, so a rate is not frozen to one income', () => {
    // The offset is fixed, but the band still has to follow the money.
    const small = paystub({
      earnings: [{ description: 'Regular', hours: 40, rate: 10, amount: 0 }],
      includeFederalTax: true,
      taxJitter: 0.5,
    });
    const large = paystub({
      earnings: [{ description: 'Regular', hours: 40, rate: 60, amount: 0 }],
      includeFederalTax: true,
      taxJitter: 0.5,
    });
    const smallRate = math.federalCurrent(small) / math.grossCurrent(small);
    const largeRate = math.federalCurrent(large) / math.grossCurrent(large);
    expect(largeRate).toBeGreaterThan(smallRate);
  });
});

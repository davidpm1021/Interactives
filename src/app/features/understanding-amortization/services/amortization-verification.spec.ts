/**
 * Comprehensive verification tests for amortization calculations.
 *
 * Each scenario is verified against multiple invariants:
 *   1. Monthly payment matches the standard amortization formula
 *   2. Total payment = sum of all totalPayment in the schedule
 *   3. Total interest = sum of all interest in the schedule
 *   4. Total interest = total payment - loan amount (for no-extra scenarios)
 *   5. Final balance = $0.00
 *   6. Months to payoff = schedule.length
 *   7. Every row: principal + interest = paymentAmount (within rounding)
 *   8. Every row: totalPayment = paymentAmount + extraPayment
 *   9. Balance decreases monotonically
 *  10. Extra payments appear only in the correct months
 *  11. Savings = baseline interest - actual interest (when extras present)
 *  12. Savings = 0 when no extras
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AmortizationService } from './amortization.service';
import { LoanInputs, Payment } from '../models/amortization.models';

function makeInputs(overrides: Partial<LoanInputs> = {}): LoanInputs {
  return {
    loanAmount: 200000,
    annualInterestRate: 6.5,
    loanTermYears: 30,
    monthlyExtraPayment: 0,
    oneTimeExtraPayment: 0,
    oneTimeExtraPaymentMonth: 1,
    ...overrides,
  };
}

/** Round to N decimal places (matching service utility) */
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/** Recompute monthly payment independently for cross-check.
 *  Must match service rounding: monthly rate rounded to 6 decimals. */
function expectedMonthlyPayment(principal: number, annualRate: number, years: number): number {
  const r = roundTo(annualRate / 100 / 12, 6);
  const n = years * 12;
  if (r === 0) return roundTo(principal / n, 2);
  const pow = Math.pow(1 + r, n);
  return roundTo((principal * (r * pow)) / (pow - 1), 2);
}

/** Get the service's monthly rate for a given annual rate */
function monthlyRate(annualRate: number): number {
  return roundTo(annualRate / 100 / 12, 6);
}

/** Validate structural invariants of any schedule */
function assertScheduleInvariants(schedule: Payment[], loanAmount: number): void {
  expect(schedule.length).toBeGreaterThan(0);

  // Final balance must be zero
  expect(schedule[schedule.length - 1].remainingBalance).toBe(0);

  // Balance must decrease monotonically
  let prevBalance = loanAmount;
  for (const row of schedule) {
    expect(row.remainingBalance).toBeLessThanOrEqual(prevBalance);
    prevBalance = row.remainingBalance;
  }

  // Payment numbers must be sequential starting at 1
  for (let i = 0; i < schedule.length; i++) {
    expect(schedule[i].paymentNumber).toBe(i + 1);
  }

  // Each row: principal + interest ≈ paymentAmount (within 1 cent of rounding)
  for (const row of schedule) {
    expect(Math.abs(row.principal + row.interest - row.paymentAmount)).toBeLessThanOrEqual(0.01);
  }

  // Each row: totalPayment = paymentAmount + extra
  for (const row of schedule) {
    const extra = row.extraPayment ?? 0;
    expect(Math.abs(row.totalPayment - row.paymentAmount - extra)).toBeLessThanOrEqual(0.01);
  }

  // Sum of principal + extra must equal loan amount
  const totalPrincipalPaid = schedule.reduce(
    (sum, p) => sum + p.principal + (p.extraPayment ?? 0),
    0,
  );
  expect(totalPrincipalPaid).toBeCloseTo(loanAmount, 1);
}

describe('Amortization Verification Scenarios', () => {
  let service: AmortizationService;

  beforeEach(() => {
    service = new AmortizationService();
  });

  // =====================================================
  // SCENARIO 1: Standard 30-year mortgage, no extras
  // $200,000 at 6.5% for 30 years
  // =====================================================
  describe('Scenario 1: $200,000 at 6.5% for 30yr, no extras', () => {
    const inputs = makeInputs();
    let schedule: Payment[];
    let summary: ReturnType<AmortizationService['calculateSummary']>;

    beforeEach(() => {
      schedule = service.generateSchedule(inputs);
      summary = service.calculateSummary(inputs, schedule);
    });

    it('monthly payment matches formula', () => {
      const expected = expectedMonthlyPayment(200000, 6.5, 30);
      expect(summary.monthlyPayment).toBe(expected);
    });

    it('schedule is 360 months', () => {
      expect(summary.monthsToPayoff).toBe(360);
      expect(schedule.length).toBe(360);
    });

    it('total interest = total payment - loan amount', () => {
      expect(summary.totalInterest).toBeCloseTo(summary.totalPayment - 200000, 1);
    });

    it('total payment = sum of schedule totalPayments', () => {
      const sum = schedule.reduce((s, p) => s + p.totalPayment, 0);
      expect(summary.totalPayment).toBeCloseTo(sum, 1);
    });

    it('total interest = sum of schedule interest', () => {
      const sum = schedule.reduce((s, p) => s + p.interest, 0);
      expect(summary.totalInterest).toBeCloseTo(sum, 1);
    });

    it('no extra payments in any row', () => {
      for (const row of schedule) {
        expect(row.extraPayment).toBeUndefined();
      }
    });

    it('savings is zero', () => {
      expect(summary.totalSaved).toBe(0);
    });

    it('passes structural invariants', () => {
      assertScheduleInvariants(schedule, 200000);
    });

    it('first month interest = principal * monthly rate', () => {
      const r = monthlyRate(6.5);
      expect(schedule[0].interest).toBeCloseTo(200000 * r, 1);
    });
  });

  // =====================================================
  // SCENARIO 2: Same loan + $200/mo extra payment
  // =====================================================
  describe('Scenario 2: $200,000 at 6.5% for 30yr + $200/mo extra', () => {
    const inputs = makeInputs({ monthlyExtraPayment: 200 });
    let schedule: Payment[];
    let summary: ReturnType<AmortizationService['calculateSummary']>;

    beforeEach(() => {
      schedule = service.generateSchedule(inputs);
      summary = service.calculateSummary(inputs, schedule);
    });

    it('monthly payment is same as no-extras (base payment unchanged)', () => {
      const expected = expectedMonthlyPayment(200000, 6.5, 30);
      expect(summary.monthlyPayment).toBe(expected);
    });

    it('pays off faster than 360 months', () => {
      expect(summary.monthsToPayoff).toBeLessThan(360);
    });

    it('total interest is less than no-extras scenario', () => {
      const noExtraSchedule = service.generateSchedule(makeInputs());
      const noExtraInterest = noExtraSchedule.reduce((s, p) => s + p.interest, 0);
      expect(summary.totalInterest).toBeLessThan(noExtraInterest);
    });

    it('savings > 0', () => {
      expect(summary.totalSaved).toBeGreaterThan(0);
    });

    it('savings = baseline interest - actual interest', () => {
      const noExtraSchedule = service.generateSchedule(makeInputs());
      const noExtraInterest = noExtraSchedule.reduce((s, p) => s + p.interest, 0);
      const actualInterest = schedule.reduce((s, p) => s + p.interest, 0);
      expect(summary.totalSaved).toBeCloseTo(noExtraInterest - actualInterest, 1);
    });

    it('every non-final row has $200 extra (or capped)', () => {
      for (let i = 0; i < schedule.length - 1; i++) {
        const extra = schedule[i].extraPayment ?? 0;
        // Extra is either 200 or capped to remaining balance
        expect(extra).toBeGreaterThan(0);
        expect(extra).toBeLessThanOrEqual(200);
      }
    });

    it('total payment = sum of schedule totalPayments', () => {
      const sum = schedule.reduce((s, p) => s + p.totalPayment, 0);
      expect(summary.totalPayment).toBeCloseTo(sum, 1);
    });

    it('passes structural invariants', () => {
      assertScheduleInvariants(schedule, 200000);
    });
  });

  // =====================================================
  // SCENARIO 3: One-time payment of $5,000 in month 12
  // =====================================================
  describe('Scenario 3: $200,000 at 6.5% for 30yr + $5,000 one-time in month 12', () => {
    const inputs = makeInputs({
      oneTimeExtraPayment: 5000,
      oneTimeExtraPaymentMonth: 12,
    });
    let schedule: Payment[];
    let summary: ReturnType<AmortizationService['calculateSummary']>;

    beforeEach(() => {
      schedule = service.generateSchedule(inputs);
      summary = service.calculateSummary(inputs, schedule);
    });

    it('pays off faster than 360 months', () => {
      expect(summary.monthsToPayoff).toBeLessThan(360);
    });

    it('one-time payment appears only in month 12', () => {
      for (const row of schedule) {
        if (row.paymentNumber === 12) {
          expect(row.extraPayment).toBeDefined();
          expect(row.extraPayment!).toBeCloseTo(5000, 0);
        } else {
          expect(row.extraPayment).toBeUndefined();
        }
      }
    });

    it('savings > 0', () => {
      expect(summary.totalSaved).toBeGreaterThan(0);
    });

    it('total payment < no-extras total payment', () => {
      const noExtraSchedule = service.generateSchedule(makeInputs());
      const noExtraSummary = service.calculateSummary(makeInputs(), noExtraSchedule);
      expect(summary.totalPayment).toBeLessThan(noExtraSummary.totalPayment);
    });

    it('passes structural invariants', () => {
      assertScheduleInvariants(schedule, 200000);
    });
  });

  // =====================================================
  // SCENARIO 4: Both monthly extra AND one-time extra
  // $300,000 at 7% for 30yr + $100/mo + $10,000 in month 6
  // =====================================================
  describe('Scenario 4: $300,000 at 7% for 30yr + $100/mo + $10,000 one-time month 6', () => {
    const inputs = makeInputs({
      loanAmount: 300000,
      annualInterestRate: 7,
      loanTermYears: 30,
      monthlyExtraPayment: 100,
      oneTimeExtraPayment: 10000,
      oneTimeExtraPaymentMonth: 6,
    });
    let schedule: Payment[];
    let summary: ReturnType<AmortizationService['calculateSummary']>;

    beforeEach(() => {
      schedule = service.generateSchedule(inputs);
      summary = service.calculateSummary(inputs, schedule);
    });

    it('monthly payment matches formula for $300K at 7% for 30yr', () => {
      const expected = expectedMonthlyPayment(300000, 7, 30);
      expect(summary.monthlyPayment).toBe(expected);
    });

    it('pays off faster than 360 months', () => {
      expect(summary.monthsToPayoff).toBeLessThan(360);
    });

    it('month 6 has both monthly and one-time extra combined', () => {
      const month6 = schedule[5];
      expect(month6.extraPayment).toBeDefined();
      // Should be $100 monthly + $10,000 one-time = $10,100
      expect(month6.extraPayment!).toBeCloseTo(10100, 0);
    });

    it('non-month-6 rows have only $100 monthly extra (or capped)', () => {
      for (const row of schedule) {
        if (row.paymentNumber !== 6) {
          const extra = row.extraPayment ?? 0;
          if (extra > 0) {
            expect(extra).toBeLessThanOrEqual(100);
          }
        }
      }
    });

    it('savings reflects both types of extra payments', () => {
      expect(summary.totalSaved).toBeGreaterThan(0);

      // Savings should be greater than monthly-only extras
      const monthlyOnlyInputs = makeInputs({
        loanAmount: 300000,
        annualInterestRate: 7,
        loanTermYears: 30,
        monthlyExtraPayment: 100,
      });
      const monthlyOnlySchedule = service.generateSchedule(monthlyOnlyInputs);
      const monthlyOnlySummary = service.calculateSummary(monthlyOnlyInputs, monthlyOnlySchedule);
      expect(summary.totalSaved).toBeGreaterThan(monthlyOnlySummary.totalSaved);
    });

    it('passes structural invariants', () => {
      assertScheduleInvariants(schedule, 300000);
    });
  });

  // =====================================================
  // SCENARIO 5: Small loan, short term
  // $10,000 at 5% for 3 years
  // =====================================================
  describe('Scenario 5: $10,000 at 5% for 3yr, no extras', () => {
    const inputs = makeInputs({
      loanAmount: 10000,
      annualInterestRate: 5,
      loanTermYears: 3,
    });
    let schedule: Payment[];
    let summary: ReturnType<AmortizationService['calculateSummary']>;

    beforeEach(() => {
      schedule = service.generateSchedule(inputs);
      summary = service.calculateSummary(inputs, schedule);
    });

    it('schedule is 36 months', () => {
      expect(summary.monthsToPayoff).toBe(36);
    });

    it('monthly payment matches formula', () => {
      const expected = expectedMonthlyPayment(10000, 5, 3);
      expect(summary.monthlyPayment).toBe(expected);
    });

    it('total interest is reasonable (much less than principal)', () => {
      // At 5% for 3 years, interest should be roughly $800
      expect(summary.totalInterest).toBeGreaterThan(700);
      expect(summary.totalInterest).toBeLessThan(900);
    });

    it('total interest = total payment - loan amount', () => {
      expect(summary.totalInterest).toBeCloseTo(summary.totalPayment - 10000, 1);
    });

    it('passes structural invariants', () => {
      assertScheduleInvariants(schedule, 10000);
    });
  });

  // =====================================================
  // SCENARIO 6: 0% interest rate
  // $24,000 at 0% for 2 years
  // =====================================================
  describe('Scenario 6: $24,000 at 0% for 2yr', () => {
    const inputs = makeInputs({
      loanAmount: 24000,
      annualInterestRate: 0,
      loanTermYears: 2,
    });
    let schedule: Payment[];
    let summary: ReturnType<AmortizationService['calculateSummary']>;

    beforeEach(() => {
      schedule = service.generateSchedule(inputs);
      summary = service.calculateSummary(inputs, schedule);
    });

    it('monthly payment = $1,000 (24000 / 24)', () => {
      expect(summary.monthlyPayment).toBe(1000);
    });

    it('schedule is 24 months', () => {
      expect(summary.monthsToPayoff).toBe(24);
    });

    it('zero total interest', () => {
      expect(summary.totalInterest).toBe(0);
    });

    it('total payment = loan amount', () => {
      expect(summary.totalPayment).toBeCloseTo(24000, 1);
    });

    it('every row has zero interest', () => {
      for (const row of schedule) {
        expect(row.interest).toBe(0);
      }
    });

    it('passes structural invariants', () => {
      assertScheduleInvariants(schedule, 24000);
    });
  });

  // =====================================================
  // SCENARIO 7: 0% interest + monthly extra
  // $24,000 at 0% for 2yr + $500/mo extra
  // =====================================================
  describe('Scenario 7: $24,000 at 0% for 2yr + $500/mo extra', () => {
    const inputs = makeInputs({
      loanAmount: 24000,
      annualInterestRate: 0,
      loanTermYears: 2,
      monthlyExtraPayment: 500,
    });
    let schedule: Payment[];
    let summary: ReturnType<AmortizationService['calculateSummary']>;

    beforeEach(() => {
      schedule = service.generateSchedule(inputs);
      summary = service.calculateSummary(inputs, schedule);
    });

    it('monthly payment = $1,000', () => {
      expect(summary.monthlyPayment).toBe(1000);
    });

    it('pays off in 16 months (24000 / 1500 = 16)', () => {
      expect(summary.monthsToPayoff).toBe(16);
    });

    it('zero total interest', () => {
      expect(summary.totalInterest).toBe(0);
    });

    it('total payment = loan amount (no interest to save)', () => {
      expect(summary.totalPayment).toBeCloseTo(24000, 1);
    });

    it('savings = 0 (no interest with 0% rate)', () => {
      expect(summary.totalSaved).toBe(0);
    });

    it('passes structural invariants', () => {
      assertScheduleInvariants(schedule, 24000);
    });
  });

  // =====================================================
  // SCENARIO 8: High interest, with monthly extra
  // $150,000 at 8% for 15yr + $500/mo extra
  // =====================================================
  describe('Scenario 8: $150,000 at 8% for 15yr + $500/mo extra', () => {
    const inputs = makeInputs({
      loanAmount: 150000,
      annualInterestRate: 8,
      loanTermYears: 15,
      monthlyExtraPayment: 500,
    });
    let schedule: Payment[];
    let summary: ReturnType<AmortizationService['calculateSummary']>;

    beforeEach(() => {
      schedule = service.generateSchedule(inputs);
      summary = service.calculateSummary(inputs, schedule);
    });

    it('monthly payment matches formula', () => {
      const expected = expectedMonthlyPayment(150000, 8, 15);
      expect(summary.monthlyPayment).toBe(expected);
    });

    it('pays off much faster than 180 months', () => {
      expect(summary.monthsToPayoff).toBeLessThan(180);
      // With $500/mo extra on a ~$1,433 payment, should be around 100-110 months
      expect(summary.monthsToPayoff).toBeLessThan(120);
    });

    it('significant interest savings', () => {
      expect(summary.totalSaved).toBeGreaterThan(30000);
    });

    it('total interest < no-extras scenario', () => {
      const noExtraInputs = makeInputs({
        loanAmount: 150000,
        annualInterestRate: 8,
        loanTermYears: 15,
      });
      const noExtraSchedule = service.generateSchedule(noExtraInputs);
      const noExtraSummary = service.calculateSummary(noExtraInputs, noExtraSchedule);
      expect(summary.totalInterest).toBeLessThan(noExtraSummary.totalInterest);
    });

    it('passes structural invariants', () => {
      assertScheduleInvariants(schedule, 150000);
    });
  });

  // =====================================================
  // SCENARIO 9: One-time payment in month 1
  // $100,000 at 6% for 10yr + $20,000 one-time month 1
  // =====================================================
  describe('Scenario 9: $100,000 at 6% for 10yr + $20,000 one-time month 1', () => {
    const inputs = makeInputs({
      loanAmount: 100000,
      annualInterestRate: 6,
      loanTermYears: 10,
      oneTimeExtraPayment: 20000,
      oneTimeExtraPaymentMonth: 1,
    });
    let schedule: Payment[];
    let summary: ReturnType<AmortizationService['calculateSummary']>;

    beforeEach(() => {
      schedule = service.generateSchedule(inputs);
      summary = service.calculateSummary(inputs, schedule);
    });

    it('month 1 has the $20,000 extra', () => {
      expect(schedule[0].extraPayment).toBeDefined();
      expect(schedule[0].extraPayment!).toBeCloseTo(20000, 0);
    });

    it('month 1 balance drops by much more than regular payment', () => {
      // Balance should drop from 100,000 by about $20,000 + principal portion
      expect(schedule[0].remainingBalance).toBeLessThan(80000);
    });

    it('pays off faster than 120 months', () => {
      expect(summary.monthsToPayoff).toBeLessThan(120);
    });

    it('savings > 0', () => {
      expect(summary.totalSaved).toBeGreaterThan(0);
    });

    it('passes structural invariants', () => {
      assertScheduleInvariants(schedule, 100000);
    });
  });

  // =====================================================
  // SCENARIO 10: Huge extra payment that pays off in month 1
  // $50,000 at 5% for 5yr + $100,000 one-time month 1
  // =====================================================
  describe('Scenario 10: $50,000 at 5% for 5yr + $100K one-time month 1 (instant payoff)', () => {
    const inputs = makeInputs({
      loanAmount: 50000,
      annualInterestRate: 5,
      loanTermYears: 5,
      oneTimeExtraPayment: 100000,
      oneTimeExtraPaymentMonth: 1,
    });
    let schedule: Payment[];
    let summary: ReturnType<AmortizationService['calculateSummary']>;

    beforeEach(() => {
      schedule = service.generateSchedule(inputs);
      summary = service.calculateSummary(inputs, schedule);
    });

    it('pays off in exactly 1 month', () => {
      expect(summary.monthsToPayoff).toBe(1);
      expect(schedule.length).toBe(1);
    });

    it('final balance is $0', () => {
      expect(schedule[0].remainingBalance).toBe(0);
    });

    it('total interest is just 1 month of interest', () => {
      const oneMonthInterest = 50000 * (5 / 100 / 12);
      expect(summary.totalInterest).toBeCloseTo(oneMonthInterest, 1);
    });

    it('savings nearly equals the full baseline interest', () => {
      const noExtraInputs = makeInputs({
        loanAmount: 50000,
        annualInterestRate: 5,
        loanTermYears: 5,
      });
      const noExtraSchedule = service.generateSchedule(noExtraInputs);
      const noExtraSummary = service.calculateSummary(noExtraInputs, noExtraSchedule);
      // Savings should be most of the baseline interest (all but 1 month)
      expect(summary.totalSaved).toBeCloseTo(noExtraSummary.totalInterest - summary.totalInterest, 1);
    });

    it('passes structural invariants', () => {
      assertScheduleInvariants(schedule, 50000);
    });
  });

  // =====================================================
  // SCENARIO 11: 40-year maximum term
  // $500,000 at 4% for 40yr
  // =====================================================
  describe('Scenario 11: $500,000 at 4% for 40yr, no extras', () => {
    const inputs = makeInputs({
      loanAmount: 500000,
      annualInterestRate: 4,
      loanTermYears: 40,
    });
    let schedule: Payment[];
    let summary: ReturnType<AmortizationService['calculateSummary']>;

    beforeEach(() => {
      schedule = service.generateSchedule(inputs);
      summary = service.calculateSummary(inputs, schedule);
    });

    it('schedule is 480 months', () => {
      expect(summary.monthsToPayoff).toBe(480);
    });

    it('monthly payment matches formula', () => {
      const expected = expectedMonthlyPayment(500000, 4, 40);
      expect(summary.monthlyPayment).toBe(expected);
    });

    it('total interest > loan amount (high with 40yr term)', () => {
      expect(summary.totalInterest).toBeGreaterThan(500000);
    });

    it('total interest = total payment - loan amount', () => {
      expect(summary.totalInterest).toBeCloseTo(summary.totalPayment - 500000, 1);
    });

    it('passes structural invariants', () => {
      assertScheduleInvariants(schedule, 500000);
    });
  });

  // =====================================================
  // SCENARIO 12: Very low rate
  // $250,000 at 0.5% for 15yr
  // =====================================================
  describe('Scenario 12: $250,000 at 0.5% for 15yr', () => {
    const inputs = makeInputs({
      loanAmount: 250000,
      annualInterestRate: 0.5,
      loanTermYears: 15,
    });
    let schedule: Payment[];
    let summary: ReturnType<AmortizationService['calculateSummary']>;

    beforeEach(() => {
      schedule = service.generateSchedule(inputs);
      summary = service.calculateSummary(inputs, schedule);
    });

    it('schedule is 180 months', () => {
      expect(summary.monthsToPayoff).toBe(180);
    });

    it('total interest is very low relative to principal', () => {
      // At 0.5% for 15yr, interest should be roughly $9,500
      expect(summary.totalInterest).toBeGreaterThan(5000);
      expect(summary.totalInterest).toBeLessThan(15000);
    });

    it('monthly payment is close to principal / months (since rate is tiny)', () => {
      const simpleDivision = 250000 / 180;
      // With 0.5% rate, payment should be very close to simple division
      expect(Math.abs(summary.monthlyPayment - simpleDivision)).toBeLessThan(60);
    });

    it('passes structural invariants', () => {
      assertScheduleInvariants(schedule, 250000);
    });
  });

  // =====================================================
  // SCENARIO 13: One-time payment in last possible month
  // $100,000 at 5% for 5yr + $2,000 one-time in month 60
  // =====================================================
  describe('Scenario 13: $100,000 at 5% for 5yr + $2,000 one-time month 60 (last month)', () => {
    const inputs = makeInputs({
      loanAmount: 100000,
      annualInterestRate: 5,
      loanTermYears: 5,
      oneTimeExtraPayment: 2000,
      oneTimeExtraPaymentMonth: 60,
    });
    let schedule: Payment[];
    let summary: ReturnType<AmortizationService['calculateSummary']>;

    beforeEach(() => {
      schedule = service.generateSchedule(inputs);
      summary = service.calculateSummary(inputs, schedule);
    });

    it('one-time in last month has minimal effect (balance nearly zero)', () => {
      // By month 60 the balance is very small, so the $2,000 one-time is largely capped
      // The loan should still pay off at or before month 60
      expect(summary.monthsToPayoff).toBeLessThanOrEqual(60);
    });

    it('passes structural invariants', () => {
      assertScheduleInvariants(schedule, 100000);
    });
  });

  // =====================================================
  // Cross-check: monthly payment consistency
  // =====================================================
  describe('Cross-check: monthly payment formula across many configurations', () => {
    const configs = [
      { principal: 100000, rate: 3, years: 15 },
      { principal: 200000, rate: 4.5, years: 30 },
      { principal: 350000, rate: 6, years: 20 },
      { principal: 50000, rate: 7.5, years: 10 },
      { principal: 500000, rate: 3.5, years: 30 },
      { principal: 75000, rate: 9, years: 5 },
      { principal: 1000000, rate: 5.25, years: 30 },
    ];

    for (const cfg of configs) {
      it(`$${cfg.principal.toLocaleString()} at ${cfg.rate}% for ${cfg.years}yr`, () => {
        const r = monthlyRate(cfg.rate);
        const n = cfg.years * 12;
        const servicePayment = service.calculateMonthlyPayment(cfg.principal, r, n);
        const independentPayment = expectedMonthlyPayment(cfg.principal, cfg.rate, cfg.years);
        expect(servicePayment).toBe(independentPayment);
      });
    }
  });
});

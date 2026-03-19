import { describe, it, expect, beforeEach } from 'vitest';
import { AmortizationService } from './amortization.service';
import { LoanInputs } from '../models/amortization.models';

function makeInputs(overrides: Partial<LoanInputs> = {}): LoanInputs {
  return {
    loanAmount: 10000,
    annualInterestRate: 6,
    loanTermYears: 5,
    monthlyExtraPayment: 0,
    oneTimeExtraPayment: 0,
    oneTimeExtraPaymentMonth: 1,
    ...overrides,
  };
}

describe('AmortizationService', () => {
  let service: AmortizationService;

  beforeEach(() => {
    service = new AmortizationService();
  });

  describe('calculateMonthlyPayment', () => {
    it('should calculate standard monthly payment', () => {
      // $10,000 at 6% for 5 years = ~$193.33/month
      const payment = service.calculateMonthlyPayment(10000, 0.005, 60);
      expect(payment).toBeCloseTo(193.33, 1);
    });

    it('should handle 0% interest', () => {
      const payment = service.calculateMonthlyPayment(12000, 0, 12);
      expect(payment).toBe(1000);
    });

    it('should handle large loan with small rate', () => {
      // $500,000 at 3.5% for 30 years
      const monthlyRate = 0.035 / 12;
      const payment = service.calculateMonthlyPayment(500000, monthlyRate, 360);
      expect(payment).toBeCloseTo(2245.22, 0);
    });
  });

  describe('generateSchedule', () => {
    it('should generate correct number of payments for standard loan', () => {
      const inputs = makeInputs();
      const schedule = service.generateSchedule(inputs);
      expect(schedule.length).toBe(60);
    });

    it('should end with zero remaining balance', () => {
      const inputs = makeInputs();
      const schedule = service.generateSchedule(inputs);
      const last = schedule[schedule.length - 1];
      expect(last.remainingBalance).toBe(0);
    });

    it('should have first payment with correct structure', () => {
      const inputs = makeInputs();
      const schedule = service.generateSchedule(inputs);
      const first = schedule[0];

      expect(first.paymentNumber).toBe(1);
      expect(first.interest).toBeCloseTo(50, 0); // 10000 * 0.005
      expect(first.principal).toBeCloseTo(143.33, 0);
      expect(first.paymentAmount).toBeCloseTo(193.33, 0);
      expect(first.extraPayment).toBeUndefined();
      expect(first.totalPayment).toBe(first.paymentAmount);
      expect(first.remainingBalance).toBeLessThan(10000);
    });

    it('should handle 0% interest rate', () => {
      const inputs = makeInputs({ annualInterestRate: 0, loanTermYears: 1 });
      const schedule = service.generateSchedule(inputs);

      expect(schedule.length).toBe(12);
      for (const payment of schedule) {
        expect(payment.interest).toBe(0);
      }
      expect(schedule[schedule.length - 1].remainingBalance).toBe(0);
    });

    it('should reduce term with monthly extra payments', () => {
      const baseInputs = makeInputs();
      const extraInputs = makeInputs({ monthlyExtraPayment: 100 });

      const baseSchedule = service.generateSchedule(baseInputs);
      const extraSchedule = service.generateSchedule(extraInputs);

      expect(extraSchedule.length).toBeLessThan(baseSchedule.length);
      expect(extraSchedule[extraSchedule.length - 1].remainingBalance).toBe(0);
    });

    it('should apply one-time extra payment in correct month', () => {
      const inputs = makeInputs({
        oneTimeExtraPayment: 2000,
        oneTimeExtraPaymentMonth: 3,
      });
      const schedule = service.generateSchedule(inputs);

      // Month 3 should have the one-time extra
      expect(schedule[2].extraPayment).toBeDefined();
      expect(schedule[2].extraPayment!).toBeGreaterThanOrEqual(2000);

      // Other months should not have extra (unless monthly extra is set)
      expect(schedule[0].extraPayment).toBeUndefined();
      expect(schedule[1].extraPayment).toBeUndefined();
    });

    it('should apply one-time payment in month 1', () => {
      const inputs = makeInputs({
        oneTimeExtraPayment: 1000,
        oneTimeExtraPaymentMonth: 1,
      });
      const schedule = service.generateSchedule(inputs);

      expect(schedule[0].extraPayment).toBeDefined();
      expect(schedule[0].extraPayment!).toBeGreaterThanOrEqual(1000);
    });

    it('should cap extra payment when it exceeds remaining balance', () => {
      const inputs = makeInputs({
        loanAmount: 1000,
        annualInterestRate: 5,
        loanTermYears: 1,
        monthlyExtraPayment: 500,
      });
      const schedule = service.generateSchedule(inputs);
      const last = schedule[schedule.length - 1];

      expect(last.remainingBalance).toBe(0);
      // Should pay off early (< 12 months)
      expect(schedule.length).toBeLessThan(12);
    });

    it('should handle final month with reduced payment', () => {
      const inputs = makeInputs();
      const schedule = service.generateSchedule(inputs);
      const last = schedule[schedule.length - 1];

      // Final payment should be <= standard monthly payment
      expect(last.paymentAmount).toBeLessThanOrEqual(
        service.calculateMonthlyPayment(10000, 0.005, 60) + 0.01,
      );
      expect(last.remainingBalance).toBe(0);
    });

    it('should handle very large extra payment that pays off immediately', () => {
      const inputs = makeInputs({
        oneTimeExtraPayment: 50000,
        oneTimeExtraPaymentMonth: 1,
      });
      const schedule = service.generateSchedule(inputs);

      // Should pay off in month 1
      expect(schedule.length).toBe(1);
      expect(schedule[0].remainingBalance).toBe(0);
    });

    it('should handle 0% interest with monthly extra payments', () => {
      const inputs = makeInputs({
        loanAmount: 12000,
        annualInterestRate: 0,
        loanTermYears: 1,
        monthlyExtraPayment: 500,
      });
      const schedule = service.generateSchedule(inputs);

      // $12,000 / ($1,000 + $500) = 8 months
      expect(schedule.length).toBe(8);
      expect(schedule[schedule.length - 1].remainingBalance).toBe(0);
      for (const payment of schedule) {
        expect(payment.interest).toBe(0);
      }
    });

    it('should handle 40-year term loan', () => {
      const inputs = makeInputs({
        loanAmount: 400000,
        annualInterestRate: 7,
        loanTermYears: 40,
      });
      const schedule = service.generateSchedule(inputs);

      expect(schedule.length).toBe(480);
      expect(schedule[schedule.length - 1].remainingBalance).toBe(0);
      // First payment interest: 400000 * (7/12/100) = ~2333.33
      expect(schedule[0].interest).toBeCloseTo(2333.33, 0);
    });

    it('should handle minimum 1-year term loan', () => {
      const inputs = makeInputs({
        loanAmount: 5000,
        annualInterestRate: 4,
        loanTermYears: 1,
      });
      const schedule = service.generateSchedule(inputs);

      expect(schedule.length).toBe(12);
      expect(schedule[schedule.length - 1].remainingBalance).toBe(0);
    });
  });

  describe('calculateSummary', () => {
    it('should return correct summary for standard loan', () => {
      const inputs = makeInputs();
      const schedule = service.generateSchedule(inputs);
      const summary = service.calculateSummary(inputs, schedule);

      expect(summary.monthlyPayment).toBeCloseTo(193.33, 1);
      expect(summary.monthsToPayoff).toBe(60);
      expect(summary.totalInterest).toBeGreaterThan(0);
      expect(summary.totalPayment).toBeGreaterThan(10000);
      expect(summary.totalSaved).toBe(0); // No extra payments
    });

    it('should calculate savings from extra payments', () => {
      const inputs = makeInputs({ monthlyExtraPayment: 100 });
      const schedule = service.generateSchedule(inputs);
      const summary = service.calculateSummary(inputs, schedule);

      expect(summary.totalSaved).toBeGreaterThan(0);
      expect(summary.monthsToPayoff).toBeLessThan(60);
    });

    it('should report zero savings when no extras', () => {
      const inputs = makeInputs();
      const schedule = service.generateSchedule(inputs);
      const summary = service.calculateSummary(inputs, schedule);

      expect(summary.totalSaved).toBe(0);
    });

    it('should compute totalPayment as sum of schedule totalPayments', () => {
      const inputs = makeInputs({ monthlyExtraPayment: 50 });
      const schedule = service.generateSchedule(inputs);
      const summary = service.calculateSummary(inputs, schedule);

      const manualSum = schedule.reduce((s, p) => s + p.totalPayment, 0);
      expect(summary.totalPayment).toBeCloseTo(manualSum, 1);
    });

    it('should report zero savings at 0% interest with extras', () => {
      const inputs = makeInputs({
        loanAmount: 12000,
        annualInterestRate: 0,
        loanTermYears: 1,
        monthlyExtraPayment: 500,
      });
      const schedule = service.generateSchedule(inputs);
      const summary = service.calculateSummary(inputs, schedule);

      // At 0% there is no interest to save
      expect(summary.totalInterest).toBe(0);
      expect(summary.totalSaved).toBe(0);
    });

    it('should handle 40-year term summary', () => {
      const inputs = makeInputs({
        loanAmount: 400000,
        annualInterestRate: 7,
        loanTermYears: 40,
      });
      const schedule = service.generateSchedule(inputs);
      const summary = service.calculateSummary(inputs, schedule);

      expect(summary.monthsToPayoff).toBe(480);
      expect(summary.totalInterest).toBeGreaterThan(400000);
      expect(summary.totalPayment).toBeGreaterThan(800000);
    });
  });
});

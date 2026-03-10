import { Injectable } from '@angular/core';
import { LoanInputs, LoanSummary, Payment } from '../models/amortization.models';
import { roundTo } from '../utils/formatters';

@Injectable()
export class AmortizationService {
  calculateMonthlyPayment(
    principal: number,
    monthlyRate: number,
    numberOfPayments: number,
  ): number {
    if (monthlyRate === 0) {
      return roundTo(principal / numberOfPayments, 2);
    }
    const pow = Math.pow(1 + monthlyRate, numberOfPayments);
    return roundTo((principal * (monthlyRate * pow)) / (pow - 1), 2);
  }

  generateSchedule(inputs: LoanInputs): Payment[] {
    const monthlyRate = roundTo(inputs.annualInterestRate / 100 / 12, 6);
    const n = inputs.loanTermYears * 12;
    const monthlyPayment = this.calculateMonthlyPayment(inputs.loanAmount, monthlyRate, n);

    let balance = inputs.loanAmount;
    const schedule: Payment[] = [];

    for (let month = 1; month <= n && balance > 0; month++) {
      const interestPayment = roundTo(balance * monthlyRate, 2);
      let currentPayment = monthlyPayment;
      let principalPayment = currentPayment - interestPayment;
      let extraPayment = 0;

      // Accumulate extra payments for this month
      if (inputs.monthlyExtraPayment > 0) {
        extraPayment += inputs.monthlyExtraPayment;
      }
      if (
        inputs.oneTimeExtraPayment > 0 &&
        month === inputs.oneTimeExtraPaymentMonth
      ) {
        extraPayment += inputs.oneTimeExtraPayment;
      }

      // Final month cap: if balance can be covered by this payment, or it's the last contractual month
      if (balance + interestPayment <= currentPayment || month === n) {
        currentPayment = roundTo(balance + interestPayment, 2);
        principalPayment = balance;
        extraPayment = 0;
      } else if (principalPayment + extraPayment > balance) {
        // Extra payment cap: don't overpay the balance
        extraPayment = roundTo(balance - principalPayment, 2);
      }

      balance = roundTo(balance - principalPayment - extraPayment, 2);
      if (balance < 0) {
        balance = 0;
      }

      schedule.push({
        paymentNumber: month,
        paymentAmount: currentPayment,
        principal: principalPayment,
        interest: interestPayment,
        extraPayment: extraPayment > 0 ? extraPayment : undefined,
        totalPayment: roundTo(currentPayment + extraPayment, 2),
        remainingBalance: balance,
      });

      if (balance <= 0) break;
    }

    return schedule;
  }

  calculateSummary(inputs: LoanInputs, schedule: Payment[]): LoanSummary {
    const monthlyRate = roundTo(inputs.annualInterestRate / 100 / 12, 6);
    const n = inputs.loanTermYears * 12;
    const monthlyPayment = this.calculateMonthlyPayment(inputs.loanAmount, monthlyRate, n);

    const totalPayment = schedule.reduce((sum, p) => sum + p.totalPayment, 0);
    const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
    const monthsToPayoff = schedule.length;

    // Savings: compare to a no-extras schedule
    const hasExtras = inputs.monthlyExtraPayment > 0 || inputs.oneTimeExtraPayment > 0;
    let totalSaved = 0;
    if (hasExtras) {
      const baselineSchedule = this.generateSchedule({
        ...inputs,
        monthlyExtraPayment: 0,
        oneTimeExtraPayment: 0,
        oneTimeExtraPaymentMonth: 1,
      });
      const baselineInterest = baselineSchedule.reduce((sum, p) => sum + p.interest, 0);
      totalSaved = roundTo(baselineInterest - totalInterest, 2);
    }

    return {
      monthlyPayment,
      totalPayment: roundTo(totalPayment, 2),
      totalInterest: roundTo(totalInterest, 2),
      monthsToPayoff,
      totalSaved: Math.max(0, totalSaved),
    };
  }
}

import { Injectable } from '@angular/core';
import {
  RetirementInputs,
  RetirementProjection,
  WITHDRAWAL_RATE,
  YearlyBalance,
} from '../models/retirement.models';

@Injectable()
export class RetirementService {
  /**
   * Project year-by-year retirement savings, plus the target nest egg
   * to sustain the target monthly budget, the gap, and the monthly
   * contribution required to close it.
   */
  project(inputs: RetirementInputs): RetirementProjection {
    const years = Math.max(0, inputs.retirementAge - inputs.currentAge);
    const monthlyRate = inputs.expectedReturn / 12;

    const yearlyBalances: YearlyBalance[] = [];

    let balance = inputs.currentSavings;
    let totalContributed = 0;

    // Anchor: age 0 point at currentAge
    yearlyBalances.push({
      age: inputs.currentAge,
      balance,
      totalContributed,
    });

    for (let year = 1; year <= years; year++) {
      // Compound monthly for 12 months with monthly contribution added at
      // the end of each month (ordinary annuity behavior).
      for (let month = 0; month < 12; month++) {
        balance = balance * (1 + monthlyRate) + inputs.monthlyContribution;
        totalContributed += inputs.monthlyContribution;
      }

      yearlyBalances.push({
        age: inputs.currentAge + year,
        balance,
        totalContributed,
      });
    }

    const finalBalance = balance;
    const targetNestEgg = (inputs.targetMonthlyBudget * 12) / WITHDRAWAL_RATE;
    const gapAtRetirement = Math.max(0, targetNestEgg - finalBalance);

    return {
      yearlyBalances,
      finalBalance,
      targetNestEgg,
      gapAtRetirement,
      requiredMonthlyToHitGoal: this.solveMonthlyContribution(
        inputs.currentSavings,
        targetNestEgg,
        monthlyRate,
        years * 12,
      ),
      projectedMonthlyIncome: (finalBalance * WITHDRAWAL_RATE) / 12,
      yearsToRetirement: years,
      totalContributed,
    };
  }

  /**
   * Solve for the monthly contribution needed to hit a future value target.
   * Uses the future-value-of-annuity formula:
   *
   *   FV = currentSavings * (1+r)^n + P * ((1+r)^n - 1) / r
   *
   * Solved for P. Returns 0 if the goal is already covered by current savings
   * growth alone.
   */
  private solveMonthlyContribution(
    currentSavings: number,
    targetNestEgg: number,
    monthlyRate: number,
    months: number,
  ): number {
    if (months <= 0) return targetNestEgg;
    if (monthlyRate === 0) {
      const need = targetNestEgg - currentSavings;
      return need <= 0 ? 0 : need / months;
    }

    const growthFactor = Math.pow(1 + monthlyRate, months);
    const projectedFromSavings = currentSavings * growthFactor;
    const stillNeeded = targetNestEgg - projectedFromSavings;

    if (stillNeeded <= 0) return 0;

    return (stillNeeded * monthlyRate) / (growthFactor - 1);
  }
}

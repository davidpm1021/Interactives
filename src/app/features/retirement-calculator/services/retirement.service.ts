import { Injectable } from '@angular/core';
import {
  INCOME_GROWTH,
  INFLATION,
  LIFE_EXPECTANCY,
  POST_RETIREMENT_RETURN,
  PRE_RETIREMENT_RETURN,
  RetirementInputs,
  RetirementProjection,
  YearlyBalance,
} from '../models/retirement.models';

@Injectable()
export class RetirementService {
  /**
   * Project year-by-year retirement savings under the fixed model:
   *
   *   Pre-retirement return: 6% nominal, compounded monthly
   *   Post-retirement return: 5% nominal, drawn down annually
   *   Inflation: 3% (grows the withdrawal each year, and inflates today's
   *     budget input to retirement year for the nest-egg calc)
   *   Life expectancy: 95
   *   Salary growth: 2% per year (informational)
   *
   * Balances are reported in nominal (future) dollars because that's what
   * the account will actually hold at that time. The one exception is
   * `projectedMonthlyIncome`, which is deflated back to today's dollars so
   * it can be compared directly to the user-entered budget.
   */
  project(inputs: RetirementInputs): RetirementProjection {
    const yearsToRetirement = Math.max(0, inputs.retirementAge - inputs.currentAge);
    const yearsInRetirement = Math.max(0, LIFE_EXPECTANCY - inputs.retirementAge);
    const monthlyRate = PRE_RETIREMENT_RETURN / 12;

    // Year-by-year accumulation with monthly compounding + contribution.
    const yearlyBalances: YearlyBalance[] = [];
    let balance = inputs.currentSavings;
    let totalContributed = 0;

    yearlyBalances.push({ age: inputs.currentAge, balance, totalContributed });

    for (let year = 1; year <= yearsToRetirement; year++) {
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

    // Salary grown at INCOME_GROWTH each year (informational; not used in
    // the savings math since contributions are entered as a flat dollar amount).
    const salaryAtRetirement =
      inputs.currentSalary * Math.pow(1 + INCOME_GROWTH, yearsToRetirement);

    // Inflate today's monthly budget to retirement year.
    const budgetAtRetirement =
      inputs.targetMonthlyBudget * Math.pow(1 + INFLATION, yearsToRetirement);
    const firstYearAnnualBudget = budgetAtRetirement * 12;

    // Nest egg needed at retirement to fund a growing-annuity withdrawal
    // that pays budget in year 1 and grows at 3% each subsequent year for
    // `yearsInRetirement` years, with the leftover balance earning 5%.
    const targetNestEgg = this.growingAnnuityPV(
      firstYearAnnualBudget,
      POST_RETIREMENT_RETURN,
      INFLATION,
      yearsInRetirement,
    );

    const gapAtRetirement = Math.max(0, targetNestEgg - finalBalance);

    const requiredMonthlyToHitGoal = this.solveMonthlyContribution(
      inputs.currentSavings,
      targetNestEgg,
      monthlyRate,
      yearsToRetirement * 12,
    );

    // How much monthly income (in today's dollars) does the actual nest
    // egg support over the drawdown?
    const firstYearIncomeNominal = this.solveFirstYearWithdrawal(
      finalBalance,
      POST_RETIREMENT_RETURN,
      INFLATION,
      yearsInRetirement,
    );
    const projectedMonthlyIncome =
      firstYearIncomeNominal / 12 / Math.pow(1 + INFLATION, yearsToRetirement);

    return {
      yearlyBalances,
      finalBalance,
      targetNestEgg,
      gapAtRetirement,
      requiredMonthlyToHitGoal,
      projectedMonthlyIncome,
      yearsToRetirement,
      yearsInRetirement,
      totalContributed,
      salaryAtRetirement,
      budgetAtRetirement,
    };
  }

  /**
   * Present value of a growing annuity paying P in year 1, growing at g each
   * year, discounted at r, for n years (payments at end of year).
   *
   *   PV = P * (1 - ((1+g)/(1+r))^n) / (r - g)   when r != g
   *   PV = P * n / (1 + r)                        when r == g
   */
  private growingAnnuityPV(P: number, r: number, g: number, n: number): number {
    if (n <= 0 || P <= 0) return 0;
    if (Math.abs(r - g) < 1e-9) return (P * n) / (1 + r);
    return (P * (1 - Math.pow((1 + g) / (1 + r), n))) / (r - g);
  }

  /**
   * Inverse of growingAnnuityPV: given a lump sum PV, solve for the year-1
   * payment of the same growing annuity.
   */
  private solveFirstYearWithdrawal(PV: number, r: number, g: number, n: number): number {
    if (n <= 0 || PV <= 0) return 0;
    if (Math.abs(r - g) < 1e-9) return (PV * (1 + r)) / n;
    return (PV * (r - g)) / (1 - Math.pow((1 + g) / (1 + r), n));
  }

  /**
   * Monthly contribution needed to grow currentSavings into targetNestEgg
   * over `months` months at `monthlyRate` per month. Uses future-value-of-
   * annuity solved for the payment.
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

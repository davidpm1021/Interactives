import { Injectable } from '@angular/core';
import {
  ChartPoint,
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
   * Project year-by-year retirement savings under the fixed NerdWallet-style
   * model:
   *
   *   Pre-retirement return: 6% per year, compounded annually
   *   Post-retirement return: 5% per year during drawdown
   *   Inflation: 3% per year (grows both target budget and yearly withdrawal)
   *   Life expectancy: 95
   *   Salary growth: 2% per year, applied to the monthly contribution too
   *     (the contribution is treated as a constant % of income, so it grows
   *     as income grows)
   *
   * Balances are in nominal (future) dollars. `projectedMonthlyIncome` is
   * deflated back to today's dollars so it can be compared directly with
   * the entered budget.
   */
  project(inputs: RetirementInputs): RetirementProjection {
    const yearsToRetirement = Math.max(0, inputs.retirementAge - inputs.currentAge);
    // 29 years to fund from age 67 through age 95 inclusive (matches
    // NerdWallet's empirical output).
    const yearsInRetirement = Math.max(0, LIFE_EXPECTANCY - inputs.retirementAge + 1);
    const r = PRE_RETIREMENT_RETURN;
    const g = INCOME_GROWTH;

    // Year-by-year accumulation. Annual compounding; end-of-year contribution
    // (ordinary annuity). The monthly contribution grows 2% at the start of
    // each new year so year 1 uses the user's input, year 2 uses input * 1.02,
    // etc. This matches NerdWallet's model.
    const yearlyBalances: YearlyBalance[] = [];
    let balance = inputs.currentSavings;
    let totalContributed = 0;
    let monthlyContrib = inputs.monthlyContribution;

    yearlyBalances.push({ age: inputs.currentAge, balance, totalContributed });

    for (let year = 1; year <= yearsToRetirement; year++) {
      const yearContribution = monthlyContrib * 12;
      balance = balance * (1 + r) + yearContribution;
      totalContributed += yearContribution;
      yearlyBalances.push({
        age: inputs.currentAge + year,
        balance,
        totalContributed,
      });
      monthlyContrib *= 1 + g; // grow contribution for next year
    }

    const finalBalance = balance;

    const salaryAtRetirement =
      inputs.currentSalary * Math.pow(1 + g, yearsToRetirement);

    // Inflate today's monthly budget to retirement year.
    const budgetAtRetirement =
      inputs.targetMonthlyBudget * Math.pow(1 + INFLATION, yearsToRetirement);
    const firstYearAnnualBudget = budgetAtRetirement * 12;

    // Nest egg needed at retirement to fund a growing-annuity withdrawal
    // over yearsInRetirement.
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
      r,
      g,
      yearsToRetirement,
    );

    // What monthly income (in today's dollars) does the projected nest egg
    // support over the drawdown?
    const firstYearIncomeNominal = this.solveFirstYearWithdrawal(
      finalBalance,
      POST_RETIREMENT_RETURN,
      INFLATION,
      yearsInRetirement,
    );
    const projectedMonthlyIncome =
      firstYearIncomeNominal / 12 / Math.pow(1 + INFLATION, yearsToRetirement);

    const chartData = this.buildChartData(
      inputs,
      yearsToRetirement,
      yearsInRetirement,
      finalBalance,
      targetNestEgg,
      budgetAtRetirement,
      requiredMonthlyToHitGoal,
      r,
      g,
    );

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
      chartData,
    };
  }

  /**
   * "What you'll have vs. what you'll need" over the full lifetime.
   *
   * Accumulation phase: both series grow via the same 6% annual + 2%
   * contribution-growth model. `actual` uses the user's monthlyContribution;
   * `target` uses the requiredMonthlyToHitGoal (year-1) so it lands at
   * exactly targetNestEgg at retirement.
   *
   * Drawdown phase: each series starts at its own peak and each year
   * withdraws the inflating budget while remaining balance grows at 5%.
   * The target line hits ~0 at age 95 by construction; the actual line
   * may hit 0 earlier if the user is under-saving.
   */
  private buildChartData(
    inputs: RetirementInputs,
    yearsToRetirement: number,
    yearsInRetirement: number,
    finalBalance: number,
    targetNestEgg: number,
    budgetAtRetirement: number,
    requiredMonthly: number,
    r: number,
    g: number,
  ): ChartPoint[] {
    const out: ChartPoint[] = [];
    // If the user is already on track or over, "target" contribution equals
    // the user's own contribution (there's no additional required amount).
    const needStartingMonthly = requiredMonthly > 0
      ? requiredMonthly
      : inputs.monthlyContribution;

    let actualBalance = inputs.currentSavings;
    let targetBalance = inputs.currentSavings;
    let actualContrib = inputs.monthlyContribution;
    let targetContrib = needStartingMonthly;

    out.push({
      age: inputs.currentAge,
      actual: actualBalance,
      target: targetBalance,
      phase: 'accumulation',
    });

    for (let year = 1; year <= yearsToRetirement; year++) {
      actualBalance = actualBalance * (1 + r) + actualContrib * 12;
      targetBalance = targetBalance * (1 + r) + targetContrib * 12;
      out.push({
        age: inputs.currentAge + year,
        actual: actualBalance,
        target: targetBalance,
        phase: 'accumulation',
      });
      actualContrib *= 1 + g;
      targetContrib *= 1 + g;
    }

    // If the user's actual accumulation overshoots targetNestEgg, the target
    // line at retirement should still show targetNestEgg (not the higher
    // actual). Snap the target curve to targetNestEgg at retirement so the
    // drawdown starts from the correct base.
    if (out.length > 0) {
      out[out.length - 1] = { ...out[out.length - 1], target: targetNestEgg };
    }

    // Drawdown phase.
    let actualDraw = finalBalance;
    let targetDraw = targetNestEgg;
    let withdrawal = budgetAtRetirement * 12;

    for (let k = 1; k <= yearsInRetirement; k++) {
      actualDraw = Math.max(0, actualDraw * (1 + POST_RETIREMENT_RETURN) - withdrawal);
      targetDraw = Math.max(0, targetDraw * (1 + POST_RETIREMENT_RETURN) - withdrawal);
      out.push({
        age: inputs.retirementAge + k,
        actual: actualDraw,
        target: targetDraw,
        phase: 'drawdown',
      });
      withdrawal *= 1 + INFLATION;
    }

    return out;
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
   * Solve for the year-1 monthly contribution needed to grow currentSavings
   * into targetNestEgg over `years` years, given:
   *   - contributions applied end-of-year and compounded annually at rate r
   *   - each subsequent year's contribution grows by rate g
   *
   * From the growing-annuity future value:
   *   FV = S * (1+r)^n + P_annual * ((1+r)^n - (1+g)^n) / (r - g)
   *
   * Return the monthly (annual / 12).
   */
  private solveMonthlyContribution(
    currentSavings: number,
    targetNestEgg: number,
    r: number,
    g: number,
    years: number,
  ): number {
    if (years <= 0) return targetNestEgg;
    const growthFactor = Math.pow(1 + r, years);
    const projectedFromSavings = currentSavings * growthFactor;
    const stillNeeded = targetNestEgg - projectedFromSavings;
    if (stillNeeded <= 0) return 0;

    let annualYearOne: number;
    if (Math.abs(r - g) < 1e-9) {
      // r == g: FV_contribs = P_annual * n * (1+r)^(n-1)
      annualYearOne = stillNeeded / (years * Math.pow(1 + r, years - 1));
    } else {
      annualYearOne =
        (stillNeeded * (r - g)) / (Math.pow(1 + r, years) - Math.pow(1 + g, years));
    }
    return annualYearOne / 12;
  }
}

import { Injectable } from '@angular/core';
import {
  ChartPoint,
  DEFAULT_ASSUMPTIONS,
  EmployerMatch,
  LIFE_EXPECTANCY,
  RetirementAssumptions,
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
  project(
    inputs: RetirementInputs,
    assumptions: RetirementAssumptions = DEFAULT_ASSUMPTIONS,
  ): RetirementProjection {
    const yearsToRetirement = Math.max(0, inputs.retirementAge - inputs.currentAge);
    // 29 years to fund from age 67 through age 95 inclusive (matches
    // NerdWallet's empirical output).
    const yearsInRetirement = Math.max(0, LIFE_EXPECTANCY - inputs.retirementAge + 1);
    const r = assumptions.preReturn;
    const g = assumptions.incomeGrowth;
    const postR = assumptions.postReturn;
    const inflation = assumptions.inflation;
    const match = inputs.employerMatch;

    // Year-by-year accumulation. Annual compounding; end-of-year contribution
    // (ordinary annuity). The monthly contribution grows 2% at the start of
    // each new year so year 1 uses the user's input, year 2 uses input * 1.02,
    // etc. This matches NerdWallet's model.
    const yearlyBalances: YearlyBalance[] = [];
    let balance = inputs.currentSavings;
    let totalContributed = 0;
    let totalEmployerMatch = 0;
    let monthlyContrib = inputs.monthlyContribution;
    let salary = inputs.currentSalary;

    yearlyBalances.push({ age: inputs.currentAge, balance, totalContributed });

    for (let year = 1; year <= yearsToRetirement; year++) {
      const step = this.stepYear(balance, monthlyContrib, salary, r, match);
      const yearEmployeeContribution = step.employee;
      const yearEmployerMatch = step.employer;
      balance = step.balance;
      totalContributed += yearEmployeeContribution;
      totalEmployerMatch += yearEmployerMatch;
      yearlyBalances.push({
        age: inputs.currentAge + year,
        balance,
        totalContributed,
      });
      monthlyContrib *= 1 + g; // grow contribution for next year
      salary *= 1 + g;          // salary grows at the same rate
    }

    const finalBalance = balance;

    const salaryAtRetirement =
      inputs.currentSalary * Math.pow(1 + g, yearsToRetirement);

    // Inflate today's monthly budget to retirement year.
    const budgetAtRetirement =
      inputs.targetMonthlyBudget * Math.pow(1 + inflation, yearsToRetirement);
    const firstYearAnnualBudget = budgetAtRetirement * 12;

    // Nest egg needed at retirement to fund a growing-annuity withdrawal
    // over yearsInRetirement.
    const targetNestEgg = this.growingAnnuityPV(
      firstYearAnnualBudget,
      postR,
      inflation,
      yearsInRetirement,
    );

    // Signed: positive = shortfall, negative = surplus over target.
    const gapAtRetirement = targetNestEgg - finalBalance;

    const requiredMonthlyToHitGoal = this.solveMonthlyContribution(
      inputs,
      targetNestEgg,
      r,
      g,
      yearsToRetirement,
    );

    // What monthly income (in today's dollars) does the projected nest egg
    // support over the drawdown?
    const firstYearIncomeNominal = this.solveFirstYearWithdrawal(
      finalBalance,
      postR,
      inflation,
      yearsInRetirement,
    );
    const projectedMonthlyIncome =
      firstYearIncomeNominal / 12 / Math.pow(1 + inflation, yearsToRetirement);

    const noMatchFinalBalance = this.projectNoMatchFinalBalance(inputs, r, g, yearsToRetirement);

    const chartData = this.buildChartData(
      inputs,
      yearsToRetirement,
      yearsInRetirement,
      finalBalance,
      noMatchFinalBalance,
      targetNestEgg,
      budgetAtRetirement,
      requiredMonthlyToHitGoal,
      r,
      g,
      postR,
      inflation,
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
      totalEmployerMatch,
      salaryAtRetirement,
      budgetAtRetirement,
      chartData,
    };
  }

  /**
   * Annual employer match dollars given the year's employee contribution,
   * annual salary, and match config. Standard "N% match up to M% of salary"
   * formula: employer matches matchRate of employee's contribution, but only
   * the portion of the contribution up to (capPct × salary) is match-eligible.
   */
  private annualEmployerMatch(
    yearEmployeeContribution: number,
    salary: number,
    match: EmployerMatch | undefined,
  ): number {
    if (!match || salary <= 0) return 0;
    const capAmount = salary * match.capPct;
    const eligible = Math.min(yearEmployeeContribution, capAmount);
    return Math.max(0, eligible) * match.matchRate;
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
    noMatchFinalBalance: number,
    targetNestEgg: number,
    budgetAtRetirement: number,
    requiredMonthly: number,
    r: number,
    g: number,
    postR: number,
    inflation: number,
  ): ChartPoint[] {
    const out: ChartPoint[] = [];
    // If the user is already on track or over, "target" contribution equals
    // the user's own contribution (there's no additional required amount).
    const needStartingMonthly = requiredMonthly > 0
      ? requiredMonthly
      : inputs.monthlyContribution;

    let actualBalance = inputs.currentSavings;
    let noMatchBalance = inputs.currentSavings;
    let targetBalance = inputs.currentSavings;
    let actualContrib = inputs.monthlyContribution;
    let targetContrib = needStartingMonthly;
    let salary = inputs.currentSalary;

    out.push({
      age: inputs.currentAge,
      actual: actualBalance,
      actualNoMatch: noMatchBalance,
      target: targetBalance,
      phase: 'accumulation',
    });

    for (let year = 1; year <= yearsToRetirement; year++) {
      const employeeAnnual = actualContrib * 12;
      const employerAnnual = this.annualEmployerMatch(employeeAnnual, salary, inputs.employerMatch);
      actualBalance = actualBalance * (1 + r) + employeeAnnual + employerAnnual;
      noMatchBalance = noMatchBalance * (1 + r) + employeeAnnual;
      targetBalance = targetBalance * (1 + r) + targetContrib * 12;
      out.push({
        age: inputs.currentAge + year,
        actual: actualBalance,
        actualNoMatch: noMatchBalance,
        target: targetBalance,
        phase: 'accumulation',
      });
      actualContrib *= 1 + g;
      targetContrib *= 1 + g;
      salary *= 1 + g;
    }

    // If the user's actual accumulation overshoots targetNestEgg, the target
    // line at retirement should still show targetNestEgg (not the higher
    // actual). Snap the target curve to targetNestEgg at retirement so the
    // drawdown starts from the correct base.
    if (out.length > 0) {
      out[out.length - 1] = { ...out[out.length - 1], target: targetNestEgg };
    }

    // Drawdown phase. Both actual and no-match series draw the same
    // withdrawal schedule; the smaller starting balance runs out sooner.
    let actualDraw = finalBalance;
    let noMatchDraw = noMatchFinalBalance;
    let targetDraw = targetNestEgg;
    let withdrawal = budgetAtRetirement * 12;

    for (let k = 1; k <= yearsInRetirement; k++) {
      actualDraw = Math.max(0, actualDraw * (1 + postR) - withdrawal);
      noMatchDraw = Math.max(0, noMatchDraw * (1 + postR) - withdrawal);
      targetDraw = Math.max(0, targetDraw * (1 + postR) - withdrawal);
      out.push({
        age: inputs.retirementAge + k,
        actual: actualDraw,
        actualNoMatch: noMatchDraw,
        target: targetDraw,
        phase: 'drawdown',
      });
      withdrawal *= 1 + inflation;
    }

    return out;
  }

  /**
   * Final balance ignoring employer match — needed as the starting point of
   * the "no match" drawdown line on the chart.
   */
  private projectNoMatchFinalBalance(
    inputs: RetirementInputs,
    r: number,
    g: number,
    yearsToRetirement: number,
  ): number {
    let balance = inputs.currentSavings;
    let monthly = inputs.monthlyContribution;
    for (let year = 1; year <= yearsToRetirement; year++) {
      balance = balance * (1 + r) + monthly * 12;
      monthly *= 1 + g;
    }
    return balance;
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
  /**
   * One year of accumulation. The single place the recurrence lives, so the
   * projection the student sees and the solver below can't drift apart.
   */
  private stepYear(
    balance: number,
    monthlyContrib: number,
    salary: number,
    r: number,
    match: EmployerMatch | undefined,
  ): { balance: number; employee: number; employer: number } {
    const employee = monthlyContrib * 12;
    const employer = this.annualEmployerMatch(employee, salary, match);
    return { balance: balance * (1 + r) + employee + employer, employee, employer };
  }

  /** Final balance for a given starting monthly contribution. */
  private accumulate(
    monthlyContribution: number,
    inputs: RetirementInputs,
    r: number,
    g: number,
    years: number,
  ): number {
    let balance = inputs.currentSavings;
    let monthlyContrib = monthlyContribution;
    let salary = inputs.currentSalary;
    for (let year = 1; year <= years; year++) {
      balance = this.stepYear(balance, monthlyContrib, salary, r, inputs.employerMatch).balance;
      monthlyContrib *= 1 + g;
      salary *= 1 + g;
    }
    return balance;
  }

  /**
   * Monthly contribution needed to reach the target.
   *
   * Solved numerically against the same accumulation the chart is drawn from,
   * rather than with a closed-form annuity formula. The closed form had no way
   * to express the employer match, so the answer ignored it entirely: with a
   * 50%-up-to-6% match the projected balance rose by ~$295,000 while this
   * figure didn't move, telling a student to contribute more than they need.
   * The match is also piecewise (it stops at the cap), which a single formula
   * can't capture cleanly anyway.
   */
  private solveMonthlyContribution(
    inputs: RetirementInputs,
    targetNestEgg: number,
    r: number,
    g: number,
    years: number,
  ): number {
    if (years <= 0) return targetNestEgg;
    // Existing savings alone already get there.
    if (this.accumulate(0, inputs, r, g, years) >= targetNestEgg) return 0;

    let lo = 0;
    let hi = Math.max(1000, targetNestEgg / (years * 12));
    // Widen until the target is bracketed, with a ceiling so a pathological
    // input can't spin here.
    let guard = 0;
    while (this.accumulate(hi, inputs, r, g, years) < targetNestEgg && guard++ < 60) {
      hi *= 2;
    }

    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (this.accumulate(mid, inputs, r, g, years) < targetNestEgg) lo = mid;
      else hi = mid;
    }
    return hi;
  }
}

import { RetirementService } from './retirement.service';
import {
  DEFAULT_INPUTS,
  INCOME_GROWTH,
  INFLATION,
  LIFE_EXPECTANCY,
  POST_RETIREMENT_RETURN,
  PRE_RETIREMENT_RETURN,
  RetirementInputs,
} from '../models/retirement.models';

describe('RetirementService', () => {
  let service: RetirementService;

  beforeEach(() => {
    service = new RetirementService();
  });

  it('produces one balance row per year including age 0 anchor', () => {
    const inputs: RetirementInputs = { ...DEFAULT_INPUTS, currentAge: 40, retirementAge: 45 };
    const p = service.project(inputs);
    expect(p.yearlyBalances.length).toBe(6);
    expect(p.yearlyBalances[0].age).toBe(40);
    expect(p.yearlyBalances[5].age).toBe(45);
  });

  it('grows starting savings alone with no monthly contribution (annual compounding)', () => {
    const inputs: RetirementInputs = {
      ...DEFAULT_INPUTS,
      currentAge: 30,
      retirementAge: 60,
      currentSavings: 10_000,
      monthlyContribution: 0,
    };
    const p = service.project(inputs);
    // 10_000 * 1.06^30 = 57,434.91
    expect(p.finalBalance).toBeCloseTo(10_000 * Math.pow(1 + PRE_RETIREMENT_RETURN, 30), 1);
    expect(p.totalContributed).toBe(0);
  });

  it('grows contributions at 2% per year and matches NerdWallet', () => {
    // Scenario the user compared against NerdWallet:
    //   age 40, retire at 67, $60k salary, $0 savings, $500/mo, $2225/mo budget
    // NerdWallet projected nest egg: $467,319; needed: $1,267,661.
    const p = service.project({
      currentAge: 40,
      retirementAge: 67,
      currentSalary: 60_000,
      currentSavings: 0,
      monthlyContribution: 500,
      targetMonthlyBudget: 2225,
    });
    // Closed form for growing annuity FV, annual compounding:
    //   FV = P_annual * ((1+r)^n - (1+g)^n) / (r - g)
    //   6000 * (1.06^27 - 1.02^27) / 0.04
    const expectedFinal =
      (500 * 12 * (Math.pow(1.06, 27) - Math.pow(1.02, 27))) / (1.06 - 1.02);
    expect(p.finalBalance).toBeCloseTo(expectedFinal, 0);
    // ~$467K, matching NerdWallet within rounding.
    expect(p.finalBalance).toBeGreaterThan(465_000);
    expect(p.finalBalance).toBeLessThan(470_000);
    // NerdWallet reports $1,267,661. We match within tens of dollars.
    expect(p.targetNestEgg).toBeGreaterThan(1_267_000);
    expect(p.targetNestEgg).toBeLessThan(1_268_500);
  });

  it('exposes hardcoded years in retirement based on life expectancy 95', () => {
    const p = service.project({ ...DEFAULT_INPUTS, retirementAge: 67 });
    expect(p.yearsInRetirement).toBe(LIFE_EXPECTANCY - 67 + 1);
  });

  it('inflates the target budget to retirement year', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 30,
      retirementAge: 67,
      targetMonthlyBudget: 3000,
    });
    const expected = 3000 * Math.pow(1 + INFLATION, 37);
    expect(p.budgetAtRetirement).toBeCloseTo(expected, 1);
  });

  it('computes target nest egg via growing-annuity present value', () => {
    const inputs: RetirementInputs = {
      ...DEFAULT_INPUTS,
      currentAge: 67,
      retirementAge: 67,
      targetMonthlyBudget: 3000,
    };
    const p = service.project(inputs);
    const n = LIFE_EXPECTANCY - 67 + 1;
    const P = 3000 * 12;
    const r = POST_RETIREMENT_RETURN;
    const g = INFLATION;
    const expected = (P * (1 - Math.pow((1 + g) / (1 + r), n))) / (r - g);
    expect(p.targetNestEgg).toBeCloseTo(expected, 1);
  });

  it('reports a gap when projected balance is below target', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 40,
      retirementAge: 67,
      currentSavings: 0,
      monthlyContribution: 500,
      targetMonthlyBudget: 3000,
    });
    expect(p.gapAtRetirement).toBeGreaterThan(0);
    expect(p.finalBalance).toBeLessThan(p.targetNestEgg);
  });

  it('reports zero gap when projection meets target', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 22,
      retirementAge: 67,
      currentSavings: 0,
      monthlyContribution: 5000,
      targetMonthlyBudget: 3000,
    });
    expect(p.finalBalance).toBeGreaterThan(p.targetNestEgg);
    expect(p.gapAtRetirement).toBe(0);
  });

  it('solves required (year-1) monthly contribution that would hit the target exactly', () => {
    const base: RetirementInputs = {
      ...DEFAULT_INPUTS,
      currentAge: 40,
      retirementAge: 67,
      currentSavings: 0,
      monthlyContribution: 500,
      targetMonthlyBudget: 3000,
    };
    const p = service.project(base);
    expect(p.requiredMonthlyToHitGoal).toBeGreaterThan(500);
    // Re-run with the required starting monthly, gap should be ~0.
    const p2 = service.project({ ...base, monthlyContribution: p.requiredMonthlyToHitGoal });
    expect(Math.abs(p2.finalBalance - p2.targetNestEgg) / p2.targetNestEgg).toBeLessThan(0.005);
  });

  it('returns zero required monthly when currentSavings alone covers the goal', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 30,
      retirementAge: 67,
      currentSavings: 5_000_000,
      monthlyContribution: 0,
      targetMonthlyBudget: 3000,
    });
    expect(p.requiredMonthlyToHitGoal).toBe(0);
  });

  it('reports projected monthly income in today\'s dollars', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentSavings: 1_000_000,
      monthlyContribution: 0,
      currentAge: 67,
      retirementAge: 67,
    });
    const n = LIFE_EXPECTANCY - 67 + 1;
    const r = POST_RETIREMENT_RETURN;
    const g = INFLATION;
    const expectedFirstYearAnnual = (1_000_000 * (r - g)) / (1 - Math.pow((1 + g) / (1 + r), n));
    const expectedMonthlyToday = expectedFirstYearAnnual / 12;
    expect(p.projectedMonthlyIncome).toBeCloseTo(expectedMonthlyToday, 1);
  });

  it('grows salary at 2 percent per year', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 30,
      retirementAge: 60,
      currentSalary: 60_000,
    });
    expect(p.salaryAtRetirement).toBeCloseTo(60_000 * Math.pow(1 + INCOME_GROWTH, 30), 1);
  });

  it('handles zero-year horizon (retirement == current age)', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 67,
      retirementAge: 67,
      currentSavings: 100_000,
      monthlyContribution: 500,
    });
    expect(p.yearsToRetirement).toBe(0);
    expect(p.finalBalance).toBe(100_000);
    expect(p.yearlyBalances.length).toBe(1);
  });

  it('delaying retirement 3 years reduces the gap', () => {
    const base: RetirementInputs = {
      ...DEFAULT_INPUTS,
      currentAge: 40,
      retirementAge: 67,
      currentSavings: 0,
      monthlyContribution: 500,
      targetMonthlyBudget: 3000,
    };
    const p67 = service.project(base);
    const p70 = service.project({ ...base, retirementAge: 70 });
    expect(p70.gapAtRetirement).toBeLessThan(p67.gapAtRetirement);
  });
});

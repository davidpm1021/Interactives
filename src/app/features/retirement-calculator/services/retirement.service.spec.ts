import { RetirementService } from './retirement.service';
import {
  DEFAULT_INPUTS,
  INFLATION,
  LIFE_EXPECTANCY,
  POST_RETIREMENT_RETURN,
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

  it('grows starting savings alone with no monthly contribution', () => {
    const inputs: RetirementInputs = {
      ...DEFAULT_INPUTS,
      currentAge: 30,
      retirementAge: 60,
      currentSavings: 10000,
      monthlyContribution: 0,
    };
    const p = service.project(inputs);
    // 30 years compounded monthly at 0.5%/mo: 10000 * (1.005)^360 ≈ 60225
    expect(p.finalBalance).toBeGreaterThan(59000);
    expect(p.finalBalance).toBeLessThan(62000);
    expect(p.totalContributed).toBe(0);
  });

  it('exposes hardcoded years in retirement based on life expectancy 95', () => {
    const p = service.project({ ...DEFAULT_INPUTS, retirementAge: 67 });
    expect(p.yearsInRetirement).toBe(LIFE_EXPECTANCY - 67);
  });

  it('inflates the target budget to retirement year', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 30,
      retirementAge: 67,
      targetMonthlyBudget: 3000,
    });
    // 3000 * 1.03^37
    const expected = 3000 * Math.pow(1 + INFLATION, 37);
    expect(p.budgetAtRetirement).toBeCloseTo(expected, 1);
  });

  it('computes target nest egg via growing-annuity present value', () => {
    // With yearsToRetirement = 0, budgetAtRetirement === targetMonthlyBudget * 12.
    // Then targetNestEgg == PV of annuity paying that amount for n years,
    // growing at 3%, discounted at 5%.
    const inputs: RetirementInputs = {
      ...DEFAULT_INPUTS,
      currentAge: 67,
      retirementAge: 67,
      targetMonthlyBudget: 3000,
    };
    const p = service.project(inputs);
    const n = LIFE_EXPECTANCY - 67;
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
      monthlyContribution: 5000, // aggressive contribution swamps the target
      targetMonthlyBudget: 3000,
    });
    expect(p.finalBalance).toBeGreaterThan(p.targetNestEgg);
    expect(p.gapAtRetirement).toBe(0);
  });

  it('solves required monthly contribution that would hit the target exactly', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 40,
      retirementAge: 67,
      currentSavings: 0,
      monthlyContribution: 500,
      targetMonthlyBudget: 3000,
    });
    expect(p.requiredMonthlyToHitGoal).toBeGreaterThan(500);
    const p2 = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 40,
      retirementAge: 67,
      currentSavings: 0,
      monthlyContribution: p.requiredMonthlyToHitGoal,
      targetMonthlyBudget: 3000,
    });
    // Within 0.5% due to rounding.
    expect(Math.abs(p2.finalBalance - p2.targetNestEgg) / p2.targetNestEgg).toBeLessThan(0.005);
  });

  it('returns zero required monthly when currentSavings alone covers the goal', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 30,
      retirementAge: 67,
      currentSavings: 5_000_000, // huge head start swamps any inflated target
      monthlyContribution: 0,
      targetMonthlyBudget: 3000,
    });
    expect(p.requiredMonthlyToHitGoal).toBe(0);
  });

  it('reports projected monthly income in today\'s dollars', () => {
    // If retirement is now (yearsToRetirement=0), no deflation, and the
    // nest egg supports a growing-annuity draw over the drawdown horizon.
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentSavings: 1_000_000,
      monthlyContribution: 0,
      currentAge: 67,
      retirementAge: 67,
    });
    const n = LIFE_EXPECTANCY - 67;
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
    // 60_000 * 1.02^30
    expect(p.salaryAtRetirement).toBeCloseTo(60_000 * Math.pow(1.02, 30), 1);
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

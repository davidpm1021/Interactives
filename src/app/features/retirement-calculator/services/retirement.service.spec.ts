import { RetirementService } from './retirement.service';
import { DEFAULT_INPUTS, RetirementInputs } from '../models/retirement.models';

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
      expectedReturn: 0.06,
    };
    const p = service.project(inputs);
    // 30 years compounded monthly at 0.5%/mo: 10000 * (1.005)^360 ≈ 60225
    expect(p.finalBalance).toBeGreaterThan(59000);
    expect(p.finalBalance).toBeLessThan(62000);
    expect(p.totalContributed).toBe(0);
  });

  it('computes target nest egg using the 4% rule', () => {
    const p = service.project({ ...DEFAULT_INPUTS, targetMonthlyBudget: 2225 });
    // 2225 * 12 / 0.04 = 667,500
    expect(p.targetNestEgg).toBe(667500);
  });

  it('reports a gap when projected balance is below target', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 40,
      retirementAge: 67,
      currentSavings: 0,
      monthlyContribution: 500,
      targetMonthlyBudget: 2225,
    });
    expect(p.gapAtRetirement).toBeGreaterThan(0);
    expect(p.targetNestEgg).toBe(667500);
    expect(p.finalBalance).toBeLessThan(p.targetNestEgg);
  });

  it('reports zero gap when projection meets target', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 22,
      retirementAge: 67,
      currentSavings: 0,
      monthlyContribution: 1200,
      targetMonthlyBudget: 4000,
    });
    // At 45 years, $1200/mo at 6% real should crush the target
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
      targetMonthlyBudget: 2225,
    });
    // The required-monthly should be higher than the current $500 (since there's a gap)
    expect(p.requiredMonthlyToHitGoal).toBeGreaterThan(500);
    // Sanity: re-run with the required monthly, gap should be ~0
    const p2 = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 40,
      retirementAge: 67,
      currentSavings: 0,
      monthlyContribution: p.requiredMonthlyToHitGoal,
      targetMonthlyBudget: 2225,
    });
    // Within 0.5% due to rounding
    expect(Math.abs(p2.finalBalance - p2.targetNestEgg) / p2.targetNestEgg).toBeLessThan(0.005);
  });

  it('returns zero required monthly when currentSavings alone covers the goal', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 30,
      retirementAge: 67,
      currentSavings: 500000, // huge head start
      monthlyContribution: 0,
      targetMonthlyBudget: 2225,
      expectedReturn: 0.06,
    });
    expect(p.requiredMonthlyToHitGoal).toBe(0);
  });

  it('reports projected monthly income under the 4% rule', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentSavings: 1000000,
      monthlyContribution: 0,
      currentAge: 67,
      retirementAge: 67, // no growth
    });
    // 1,000,000 * 0.04 / 12 ≈ 3333.33
    expect(p.projectedMonthlyIncome).toBeCloseTo(3333.33, 1);
  });

  it('handles zero-year horizon (retirement == current age)', () => {
    const p = service.project({
      ...DEFAULT_INPUTS,
      currentAge: 67,
      retirementAge: 67,
      currentSavings: 100000,
      monthlyContribution: 500,
    });
    expect(p.yearsToRetirement).toBe(0);
    expect(p.finalBalance).toBe(100000);
    expect(p.yearlyBalances.length).toBe(1);
  });

  it('delaying retirement 3 years reduces the gap', () => {
    const base: RetirementInputs = {
      ...DEFAULT_INPUTS,
      currentAge: 40,
      retirementAge: 67,
      currentSavings: 0,
      monthlyContribution: 500,
      targetMonthlyBudget: 2225,
    };
    const p67 = service.project(base);
    const p70 = service.project({ ...base, retirementAge: 70 });
    expect(p70.gapAtRetirement).toBeLessThan(p67.gapAtRetirement);
  });
});

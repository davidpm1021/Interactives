export interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
  currentSalary: number;
  currentSavings: number;
  monthlyContribution: number;
  /** In today's dollars. Model inflates this to retirement year internally. */
  targetMonthlyBudget: number;
}

export interface YearlyBalance {
  age: number;
  balance: number;
  totalContributed: number;
}

/** One year of the "What you'll have vs. what you'll need" comparison. */
export interface ChartPoint {
  age: number;
  /** Balance you're projected to have at end of this year, in nominal dollars. */
  actual: number;
  /** Balance you'd need to have at end of this year to end at zero at 95, nominal. */
  target: number;
  phase: 'accumulation' | 'drawdown';
}

export interface RetirementProjection {
  yearlyBalances: YearlyBalance[];
  /** Balance at retirement age, in nominal (future) dollars. */
  finalBalance: number;
  /** Lump sum needed at retirement to fund the drawdown, in nominal (future) dollars. */
  targetNestEgg: number;
  /** Signed: positive = shortfall, negative = surplus over target. */
  gapAtRetirement: number;
  requiredMonthlyToHitGoal: number;
  /** Monthly income the projected nest egg supports, expressed in today's dollars. */
  projectedMonthlyIncome: number;
  yearsToRetirement: number;
  yearsInRetirement: number;
  totalContributed: number;
  /** Salary at retirement year, in nominal dollars, after INCOME_GROWTH compounding. */
  salaryAtRetirement: number;
  /** targetMonthlyBudget inflated to retirement year, in nominal dollars. */
  budgetAtRetirement: number;
  /** Full-lifetime chart data from currentAge through age 95. */
  chartData: ChartPoint[];
}

// ── Hardcoded model constants (not user-editable) ───────────
export const LIFE_EXPECTANCY = 95;

/** Editable macro assumptions surfaced under the results panel. */
export interface RetirementAssumptions {
  /** Annual real return on the balance while working. */
  preReturn: number;
  /** Annual return on the remaining balance during drawdown. */
  postReturn: number;
  /** Annual inflation rate applied to the target budget + withdrawals. */
  inflation: number;
  /** Annual salary/contribution growth. */
  incomeGrowth: number;
}

export const DEFAULT_ASSUMPTIONS: RetirementAssumptions = {
  preReturn: 0.06,
  postReturn: 0.05,
  inflation: 0.03,
  incomeGrowth: 0.02,
};

/**
 * Kept for tests that import the raw constants. Prefer passing an assumptions
 * object into service.project().
 */
export const PRE_RETIREMENT_RETURN = DEFAULT_ASSUMPTIONS.preReturn;
export const POST_RETIREMENT_RETURN = DEFAULT_ASSUMPTIONS.postReturn;
export const INFLATION = DEFAULT_ASSUMPTIONS.inflation;
export const INCOME_GROWTH = DEFAULT_ASSUMPTIONS.incomeGrowth;

export const DEFAULT_INPUTS: RetirementInputs = {
  currentAge: 30,
  retirementAge: 67,
  currentSalary: 60000,
  currentSavings: 0,
  monthlyContribution: 500,
  targetMonthlyBudget: 3000,
};

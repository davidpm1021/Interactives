export interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
  currentSalary: number;
  currentSavings: number;
  monthlyContribution: number;
  targetMonthlyBudget: number;
  expectedReturn: number;
  yearsInRetirement: number;
}

export interface YearlyBalance {
  age: number;
  balance: number;
  totalContributed: number;
}

export interface RetirementProjection {
  yearlyBalances: YearlyBalance[];
  finalBalance: number;
  targetNestEgg: number;
  gapAtRetirement: number;
  requiredMonthlyToHitGoal: number;
  projectedMonthlyIncome: number;
  yearsToRetirement: number;
  totalContributed: number;
}

export const DEFAULT_INPUTS: RetirementInputs = {
  currentAge: 30,
  retirementAge: 67,
  currentSalary: 60000,
  currentSavings: 0,
  monthlyContribution: 500,
  targetMonthlyBudget: 3000,
  expectedReturn: 0.06,
  yearsInRetirement: 25,
};

/** Safe withdrawal rate (4% rule). */
export const WITHDRAWAL_RATE = 0.04;

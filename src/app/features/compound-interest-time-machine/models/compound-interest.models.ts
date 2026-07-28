export interface SimulationInputs {
  principal: number;
  interestRate: number;
  timeHorizon: number;
  contributionAmount: number;
  contributionFrequency: ContributionFrequency;
  compoundingFrequency: CompoundingFrequency;
}

export type ContributionFrequency = 'none' | 'monthly' | 'yearly';
export type CompoundingFrequency = 'annually' | 'monthly' | 'daily';

export interface SimulationResult {
  dataPoints: YearlyDataPoint[];
  summary: SimulationSummary;
}

export interface YearlyDataPoint {
  year: number;
  compoundBalance: number;
  simpleBalance: number;
  totalContributions: number;
  totalInterestEarned: number;
}

export interface Milestone {
  year: number;
  type: 'interest-exceeds-contributions' | 'balance-100k' | 'balance-500k' | 'balance-1m';
  label: string;
  value: number;
}

export interface SimulationSummary {
  finalBalance: number;
  totalContributions: number;
  totalInterestEarned: number;
  interestAsPercentOfFinal: number;
  simpleInterestFinal: number;
  compoundAdvantage: number;
  doublingYear: number | null;
  milestones?: Milestone[];
}

export interface Scenario {
  id: string;
  label: string;
  description: string;
  inputs: SimulationInputs;
}

export type ViewState = 'scenario-selection' | 'exploring' | 'comparing';

// ── Challenge State ──────────────────────────────

export type ChallengeId = 1 | 2 | 3 | 4 | 5;
export type ChallengePhase =
  | 'intro'
  | 'concept'
  | 'predict'
  | 'reveal'
  | 'reflect'
  | 'sandbox'
  | 'summary';

export interface ChallengeState {
  currentChallenge: ChallengeId;
  phase: ChallengePhase;
  completedChallenges: Set<ChallengeId>;
  predictions: ChallengePredictions;
}

export interface ChallengePredictions {
  challenge1Year10?: number;
  challenge1Year40?: number;
  challenge2RateGuess?: string;
  challenge3ContributionGuess?: number;
  challenge4WaitGuess?: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface PredictionPoint {
  year: number;
  value: number;
  locked: boolean;
}

// ── Step Navigation ──

export type StepId = 'setup' | 'track' | 'compare' | 'report';

export interface StepConfig {
  id: StepId;
  label: string;
  shortLabel: string;
  number: number;
}

export const STEPS: readonly StepConfig[] = [
  { id: 'setup', label: 'Setup & Pick Companies', shortLabel: 'Setup', number: 1 },
  { id: 'track', label: 'Track Prices', shortLabel: 'Track', number: 2 },
  { id: 'compare', label: 'Compare Stocks', shortLabel: 'Compare', number: 3 },
  { id: 'report', label: 'Write Report', shortLabel: 'Report', number: 4 },
] as const;

export type StepStatus = 'completed' | 'active' | 'locked';

// ── Data Models ──

export interface StudentProfile {
  birthday: Date;
  tenthBirthday: Date;
  tradingDayOnTenth: Date;
  currentAge: number;
}

export interface StockPick {
  companyName: string;
  ticker: string;
  priceOnBirthday: number;
  dateUsed: Date;
  sharesOwned: number; // Always 100
  annualData: AnnualDataPoint[];
  currentPrice: number;
  currentValue: number;
  roi: number;
  totalReturn: number;
}

export interface AnnualDataPoint {
  year: number;
  age: number;
  dateUsed: Date;
  adjClose: number;
  valueOf100Shares: number;
  yearOverYearChange: number;
}

export interface StockReport {
  bestPerformerAnalysis: string;
  mostValuableAnalysis: string;
  mostValuablePick: string;
  biggestSurprise: string;
  biggestSurprisePick: string;
  lessonsLearned: string;
  generatedAt: Date;
}

export interface TickerSearchResult {
  symbol: string;
  shortname: string;
  longname: string;
  exchange: string;
  quoteType: string;
}

export interface PriceOnDateResult {
  ticker: string;
  companyName: string;
  adjClose: number;
  dateUsed: Date;
}

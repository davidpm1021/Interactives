export interface LineItem {
  label: string;
  value: number;
}

export interface FinancialProfile {
  id: string;
  name: string;
  age: number;
  occupation: string;
  salary: number;
  cashOnHand: number;
  assets: LineItem[];
  debts: LineItem[];
}

export interface NetWorthBreakdown {
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
}

export type Phase = 'predict' | 'reveal' | 'summary';

/** During reveal, rows fade in one section at a time. */
export type RevealStage = 'salary-cash' | 'assets' | 'debts' | 'net-worth';

export const REVEAL_ORDER: RevealStage[] = ['salary-cash', 'assets', 'debts', 'net-worth'];

export type PredictionChoice = 'a' | 'b' | 'same';

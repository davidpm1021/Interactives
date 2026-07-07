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

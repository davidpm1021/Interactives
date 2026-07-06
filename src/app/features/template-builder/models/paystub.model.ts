export interface PaystubEarning {
  description: string;
  hours: number | null;
  rate: number | null;
  amount: number;
}

export interface PaystubLineItem {
  description: string;
  current: number;
}

export interface PaystubParty {
  name: string;
  addressLine1: string;
  addressLine2: string;
}

export interface PaystubPeriod {
  start: string;
  end: string;
  payDate: string;
  checkNumber: string;
}

export interface Paystub {
  employer: PaystubParty;
  employee: PaystubParty & { employeeId: string };
  period: PaystubPeriod;
  periodsYTD: number;
  earnings: PaystubEarning[];
  includeFICA: boolean;
  otherTaxes: PaystubLineItem[];
  deductions: PaystubLineItem[];
}

export const SOCIAL_SECURITY_RATE = 0.062;
export const MEDICARE_RATE = 0.0145;

export function earningCurrent(e: PaystubEarning): number {
  if (e.hours !== null && e.rate !== null) return e.hours * e.rate;
  return e.amount;
}

export function emptyEarning(): PaystubEarning {
  return { description: '', hours: null, rate: null, amount: 0 };
}

export function emptyLineItem(): PaystubLineItem {
  return { description: '', current: 0 };
}

export function samplePaystub(): Paystub {
  return {
    employer: {
      name: 'Riverside Coffee Co.',
      addressLine1: '482 Market Street',
      addressLine2: 'Portland, OR 97204',
    },
    employee: {
      name: 'Alex Morgan',
      addressLine1: '1130 NE Halsey Street',
      addressLine2: 'Portland, OR 97232',
      employeeId: 'EMP-04821',
    },
    period: {
      start: '2026-06-08',
      end: '2026-06-21',
      payDate: '2026-06-26',
      checkNumber: '10428',
    },
    periodsYTD: 13,
    earnings: [
      { description: 'Regular', hours: 72, rate: 18.5, amount: 0 },
      { description: 'Overtime', hours: 4, rate: 27.75, amount: 0 },
    ],
    includeFICA: true,
    otherTaxes: [
      { description: 'Federal Income Tax', current: 137.45 },
      { description: 'State Income Tax (OR)', current: 92.31 },
    ],
    deductions: [
      { description: '401(k) Contribution', current: 57.72 },
      { description: 'Health Insurance', current: 45.0 },
    ],
  };
}

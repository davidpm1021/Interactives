export interface PaystubEarning {
  description: string;
  hours: number | null;
  rate: number | null;
  amount: number;
}

export interface PaystubLineItem {
  description: string;
  current: number;
  /**
   * When set (non-null), the line item is a percentage of gross rather than
   * a fixed dollar amount. `current` is derived at read time as
   * grossPerPeriod × percentOfGross / 100. Used for classic %-based
   * deductions like 401(k) contributions.
   */
  percentOfGross?: number | null;
  /**
   * Whether the deduction comes out before income tax is figured, so it
   * lowers the federal and state withholding base. It does not lower the FICA
   * base: a traditional 401(k) contribution is still subject to Social
   * Security and Medicare, which is why a W-2 reports Box 1 below Box 3.
   *
   * A flag rather than a check on the description, because the two cases that
   * matter read almost identically: a traditional 401(k) is pre-tax and a Roth
   * 401(k) is not. That contrast is the point of the lesson, so the tool has
   * to be able to show both.
   */
  preTax?: boolean;
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
  /** When true, federal income tax auto-computes from annualized gross. */
  includeFederalTax: boolean;
  /**
   * When set (e.g. "OR"), state income tax auto-computes from annualized
   * gross using the state's effective rate. Empty string = no state tax.
   */
  stateForTax: string;
  otherTaxes: PaystubLineItem[];
  deductions: PaystubLineItem[];
  /**
   * Fixed 0-1 position within the tax-rate offset window, rolled once when the
   * paystub is created.
   *
   * Withholding is derived on every render, so when the rate functions rolled
   * their own number the figures moved on each change-detection pass: editing
   * the employee's name alone swung federal tax across a nine-dollar spread on
   * an unchanged gross, and printing twice could produce two different sheets.
   * Holding the position here keeps a given paystub's tax stable while two
   * separately generated stubs still differ in the cents.
   */
  taxJitter: number;
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
  return { description: '', current: 0, percentOfGross: null };
}

/**
 * Effective dollar amount for a line item on a given per-period gross.
 * Percentage-based items derive from gross; fixed items use `current`.
 */
export function lineItemAmount(item: PaystubLineItem, grossPerPeriod: number): number {
  if (item.percentOfGross != null && Number.isFinite(item.percentOfGross)) {
    return Math.round((grossPerPeriod * item.percentOfGross) / 100 * 100) / 100;
  }
  return item.current;
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
    includeFederalTax: true,
    stateForTax: 'OR',
    otherTaxes: [],
    deductions: [
      { description: '401(k) Contribution', current: 0, percentOfGross: 4, preTax: true },
      { description: 'Health Insurance', current: 45.0, percentOfGross: null },
    ],
    // Mid-window, so the documented sample prints the published rate exactly.
    taxJitter: 0.5,
  };
}

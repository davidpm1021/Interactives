import { AccountStatement, AccountTransaction } from '../models/account-statement.model';
import { pick, randFloat, randInt, shiftDays, toISO } from './random-helpers.util';
import { CITIES, FIRST_NAMES, LAST_NAMES, STREETS } from './pools.util';
import { CREDIT_VENDORS, DEBIT_VENDORS, VendorPicker, VendorPreset } from './vendors.util';

const BANKS = [
  { name: 'Cascade Federal Credit Union', tagline: 'Member-owned since 1962' },
  { name: 'Brightline National Bank', tagline: 'Banking that travels with you' },
  { name: 'Pinecrest Community Bank', tagline: 'Local roots, regional reach' },
  { name: 'Harbor Trust Bank', tagline: 'Established 1894' },
  { name: 'Northstar Bank', tagline: 'Built on trust' },
];

/**
 * Build a realistic all-caps bank-statement description for a vendor
 * transaction. Real statements use terse prefixes like "POS PURCHASE",
 * "ACH DEBIT", "CHECK #NNNN", "ATM WITHDRAWAL NNNN", "DIRECT DEPOSIT",
 * with vendor names uppercased and parenthetical qualifiers stripped.
 */
function describeVendor(vendor: VendorPreset, isDebit: boolean): string {
  const cleanName = vendor.description.replace(/\s*\([^)]*\)\s*$/, '').toUpperCase();
  switch (vendor.refKind) {
    case 'check':
      return `CHECK #${randInt(1000, 9999)} ${cleanName}`;
    case 'pos':
      return `POS PURCHASE ${cleanName}`;
    case 'ach':
      return `${isDebit ? 'ACH DEBIT' : 'ACH CREDIT'} ${cleanName}`;
    case 'atm':
      return `ATM WITHDRAWAL ${randInt(1000, 9999)}`;
    case 'dep':
      if (vendor.id === 'paycheck') return 'DIRECT DEPOSIT PAYROLL';
      if (vendor.id === 'birthday') return 'MOBILE DEPOSIT';
      return `ELECTRONIC DEPOSIT ${cleanName}`;
  }
}

function txnFromVendor(date: Date, vendor: VendorPreset, isDebit: boolean): AccountTransaction {
  return {
    date: toISO(date),
    description: describeVendor(vendor, isDebit),
    amount: randFloat(vendor.amtMin, vendor.amtMax),
    kind: isDebit ? 'debit' : 'credit',
  };
}

export function randomChecking(now: Date = new Date()): AccountStatement {
  const bank = pick(BANKS);
  const city = pick(CITIES);
  const periodEnd = shiftDays(now, -randInt(0, 25));
  const periodStart = shiftDays(periodEnd, -29);
  const beginningBalance = randFloat(600, 2200);

  const debitPicker = new VendorPicker(3, city.state);
  const NON_PAYCHECK_CREDITS = CREDIT_VENDORS.filter((v) => v.id !== 'paycheck');
  const creditPicker = new VendorPicker(3, city.state);

  const transactions: AccountTransaction[] = [];

  const paycheck = CREDIT_VENDORS.find((v) => v.id === 'paycheck')!;
  const firstPay = shiftDays(periodStart, randInt(2, 5));
  transactions.push(txnFromVendor(firstPay, paycheck, false));
  const secondPay = shiftDays(firstPay, 14);
  if (secondPay <= periodEnd) {
    transactions.push(txnFromVendor(secondPay, paycheck, false));
  }

  const count = randInt(8, 14);
  let cursor = new Date(periodStart);
  for (let i = 0; i < count; i++) {
    cursor = shiftDays(cursor, randInt(1, 4));
    if (cursor > periodEnd) break;
    if (Math.random() < 0.18) {
      const v = creditPicker.pick(NON_PAYCHECK_CREDITS);
      if (v) transactions.push(txnFromVendor(cursor, v, false));
    } else {
      const v = debitPicker.pick(DEBIT_VENDORS);
      if (v) transactions.push(txnFromVendor(cursor, v, true));
    }
  }

  const accountType = pickCheckingType();
  // Named fee transaction only for account types that have a monthly
  // maintenance charge. Free Checking (the majority case) doesn't have one.
  if (accountType === 'Standard Checking') {
    transactions.push({
      date: toISO(shiftDays(periodEnd, -1)),
      description: 'MONTHLY MAINTENANCE FEE',
      amount: 12,
      kind: 'debit',
    });
  }
  // Occasional out-of-network ATM fee, regardless of account type.
  if (Math.random() < 0.15) {
    transactions.push({
      date: toISO(shiftDays(periodStart, randInt(5, 22))),
      description: 'ATM FEE OUT-OF-NETWORK',
      amount: 3.5,
      kind: 'debit',
    });
  }

  transactions.sort((a, b) => a.date.localeCompare(b.date));

  return {
    bank,
    customer: {
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      addressLine1: `${randInt(100, 9999)} ${pick(STREETS)}`,
      addressLine2: `${city.city}, ${city.state} ${city.zip}`,
    },
    accountNumber: `****${randInt(1000, 9999)}`,
    accountType,
    periodStart: toISO(periodStart),
    periodEnd: toISO(periodEnd),
    beginningBalance,
    transactions,
    fees: 0,
    interestEarned: 0,
    apy: null,
  };
}

function pickCheckingType(): string {
  return pick(['Free Checking', 'Free Checking', 'Free Checking', 'Standard Checking']);
}

export function randomSavings(now: Date = new Date()): AccountStatement {
  const bank = pick(BANKS);
  const city = pick(CITIES);
  const periodEnd = shiftDays(now, -randInt(0, 25));
  const periodStart = shiftDays(periodEnd, -29);
  const beginningBalance = randFloat(800, 12000);
  const apy = pick([1.5, 2.25, 3.0, 3.8, 4.35, 4.6, 5.0]);

  const transactions: AccountTransaction[] = [];
  const transferAmt = pick([50, 100, 150, 200]);
  let cursor = new Date(periodStart);
  for (let i = 0; i < randInt(2, 5); i++) {
    cursor = shiftDays(cursor, randInt(5, 8));
    if (cursor > periodEnd) break;
    transactions.push({
      date: toISO(cursor),
      description: 'TRANSFER FROM CHECKING',
      amount: transferAmt,
      kind: 'credit',
    });
  }
  if (Math.random() < 0.3) {
    transactions.push({
      date: toISO(shiftDays(periodStart, randInt(10, 24))),
      description: pick([
        'WITHDRAWAL EMERGENCY CAR REPAIR',
        'WITHDRAWAL MEDICAL COPAY',
        'WITHDRAWAL SECURITY DEPOSIT',
      ]),
      amount: randFloat(120, 480),
      kind: 'debit',
    });
  }

  // Interest is expressed as APY, so the true monthly rate is the
  // 12th root of (1 + APY), not APY/12.
  const monthlyRate = Math.pow(1 + apy / 100, 1 / 12) - 1;
  const interestEarned = Math.round(beginningBalance * monthlyRate * 100) / 100;
  transactions.sort((a, b) => a.date.localeCompare(b.date));

  return {
    bank,
    customer: {
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      addressLine1: `${randInt(100, 9999)} ${pick(STREETS)}`,
      addressLine2: `${city.city}, ${city.state} ${city.zip}`,
    },
    accountNumber: `****${randInt(1000, 9999)}`,
    accountType: 'High-Yield Savings',
    periodStart: toISO(periodStart),
    periodEnd: toISO(periodEnd),
    beginningBalance,
    transactions,
    fees: 0,
    interestEarned,
    apy,
  };
}

export interface AccountTransaction {
  date: string;
  description: string;
  amount: number;
  kind: 'debit' | 'credit';
}

export interface AccountStatement {
  bank: { name: string; tagline: string };
  customer: { name: string; addressLine1: string; addressLine2: string };
  accountNumber: string;
  accountType: string;
  periodStart: string;
  periodEnd: string;
  beginningBalance: number;
  transactions: AccountTransaction[];
  fees: number;
  interestEarned: number;
  apy: number | null;
}

export function emptyTxn(): AccountTransaction {
  return { date: '', description: '', amount: 0, kind: 'debit' };
}

export function sampleChecking(): AccountStatement {
  return {
    bank: { name: 'Cascade Federal Credit Union', tagline: 'Member-owned since 1962' },
    customer: {
      name: 'Alex Morgan',
      addressLine1: '1130 NE Halsey Street',
      addressLine2: 'Portland, OR 97232',
    },
    accountNumber: '****4218',
    accountType: 'Free Checking',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    beginningBalance: 1247.83,
    transactions: [
      { date: '2026-05-03', description: 'Direct deposit:Riverside Coffee Co.', amount: 1000.13, kind: 'credit' },
      { date: '2026-05-04', description: 'Check #1143:Lakeview Apartments', amount: 950.0, kind: 'debit' },
      { date: '2026-05-07', description: 'POS:Greenleaf Grocery', amount: 78.42, kind: 'debit' },
      { date: '2026-05-09', description: 'ATM withdrawal', amount: 60.0, kind: 'debit' },
      { date: '2026-05-11', description: 'Check #1144:Pacific NW Electric', amount: 86.59, kind: 'debit' },
      { date: '2026-05-15', description: 'ACH:Westridge Internet', amount: 65.99, kind: 'debit' },
      { date: '2026-05-17', description: 'Direct deposit:Riverside Coffee Co.', amount: 1000.13, kind: 'credit' },
      { date: '2026-05-21', description: 'POS:Sunset Pizzeria', amount: 24.85, kind: 'debit' },
      { date: '2026-05-23', description: 'POS:Greenleaf Grocery', amount: 52.17, kind: 'debit' },
      { date: '2026-05-28', description: 'Mobile deposit:birthday gift', amount: 50.0, kind: 'credit' },
    ],
    fees: 0,
    interestEarned: 0,
    apy: null,
  };
}

export function sampleSavings(): AccountStatement {
  return {
    bank: { name: 'Cascade Federal Credit Union', tagline: 'Member-owned since 1962' },
    customer: {
      name: 'Alex Morgan',
      addressLine1: '1130 NE Halsey Street',
      addressLine2: 'Portland, OR 97232',
    },
    accountNumber: '****7820',
    accountType: 'High-Yield Savings',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    beginningBalance: 3450.0,
    transactions: [
      { date: '2026-05-05', description: 'Automatic transfer from checking', amount: 100.0, kind: 'credit' },
      { date: '2026-05-12', description: 'Automatic transfer from checking', amount: 100.0, kind: 'credit' },
      { date: '2026-05-19', description: 'Automatic transfer from checking', amount: 100.0, kind: 'credit' },
      { date: '2026-05-25', description: 'Withdrawal:emergency car repair', amount: 240.0, kind: 'debit' },
      { date: '2026-05-26', description: 'Automatic transfer from checking', amount: 100.0, kind: 'credit' },
      { date: '2026-05-31', description: 'Monthly interest credit', amount: 13.18, kind: 'credit' },
    ],
    fees: 0,
    interestEarned: 13.18,
    apy: 4.35,
  };
}

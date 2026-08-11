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
      { date: '2026-05-03', description: 'DIRECT DEPOSIT PAYROLL',            amount: 1000.13, kind: 'credit' },
      { date: '2026-05-04', description: 'CHECK #1143 LAKEVIEW APARTMENTS',   amount:  950.00, kind: 'debit'  },
      { date: '2026-05-07', description: 'POS PURCHASE GREENLEAF GROCERY',    amount:   78.42, kind: 'debit'  },
      { date: '2026-05-09', description: 'ATM WITHDRAWAL 3847',               amount:   60.00, kind: 'debit'  },
      { date: '2026-05-11', description: 'CHECK #1144 PACIFIC NW ELECTRIC',   amount:   86.59, kind: 'debit'  },
      { date: '2026-05-15', description: 'ACH DEBIT WESTRIDGE INTERNET',      amount:   65.99, kind: 'debit'  },
      { date: '2026-05-17', description: 'DIRECT DEPOSIT PAYROLL',            amount: 1000.13, kind: 'credit' },
      { date: '2026-05-21', description: 'POS PURCHASE SUNSET PIZZERIA',      amount:   24.85, kind: 'debit'  },
      { date: '2026-05-23', description: 'POS PURCHASE GREENLEAF GROCERY',    amount:   52.17, kind: 'debit'  },
      { date: '2026-05-28', description: 'MOBILE DEPOSIT BIRTHDAY GIFT',      amount:   50.00, kind: 'credit' },
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
      { date: '2026-05-05', description: 'TRANSFER FROM CHECKING',        amount: 100.00, kind: 'credit' },
      { date: '2026-05-12', description: 'TRANSFER FROM CHECKING',        amount: 100.00, kind: 'credit' },
      { date: '2026-05-19', description: 'TRANSFER FROM CHECKING',        amount: 100.00, kind: 'credit' },
      { date: '2026-05-25', description: 'WITHDRAWAL EMERGENCY CAR REPAIR', amount: 240.00, kind: 'debit'  },
      { date: '2026-05-26', description: 'TRANSFER FROM CHECKING',        amount: 100.00, kind: 'credit' },
      { date: '2026-05-31', description: 'INTEREST CREDIT',                amount:  13.18, kind: 'credit' },
    ],
    fees: 0,
    interestEarned: 13.18,
    apy: 4.35,
  };
}

export interface CheckbookEntry {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
}

export interface Checkbook {
  accountHolder: string;
  accountNumber: string;
  openingBalance: number;
  entries: CheckbookEntry[];
}

export function emptyEntry(): CheckbookEntry {
  return { date: '', reference: '', description: '', debit: 0, credit: 0 };
}

export function sampleCheckbook(): Checkbook {
  return {
    accountHolder: 'Alex Morgan',
    accountNumber: '****4218',
    openingBalance: 1247.83,
    entries: [
      { date: '2026-06-02', reference: '1142', description: 'Riverside Coffee Co. (paycheck)', debit: 0, credit: 1000.13 },
      { date: '2026-06-03', reference: '1143', description: 'Lakeview Apartments (rent)', debit: 950.0, credit: 0 },
      { date: '2026-06-05', reference: 'POS', description: 'Greenleaf Grocery', debit: 78.42, credit: 0 },
      { date: '2026-06-07', reference: 'ATM', description: 'Cash withdrawal', debit: 60.0, credit: 0 },
      { date: '2026-06-09', reference: '1144', description: 'Pacific NW Electric', debit: 86.59, credit: 0 },
      { date: '2026-06-12', reference: 'POS', description: 'Sunset Pizzeria', debit: 24.85, credit: 0 },
      { date: '2026-06-15', reference: 'ACH', description: 'Westridge Internet', debit: 65.99, credit: 0 },
      { date: '2026-06-16', reference: 'POS', description: 'Greenleaf Grocery', debit: 52.17, credit: 0 },
      { date: '2026-06-19', reference: 'ATM', description: 'Cash withdrawal', debit: 40.0, credit: 0 },
      { date: '2026-06-21', reference: 'DEP', description: 'Birthday gift from Mom', debit: 0, credit: 50.0 },
    ],
  };
}

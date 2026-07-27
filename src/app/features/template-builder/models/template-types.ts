// Checkbook Register and Bill (Invoice) are intentionally omitted from the
// catalog but the CheckbookEditor + bill-editor variant=2 code still exist
// on disk in case a teacher requests them back.
export type TemplateKey =
  | 'paystub'
  | 'w2'
  | 'bank-statement'
  | 'savings-statement'
  | 'bill-1'
  | 'credit-report';

export interface TemplateDescriptor {
  key: TemplateKey;
  title: string;
  category: string;
  description: string;
  available: boolean;
}

export const TEMPLATE_CATALOG: TemplateDescriptor[] = [
  {
    key: 'paystub',
    title: 'Paystub',
    category: 'Employment & Income',
    description: 'Earnings, taxes, deductions, and net pay with YTD totals.',
    available: true,
  },
  {
    key: 'w2',
    title: 'W-2',
    category: 'Employment & Income',
    description: 'Annual wage and tax statement in the standard W-2 box layout.',
    available: true,
  },
  {
    key: 'bank-statement',
    title: 'Bank Statement',
    category: 'Banking & Accounts',
    description: 'Monthly checking statement with transactions and ending balance.',
    available: true,
  },
  {
    key: 'savings-statement',
    title: 'Savings Statement',
    category: 'Banking & Accounts',
    description: 'Savings account activity with APY and interest earned.',
    available: true,
  },
  {
    key: 'bill-1',
    title: 'Bill (Statement)',
    category: 'Bills & Expenses',
    description: 'Utility-style statement with vendor info and itemized charges.',
    available: true,
  },
  {
    key: 'credit-report',
    title: 'Credit Report',
    category: 'Credit',
    description: 'Score, personal info, accounts, and recent inquiries.',
    available: true,
  },
];

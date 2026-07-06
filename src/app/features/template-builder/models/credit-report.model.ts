export type AccountStatus = 'Open' | 'Closed' | 'Paid';
export type PaymentStatus = 'Current' | '30 days late' | '60 days late' | '90+ days late';
export type Bureau = 'Equifax' | 'Experian' | 'TransUnion';

export interface CreditAccount {
  creditor: string;
  type: string;
  accountNumber: string;
  openedDate: string;
  balance: number;
  creditLimit: number;
  status: AccountStatus;
  paymentStatus: PaymentStatus;
}

export interface CreditInquiry {
  date: string;
  requester: string;
  kind: 'hard' | 'soft';
}

export interface CreditReport {
  consumer: {
    name: string;
    currentAddressLine1: string;
    currentAddressLine2: string;
    previousAddress: string;
    dobMasked: string;
    ssnMasked: string;
  };
  reportDate: string;
  bureau: Bureau;
  score: number;
  accounts: CreditAccount[];
  inquiries: CreditInquiry[];
}

export function emptyAccount(): CreditAccount {
  return {
    creditor: '',
    type: 'Credit Card',
    accountNumber: '',
    openedDate: '',
    balance: 0,
    creditLimit: 0,
    status: 'Open',
    paymentStatus: 'Current',
  };
}

export function emptyInquiry(): CreditInquiry {
  return { date: '', requester: '', kind: 'hard' };
}

export function sampleCreditReport(): CreditReport {
  return {
    consumer: {
      name: 'Alex Morgan',
      currentAddressLine1: '1130 NE Halsey Street',
      currentAddressLine2: 'Portland, OR 97232',
      previousAddress: '88 Birchwood Place, Eugene, OR 97401',
      dobMasked: '**/**/2003',
      ssnMasked: '***-**-6789',
    },
    reportDate: '2026-06-15',
    bureau: 'Experian',
    score: 712,
    accounts: [
      { creditor: 'Cascade Federal Credit Union', type: 'Credit Card', accountNumber: '****-****-****-4218', openedDate: '2023-09-14', balance: 432.18, creditLimit: 2500, status: 'Open', paymentStatus: 'Current' },
      { creditor: 'Brightline Bank', type: 'Auto Loan', accountNumber: '****6201', openedDate: '2024-05-02', balance: 9842.0, creditLimit: 14500, status: 'Open', paymentStatus: 'Current' },
      { creditor: 'Federal Student Aid', type: 'Student Loan', accountNumber: '****1183', openedDate: '2021-09-01', balance: 12640.0, creditLimit: 18500, status: 'Open', paymentStatus: 'Current' },
      { creditor: 'Pinecrest Retail', type: 'Store Card', accountNumber: '****7702', openedDate: '2025-02-11', balance: 0, creditLimit: 800, status: 'Paid', paymentStatus: 'Current' },
    ],
    inquiries: [
      { date: '2026-04-22', requester: 'Brightline Auto Finance', kind: 'hard' },
      { date: '2026-02-08', requester: 'Northstar Mobile (account opening)', kind: 'hard' },
      { date: '2026-01-15', requester: 'Pre-approved offer (Capital Bank)', kind: 'soft' },
    ],
  };
}

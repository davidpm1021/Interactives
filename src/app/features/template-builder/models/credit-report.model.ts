export type AccountStatus = 'Open' | 'Closed' | 'Paid';
export type PaymentStatus = 'Current' | '30 days late' | '60 days late' | '90+ days late';
export type Bureau = 'Equifax' | 'Experian' | 'TransUnion';

/**
 * One month's on-time status for a single account. Matches the visual
 * legend on real bureau reports:
 *   OK   = on-time payment
 *   30   = 30 days late
 *   60   = 60 days late
 *   90   = 90+ days late
 *   CO   = charge-off
 *   NA   = no data (account not yet open or already closed)
 */
export type MonthStatus = 'OK' | '30' | '60' | '90' | 'CO' | 'NA';

/** Number of months of payment history to render per account. Two years matches Wisconsin extension example. */
export const PAYMENT_HISTORY_MONTHS = 24;

export interface CreditAccount {
  creditor: string;
  type: string;
  accountNumber: string;
  openedDate: string;
  balance: number;
  creditLimit: number;
  status: AccountStatus;
  paymentStatus: PaymentStatus;
  /**
   * 24 months of month-by-month status, most recent first (index 0 = last
   * month, index 23 = 24 months ago). Rendered as the payment-history grid
   * on the preview. Length may be less than PAYMENT_HISTORY_MONTHS for
   * accounts opened more recently.
   */
  paymentHistory: MonthStatus[];
}

export interface CreditInquiry {
  date: string;
  requester: string;
  kind: 'hard' | 'soft';
}

/**
 * Public-record items (bankruptcies, tax liens, civil judgments). Most reports
 * show "None" here; kept as an array so a teacher can add one for teaching
 * scenarios about derogatory marks.
 */
export interface PublicRecord {
  kind: string;
  date: string;
  amount: number;
  status: string;
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
  publicRecords: PublicRecord[];
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
    paymentHistory: Array(PAYMENT_HISTORY_MONTHS).fill('OK'),
  };
}

export function emptyInquiry(): CreditInquiry {
  return { date: '', requester: '', kind: 'hard' };
}

export function emptyPublicRecord(): PublicRecord {
  return { kind: 'Bankruptcy (Chapter 7)', date: '', amount: 0, status: 'Discharged' };
}

/**
 * Build a 24-month history string with the trailing (most recent) `bad`
 * months marked with `badMark`, and everything before that as 'OK'.
 * Used by the sample and random generators to produce a plausible history
 * consistent with the account's current paymentStatus.
 */
export function historyEndingWith(bad: number, badMark: MonthStatus): MonthStatus[] {
  const h: MonthStatus[] = Array(PAYMENT_HISTORY_MONTHS).fill('OK');
  for (let i = 0; i < Math.min(bad, PAYMENT_HISTORY_MONTHS); i++) h[i] = badMark;
  return h;
}

export function sampleCreditReport(): CreditReport {
  return {
    consumer: {
      name: 'Alex Morgan',
      currentAddressLine1: '1130 NE Halsey Street',
      currentAddressLine2: 'Portland, OR 97232',
      previousAddress: '88 Birchwood Place, Eugene, OR 97401',
      dobMasked: '**/**/2003',
      ssnMasked: '***-**-1111',
    },
    reportDate: '2026-06-15',
    bureau: 'Experian',
    score: 712,
    accounts: [
      { creditor: 'Cascade Federal Credit Union', type: 'Credit Card',   accountNumber: '****-****-****-4218', openedDate: '2023-09-14', balance:   432.18, creditLimit:  2500, status: 'Open', paymentStatus: 'Current',       paymentHistory: historyEndingWith(0, 'OK') },
      { creditor: 'Brightline Bank',              type: 'Auto Loan',     accountNumber: '****6201',           openedDate: '2024-05-02', balance:  9842.00, creditLimit: 14500, status: 'Open', paymentStatus: 'Current',       paymentHistory: historyEndingWith(0, 'OK') },
      { creditor: 'Federal Student Aid',          type: 'Student Loan',  accountNumber: '****1183',           openedDate: '2021-09-01', balance: 12640.00, creditLimit: 18500, status: 'Open', paymentStatus: '30 days late',  paymentHistory: historyEndingWith(1, '30') },
      { creditor: 'Pinecrest Retail',             type: 'Store Card',    accountNumber: '****7702',           openedDate: '2025-02-11', balance:     0.00, creditLimit:   800, status: 'Paid', paymentStatus: 'Current',       paymentHistory: historyEndingWith(0, 'OK') },
    ],
    publicRecords: [],
    inquiries: [
      { date: '2026-04-22', requester: 'Brightline Auto Finance',              kind: 'hard' },
      { date: '2026-02-08', requester: 'Northstar Mobile (account opening)',   kind: 'hard' },
      { date: '2026-01-15', requester: 'Pre-approved offer (Capital Bank)',    kind: 'soft' },
    ],
  };
}

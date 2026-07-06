import {
  AccountStatus,
  Bureau,
  CreditAccount,
  CreditInquiry,
  CreditReport,
  PaymentStatus,
} from '../models/credit-report.model';
import { pick, randFloat, randInt, shiftDays, toISO } from './random-helpers.util';
import { CITIES, FIRST_NAMES, LAST_NAMES, STREETS } from './pools.util';

const BUREAUS: Bureau[] = ['Equifax', 'Experian', 'TransUnion'];

const CARD_ISSUERS = ['Cascade Federal Credit Union', 'Brightline Bank', 'Northstar Bank', 'Harbor Trust Visa', 'Pinecrest Community Card'];
const AUTO_LENDERS = ['Brightline Bank', 'Coastline Auto Finance', 'Cascade Credit Union'];
const STUDENT_LENDERS = ['Federal Student Aid', 'EdFund National'];
const STORE_CARDS = ['Pinecrest Retail', 'Atlas Outfitters', 'Greenleaf Rewards Card', 'Westridge Home'];

function maskedCard(): string {
  return `****-****-****-${randInt(1000, 9999)}`;
}

function maskedLoan(): string {
  return `****${randInt(1000, 9999)}`;
}

function randomPastDate(now: Date, minYearsBack: number, maxYearsBack: number): Date {
  const yearsBack = minYearsBack + Math.random() * Math.max(0, maxYearsBack - minYearsBack);
  return shiftDays(now, -Math.floor(yearsBack * 365));
}

/**
 * Box-Muller transform: returns a sample from N(0, 1).
 */
function gaussianSample(): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Credit score sampled from a bell curve centered around 700.
 */
function gaussianScore(): number {
  const raw = 700 + gaussianSample() * 85;
  return Math.max(300, Math.min(850, Math.round(raw)));
}

interface AccountConstraints {
  minOpenAge: number;
  maxAccountAge: number;
}

function buildAccount(now: Date, kind: 'card' | 'auto' | 'student' | 'store', limits: AccountConstraints): CreditAccount {
  const maxYearsBack = Math.max(0.25, limits.maxAccountAge);

  if (kind === 'card') {
    const limit = pick([1000, 1500, 2000, 2500, 5000, 7500]);
    const utilization = Math.random() * 0.5;
    const balance = randFloat(0, limit * utilization);
    return {
      creditor: pick(CARD_ISSUERS),
      type: 'Credit Card',
      accountNumber: maskedCard(),
      openedDate: toISO(randomPastDate(now, 0.25, Math.min(maxYearsBack, 5))),
      balance,
      creditLimit: limit,
      status: 'Open',
      paymentStatus: pick(['Current', 'Current', 'Current', 'Current', '30 days late']) as PaymentStatus,
    };
  }
  if (kind === 'auto') {
    const original = pick([12000, 18000, 22000, 28000]);
    const balance = randFloat(original * 0.3, original * 0.85);
    return {
      creditor: pick(AUTO_LENDERS),
      type: 'Auto Loan',
      accountNumber: maskedLoan(),
      openedDate: toISO(randomPastDate(now, 0.5, Math.min(maxYearsBack, 4))),
      balance,
      creditLimit: original,
      status: 'Open',
      paymentStatus: 'Current',
    };
  }
  if (kind === 'student') {
    const original = pick([10000, 18500, 27000, 38000]);
    const balance = randFloat(original * 0.4, original);
    return {
      creditor: pick(STUDENT_LENDERS),
      type: 'Student Loan',
      accountNumber: maskedLoan(),
      openedDate: toISO(randomPastDate(now, 2, Math.min(maxYearsBack, 6))),
      balance,
      creditLimit: original,
      status: 'Open',
      paymentStatus: pick(['Current', 'Current', 'Current']) as PaymentStatus,
    };
  }
  const limit = pick([500, 800, 1200, 1500]);
  const isPaid = Math.random() < 0.4;
  return {
    creditor: pick(STORE_CARDS),
    type: 'Store Card',
    accountNumber: maskedLoan(),
    openedDate: toISO(randomPastDate(now, 0.25, Math.min(maxYearsBack, 3))),
    balance: isPaid ? 0 : randFloat(0, limit * 0.6),
    creditLimit: limit,
    status: (isPaid ? 'Paid' : 'Open') as AccountStatus,
    paymentStatus: 'Current',
  };
}

export function randomCreditReport(now: Date = new Date()): CreditReport {
  const city = pick(CITIES);
  const prevCity = pick(CITIES.filter((c) => c.city !== city.city));

  const birthYear = randInt(1985, 2007);
  const age = now.getFullYear() - birthYear;
  const yearsAsAdult = Math.max(0, age - 18);
  const accountConstraints: AccountConstraints = {
    minOpenAge: 18,
    maxAccountAge: yearsAsAdult,
  };

  const numAccounts = randInt(3, 6);
  const accounts: CreditAccount[] = [];
  accounts.push(buildAccount(now, 'card', accountConstraints));
  for (let i = 1; i < numAccounts; i++) {
    const kind = pick(['card', 'card', 'auto', 'student', 'store']) as 'card' | 'auto' | 'student' | 'store';
    const c = kind === 'student'
      ? { ...accountConstraints, maxAccountAge: Math.max(0, age - 17) }
      : accountConstraints;
    accounts.push(buildAccount(now, kind, c));
  }

  const numInquiries = randInt(0, 4);
  const inquiries: CreditInquiry[] = [];
  const inquiryRequesters = [
    'Brightline Auto Finance',
    'Northstar Mobile',
    'Cascade Mortgage',
    'Capital Bank pre-approval',
    'Harbor Trust Visa',
    'Pinecrest Apartments (background)',
    'Atlas Cellular (account opening)',
  ];
  const maxInquiryDays = Math.min(730, Math.max(30, yearsAsAdult * 365));
  for (let i = 0; i < numInquiries; i++) {
    inquiries.push({
      date: toISO(shiftDays(now, -randInt(7, maxInquiryDays))),
      requester: pick(inquiryRequesters),
      kind: Math.random() < 0.7 ? 'hard' : 'soft',
    });
  }
  inquiries.sort((a, b) => b.date.localeCompare(a.date));

  return {
    consumer: {
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      currentAddressLine1: `${randInt(100, 9999)} ${pick(STREETS)}`,
      currentAddressLine2: `${city.city}, ${city.state} ${city.zip}`,
      previousAddress: `${randInt(100, 9999)} ${pick(STREETS)}, ${prevCity.city}, ${prevCity.state} ${prevCity.zip}`,
      dobMasked: `**/**/${birthYear}`,
      ssnMasked: `***-**-${randInt(1000, 9999)}`,
    },
    reportDate: toISO(now),
    bureau: pick(BUREAUS),
    score: gaussianScore(),
    accounts,
    inquiries,
  };
}

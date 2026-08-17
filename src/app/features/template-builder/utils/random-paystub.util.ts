import { Paystub, PaystubEarning, PaystubLineItem } from '../models/paystub.model';
import { pick, randInt, round2, shiftDays, toISO } from './random-helpers.util';
import { FIRST_NAMES, LAST_NAMES, NEIGHBOR_CITIES, STREETS } from './pools.util';
import { hasStateIncomeTax } from './tax-rates.util';
import { EMPLOYERS } from './employers.util';

const RATE_CHOICES = [
  15.0, 16.5, 17.25, 18.5, 19.75, 21.0, 22.5, 24.0, 25.5, 27.75, 30.0, 32.5,
];

/**
 * Optional dimensions a teacher can pin before hitting "Generate with these
 * settings" on the paystub editor. All fields are optional; omitting them
 * gives fully-random behavior (the default randomPaystub() call).
 */
export interface PaystubRandomOptions {
  /**
   * Target annual gross. When set, the hourly rate is derived to hit this
   * gross (assuming 76 regular hours per biweekly period × 26 periods). No
   * band snapping — teacher's exact number is respected.
   */
  annualIncomeTarget?: number;
  /** Restrict employer pool to this state's employers. Undefined = any. */
  state?: string;
  /** Only pick employers that don't typically offer 401(k). */
  smallEmployerOnly?: boolean;
  /** Force the overtime line on or off. Undefined = random (~55% chance). */
  includeOvertime?: boolean;
}

export { EMPLOYER_STATES } from './employers.util';

/**
 * Biweekly periods completed by the given pay date, clamped to 26.
 * Assumes pay dates fall on a roughly biweekly schedule starting near Jan 1.
 */
function biweeklyPeriodsYTD(payDate: Date): number {
  const yearStart = new Date(payDate.getFullYear(), 0, 1);
  const daysSince = Math.floor(
    (payDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24),
  );
  const adjusted = Math.max(0, daysSince - 7);
  return Math.max(1, Math.min(26, Math.floor(adjusted / 14) + 1));
}

export function randomPaystub(now: Date = new Date(), opts: PaystubRandomOptions = {}): Paystub {
  // Filter the employer pool by the caller's optional constraints. If the
  // constraints filter everything out (rare edge — e.g. small-only + a state
  // with only large employers), fall back to the unfiltered pool.
  const filtered = EMPLOYERS.filter((e) => {
    if (opts.state && e.stateAbbr !== opts.state) return false;
    if (opts.smallEmployerOnly && e.offers401k) return false;
    return true;
  });
  const employer = pick(filtered.length ? filtered : EMPLOYERS);
  const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  const employeeStreet = `${randInt(100, 9999)} ${pick(STREETS)}`;
  const liveInNeighbor = Math.random() < 0.3 && NEIGHBOR_CITIES[employer.stateAbbr];
  const employeeAddrLine2 = liveInNeighbor
    ? pick(NEIGHBOR_CITIES[employer.stateAbbr])
    : employer.addr2;

  let payDate = shiftDays(now, -randInt(0, 24) * 7);
  while (payDate.getDay() !== 5) payDate = shiftDays(payDate, -1);
  const periodEnd = shiftDays(payDate, -4);
  const periodStart = shiftDays(periodEnd, -13);
  const periodsYTD = biweeklyPeriodsYTD(payDate);

  // Rate: derive from annualIncomeTarget when set, else pick from the
  // canonical hourly-rate menu.
  const regularHours = pick([72, 76, 80]);
  const rate = opts.annualIncomeTarget && opts.annualIncomeTarget > 0
    ? Math.round((opts.annualIncomeTarget / (regularHours * 26)) * 100) / 100
    : pick(RATE_CHOICES);
  const earnings: PaystubEarning[] = [
    { description: 'Regular', hours: regularHours, rate, amount: 0 },
  ];
  const wantsOvertime = opts.includeOvertime ?? (Math.random() < 0.55);
  if (wantsOvertime) {
    const otHours = pick([2, 4, 6, 8]);
    const otRate = round2(rate * 1.5);
    earnings.push({ description: 'Overtime', hours: otHours, rate: otRate, amount: 0 });
  }

  const grossPerPeriod = earnings.reduce((s, e) => s + (e.hours ?? 0) * (e.rate ?? 0), 0);

  // Deductions carry a preTax flag; paystub-math subtracts the flagged ones
  // from the FIT/state tax base. Matches the W-2's treatment of Box 1.
  const deductions: PaystubLineItem[] = [];
  let contrib401kPerPeriod = 0;
  if (employer.offers401k && Math.random() < 0.6) {
    const pct = pick([0.03, 0.04, 0.05, 0.06]);
    contrib401kPerPeriod = round2(grossPerPeriod * pct);
    deductions.push({
      description: '401(k) Contribution',
      current: contrib401kPerPeriod,
      preTax: true,
    });
  }
  if (Math.random() < 0.55) {
    deductions.push({
      description: 'Health Insurance',
      current: pick([25, 35, 45, 55, 65]),
    });
  }
  if (Math.random() < 0.2) {
    deductions.push({
      description: 'Dental Insurance',
      current: pick([8, 12, 18]),
    });
  }

  return {
    employer: {
      name: employer.name,
      addressLine1: employer.addr1,
      addressLine2: employer.addr2,
    },
    employee: {
      name,
      addressLine1: employeeStreet,
      addressLine2: employeeAddrLine2,
      employeeId: `EMP-${String(randInt(1000, 99999)).padStart(5, '0')}`,
    },
    period: {
      start: toISO(periodStart),
      end: toISO(periodEnd),
      payDate: toISO(payDate),
      checkNumber: String(randInt(10000, 99999)),
    },
    periodsYTD,
    earnings,
    includeFICA: true,
    includeFederalTax: true,
    stateForTax: hasStateIncomeTax(employer.stateAbbr) ? employer.stateAbbr : '',
    otherTaxes: [],
    deductions,
    taxJitter: Math.random(),
  };
}

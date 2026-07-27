import { Paystub, PaystubEarning, PaystubLineItem } from '../models/paystub.model';
import { pick, randInt, round2, shiftDays, toISO } from './random-helpers.util';
import { FIRST_NAMES, LAST_NAMES, NEIGHBOR_CITIES, STREETS } from './pools.util';
import { hasStateIncomeTax } from './tax-rates.util';

interface EmployerPool {
  name: string;
  addr1: string;
  addr2: string;
  stateAbbr: string;
  /**
   * Whether the employer plausibly offers a 401(k). Small independent shops
   * (coffee, grocery, pizzeria, bookstore, daycare, etc.) usually don't; a
   * logistics/parts-chain operation does. Random paystub only rolls a 401(k)
   * deduction when this is true.
   */
  offers401k: boolean;
}

const EMPLOYERS: EmployerPool[] = [
  { name: 'Riverside Coffee Co.',   addr1: '482 Market Street',      addr2: 'Portland, OR 97204',   stateAbbr: 'OR', offers401k: false },
  { name: 'Greenleaf Grocery',      addr1: '215 Oak Avenue',         addr2: 'Boulder, CO 80302',    stateAbbr: 'CO', offers401k: false },
  { name: 'Crescent Hardware',      addr1: '88 Industrial Way',      addr2: 'Asheville, NC 28801',  stateAbbr: 'NC', offers401k: false },
  { name: 'Brightline Logistics',   addr1: '1450 Cedar Road',        addr2: 'Tacoma, WA 98402',     stateAbbr: 'WA', offers401k: true  },
  { name: 'Northside Veterinary',   addr1: '602 Elm Street',         addr2: 'Madison, WI 53703',    stateAbbr: 'WI', offers401k: false },
  { name: 'Sunset Pizzeria',        addr1: '74 Beach Boulevard',     addr2: 'San Diego, CA 92103',  stateAbbr: 'CA', offers401k: false },
  { name: 'Ironwood Books',         addr1: '301 Main Street',        addr2: 'Burlington, VT 05401', stateAbbr: 'VT', offers401k: false },
  { name: 'Atlas Print Shop',       addr1: '155 Lakeview Drive',     addr2: 'Minneapolis, MN 55402', stateAbbr: 'MN', offers401k: false },
  { name: 'Lone Star Auto Parts',   addr1: '720 Crockett Lane',      addr2: 'Austin, TX 78704',     stateAbbr: 'TX', offers401k: true  },
  { name: 'Bayfront Dental',        addr1: '95 Harbor Drive',        addr2: 'Tampa, FL 33602',      stateAbbr: 'FL', offers401k: false },
  { name: 'Maple Hill Daycare',     addr1: '11 Sycamore Place',      addr2: 'Concord, NH 03301',    stateAbbr: 'NH', offers401k: false },
  { name: 'Pioneer Outfitters',     addr1: '38 Mountain View Road',  addr2: 'Bozeman, MT 59715',    stateAbbr: 'MT', offers401k: false },
];

const RATE_CHOICES = [
  15.0, 16.5, 17.25, 18.5, 19.75, 21.0, 22.5, 24.0, 25.5, 27.75, 30.0, 32.5,
];

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

export function randomPaystub(now: Date = new Date()): Paystub {
  const employer = pick(EMPLOYERS);
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

  const rate = pick(RATE_CHOICES);
  const regularHours = pick([72, 76, 80]);
  const earnings: PaystubEarning[] = [
    { description: 'Regular', hours: regularHours, rate, amount: 0 },
  ];
  if (Math.random() < 0.55) {
    const otHours = pick([2, 4, 6, 8]);
    const otRate = round2(rate * 1.5);
    earnings.push({ description: 'Overtime', hours: otHours, rate: otRate, amount: 0 });
  }

  const grossPerPeriod = earnings.reduce((s, e) => s + (e.hours ?? 0) * (e.rate ?? 0), 0);

  // Build deductions first so we can subtract the pre-tax ones (401(k))
  // from the FIT/state tax base. Matches the W-2's treatment of Box 1.
  const deductions: PaystubLineItem[] = [];
  let contrib401kPerPeriod = 0;
  if (employer.offers401k && Math.random() < 0.6) {
    const pct = pick([0.03, 0.04, 0.05, 0.06]);
    contrib401kPerPeriod = round2(grossPerPeriod * pct);
    deductions.push({
      description: '401(k) Contribution',
      current: contrib401kPerPeriod,
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
  };
}

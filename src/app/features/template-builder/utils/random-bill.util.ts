import { Bill, BillLineItem } from '../models/bill.model';
import { pick, randInt, round2, shiftDays, toISO } from './random-helpers.util';
import { CITIES, FIRST_NAMES, LAST_NAMES, STREETS } from './pools.util';

interface BillerPreset {
  name: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  // States this biller serves. Undefined means nationwide.
  geoStates?: string[];
  buildItems: () => BillLineItem[];
}

const BILLERS: BillerPreset[] = [
  // Electric, water, and natural gas billers were removed. Real versions of
  // those bills include a previous-usage chart that this template doesn't
  // render — better to drop them than fake it. Only usage-agnostic billers
  // stay: internet, mobile, insurance.

  // Nationwide.
  {
    name: 'Westridge Internet',
    addressLine1: '4118 Cascade Way',
    addressLine2: 'Seattle, WA 98109',
    phone: '(206) 555-0177',
    buildItems: () => [
      { description: '300 Mbps Home Internet', amount: pick([49.99, 59.99, 69.99]) },
      { description: 'Wi-Fi router rental', amount: 14.0 },
      { description: 'Regulatory recovery fee', amount: round2(2 + Math.random() * 2) },
      { description: 'Local franchise fee', amount: round2(1 + Math.random() * 2) },
    ],
  },
  {
    name: 'Cascade Mobile',
    addressLine1: 'PO Box 7780',
    addressLine2: 'Boise, ID 83707',
    phone: '(800) 555-0103',
    buildItems: () => [
      { description: 'Unlimited plan (1 line)', amount: pick([55.0, 65.0, 75.0]) },
      { description: 'Device payment 6 of 24', amount: round2(20 + Math.random() * 15) },
      { description: 'Federal universal service fee', amount: round2(1 + Math.random() * 2) },
      { description: 'State and local taxes', amount: round2(3 + Math.random() * 4) },
    ],
  },
  {
    name: 'Coastline Auto Insurance',
    addressLine1: '8800 Boardwalk Drive',
    addressLine2: 'San Diego, CA 92103',
    phone: '(619) 555-0166',
    buildItems: () => [
      { description: 'Liability coverage (monthly premium)', amount: round2(46 + Math.random() * 20) },
      { description: 'Comprehensive and collision', amount: round2(30 + Math.random() * 18) },
      { description: 'Roadside assistance', amount: 4.0 },
      { description: 'Multi-policy discount', amount: round2(-(3 + Math.random() * 4)) },
    ],
  },
];

export function randomBill(now: Date = new Date()): Bill {
  const customerCity = pick(CITIES);
  const eligibleBillers = BILLERS.filter(
    (b) => !b.geoStates || b.geoStates.includes(customerCity.state),
  );
  const biller = pick(eligibleBillers);

  const customerName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  const customerStreet = `${randInt(100, 9999)} ${pick(STREETS)}`;

  const statementDate = shiftDays(now, -randInt(0, 18));
  // Give students at least two weeks between "today" and the due date.
  const dueDate = shiftDays(statementDate, 28 + randInt(0, 7));
  const servicePeriodEnd = shiftDays(statementDate, -randInt(2, 7));
  const servicePeriodStart = shiftDays(servicePeriodEnd, -randInt(28, 32));

  const lineItems = biller.buildItems();

  const hadPriorBalance = Math.random() < 0.7;
  const previousBalance = hadPriorBalance ? round2(40 + Math.random() * 140) : 0;
  // Sometimes the prior balance is fully paid, sometimes partially, sometimes
  // not paid at all — the last case triggers the past-due flow.
  const paymentDice = Math.random();
  let paymentsReceived = 0;
  if (hadPriorBalance) {
    if (paymentDice < 0.7) paymentsReceived = previousBalance;
    else if (paymentDice < 0.9) paymentsReceived = round2(previousBalance * 0.6);
    else paymentsReceived = 0;
  }
  const isPastDue = previousBalance - paymentsReceived > 0;
  const lateFee = isPastDue ? 25 : 0;
  // Only surface a minimum payment when past-due (bills without a carry-over
  // typically require the full amount).
  const newChargesTotal = lineItems.reduce((s, l) => s + l.amount, 0);
  const balanceDue = previousBalance - paymentsReceived + lateFee + newChargesTotal;
  const minimumPayment = isPastDue
    ? round2(Math.max(25, Math.min(balanceDue, previousBalance - paymentsReceived + lateFee + newChargesTotal * 0.1)))
    : 0;

  return {
    biller: {
      name: biller.name,
      addressLine1: biller.addressLine1,
      addressLine2: biller.addressLine2,
      phone: biller.phone,
    },
    customer: {
      name: customerName,
      addressLine1: customerStreet,
      addressLine2: `${customerCity.city}, ${customerCity.state} ${customerCity.zip}`,
      accountNumber: `${randInt(100, 999)}-${randInt(1000, 9999)}-${randInt(1000, 9999)}`,
    },
    statementDate: toISO(statementDate),
    dueDate: toISO(dueDate),
    servicePeriodStart: toISO(servicePeriodStart),
    servicePeriodEnd: toISO(servicePeriodEnd),
    previousBalance,
    paymentsReceived,
    lineItems,
    lateFee,
    minimumPayment,
  };
}

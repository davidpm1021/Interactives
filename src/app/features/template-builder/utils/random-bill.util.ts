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
  // Electric — local.
  {
    name: 'Pacific Northwest Electric',
    addressLine1: 'PO Box 4421',
    addressLine2: 'Portland, OR 97208',
    phone: '(503) 555-0142',
    geoStates: ['OR', 'WA'],
    buildItems: () => {
      const kwh = randInt(280, 720);
      const rate = 0.118;
      return [
        { description: 'Basic service charge', amount: round2(12 + Math.random() * 8) },
        { description: `Energy used: ${kwh} kWh @ $${rate}/kWh`, amount: round2(kwh * rate) },
        { description: 'Delivery charges', amount: round2(15 + Math.random() * 10) },
        { description: 'State energy tax', amount: round2(1 + Math.random() * 4) },
      ];
    },
  },
  {
    name: 'Bayfront Power',
    addressLine1: 'PO Box 8810',
    addressLine2: 'Tampa, FL 33601',
    phone: '(813) 555-0177',
    geoStates: ['FL', 'CA'],
    buildItems: () => {
      const kwh = randInt(420, 980);
      const rate = 0.132;
      return [
        { description: 'Customer charge', amount: round2(11 + Math.random() * 6) },
        { description: `Energy used: ${kwh} kWh @ $${rate}/kWh`, amount: round2(kwh * rate) },
        { description: 'Fuel adjustment', amount: round2(6 + Math.random() * 8) },
      ];
    },
  },
  {
    name: 'Prairie Electric Co-op',
    addressLine1: '88 Industrial Way',
    addressLine2: 'Boulder, CO 80301',
    phone: '(303) 555-0144',
    geoStates: ['CO', 'MT', 'TX'],
    buildItems: () => {
      const kwh = randInt(320, 760);
      const rate = 0.106;
      return [
        { description: 'Member service charge', amount: 9.75 },
        { description: `Energy used: ${kwh} kWh @ $${rate}/kWh`, amount: round2(kwh * rate) },
        { description: 'Generation adjustment', amount: round2(3 + Math.random() * 4) },
      ];
    },
  },
  {
    name: 'Badger Energy',
    addressLine1: '215 Capitol Square',
    addressLine2: 'Madison, WI 53703',
    phone: '(608) 555-0118',
    geoStates: ['WI', 'MN', 'NC'],
    buildItems: () => {
      const kwh = randInt(380, 820);
      const rate = 0.124;
      return [
        { description: 'Basic service', amount: 14.5 },
        { description: `Energy used: ${kwh} kWh @ $${rate}/kWh`, amount: round2(kwh * rate) },
        { description: 'Delivery surcharge', amount: round2(8 + Math.random() * 6) },
        { description: 'Renewable energy fund', amount: round2(2 + Math.random() * 2) },
      ];
    },
  },

  // Water — local.
  {
    name: 'Stream City Water',
    addressLine1: '210 Civic Plaza',
    addressLine2: 'Madison, WI 53703',
    phone: '(608) 555-0124',
    geoStates: ['WI', 'MN'],
    buildItems: () => {
      const gal = randInt(2000, 5500);
      return [
        { description: 'Water base charge', amount: 12.5 },
        { description: `Water use: ${gal} gal`, amount: round2(gal * 0.0058) },
        { description: 'Sewer service', amount: round2(18 + Math.random() * 6) },
        { description: 'Stormwater fee', amount: 4.25 },
      ];
    },
  },

  // Natural gas — local.
  {
    name: 'Greenway Natural Gas',
    addressLine1: 'PO Box 1199',
    addressLine2: 'Denver, CO 80201',
    phone: '(720) 555-0185',
    geoStates: ['CO', 'MT', 'NC', 'WI', 'MN'],
    buildItems: () => {
      const therms = randInt(20, 95);
      const rate = 0.84;
      return [
        { description: 'Monthly service fee', amount: 9.5 },
        { description: `Natural gas: ${therms} therms @ $${rate}`, amount: round2(therms * rate) },
        { description: 'Pipeline integrity charge', amount: round2(2 + Math.random() * 3) },
      ];
    },
  },

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

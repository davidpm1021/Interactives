import { Checkbook, CheckbookEntry } from '../models/checkbook.model';
import { pick, randFloat, randInt, shiftDays, toISO } from './random-helpers.util';
import { FIRST_NAMES, LAST_NAMES } from './pools.util';
import { CREDIT_VENDORS, DEBIT_VENDORS, REF_LABELS, VendorPicker, VendorPreset } from './vendors.util';

const CUSTOMER_STATES = ['OR', 'CO', 'NC', 'WA', 'WI', 'CA', 'VT', 'MN', 'TX', 'FL', 'NH', 'MT'];

function entryFromVendor(date: Date, vendor: VendorPreset, isDebit: boolean, ref: string): CheckbookEntry {
  const amount = randFloat(vendor.amtMin, vendor.amtMax);
  return {
    date: toISO(date),
    reference: ref,
    description: vendor.description,
    debit: isDebit ? amount : 0,
    credit: isDebit ? 0 : amount,
  };
}

export function randomCheckbook(now: Date = new Date()): Checkbook {
  const accountHolder = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  const accountNumber = `****${randInt(1000, 9999)}`;
  const openingBalance = randFloat(400, 2400);
  const customerState = pick(CUSTOMER_STATES);

  const debitPicker = new VendorPicker(3, customerState);
  const NON_PAYCHECK_CREDITS = CREDIT_VENDORS.filter((v) => v.id !== 'paycheck');
  const creditPicker = new VendorPicker(3, customerState);

  const startDate = shiftDays(now, -randInt(28, 32));
  const entries: CheckbookEntry[] = [];
  let nextCheckNum = randInt(1100, 1200);
  let cursor = new Date(startDate);

  const paycheck = CREDIT_VENDORS.find((v) => v.id === 'paycheck')!;
  entries.push(entryFromVendor(cursor, paycheck, false, REF_LABELS[paycheck.refKind]));
  const secondPaycheckDate = shiftDays(startDate, 14 + randInt(-1, 1));
  if (secondPaycheckDate < now) {
    entries.push(entryFromVendor(secondPaycheckDate, paycheck, false, REF_LABELS[paycheck.refKind]));
  }
  cursor = shiftDays(cursor, randInt(1, 3));

  const target = randInt(9, 14);
  while (entries.length < target && cursor < now) {
    if (Math.random() < 0.18) {
      const v = creditPicker.pick(NON_PAYCHECK_CREDITS);
      if (v) {
        entries.push(entryFromVendor(cursor, v, false, REF_LABELS[v.refKind]));
      }
    } else {
      const v = debitPicker.pick(DEBIT_VENDORS);
      if (v) {
        const ref = v.refKind === 'check' ? String(nextCheckNum++) : REF_LABELS[v.refKind];
        entries.push(entryFromVendor(cursor, v, true, ref));
      }
    }
    cursor = shiftDays(cursor, randInt(1, 4));
  }

  entries.sort((a, b) => a.date.localeCompare(b.date));

  return { accountHolder, accountNumber, openingBalance, entries };
}

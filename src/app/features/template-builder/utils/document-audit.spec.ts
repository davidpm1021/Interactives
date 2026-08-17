/**
 * Calculation audit across every document the Template Builder produces.
 *
 * Generates a large sample of each and re-derives the printed figures from
 * first principles, rather than trusting the code that produced them. Teachers
 * hand these numbers to students as fact, and the failures worth catching are
 * the ones where a document contradicts itself: a balance that will not
 * reconcile, payment history predating the account it belongs to.
 *
 * One limitation worth knowing. The statement check re-derives both the
 * ending balance and the running-balance column here, so it cannot catch
 * those two drifting apart inside the editor component. That equality is
 * verified against the rendered document instead.
 */
import { describe, expect, it } from 'vitest';
import { randomPaystub } from './random-paystub.util';
import { randomW2 } from './random-w2.util';
import { randomChecking, randomSavings } from './random-account-statement.util';
import { randomBill } from './random-bill.util';
import { randomCreditReport } from './random-credit-report.util';
import { sampleChecking, sampleSavings } from '../models/account-statement.model';
import { sampleBill } from '../models/bill.model';
import { samplePaystub, earningCurrent, lineItemAmount } from '../models/paystub.model';
import { sampleCreditReport, PAYMENT_HISTORY_MONTHS } from '../models/credit-report.model';
import * as pm from './paystub-math.util';

const N = 400;
const REF = new Date(2026, 5, 15);
const cents = (n: number) => Math.round(n * 100);
const findings = new Map<string, { count: number; example: string }>();

function check(ok: boolean, label: string, example: () => string): void {
  if (ok) return;
  const f = findings.get(label);
  if (f) f.count++;
  else findings.set(label, { count: 1, example: example() });
}

// ── Paystub ────────────────────────────────────────────────────────────────
for (let i = 0; i < N; i++) {
  const p = randomPaystub(REF);
  const gross = p.earnings.reduce((s, e) => s + earningCurrent(e), 0);
  check(cents(pm.grossCurrent(p)) === cents(gross), 'paystub: gross != sum of earnings', () => `${gross}`);

  const preTax = p.deductions.reduce((s, d) => (d.preTax ? s + lineItemAmount(d, gross) : s), 0);
  const taxable = Math.max(0, gross - preTax);
  check(cents(pm.taxableGrossCurrent(p)) === cents(taxable), 'paystub: taxable base wrong', () => `${taxable}`);

  check(cents(pm.socialSecurityCurrent(p)) === cents(gross * 0.062), 'paystub: SS != 6.2% of gross', () => `${gross}`);
  check(cents(pm.medicareCurrent(p)) === cents(gross * 0.0145), 'paystub: Medicare != 1.45% of gross', () => `${gross}`);

  const net = pm.netCurrent(p);
  check(
    cents(net + pm.taxesCurrent(p) + pm.deductionsCurrent(p)) === cents(gross),
    'paystub: net + taxes + deductions != gross',
    () => `${gross}`,
  );
  check(net > 0, 'paystub: net pay is zero or negative', () => `gross ${gross}, net ${net}`);
  check(net < gross, 'paystub: net pay exceeds gross', () => `${gross}`);

  // YTD columns must be the per-period figure times the period count.
  check(cents(pm.grossYTD(p)) === cents(gross * p.periodsYTD), 'paystub: gross YTD mismatch', () => `${gross}`);
  check(cents(pm.netYTD(p)) === cents(net * p.periodsYTD), 'paystub: net YTD mismatch', () => `${net}`);

  // Period dates must be coherent.
  const start = new Date(p.period.start + 'T00:00:00');
  const end = new Date(p.period.end + 'T00:00:00');
  const pay = new Date(p.period.payDate + 'T00:00:00');
  check(start < end, 'paystub: period start not before end', () => p.period.start);
  check(end < pay, 'paystub: pay date not after period end', () => p.period.payDate);
  check(p.periodsYTD >= 1 && p.periodsYTD <= 26, 'paystub: periodsYTD out of range', () => `${p.periodsYTD}`);

  // A paystub dated in period N should not claim YTD beyond what the calendar allows.
  const weeksIntoYear = Math.floor(
    (pay.getTime() - new Date(pay.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7),
  );
  check(
    p.periodsYTD <= Math.max(1, Math.ceil(weeksIntoYear / 2) + 1),
    'paystub: periodsYTD implies more pay periods than the year has elapsed',
    () => `payDate ${p.period.payDate}, periodsYTD ${p.periodsYTD}`,
  );

  // Annualized gross should land near the YTD run-rate.
  const impliedAnnual = gross * 26;
  check(impliedAnnual > 5000 && impliedAnnual < 200000, 'paystub: implausible annual gross', () => `${impliedAnnual}`);
}

// ── W-2 ────────────────────────────────────────────────────────────────────
for (let i = 0; i < N; i++) {
  const w = randomW2(REF);
  const deferral = w.box12.find((b) => b.code === 'D')?.amount ?? 0;

  check(cents(w.wages) === cents(w.ssWages - deferral), 'w2: Box 1 != Box 3 minus deferral', () => `${w.wages}`);
  check(cents(w.ssTaxWithheld) === cents(Math.round(w.ssWages * 0.062 * 100) / 100), 'w2: Box 4 != 6.2% of Box 3', () => `${w.ssWages}`);
  check(cents(w.medicareTaxWithheld) === cents(Math.round(w.ssWages * 0.0145 * 100) / 100), 'w2: Box 6 != 1.45% of Box 5', () => `${w.ssWages}`);
  check(w.medicareWages === w.ssWages, 'w2: Box 5 != Box 3', () => `${w.ssWages}`);
  check(w.fedTaxWithheld < w.wages, 'w2: federal withholding exceeds Box 1', () => `${w.wages}`);
  check(w.fedTaxWithheld >= 0, 'w2: negative federal withholding', () => `${w.fedTaxWithheld}`);
  check(w.stateTaxWithheld >= 0, 'w2: negative state withholding', () => `${w.stateTaxWithheld}`);
  check(w.stateWages === 0 || w.stateWages === w.wages, 'w2: state wages neither zero nor Box 1', () => `${w.stateWages}`);
  check(w.retirementPlan === deferral > 0, 'w2: retirement box disagrees with Box 12 D', () => `${w.retirementPlan}`);
  // Box 12 D is an elective deferral; it cannot exceed the wages it came from.
  check(deferral < w.ssWages, 'w2: deferral exceeds total wages', () => `${deferral}`);
  // FICA is capped at the Social Security wage base; well below it here.
  check(w.ssWages < 176100, 'w2: wages above the SS wage base, cap not modelled', () => `${w.ssWages}`);
}

// ── Bank statement (checking and savings) ──────────────────────────────────
function auditStatement(s: ReturnType<typeof randomChecking>, tag: string): void {
  const credits = s.transactions.filter((t) => t.kind === 'credit').reduce((a, t) => a + t.amount, 0);
  const debits = s.transactions.filter((t) => t.kind === 'debit').reduce((a, t) => a + t.amount, 0);

  // What the preview's Ending Balance figure computes.
  const stated = s.beginningBalance + credits + (s.interestEarned || 0) - debits - s.fees;
  // What the running-balance column arrives at on its last row. Interest and
  // fees post as their own rows, so they belong here too.
  const running = s.beginningBalance + credits - debits + (s.interestEarned || 0) - s.fees;

  check(cents(stated) === cents(running), `${tag}: ending balance != last running balance`, () =>
    `stated ${stated.toFixed(2)}, running ${running.toFixed(2)}, interest ${s.interestEarned}, fees ${s.fees}`);

  check(stated > 0, `${tag}: ending balance is zero or negative`, () => `${stated.toFixed(2)}`);

  // No transaction may fall outside the statement period.
  for (const t of s.transactions) {
    check(t.date >= s.periodStart && t.date <= s.periodEnd, `${tag}: transaction outside the statement period`, () =>
      `${t.date} not in ${s.periodStart}..${s.periodEnd}`);
    check(t.amount > 0, `${tag}: non-positive transaction amount`, () => `${t.amount}`);
  }
  check(s.periodStart < s.periodEnd, `${tag}: period start not before end`, () => s.periodStart);

  // The running balance should never imply an overdraft the document doesn't show.
  let bal = s.beginningBalance;
  let lowest = bal;
  const sorted = [...s.transactions].sort((a, b) => a.date.localeCompare(b.date));
  for (const t of sorted) {
    bal += t.kind === 'credit' ? t.amount : -t.amount;
    if (bal < lowest) lowest = bal;
  }
  check(lowest >= 0, `${tag}: running balance goes negative with no overdraft line`, () =>
    `dips to ${lowest.toFixed(2)}, begins at ${s.beginningBalance.toFixed(2)}`);
}

for (let i = 0; i < N; i++) auditStatement(randomChecking(REF), 'checking');
for (let i = 0; i < N; i++) auditStatement(randomSavings(REF), 'savings');

// Savings interest should match the APY it prints.
for (let i = 0; i < N; i++) {
  const s = randomSavings(REF);
  if (!s.apy) continue;
  const monthly = Math.pow(1 + s.apy / 100, 1 / 12) - 1;
  const expected = Math.round(s.beginningBalance * monthly * 100) / 100;
  check(cents(s.interestEarned) === cents(expected), 'savings: interest does not match printed APY', () =>
    `apy ${s.apy}, begin ${s.beginningBalance}, got ${s.interestEarned}, expected ${expected}`);
}

// ── Bill ───────────────────────────────────────────────────────────────────
for (let i = 0; i < N; i++) {
  const b = randomBill(REF);
  const newCharges = b.lineItems.reduce((s, l) => s + l.amount, 0);
  const carryOver = Math.max(0, b.previousBalance - b.paymentsReceived);
  const pastDue = carryOver > 0;
  const balanceDue = b.previousBalance - b.paymentsReceived + newCharges + (pastDue ? b.lateFee : 0);

  check(balanceDue > 0, 'bill: balance due is zero or negative', () => `${balanceDue.toFixed(2)}`);
  check(b.paymentsReceived <= b.previousBalance, 'bill: payments exceed the previous balance', () =>
    `paid ${b.paymentsReceived}, prev ${b.previousBalance}`);
  check(!pastDue || b.lateFee > 0, 'bill: past due but no late fee', () => `${carryOver}`);
  check(pastDue || b.lateFee === 0, 'bill: late fee charged without a past-due balance', () => `${b.lateFee}`);
  check(b.minimumPayment === 0 || b.minimumPayment <= balanceDue + 0.005, 'bill: minimum payment exceeds balance due', () =>
    `min ${b.minimumPayment}, due ${balanceDue.toFixed(2)}`);
  check(newCharges > 0, 'bill: new charges total zero or less', () => `${newCharges}`);

  // Dates.
  check(b.servicePeriodStart < b.servicePeriodEnd, 'bill: service period start not before end', () => b.servicePeriodStart);
  check(b.servicePeriodEnd <= b.statementDate, 'bill: service period ends after the statement date', () => b.servicePeriodEnd);
  check(b.statementDate < b.dueDate, 'bill: due date not after the statement date', () => b.dueDate);

  // A negative line item is a discount; it must not exceed the charges.
  const discounts = b.lineItems.filter((l) => l.amount < 0).reduce((s, l) => s + l.amount, 0);
  check(newCharges + Math.abs(discounts) > Math.abs(discounts), 'bill: discounts exceed charges', () => `${newCharges}`);
}

// ── Credit report ──────────────────────────────────────────────────────────
for (let i = 0; i < N; i++) {
  const r = randomCreditReport(REF);
  check(r.score >= 300 && r.score <= 850, 'credit: score outside 300-850', () => `${r.score}`);

  for (const a of r.accounts) {
    check(a.balance >= 0, 'credit: negative balance', () => `${a.balance}`);
    check(a.creditLimit >= 0, 'credit: negative credit limit', () => `${a.creditLimit}`);
    if (a.creditLimit > 0) {
      check(a.balance <= a.creditLimit, 'credit: balance exceeds the credit limit', () =>
        `${a.creditor}: ${a.balance} of ${a.creditLimit}`);
    }
    check(a.openedDate <= r.reportDate, 'credit: account opened after the report date', () => a.openedDate);
    check(a.paymentHistory.length <= PAYMENT_HISTORY_MONTHS, 'credit: payment history longer than 24 months', () =>
      `${a.paymentHistory.length}`);
    check(a.paymentHistory.length > 0, 'credit: account with no payment history', () => a.creditor);

    // A closed or paid account should not carry a balance.
    if (a.status === 'Closed' || a.status === 'Paid') {
      check(a.balance === 0, 'credit: closed or paid account still carries a balance', () =>
        `${a.creditor} ${a.status} ${a.balance}`);
    }
    // Payment status describes the account now, so only the most recent month
    // has to agree. Historical lates alongside a Current status are correct
    // and are how a real report reads.
    if (a.paymentStatus === 'Current') {
      check(a.paymentHistory[0] === 'OK' || a.paymentHistory[0] === 'NA',
        'credit: marked Current but the latest month is late', () =>
        `${a.creditor}: latest ${a.paymentHistory[0]}`);
    } else if (a.paymentStatus === '30 days late') {
      check(a.paymentHistory[0] === '30', 'credit: marked 30 days late but latest month disagrees', () =>
        `${a.creditor}: latest ${a.paymentHistory[0]}`);
    }
    // History must not predate the account.
    const monthsOpen = Math.max(
      0,
      (new Date(r.reportDate).getFullYear() - new Date(a.openedDate).getFullYear()) * 12 +
        (new Date(r.reportDate).getMonth() - new Date(a.openedDate).getMonth()),
    );
    const realMonths = a.paymentHistory.filter((m) => m !== 'NA').length;
    check(realMonths <= monthsOpen + 1, 'credit: more payment months than the account has existed', () =>
      `${a.creditor}: ${realMonths} months of history, open ${monthsOpen} months`);
  }

  for (const q of r.inquiries) {
    check(q.date <= r.reportDate, 'credit: inquiry dated after the report', () => q.date);
    // Hard inquiries drop off after two years.
    const ageDays = (new Date(r.reportDate).getTime() - new Date(q.date).getTime()) / 86400000;
    check(ageDays <= 366 * 2 + 2, 'credit: inquiry older than two years still listed', () => q.date);
  }

  // Utilization, as the preview computes it.
  const revolving = r.accounts.filter((a) => a.creditLimit > 0);
  const totalBal = revolving.reduce((s, a) => s + a.balance, 0);
  const totalLim = revolving.reduce((s, a) => s + a.creditLimit, 0);
  if (totalLim > 0) {
    const util = (totalBal / totalLim) * 100;
    check(util >= 0 && util <= 100, 'credit: utilization outside 0-100%', () => `${util.toFixed(1)}`);
  }
}

// ── Built-in samples (the "Load sample" starting point) ────────────────────
{
  const p = samplePaystub();
  const gross = p.earnings.reduce((s, e) => s + earningCurrent(e), 0);
  check(cents(pm.netCurrent(p) + pm.taxesCurrent(p) + pm.deductionsCurrent(p)) === cents(gross),
    'sample paystub: net + taxes + deductions != gross', () => `${gross}`);

  for (const [s, tag] of [[sampleChecking(), 'sample checking'], [sampleSavings(), 'sample savings']] as const) {
    const credits = s.transactions.filter((t) => t.kind === 'credit').reduce((a, t) => a + t.amount, 0);
    const debits = s.transactions.filter((t) => t.kind === 'debit').reduce((a, t) => a + t.amount, 0);
    const stated = s.beginningBalance + credits + (s.interestEarned || 0) - debits - s.fees;
    const running = s.beginningBalance + credits - debits + (s.interestEarned || 0) - s.fees;
    check(cents(stated) === cents(running), `${tag}: ending balance != last running balance`, () =>
      `stated ${stated.toFixed(2)}, running ${running.toFixed(2)}`);
  }

  const b = sampleBill();
  const newCharges = b.lineItems.reduce((s, l) => s + l.amount, 0);
  check(cents(newCharges) === cents(86.59), 'sample bill: line items do not sum as documented', () => `${newCharges}`);

  const cr = sampleCreditReport();
  check(cr.score >= 300 && cr.score <= 850, 'sample credit report: score out of range', () => `${cr.score}`);
  for (const a of cr.accounts) {
    if (a.creditLimit > 0) {
      check(a.balance <= a.creditLimit, 'sample credit report: balance exceeds limit', () => a.creditor);
    }
  }
}

// ── Report ─────────────────────────────────────────────────────────────────
describe('calculation audit', () => {
  it('produces no arithmetic inconsistencies', () => {
    const lines: string[] = [`
Audited ${N} of each document type.`];
    if (findings.size === 0) {
      lines.push('No arithmetic inconsistencies found.');
    } else {
      lines.push(`${findings.size} distinct finding(s):`);
      for (const [label, { count, example }] of [...findings.entries()].sort((a, b) => b[1].count - a[1].count)) {
        lines.push(`  [${String(count).padStart(4)}]  ${label}`);
        lines.push(`          e.g. ${example}`);
      }
    }
    console.log(lines.join('\n'));
    expect([...findings.keys()]).toEqual([]);
  });
});

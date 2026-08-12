import {
  MEDICARE_RATE,
  Paystub,
  PaystubEarning,
  PaystubLineItem,
  SOCIAL_SECURITY_RATE,
  earningCurrent,
  lineItemAmount,
} from '../models/paystub.model';
import { effectiveFederalRate, effectiveStateRate } from './tax-rates.util';

/**
 * Every number that appears on a printed paystub.
 *
 * Extracted from PaystubEditor, where these lived as protected methods and so
 * could not be exercised without standing up the component and reading numbers
 * back out of the DOM. Teachers hand these figures to students as fact, so they
 * are worth testing directly.
 *
 * Pure and stateless: each function takes the paystub and returns a number.
 * The editor keeps the same method names and delegates here, so the template
 * is unchanged.
 */

/** Pay periods per year assumed when annualizing a biweekly gross. */
export const PERIODS_PER_YEAR = 26;

export function grossCurrent(p: Paystub): number {
  return p.earnings.reduce((sum, e) => sum + earningCurrent(e), 0);
}

export function grossYTD(p: Paystub): number {
  return grossCurrent(p) * p.periodsYTD;
}

export function earningYTD(e: PaystubEarning, p: Paystub): number {
  return earningCurrent(e) * p.periodsYTD;
}

/** Dollar value of a line item, resolving percent-of-gross items against gross. */
export function lineItemCurrent(item: PaystubLineItem, p: Paystub): number {
  return lineItemAmount(item, grossCurrent(p));
}

export function lineItemYTD(item: PaystubLineItem, p: Paystub): number {
  return lineItemCurrent(item, p) * p.periodsYTD;
}

export function socialSecurityCurrent(p: Paystub): number {
  return p.includeFICA ? grossCurrent(p) * SOCIAL_SECURITY_RATE : 0;
}

export function socialSecurityYTD(p: Paystub): number {
  return socialSecurityCurrent(p) * p.periodsYTD;
}

export function medicareCurrent(p: Paystub): number {
  return p.includeFICA ? grossCurrent(p) * MEDICARE_RATE : 0;
}

export function medicareYTD(p: Paystub): number {
  return medicareCurrent(p) * p.periodsYTD;
}

export function otherTaxesCurrent(p: Paystub): number {
  return p.otherTaxes.reduce((s, t) => s + lineItemCurrent(t, p), 0);
}

/**
 * Federal withholding for the period.
 *
 * The rate is looked up from the annualized gross, then applied to the
 * period's gross.
 *
 * Note: the base is the full gross. Pre-tax deductions such as a 401(k)
 * contribution do not reduce it, which is not how the W-2 generator treats the
 * same situation (there, `wagesBox1 = annualWages - contrib401k` and federal
 * withholding is computed on Box 1). Preserved as-is during extraction rather
 * than quietly changed, since it alters the numbers on documents already in
 * use. See paystub-math.util.spec.ts, which pins the behavior and explains it.
 */
export function federalCurrent(p: Paystub): number {
  if (!p.includeFederalTax) return 0;
  const gross = grossCurrent(p);
  if (gross <= 0) return 0;
  return Math.round(gross * effectiveFederalRate(gross * PERIODS_PER_YEAR) * 100) / 100;
}

export function federalYTD(p: Paystub): number {
  return federalCurrent(p) * p.periodsYTD;
}

/** State withholding for the period. Same full-gross base as federalCurrent. */
export function stateCurrent(p: Paystub): number {
  if (!p.stateForTax) return 0;
  const gross = grossCurrent(p);
  if (gross <= 0) return 0;
  return Math.round(gross * effectiveStateRate(p.stateForTax, gross * PERIODS_PER_YEAR) * 100) / 100;
}

export function stateYTD(p: Paystub): number {
  return stateCurrent(p) * p.periodsYTD;
}

export function taxesCurrent(p: Paystub): number {
  return (
    socialSecurityCurrent(p) +
    medicareCurrent(p) +
    federalCurrent(p) +
    stateCurrent(p) +
    otherTaxesCurrent(p)
  );
}

export function taxesYTD(p: Paystub): number {
  return taxesCurrent(p) * p.periodsYTD;
}

export function deductionsCurrent(p: Paystub): number {
  return p.deductions.reduce((s, d) => s + lineItemCurrent(d, p), 0);
}

export function deductionsYTD(p: Paystub): number {
  return deductionsCurrent(p) * p.periodsYTD;
}

export function netCurrent(p: Paystub): number {
  return grossCurrent(p) - taxesCurrent(p) - deductionsCurrent(p);
}

export function netYTD(p: Paystub): number {
  return netCurrent(p) * p.periodsYTD;
}

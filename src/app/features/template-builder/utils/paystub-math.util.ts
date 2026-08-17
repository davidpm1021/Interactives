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

/** Deductions taken before income tax is figured, such as a traditional 401(k). */
export function preTaxDeductionsCurrent(p: Paystub): number {
  return p.deductions.reduce((s, d) => s + (d.preTax ? lineItemCurrent(d, p) : 0), 0);
}

/**
 * The wages federal and state income tax are actually figured on: gross less
 * anything deferred before tax. This is the paystub's equivalent of W-2 Box 1,
 * and the W-2 generator computes its own the same way.
 *
 * Floored at zero so a teacher who enters deductions exceeding gross gets no
 * withholding rather than a negative tax that would credit money back.
 */
export function taxableGrossCurrent(p: Paystub): number {
  return Math.max(0, grossCurrent(p) - preTaxDeductionsCurrent(p));
}

/**
 * Federal withholding for the period.
 *
 * The rate is looked up from the annualized taxable wages, then applied to the
 * period's taxable wages. Note this is the post-deferral figure, unlike FICA
 * above, which is charged on the full gross.
 */
export function federalCurrent(p: Paystub): number {
  if (!p.includeFederalTax) return 0;
  const taxable = taxableGrossCurrent(p);
  if (taxable <= 0) return 0;
  return (
    Math.round(taxable * effectiveFederalRate(taxable * PERIODS_PER_YEAR, p.taxJitter) * 100) / 100
  );
}

export function federalYTD(p: Paystub): number {
  return federalCurrent(p) * p.periodsYTD;
}

/** State withholding for the period. Same post-deferral base as federalCurrent. */
export function stateCurrent(p: Paystub): number {
  if (!p.stateForTax) return 0;
  const taxable = taxableGrossCurrent(p);
  if (taxable <= 0) return 0;
  return (
    Math.round(
      taxable * effectiveStateRate(p.stateForTax, taxable * PERIODS_PER_YEAR, p.taxJitter) * 100,
    ) / 100
  );
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

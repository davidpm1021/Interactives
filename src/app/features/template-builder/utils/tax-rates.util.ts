// Effective withholding rate helpers used by Paystub and W-2 generators.
// These are rough effective rates (not statutory marginal rates) calibrated
// for a single filer taking the standard deduction. Good enough for
// classroom realism — never authoritative for actual tax prep.

// Two-letter state abbreviation → withholding-rate function.
// Returns the fraction of gross wages typically withheld for state income tax.
const STATE_RATE: Record<string, (annualGross: number) => number> = {
  // No state income tax on wages.
  AK: () => 0,
  FL: () => 0,
  NH: () => 0,
  NV: () => 0,
  SD: () => 0,
  TN: () => 0,
  TX: () => 0,
  WA: () => 0,
  WY: () => 0,

  // Flat-rate states.
  CO: () => 0.044,
  NC: () => 0.045,
  IL: () => 0.0495,
  IN: () => 0.0315,
  KY: () => 0.04,
  MI: () => 0.0425,
  PA: () => 0.0307,
  UT: () => 0.0485,

  // Progressive states (simplified effective rates).
  OR: (g) => (g < 10000 ? 0.05 : g < 25000 ? 0.058 : g < 125000 ? 0.075 : 0.085),
  CA: (g) => (g < 10000 ? 0.01 : g < 25000 ? 0.02 : g < 50000 ? 0.04 : g < 100000 ? 0.06 : 0.08),
  WI: (g) => (g < 13000 ? 0.035 : g < 26000 ? 0.044 : g < 287000 ? 0.054 : 0.0765),
  VT: (g) => (g < 45000 ? 0.0335 : g < 110000 ? 0.066 : g < 230000 ? 0.076 : 0.0875),
  MN: (g) => (g < 30000 ? 0.054 : g < 100000 ? 0.068 : g < 175000 ? 0.0785 : 0.0985),
  MT: (g) => (g < 21000 ? 0.047 : 0.059),
  NY: (g) => (g < 13000 ? 0.04 : g < 80000 ? 0.058 : g < 215000 ? 0.0635 : 0.0685),
  NJ: (g) => (g < 35000 ? 0.0175 : g < 75000 ? 0.0353 : g < 500000 ? 0.0637 : 0.0897),
  MA: () => 0.05,
  CT: (g) => (g < 50000 ? 0.05 : g < 100000 ? 0.055 : 0.0635),
  GA: (g) => (g < 50000 ? 0.0539 : 0.0575),
};

export function hasStateIncomeTax(stateAbbr: string): boolean {
  const fn = STATE_RATE[stateAbbr];
  if (!fn) return false;
  // Sample at $50k to detect zero-rate states quickly.
  return fn(50000) > 0;
}

/**
 * Effective state income tax withholding rate for the given annual gross.
 * Returns 0 for no-tax states. Offsets the published rate slightly so two
 * paystubs from the same employer don't show identical state tax cents.
 *
 * `jitter` is a 0-1 position within that offset window. Callers that read a
 * rate repeatedly must pass a value they hold onto: a paystub re-derives its
 * tax on every render, so rolling a fresh number here made the withholding on
 * screen change as the teacher typed. The default keeps one-shot callers, like
 * the W-2 generator, working as before.
 */
export function effectiveStateRate(
  stateAbbr: string,
  annualGross: number,
  jitter: number = Math.random(),
): number {
  const fn = STATE_RATE[stateAbbr];
  if (!fn) return 0;
  const base = fn(annualGross);
  if (base === 0) return 0;
  // ±0.3%
  const offset = (jitter - 0.5) * 0.006;
  return Math.max(0, base + offset);
}

/**
 * Effective federal income tax withholding rate for the given annual gross.
 * Single filer, standard deduction. `jitter` positions the rate within its
 * band; see effectiveStateRate for why a caller should supply it. Returns
 * roughly:
 *   $15k → 1–3%
 *   $25k → 3–5%
 *   $40k → 6–8%
 *   $60k → 9–11%
 *   $90k → 11–13%
 *  $120k → 13–15%
 */
export function effectiveFederalRate(
  annualGross: number,
  jitter: number = Math.random(),
): number {
  if (annualGross < 15000) return 0.01 + jitter * 0.02;
  if (annualGross < 25000) return 0.03 + jitter * 0.02;
  if (annualGross < 40000) return 0.06 + jitter * 0.02;
  if (annualGross < 60000) return 0.09 + jitter * 0.02;
  if (annualGross < 90000) return 0.11 + jitter * 0.02;
  return 0.13 + jitter * 0.02;
}

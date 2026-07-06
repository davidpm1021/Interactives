// Shared input parsers for editor form fields. Every editor was carrying its
// own copies of these — now they live in one place.

export function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** parseNumber, but clamps negatives to 0. Use for currency-ish fields. */
export function parseNonNegative(value: string): number {
  const n = parseNumber(value);
  return n < 0 ? 0 : n;
}

export function parseNullableNumber(value: string | null | undefined): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** parseNullableNumber, but clamps negatives to 0. */
export function parseNullableNonNegative(value: string | null | undefined): number | null {
  const n = parseNullableNumber(value);
  return n !== null && n < 0 ? 0 : n;
}

export function parseScore(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 700;
  return Math.max(300, Math.min(850, Math.round(n)));
}

/**
 * Clamp to a plausible year range [minYear, maxYear]. Returns fallback for
 * empty/invalid input. Also used to prevent flicker on partial edits: while a
 * user is typing "202", we get 202 which is below minYear, so we return
 * fallback instead of accepting an unrealistic year.
 */
export function parseYear(
  value: string,
  fallback: number,
  minYear = 1900,
  maxYear = 2100,
): number {
  if (value === '' || value === null || value === undefined) return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  if (n < minYear || n > maxYear) return fallback;
  return n;
}

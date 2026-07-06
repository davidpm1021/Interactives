// Shared input parsers for editor form fields. Every editor was carrying its
// own copies of these — now they live in one place.

export function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function parseNullableNumber(value: string | null | undefined): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseScore(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 700;
  return Math.max(300, Math.min(850, Math.round(n)));
}

export function parseYear(value: string, fallback: number): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

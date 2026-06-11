import { PreferenceCategory } from '../models/car-preferences.models';

export function encodeProfile(
  values: Record<string, number>,
  categoryOrder: PreferenceCategory[],
): string {
  return categoryOrder.map((c) => String(values[c.id] ?? c.defaultValue ?? 5)).join(',');
}

export function decodeProfile(
  param: string | null,
  categoryOrder: PreferenceCategory[],
): Record<string, number> | null {
  if (!param) return null;
  const parts = param.split(',');
  if (parts.length > categoryOrder.length) return null;
  const out: Record<string, number> = {};
  for (let i = 0; i < parts.length; i++) {
    const n = Number(parts[i]);
    if (!Number.isFinite(n) || n < 0 || n > 10) return null;
    out[categoryOrder[i].id] = Math.round(n);
  }
  return out;
}

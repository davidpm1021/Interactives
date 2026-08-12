import { describe, expect, it } from 'vitest';
import {
  parseNonNegative,
  parseNullableNonNegative,
  parseNullableNumber,
  parseNumber,
  parseScore,
  parseYear,
} from './input-parsers.util';

/**
 * These sit between a teacher's keystrokes and the money on the page, so the
 * cases that matter are the messy ones: a half-typed number, a stray minus
 * sign, an emptied field.
 */

describe('parseNumber', () => {
  it('reads a plain number', () => {
    expect(parseNumber('42')).toBe(42);
    expect(parseNumber('18.75')).toBe(18.75);
  });

  it('keeps negatives', () => {
    expect(parseNumber('-30')).toBe(-30);
  });

  it('falls back to zero on anything unparseable', () => {
    expect(parseNumber('abc')).toBe(0);
    expect(parseNumber('')).toBe(0);
    expect(parseNumber('12abc')).toBe(0);
  });
});

describe('parseNonNegative', () => {
  it('clamps a negative to zero rather than showing negative pay', () => {
    expect(parseNonNegative('-30')).toBe(0);
    expect(parseNonNegative('-0.01')).toBe(0);
  });

  it('leaves zero and positives alone', () => {
    expect(parseNonNegative('0')).toBe(0);
    expect(parseNonNegative('19.37')).toBe(19.37);
  });
});

describe('parseNullableNumber', () => {
  it('treats an emptied field as absent, not as zero', () => {
    // The distinction matters: an earning line with null hours falls back to a
    // flat amount, while zero hours would compute a gross of nothing.
    expect(parseNullableNumber('')).toBeNull();
    expect(parseNullableNumber(null)).toBeNull();
    expect(parseNullableNumber(undefined)).toBeNull();
  });

  it('reads a number when one is present', () => {
    expect(parseNullableNumber('7.5')).toBe(7.5);
    expect(parseNullableNumber('0')).toBe(0);
  });

  it('returns null rather than zero on junk', () => {
    expect(parseNullableNumber('abc')).toBeNull();
  });
});

describe('parseNullableNonNegative', () => {
  it('keeps absent as absent', () => {
    expect(parseNullableNonNegative('')).toBeNull();
  });

  it('clamps a negative to zero', () => {
    expect(parseNullableNonNegative('-5')).toBe(0);
  });
});

describe('parseScore', () => {
  it('holds a credit score inside the real 300-850 range', () => {
    expect(parseScore('200')).toBe(300);
    expect(parseScore('900')).toBe(850);
    expect(parseScore('720')).toBe(720);
  });

  it('rounds a fractional score, since scores are whole numbers', () => {
    expect(parseScore('719.6')).toBe(720);
  });

  it('falls back to a mid-range score on junk', () => {
    expect(parseScore('abc')).toBe(700);
  });

  /**
   * An emptied field is not junk to Number(), which reads '' as 0, so the
   * clamp catches it before the 700 fallback can and the score snaps to the
   * floor. Clearing the score box therefore shows 300 rather than a neutral
   * default. Pinned as current behavior; worth revisiting, since 300 is a
   * meaningful score to put in front of students rather than a blank.
   */
  it('snaps an emptied score field to the 300 floor, not to the fallback', () => {
    expect(parseScore('')).toBe(300);
  });
});

describe('parseYear', () => {
  it('accepts a year inside the range', () => {
    expect(parseYear('2024', 2026)).toBe(2024);
  });

  it('holds the fallback while a year is still being typed', () => {
    // Typing "2024" passes through "2", "20", "202" — each below the floor.
    // Accepting those would make the field flicker through absurd years.
    expect(parseYear('2', 2026)).toBe(2026);
    expect(parseYear('20', 2026)).toBe(2026);
    expect(parseYear('202', 2026)).toBe(2026);
  });

  it('rejects years outside the range', () => {
    expect(parseYear('1899', 2026)).toBe(2026);
    expect(parseYear('2101', 2026)).toBe(2026);
  });

  it('honours custom bounds', () => {
    expect(parseYear('2010', 2026, 2015, 2030)).toBe(2026);
    expect(parseYear('2020', 2026, 2015, 2030)).toBe(2020);
  });

  it('falls back on empty or junk input', () => {
    expect(parseYear('', 2026)).toBe(2026);
    expect(parseYear('abc', 2026)).toBe(2026);
  });
});

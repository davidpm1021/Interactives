import { describe, expect, it } from 'vitest';
import { PreferenceCategory } from '../models/car-preferences.models';
import { decodeProfile, encodeProfile } from './profile-codec.util';

const CATS: PreferenceCategory[] = [
  { id: 'a', label: 'A', anchors: [] },
  { id: 'b', label: 'B', anchors: [] },
  { id: 'c', label: 'C', anchors: [] },
];

describe('encodeProfile', () => {
  it('encodes values in category order', () => {
    expect(encodeProfile({ a: 5, b: 6, c: 7 }, CATS)).toBe('5,6,7');
  });

  it('falls back to defaultValue, then 5, for missing values', () => {
    const cats: PreferenceCategory[] = [
      { id: 'a', label: 'A', anchors: [], defaultValue: 3 },
      { id: 'b', label: 'B', anchors: [] },
    ];
    expect(encodeProfile({}, cats)).toBe('3,5');
  });
});

describe('decodeProfile', () => {
  it('roundtrips with encodeProfile', () => {
    const profile = { a: 5, b: 6, c: 7 };
    const encoded = encodeProfile(profile, CATS);
    expect(decodeProfile(encoded, CATS)).toEqual(profile);
  });

  it('returns null for null or empty input', () => {
    expect(decodeProfile(null, CATS)).toBeNull();
    expect(decodeProfile('', CATS)).toBeNull();
  });

  it('returns null when the param has more values than categories', () => {
    expect(decodeProfile('1,2,3,4', CATS)).toBeNull();
  });

  it('accepts shorter params and only sets the leading categories', () => {
    expect(decodeProfile('5,6', CATS)).toEqual({ a: 5, b: 6 });
  });

  it('returns null on non-numeric values', () => {
    expect(decodeProfile('5,foo,7', CATS)).toBeNull();
  });

  it('returns null on out-of-range values', () => {
    expect(decodeProfile('5,11,7', CATS)).toBeNull();
    expect(decodeProfile('-1,5,5', CATS)).toBeNull();
  });

  it('rounds fractional values to the nearest integer', () => {
    expect(decodeProfile('5.4,5.6,7', CATS)).toEqual({ a: 5, b: 6, c: 7 });
  });
});

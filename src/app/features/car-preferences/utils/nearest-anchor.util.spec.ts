import { describe, expect, it } from 'vitest';
import { PreferenceAnchor } from '../models/car-preferences.models';
import { nearestAnchor } from './nearest-anchor.util';

const A: PreferenceAnchor[] = [
  { value: 0, tag: 'Minimal', description: 'min' },
  { value: 3, tag: 'Modest', description: 'modest' },
  { value: 5, tag: 'Average', description: 'avg' },
  { value: 7, tag: 'High', description: 'high' },
  { value: 10, tag: 'Maximum', description: 'max' },
];

describe('nearestAnchor', () => {
  it('returns the anchor exactly at the value when it exists', () => {
    expect(nearestAnchor(0, A).value).toBe(0);
    expect(nearestAnchor(3, A).value).toBe(3);
    expect(nearestAnchor(5, A).value).toBe(5);
    expect(nearestAnchor(7, A).value).toBe(7);
    expect(nearestAnchor(10, A).value).toBe(10);
  });

  it('rounds ties toward the higher anchor', () => {
    // 4 is equidistant from 3 and 5 -> 5 wins
    expect(nearestAnchor(4, A).value).toBe(5);
    // 6 is equidistant from 5 and 7 -> 7 wins
    expect(nearestAnchor(6, A).value).toBe(7);
    // 8.5 is equidistant from 7 and 10... actually 1.5 vs 1.5 -> 10 wins
    expect(nearestAnchor(8.5, A).value).toBe(10);
  });

  it('snaps to the nearer non-tied anchor', () => {
    expect(nearestAnchor(1, A).value).toBe(0); // 1 vs 2 -> 0
    expect(nearestAnchor(2, A).value).toBe(3); // 1 vs 2 -> 3
    expect(nearestAnchor(8, A).value).toBe(7); // 1 vs 2 -> 7
    expect(nearestAnchor(9, A).value).toBe(10); // 1 vs 2 -> 10
  });

  it('throws on empty anchors', () => {
    expect(() => nearestAnchor(5, [])).toThrow();
  });
});

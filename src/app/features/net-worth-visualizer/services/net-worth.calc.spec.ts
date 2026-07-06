import { computeBreakdown } from './net-worth.calc';
import { PROFILE_A, PROFILE_B } from '../data/profiles';

describe('computeBreakdown', () => {
  it('computes Marcus net worth as -37,500', () => {
    // Cash 8000 + Car 22000 = 30000 assets; 45000 + 6500 + 16000 = 67500 debts
    const b = computeBreakdown(PROFILE_A);
    expect(b.totalAssets).toBe(30000);
    expect(b.totalDebts).toBe(67500);
    expect(b.netWorth).toBe(-37500);
  });

  it('computes Priya net worth as 48,000', () => {
    // Cash 4000 + Car 12000 + Home 160000 = 176000 assets; 8000 + 120000 = 128000 debts
    const b = computeBreakdown(PROFILE_B);
    expect(b.totalAssets).toBe(176000);
    expect(b.totalDebts).toBe(128000);
    expect(b.netWorth).toBe(48000);
  });

  it('handles empty assets and debts', () => {
    const b = computeBreakdown({
      id: 'x', name: 'X', age: 20, occupation: 'x',
      salary: 30000, cashOnHand: 500, assets: [], debts: [],
    });
    expect(b.totalAssets).toBe(500);
    expect(b.totalDebts).toBe(0);
    expect(b.netWorth).toBe(500);
  });
});

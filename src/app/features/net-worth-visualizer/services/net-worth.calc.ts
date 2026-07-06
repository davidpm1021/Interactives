import { FinancialProfile, NetWorthBreakdown } from '../models/net-worth.models';

export function computeBreakdown(profile: FinancialProfile): NetWorthBreakdown {
  const totalAssets =
    profile.cashOnHand + profile.assets.reduce((sum, a) => sum + a.value, 0);
  const totalDebts = profile.debts.reduce((sum, d) => sum + d.value, 0);
  return {
    totalAssets,
    totalDebts,
    netWorth: totalAssets - totalDebts,
  };
}

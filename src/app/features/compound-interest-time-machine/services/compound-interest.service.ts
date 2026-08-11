import { Injectable } from '@angular/core';
import {
  CompoundingFrequency,
  ContributionFrequency,
  Milestone,
  SimulationInputs,
  SimulationResult,
  SimulationSummary,
  YearlyDataPoint,
} from '../models/compound-interest.models';

/**
 * Monthly deposit for Challenge 3. Exported so the copy and the scenario
 * table quote the same number the simulation runs, instead of retyping it.
 */
export const CHALLENGE_3_MONTHLY = 25;

@Injectable({ providedIn: 'root' })
export class CompoundInterestService {
  calculate(inputs: SimulationInputs): SimulationResult {
    const clamped = this.clampInputs(inputs);
    const dataPoints = this.computeCompoundBalance(
      clamped.principal,
      clamped.interestRate,
      clamped.timeHorizon,
      clamped.contributionAmount,
      clamped.contributionFrequency,
      clamped.compoundingFrequency,
    );
    const summary = this.buildSummary(dataPoints);
    return { dataPoints, summary };
  }

  /** Challenge 1: $1k, {rate=7%}, 40yr, no contributions, annually */
  calculateChallenge1(rate = 0.07): SimulationResult {
    return this.calculate({
      principal: 1000,
      interestRate: rate,
      timeHorizon: 40,
      contributionAmount: 0,
      contributionFrequency: 'none',
      compoundingFrequency: 'annually',
    });
  }

  /** Challenge 2 low: $1k, 5%, 40yr, no contributions, annually */
  calculateChallenge2Low(): SimulationResult {
    return this.calculate({
      principal: 1000,
      interestRate: 0.05,
      timeHorizon: 40,
      contributionAmount: 0,
      contributionFrequency: 'none',
      compoundingFrequency: 'annually',
    });
  }

  /** Challenge 2 high: $1k, 10%, 40yr, no contributions, annually */
  calculateChallenge2High(): SimulationResult {
    return this.calculate({
      principal: 1000,
      interestRate: 0.10,
      timeHorizon: 40,
      contributionAmount: 0,
      contributionFrequency: 'none',
      compoundingFrequency: 'annually',
    });
  }

  /**
   * Challenge 3: $1k + $25/mo, {rate=7%}, 40yr, monthly compounding.
   *
   * $25 rather than $100 so the deposits stay *smaller* than what the original
   * $1,000 grows to on its own ($12,000 vs $14,974). Review: at $100/mo "you're
   * adding more than the final value of the initial investment", which makes
   * "the power of adding a little" read as "obviously, you put in a pile of
   * money."
   */
  calculateChallenge3(rate = 0.07): SimulationResult {
    return this.calculate({
      principal: 1000,
      interestRate: rate,
      timeHorizon: 40,
      contributionAmount: CHALLENGE_3_MONTHLY,
      contributionFrequency: 'monthly',
      compoundingFrequency: 'monthly',
    });
  }

  /** Challenge 4 early: $0 + $200/mo, {rate=7%}, 40yr (age 22–62), monthly compounding */
  calculateChallenge4Early(rate = 0.07): SimulationResult {
    return this.calculate({
      principal: 0,
      interestRate: rate,
      timeHorizon: 40,
      contributionAmount: 200,
      contributionFrequency: 'monthly',
      compoundingFrequency: 'monthly',
    });
  }

  /** Challenge 4 late: $0 + $200/mo, {rate=7%}, 30yr (age 32–62), monthly compounding */
  calculateChallenge4Late(rate = 0.07): SimulationResult {
    return this.calculate({
      principal: 0,
      interestRate: rate,
      timeHorizon: 30,
      contributionAmount: 200,
      contributionFrequency: 'monthly',
      compoundingFrequency: 'monthly',
    });
  }

  private clampInputs(inputs: SimulationInputs): SimulationInputs {
    return {
      principal: Math.max(0, inputs.principal),
      interestRate: Math.min(0.15, Math.max(0, inputs.interestRate)),
      timeHorizon: Math.min(50, Math.max(1, inputs.timeHorizon)),
      contributionAmount: Math.max(0, inputs.contributionAmount),
      contributionFrequency: inputs.contributionFrequency,
      compoundingFrequency: inputs.compoundingFrequency,
    };
  }

  private computeCompoundBalance(
    principal: number,
    rate: number,
    years: number,
    contributionAmount: number,
    contributionFrequency: ContributionFrequency,
    compoundingFrequency: CompoundingFrequency,
  ): YearlyDataPoint[] {
    const periodsPerYear = this.getPeriodsPerYear(compoundingFrequency);
    const ratePerPeriod = rate / periodsPerYear;

    const contributionPerPeriod = this.getContributionPerPeriod(
      contributionAmount,
      contributionFrequency,
      periodsPerYear,
    );

    const annualContribution = this.getAnnualContribution(
      contributionAmount,
      contributionFrequency,
    );

    const dataPoints: YearlyDataPoint[] = [];

    // Year 0
    dataPoints.push({
      year: 0,
      compoundBalance: principal,
      simpleBalance: principal,
      totalContributions: principal,
      totalInterestEarned: 0,
    });

    let compoundBalance = principal;

    for (let year = 1; year <= years; year++) {
      // Compound interest: iterate through each compounding period
      for (let period = 0; period < periodsPerYear; period++) {
        compoundBalance = compoundBalance * (1 + ratePerPeriod) + contributionPerPeriod;
      }

      const totalContributions = principal + annualContribution * year;

      // Simple interest: principal * (1 + r*t) + total contributions beyond principal
      const simpleBalance = principal * (1 + rate * year) + annualContribution * year;

      dataPoints.push({
        year,
        compoundBalance,
        simpleBalance,
        totalContributions,
        totalInterestEarned: compoundBalance - totalContributions,
      });
    }

    return dataPoints;
  }

  private getPeriodsPerYear(frequency: CompoundingFrequency): number {
    switch (frequency) {
      case 'annually':
        return 1;
      case 'monthly':
        return 12;
      case 'daily':
        return 365;
    }
  }

  private getContributionPerPeriod(
    amount: number,
    frequency: ContributionFrequency,
    periodsPerYear: number,
  ): number {
    if (frequency === 'none') return 0;
    if (frequency === 'yearly') return amount / periodsPerYear;
    if (frequency === 'monthly') return amount / (periodsPerYear / 12);
    return 0;
  }

  private getAnnualContribution(
    amount: number,
    frequency: ContributionFrequency,
  ): number {
    if (frequency === 'none') return 0;
    if (frequency === 'yearly') return amount;
    if (frequency === 'monthly') return amount * 12;
    return 0;
  }

  private buildSummary(dataPoints: YearlyDataPoint[]): SimulationSummary {
    const last = dataPoints[dataPoints.length - 1];
    const finalBalance = last.compoundBalance;
    const totalContributions = last.totalContributions;
    const totalInterestEarned = last.totalInterestEarned;
    const interestAsPercentOfFinal =
      finalBalance > 0 ? (totalInterestEarned / finalBalance) * 100 : 0;
    const simpleInterestFinal = last.simpleBalance;
    const compoundAdvantage = finalBalance - simpleInterestFinal;
    const doublingYear = this.findDoublingYear(dataPoints);
    const milestones = this.findMilestones(dataPoints);

    return {
      finalBalance,
      totalContributions,
      totalInterestEarned,
      interestAsPercentOfFinal,
      simpleInterestFinal,
      compoundAdvantage,
      doublingYear,
      milestones,
    };
  }

  private findDoublingYear(dataPoints: YearlyDataPoint[]): number | null {
    for (const dp of dataPoints) {
      if (dp.totalContributions > 0 && dp.compoundBalance >= 2 * dp.totalContributions) {
        return dp.year;
      }
    }
    return null;
  }

  private findMilestones(dataPoints: YearlyDataPoint[]): Milestone[] {
    const milestones: Milestone[] = [];
    const found = new Set<Milestone['type']>();

    for (const dp of dataPoints) {
      if (dp.year === 0) continue;

      if (
        !found.has('interest-exceeds-contributions') &&
        dp.totalInterestEarned > dp.totalContributions - dataPoints[0].compoundBalance
      ) {
        found.add('interest-exceeds-contributions');
        milestones.push({
          year: dp.year,
          type: 'interest-exceeds-contributions',
          label: `Interest exceeds contributions at Year ${dp.year}`,
          value: dp.totalInterestEarned,
        });
      }

      if (!found.has('balance-100k') && dp.compoundBalance >= 100_000) {
        found.add('balance-100k');
        milestones.push({
          year: dp.year,
          type: 'balance-100k',
          label: `You pass $100K at Year ${dp.year}`,
          value: dp.compoundBalance,
        });
      }

      if (!found.has('balance-500k') && dp.compoundBalance >= 500_000) {
        found.add('balance-500k');
        milestones.push({
          year: dp.year,
          type: 'balance-500k',
          label: `You pass $500K at Year ${dp.year}`,
          value: dp.compoundBalance,
        });
      }

      if (!found.has('balance-1m') && dp.compoundBalance >= 1_000_000) {
        found.add('balance-1m');
        milestones.push({
          year: dp.year,
          type: 'balance-1m',
          label: `You pass $1M at Year ${dp.year}`,
          value: dp.compoundBalance,
        });
      }
    }

    return milestones;
  }
}

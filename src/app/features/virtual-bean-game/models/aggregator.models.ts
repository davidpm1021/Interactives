import { type Allocations, type EventResult } from './game.models';

/** A decoded student result from the encoded result string */
export interface DecodedResult {
  readonly version: string;
  readonly seed: string;
  readonly round1Allocations: Allocations;
  readonly round2Allocations: Allocations;
  readonly eventOutcomes: readonly EventOutcome[];
}

/** A single event outcome from the encoded string */
export interface EventOutcome {
  readonly eventId: string;
  /** 'y' = condition met, 'n' = condition not met, 'x' = no condition */
  readonly conditionCode: 'y' | 'n' | 'x';
  readonly beanDelta: number;
}

/** Aggregated class summary for the teacher dashboard */
export interface ClassSummary {
  readonly studentCount: number;
  readonly round1Distribution: CategoryDistribution[];
  readonly round2Distribution: CategoryDistribution[];
  readonly incomeCutResponse: IncomeCutRanking[];
  readonly eventImpact: EventImpactSummary[];
  readonly lifePathStats: LifePathStats;
  readonly insights: readonly string[];
}

/** Distribution of choices for a single category across the class */
export interface CategoryDistribution {
  readonly categoryId: string;
  readonly categoryName: string;
  readonly optionBreakdown: readonly {
    readonly optionId: string;
    readonly label: string;
    readonly beans: number;
    readonly count: number;
    readonly percentage: number;
  }[];
}

/** Ranking of categories students cut first in Round 2 */
export interface IncomeCutRanking {
  readonly categoryId: string;
  readonly categoryName: string;
  readonly cutCount: number;
  readonly cutPercentage: number;
}

/** Summary of a specific event type's impact across the class */
export interface EventImpactSummary {
  readonly eventId: string;
  readonly eventTitle: string;
  readonly occurrences: number;
  readonly avgBeanImpact: number;
  readonly withProtection: { readonly count: number; readonly avgImpact: number };
  readonly withoutProtection: { readonly count: number; readonly avgImpact: number };
}

/** Statistics about life paths across the class */
export interface LifePathStats {
  readonly eventCountDistribution: Record<number, number>;
  readonly avgNetBeanChange: number;
  readonly uniqueSeeds: number;
}

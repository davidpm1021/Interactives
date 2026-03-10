import { type Allocations, type EventResult, type CategoryConfig } from '../models/game.models';

export interface InsightTemplate {
  readonly id: string;
  readonly condition: (ctx: InsightContext) => boolean;
  readonly text: (ctx: InsightContext) => string;
}

export interface InsightContext {
  readonly round1: Allocations;
  readonly round2: Allocations;
  readonly eventResults: readonly EventResult[];
  readonly finalBeans: number;
  readonly categories: readonly CategoryConfig[];
}

/** Check if an allocation includes a specific option */
function hasOption(alloc: Allocations, optionId: string): boolean {
  return Object.values(alloc).some((v) => v === optionId);
}

/** Get the bean cost for an option ID within allocations */
function getBeans(alloc: Allocations, slotId: string, categories: readonly CategoryConfig[]): number {
  const optId = alloc[slotId] as string | undefined;
  if (!optId) return 0;
  for (const cat of categories) {
    if (cat.options) {
      const opt = cat.options.find((o) => o.id === optId);
      if (opt) return opt.beans;
    }
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        const opt = sub.options.find((o) => o.id === optId);
        if (opt) return opt.beans;
      }
    }
  }
  return 0;
}

/** Count total beans allocated */
function totalAllocated(alloc: Allocations, categories: readonly CategoryConfig[]): number {
  let total = 0;
  for (const cat of categories) {
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        total += getBeans(alloc, sub.id, categories);
      }
    } else if (cat.options) {
      total += getBeans(alloc, cat.id, categories);
    }
  }
  return total;
}

export const INSIGHTS: readonly InsightTemplate[] = [
  // 1. Insurance Payoff
  {
    id: 'insurance-payoff',
    condition: (ctx) => {
      const hasHealth = hasOption(ctx.round2, 'ins-health-1');
      const healthEvent = ctx.eventResults.some(
        (r) => (r.eventId === 'S1' || r.eventId === 'S11') && r.conditionMet === true,
      );
      return hasHealth && healthEvent;
    },
    text: () =>
      'Your health insurance paid off! When a medical issue hit, your coverage protected you from the full cost. Insurance is one of the best ways to manage risk.',
  },

  // 2. No Insurance Consequence
  {
    id: 'no-insurance-consequence',
    condition: (ctx) => {
      const noHealth = !hasOption(ctx.round2, 'ins-health-1');
      const healthEvent = ctx.eventResults.some(
        (r) => (r.eventId === 'S1' || r.eventId === 'S11') && r.conditionMet === false,
      );
      return noHealth && healthEvent;
    },
    text: (ctx) => {
      const loss = ctx.eventResults
        .filter((r) => (r.eventId === 'S1' || r.eventId === 'S11') && r.conditionMet === false)
        .reduce((sum, r) => sum + Math.abs(r.beansChanged), 0);
      return `Without health insurance, medical events cost you ${loss} bean${loss !== 1 ? 's' : ''}. Basic coverage costs 2 beans but can save you much more.`;
    },
  },

  // 3. Savings Cut
  {
    id: 'savings-cut',
    condition: (ctx) => {
      const r1Savings = getBeans(ctx.round1, 'savings', ctx.categories);
      const r2Savings = getBeans(ctx.round2, 'savings', ctx.categories);
      return r1Savings > 0 && r2Savings < r1Savings;
    },
    text: () =>
      'You cut savings when income dropped. This is one of the most common moves, and one of the riskiest. Savings act as a buffer against unexpected expenses.',
  },

  // 4. Housing Dominance
  {
    id: 'housing-dominance',
    condition: (ctx) => {
      const housingBeans = getBeans(ctx.round2, 'housing', ctx.categories);
      const total = totalAllocated(ctx.round2, ctx.categories);
      return total > 0 && housingBeans / total > 0.3;
    },
    text: (ctx) => {
      const housingBeans = getBeans(ctx.round2, 'housing', ctx.categories);
      const total = totalAllocated(ctx.round2, ctx.categories);
      const pct = Math.round((housingBeans / total) * 100);
      return `Housing is your biggest expense at ${pct}% of your budget. The general guideline is to keep housing under 30% of income.`;
    },
  },

  // 5. Income Shock Response
  {
    id: 'income-shock',
    condition: (ctx) => {
      // Find the first category that was dropped or downgraded from R1 to R2
      for (const cat of ctx.categories) {
        const slots = cat.subCategories
          ? cat.subCategories.map((s) => s.id)
          : cat.options
            ? [cat.id]
            : [];
        for (const slotId of slots) {
          const r1 = getBeans(ctx.round1, slotId, ctx.categories);
          const r2 = getBeans(ctx.round2, slotId, ctx.categories);
          if (r2 < r1) return true;
        }
      }
      return false;
    },
    text: (ctx) => {
      // Find first dropped/downgraded category name
      for (const cat of ctx.categories) {
        const slots = cat.subCategories
          ? cat.subCategories.map((s) => ({ id: s.id, name: s.name }))
          : cat.options
            ? [{ id: cat.id, name: cat.name }]
            : [];
        for (const slot of slots) {
          const r1 = getBeans(ctx.round1, slot.id, ctx.categories);
          const r2 = getBeans(ctx.round2, slot.id, ctx.categories);
          if (r2 < r1) {
            return `When your income dropped, you cut ${slot.name} first. What does that tell you about your priorities?`;
          }
        }
      }
      return 'When your income dropped, you had to make tough choices about what to cut.';
    },
  },

  // 6. Advantage Allocation
  {
    id: 'advantage-allocation',
    condition: (ctx) =>
      ctx.eventResults.some((r) => r.beansChanged > 0),
    text: (ctx) => {
      const gains = ctx.eventResults.filter((r) => r.beansChanged > 0);
      const totalGained = gains.reduce((sum, r) => sum + r.beansChanged, 0);
      return `You gained ${totalGained} bean${totalGained !== 1 ? 's' : ''} from life events. Windfalls are a great chance to build savings or invest in your future, not just increase spending.`;
    },
  },

  // 7. Lucky Path
  {
    id: 'lucky-path',
    condition: (ctx) => {
      const setbacks = ctx.eventResults.filter((r) => r.beansChanged < 0).length;
      return ctx.eventResults.length > 0 && setbacks <= 1;
    },
    text: (ctx) => {
      const setbacks = ctx.eventResults.filter((r) => r.beansChanged < 0).length;
      return `You drew a lighter life path than most, with only ${setbacks} setback${setbacks !== 1 ? 's' : ''}. Not everyone is this fortunate. That is why it is important to plan for the unexpected.`;
    },
  },

  // 8. Tough Path
  {
    id: 'tough-path',
    condition: (ctx) => {
      const setbacks = ctx.eventResults.filter((r) => r.beansChanged < 0).length;
      return setbacks >= 3;
    },
    text: (ctx) => {
      const setbacks = ctx.eventResults.filter((r) => r.beansChanged < 0).length;
      return `You drew ${setbacks} setbacks. Life can be unpredictable. That is why budgets need flexibility and emergency funds matter.`;
    },
  },

  // 9. Renters Insurance
  {
    id: 'renters-insurance',
    condition: (ctx) => {
      const hasRenters = hasOption(ctx.round2, 'ins-property-1');
      const waterEvent = ctx.eventResults.some((r) => r.eventId === 'S2' && r.conditionMet === true);
      return hasRenters && waterEvent;
    },
    text: () =>
      'Your renters insurance covered the water damage, saving you from a costly surprise. At just 1 bean, it is one of the best value protections available.',
  },

  // 10. Car Trouble Without Car
  {
    id: 'no-car-advantage',
    condition: (ctx) => {
      const carEvent = ctx.eventResults.some(
        (r) => (r.eventId === 'S7' || r.eventId === 'S14') && r.conditionMet === false,
      );
      return carEvent;
    },
    text: () =>
      'Not having a car protected you from car-related expenses. Transportation choices affect more than just how you get around. They impact your financial risk too.',
  },
];

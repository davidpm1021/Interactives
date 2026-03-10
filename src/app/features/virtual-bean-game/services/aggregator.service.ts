import { inject, Injectable } from '@angular/core';
import {
  type CategoryDistribution,
  type ClassSummary,
  type EventImpactSummary,
  type IncomeCutRanking,
  type LifePathStats,
} from '../models/aggregator.models';
import { type DecodedGameResult, ReportService } from './report.service';
import { CATEGORIES } from '../data/categories';
import { EVENTS } from '../data/events';

export interface ParseResult {
  readonly valid: readonly DecodedGameResult[];
  readonly errors: readonly { line: number; text: string; reason: string }[];
}

@Injectable({ providedIn: 'root' })
export class AggregatorService {
  private readonly reportService = inject(ReportService);

  /** Parse multiple encoded result strings (one per line) */
  parseResultStrings(input: string): ParseResult {
    const lines = input
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const valid: DecodedGameResult[] = [];
    const errors: { line: number; text: string; reason: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const decoded = this.reportService.decodeResult(lines[i]);
      if (decoded) {
        valid.push(decoded);
      } else {
        errors.push({ line: i + 1, text: lines[i], reason: 'Invalid format' });
      }
    }

    return { valid, errors };
  }

  /** Build a class summary from decoded results */
  buildClassSummary(results: readonly DecodedGameResult[]): ClassSummary {
    const studentCount = results.length;

    const round1Distribution = this.buildDistribution(results, 'round1Allocations');
    const round2Distribution = this.buildDistribution(results, 'round2Allocations');
    const incomeCutResponse = this.buildIncomeCutRanking(results);
    const eventImpact = this.buildEventImpact(results);
    const lifePathStats = this.buildLifePathStats(results);
    const insights = this.generateClassInsights(results);

    return {
      studentCount,
      round1Distribution,
      round2Distribution,
      incomeCutResponse,
      eventImpact,
      lifePathStats,
      insights,
    };
  }

  /** Format class summary as copyable text */
  formatClassSummaryText(summary: ClassSummary): string {
    const lines: string[] = [];
    lines.push(`CLASS BEAN GAME SUMMARY (${summary.studentCount} students)`);
    lines.push('');

    // Income cut response
    lines.push('MOST CUT CATEGORIES (Round 1 → Round 2):');
    for (const ranking of summary.incomeCutResponse.slice(0, 5)) {
      lines.push(`  ${ranking.categoryName}: ${ranking.cutCount} students (${ranking.cutPercentage}%)`);
    }
    lines.push('');

    // Event impact
    if (summary.eventImpact.length > 0) {
      lines.push('EVENT IMPACT:');
      for (const ev of summary.eventImpact) {
        lines.push(`  ${ev.eventId} (${ev.eventTitle}): ${ev.occurrences} occurrences, avg impact ${ev.avgBeanImpact.toFixed(1)} beans`);
        if (ev.withProtection.count > 0) {
          lines.push(`    With protection: ${ev.withProtection.count} students, avg ${ev.withProtection.avgImpact.toFixed(1)} beans`);
        }
        if (ev.withoutProtection.count > 0) {
          lines.push(`    Without protection: ${ev.withoutProtection.count} students, avg ${ev.withoutProtection.avgImpact.toFixed(1)} beans`);
        }
      }
      lines.push('');
    }

    // Life path stats
    lines.push('LIFE PATH STATS:');
    lines.push(`  Unique seeds: ${summary.lifePathStats.uniqueSeeds}`);
    lines.push(`  Avg net bean change from events: ${summary.lifePathStats.avgNetBeanChange.toFixed(1)}`);
    for (const [count, num] of Object.entries(summary.lifePathStats.eventCountDistribution)) {
      lines.push(`  ${count} events: ${num} students`);
    }
    lines.push('');

    // Insights
    if (summary.insights.length > 0) {
      lines.push('CLASS INSIGHTS:');
      for (const insight of summary.insights) {
        lines.push(`  • ${insight}`);
      }
    }

    return lines.join('\n');
  }

  // ─── Private helpers ─────────────────────

  private buildDistribution(
    results: readonly DecodedGameResult[],
    roundKey: 'round1Allocations' | 'round2Allocations',
  ): CategoryDistribution[] {
    const distributions: CategoryDistribution[] = [];
    const total = results.length;

    for (const cat of CATEGORIES) {
      const slots = cat.subCategories
        ? cat.subCategories.map((s) => ({ id: s.id, name: s.name, options: s.options }))
        : cat.options
          ? [{ id: cat.id, name: cat.name, options: cat.options }]
          : [];

      for (const slot of slots) {
        const counts = new Map<string, number>();
        for (const opt of slot.options) {
          counts.set(opt.id, 0);
        }

        for (const result of results) {
          const alloc = result[roundKey];
          const selected = alloc[slot.id] as string | undefined;
          if (selected && counts.has(selected)) {
            counts.set(selected, (counts.get(selected) ?? 0) + 1);
          }
        }

        distributions.push({
          categoryId: slot.id,
          categoryName: slot.name,
          optionBreakdown: slot.options.map((opt) => ({
            optionId: opt.id,
            label: opt.label,
            beans: opt.beans,
            count: counts.get(opt.id) ?? 0,
            percentage: total > 0 ? Math.round(((counts.get(opt.id) ?? 0) / total) * 100) : 0,
          })),
        });
      }
    }

    return distributions;
  }

  private buildIncomeCutRanking(results: readonly DecodedGameResult[]): IncomeCutRanking[] {
    const cutCounts = new Map<string, { name: string; count: number }>();
    const total = results.length;

    for (const cat of CATEGORIES) {
      const slots = cat.subCategories
        ? cat.subCategories.map((s) => ({ id: s.id, name: s.name, options: s.options }))
        : cat.options
          ? [{ id: cat.id, name: cat.name, options: cat.options }]
          : [];

      for (const slot of slots) {
        cutCounts.set(slot.id, { name: slot.name, count: 0 });
      }
    }

    for (const result of results) {
      for (const [slotId, entry] of cutCounts) {
        const r1Opt = result.round1Allocations[slotId] as string | undefined;
        const r2Opt = result.round2Allocations[slotId] as string | undefined;

        if (r1Opt && r1Opt !== r2Opt) {
          // Get beans for each
          const r1Beans = this.getOptionBeans(r1Opt);
          const r2Beans = r2Opt ? this.getOptionBeans(r2Opt) : 0;
          if (r2Beans < r1Beans) {
            entry.count++;
          }
        }
      }
    }

    return [...cutCounts.entries()]
      .map(([catId, data]) => ({
        categoryId: catId,
        categoryName: data.name,
        cutCount: data.count,
        cutPercentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
      }))
      .filter((r) => r.cutCount > 0)
      .sort((a, b) => b.cutCount - a.cutCount);
  }

  private buildEventImpact(results: readonly DecodedGameResult[]): EventImpactSummary[] {
    const eventMap = new Map<string, {
      title: string;
      occurrences: number;
      totalImpact: number;
      withProt: { count: number; totalImpact: number };
      withoutProt: { count: number; totalImpact: number };
    }>();

    for (const result of results) {
      for (const outcome of result.eventOutcomes) {
        if (!eventMap.has(outcome.eventId)) {
          const ev = EVENTS.find((e) => e.id === outcome.eventId);
          eventMap.set(outcome.eventId, {
            title: ev?.title ?? outcome.eventId,
            occurrences: 0,
            totalImpact: 0,
            withProt: { count: 0, totalImpact: 0 },
            withoutProt: { count: 0, totalImpact: 0 },
          });
        }
        const data = eventMap.get(outcome.eventId)!;
        data.occurrences++;
        data.totalImpact += outcome.beansChanged;

        if (outcome.conditionCode === 'y') {
          data.withProt.count++;
          data.withProt.totalImpact += outcome.beansChanged;
        } else if (outcome.conditionCode === 'n') {
          data.withoutProt.count++;
          data.withoutProt.totalImpact += outcome.beansChanged;
        }
      }
    }

    return [...eventMap.entries()]
      .map(([eventId, data]) => ({
        eventId,
        eventTitle: data.title,
        occurrences: data.occurrences,
        avgBeanImpact: data.occurrences > 0 ? data.totalImpact / data.occurrences : 0,
        withProtection: {
          count: data.withProt.count,
          avgImpact: data.withProt.count > 0 ? data.withProt.totalImpact / data.withProt.count : 0,
        },
        withoutProtection: {
          count: data.withoutProt.count,
          avgImpact: data.withoutProt.count > 0 ? data.withoutProt.totalImpact / data.withoutProt.count : 0,
        },
      }))
      .sort((a, b) => b.occurrences - a.occurrences);
  }

  private buildLifePathStats(results: readonly DecodedGameResult[]): LifePathStats {
    const eventCountDist: Record<number, number> = {};
    let totalNetChange = 0;
    const seeds = new Set<string>();

    for (const result of results) {
      seeds.add(result.seed);
      const count = result.eventOutcomes.length;
      eventCountDist[count] = (eventCountDist[count] ?? 0) + 1;
      const netChange = result.eventOutcomes.reduce((sum, o) => sum + o.beansChanged, 0);
      totalNetChange += netChange;
    }

    return {
      eventCountDistribution: eventCountDist,
      avgNetBeanChange: results.length > 0 ? totalNetChange / results.length : 0,
      uniqueSeeds: seeds.size,
    };
  }

  private generateClassInsights(results: readonly DecodedGameResult[]): readonly string[] {
    const insights: string[] = [];
    const total = results.length;
    if (total === 0) return insights;

    // 1. What percentage had health insurance in R2?
    const withHealth = results.filter((r) =>
      Object.values(r.round2Allocations).includes('ins-health-1'),
    ).length;
    const healthPct = Math.round((withHealth / total) * 100);
    insights.push(`${healthPct}% of students kept health insurance in Round 2.`);

    // 2. Most commonly cut category
    const cutRanking = this.buildIncomeCutRanking(results);
    if (cutRanking.length > 0) {
      insights.push(
        `The most commonly cut category was ${cutRanking[0].categoryName} (${cutRanking[0].cutPercentage}% of students).`,
      );
    }

    // 3. Average net bean change from events
    const lifeStats = this.buildLifePathStats(results);
    const avgNet = lifeStats.avgNetBeanChange;
    if (avgNet < 0) {
      insights.push(
        `On average, life events cost students ${Math.abs(avgNet).toFixed(1)} beans.`,
      );
    } else if (avgNet > 0) {
      insights.push(
        `On average, students gained ${avgNet.toFixed(1)} beans from life events.`,
      );
    }

    return insights;
  }

  private getOptionBeans(optionId: string): number {
    for (const cat of CATEGORIES) {
      if (cat.options) {
        const opt = cat.options.find((o) => o.id === optionId);
        if (opt) return opt.beans;
      }
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          const opt = sub.options.find((o) => o.id === optionId);
          if (opt) return opt.beans;
        }
      }
    }
    return 0;
  }
}

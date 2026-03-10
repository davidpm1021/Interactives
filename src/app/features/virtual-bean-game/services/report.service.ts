import { Injectable } from '@angular/core';
import {
  type Allocations,
  type CategoryConfig,
  type EventResult,
  type GameConfig,
} from '../models/game.models';
import { INSIGHTS, type InsightContext } from '../data/insights';
import { CATEGORIES } from '../data/categories';

/** Encoded result for teacher aggregator */
export interface EncodedGameResult {
  readonly version: string;
  readonly seed: string;
  readonly round1: string;
  readonly round2: string;
  readonly events: string;
}

/** Full decoded result from an encoded string */
export interface DecodedGameResult {
  readonly seed: string;
  readonly round1Allocations: Allocations;
  readonly round2Allocations: Allocations;
  readonly eventOutcomes: readonly DecodedEventOutcome[];
}

export interface DecodedEventOutcome {
  readonly eventId: string;
  readonly conditionCode: 'y' | 'n' | 'x';
  readonly beansChanged: number;
}

/**
 * Slot-to-short-key mapping for encoding.
 * Each slot gets a 1-2 char key; the value is the option index (0-based).
 */
const SLOT_KEYS: readonly { slotId: string; key: string }[] = [
  { slotId: 'housing', key: 'h' },
  { slotId: 'food', key: 'f' },
  { slotId: 'insurance-auto', key: 'ia' },
  { slotId: 'insurance-health', key: 'ih' },
  { slotId: 'insurance-property', key: 'ip' },
  { slotId: 'clothing-clothes', key: 'cc' },
  { slotId: 'clothing-laundry', key: 'cl' },
  { slotId: 'transportation', key: 't' },
  { slotId: 'furnishings', key: 'fu' },
  { slotId: 'recreation', key: 'r' },
  { slotId: 'communication-phone', key: 'cp' },
  { slotId: 'communication-wifi', key: 'cw' },
  { slotId: 'personal-care', key: 'pc' },
  { slotId: 'gifts-giving', key: 'gg' },
  { slotId: 'gifts-charity', key: 'gc' },
  { slotId: 'savings', key: 's' },
];

/** Get options array for a slot ID */
function getSlotOptions(slotId: string): readonly { id: string }[] {
  for (const cat of CATEGORIES) {
    if (cat.id === slotId && cat.options) return cat.options;
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        if (sub.id === slotId) return sub.options;
      }
    }
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  /** Encode game result into a compact string for teacher aggregator */
  encodeResult(
    seed: string,
    round1: Allocations,
    round2: Allocations,
    eventResults: readonly EventResult[],
  ): string {
    const r1 = this.encodeAllocations(round1);
    const r2 = this.encodeAllocations(round2);
    const ev = this.encodeEvents(eventResults);
    return `BGv1:${seed}:${r1}:${r2}:${ev}`;
  }

  /** Decode an encoded result string */
  decodeResult(encoded: string): DecodedGameResult | null {
    const parts = encoded.split(':');
    if (parts.length < 5 || parts[0] !== 'BGv1') return null;

    const seed = parts[1];
    const r1Str = parts[2];
    const r2Str = parts[3];
    const evStr = parts[4];

    const round1Allocations = this.decodeAllocations(r1Str);
    const round2Allocations = this.decodeAllocations(r2Str);
    const eventOutcomes = this.decodeEvents(evStr);

    if (!round1Allocations || !round2Allocations) return null;

    return { seed, round1Allocations, round2Allocations, eventOutcomes };
  }

  /** Generate 2-3 personalized insights based on game outcomes */
  generateInsights(
    round1: Allocations,
    round2: Allocations,
    eventResults: readonly EventResult[],
    finalBeans: number,
    categories: readonly CategoryConfig[],
  ): readonly string[] {
    const ctx: InsightContext = { round1, round2, eventResults, finalBeans, categories };
    const matching: string[] = [];

    for (const template of INSIGHTS) {
      if (matching.length >= 3) break;
      try {
        if (template.condition(ctx)) {
          matching.push(template.text(ctx));
        }
      } catch {
        // Skip broken insight
      }
    }

    return matching;
  }

  /** Format a plain-text report */
  formatReportText(
    seed: string,
    round1: Allocations,
    round2: Allocations,
    eventResults: readonly EventResult[],
    finalBeans: number,
    categories: readonly CategoryConfig[],
    encoded: string,
  ): string {
    const lines: string[] = [];
    lines.push('MY BEAN GAME REPORT');
    lines.push(`Life Path: ${seed}`);
    lines.push('');

    // Round 1
    lines.push('ROUND 1 (20 beans)');
    for (const { slotId } of SLOT_KEYS) {
      const optId = round1[slotId] as string | undefined;
      if (!optId) continue;
      const opts = getSlotOptions(slotId);
      const opt = opts.find((o) => o.id === optId);
      if (opt) {
        const optFull = this.findFullOption(optId);
        lines.push(`  ${slotId}: ${optFull?.label ?? optId} (${optFull?.beans ?? '?'})`);
      }
    }
    lines.push('');

    // Round 2
    lines.push('ROUND 2 (13 beans)');
    for (const { slotId } of SLOT_KEYS) {
      const optId = round2[slotId] as string | undefined;
      if (!optId) continue;
      const optFull = this.findFullOption(optId);
      lines.push(`  ${slotId}: ${optFull?.label ?? optId} (${optFull?.beans ?? '?'})`);
    }
    lines.push('');

    // Events
    if (eventResults.length > 0) {
      lines.push('LIFE HAPPENS');
      for (let i = 0; i < eventResults.length; i++) {
        const r = eventResults[i];
        const delta = r.beansChanged !== 0 ? ` (${r.beansChanged > 0 ? '+' : ''}${r.beansChanged})` : '';
        lines.push(`  Event ${i + 1}: ${r.eventId} — ${r.resolutionText}${delta}`);
      }
      lines.push('');
    }

    lines.push(`Final beans: ${finalBeans}`);
    lines.push('');

    // Insights
    const insights = this.generateInsights(round1, round2, eventResults, finalBeans, categories);
    if (insights.length > 0) {
      lines.push('INSIGHTS');
      for (const insight of insights) {
        lines.push(`  • ${insight}`);
      }
      lines.push('');
    }

    lines.push(`Encoded: ${encoded}`);
    return lines.join('\n');
  }

  // ─── Private encoding helpers ────────────────────

  private encodeAllocations(alloc: Allocations): string {
    const parts: string[] = [];
    for (const { slotId, key } of SLOT_KEYS) {
      const optId = alloc[slotId] as string | undefined;
      const options = getSlotOptions(slotId);
      const idx = optId ? options.findIndex((o) => o.id === optId) : -1;
      // Only include if selected (idx >= 0)
      if (idx >= 0) {
        parts.push(`${key}${idx}`);
      }
    }
    return parts.join('');
  }

  private decodeAllocations(encoded: string): Allocations | null {
    const alloc: Allocations = {};
    let remaining = encoded;

    // Try to match each slot key (longest first to avoid ambiguity)
    const sortedKeys = [...SLOT_KEYS].sort((a, b) => b.key.length - a.key.length);

    while (remaining.length > 0) {
      let matched = false;
      for (const { slotId, key } of sortedKeys) {
        if (remaining.startsWith(key)) {
          const afterKey = remaining.slice(key.length);
          const digitMatch = afterKey.match(/^(\d+)/);
          if (digitMatch) {
            const idx = parseInt(digitMatch[1], 10);
            const options = getSlotOptions(slotId);
            if (idx >= 0 && idx < options.length) {
              alloc[slotId] = options[idx].id;
            }
            remaining = afterKey.slice(digitMatch[1].length);
            matched = true;
            break;
          }
        }
      }
      if (!matched) return null; // Parse error
    }

    return alloc;
  }

  private encodeEvents(results: readonly EventResult[]): string {
    return results
      .map((r) => {
        const cond = r.conditionMet === true ? 'y' : r.conditionMet === false ? 'n' : 'x';
        const sign = r.beansChanged >= 0 ? '+' : '';
        return `${r.eventId}${cond}${sign}${r.beansChanged}`;
      })
      .join(',');
  }

  private decodeEvents(encoded: string): DecodedEventOutcome[] {
    if (!encoded) return [];
    return encoded.split(',').map((part) => {
      const match = part.match(/^([A-Z]\d+)([ynx])([+-]?\d+)$/);
      if (!match) return { eventId: '?', conditionCode: 'x' as const, beansChanged: 0 };
      return {
        eventId: match[1],
        conditionCode: match[2] as 'y' | 'n' | 'x',
        beansChanged: parseInt(match[3], 10),
      };
    });
  }

  private findFullOption(optionId: string): { label: string; beans: number } | null {
    for (const cat of CATEGORIES) {
      if (cat.options) {
        const opt = cat.options.find((o) => o.id === optionId);
        if (opt) return opt;
      }
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          const opt = sub.options.find((o) => o.id === optionId);
          if (opt) return opt;
        }
      }
    }
    return null;
  }
}

import { Injectable } from '@angular/core';
import {
  type Allocations,
  type CategoryConfig,
  type EventConditionResult,
  type EventResult,
  type GameConfig,
  type GameEvent,
} from '../models/game.models';
import { EVENTS } from '../data/events';
import { AllocationService } from './allocation.service';

@Injectable({ providedIn: 'root' })
export class EventService {
  constructor(private readonly allocationService: AllocationService) {}

  /**
   * Generate a deterministic life path from a seeded PRNG.
   * Returns an ordered list of events for Round 3.
   */
  generateLifePath(
    rng: () => number,
    config: GameConfig,
    allocations: Allocations,
    categories: readonly CategoryConfig[],
  ): readonly GameEvent[] {
    const count = this.drawEventCount(rng, config);
    const pool = [...EVENTS];
    const drawn: GameEvent[] = [];
    const usedTargetCategories = new Set<string>();

    // Pre-filter A6 if student has no insurance (spec: replaced with re-draw)
    if (!this.hasAnyInsurance(allocations, categories)) {
      const a6Idx = pool.findIndex((e) => e.id === 'A6');
      if (a6Idx >= 0) pool.splice(a6Idx, 1);
    }

    // Step 1: Guarantee at least 1 setback
    const setback = this.drawFromType(rng, pool, 'setback', usedTargetCategories);
    if (setback) {
      drawn.push(setback);
      this.markTarget(setback, usedTargetCategories);
    }

    // Step 2: Guarantee at least 1 forced-choice or advantage
    const nonSetbackTypes: Array<'forced-choice' | 'advantage'> =
      rng() < 0.5 ? ['forced-choice', 'advantage'] : ['advantage', 'forced-choice'];
    let gotSecond = false;
    for (const type of nonSetbackTypes) {
      const event = this.drawFromType(rng, pool, type, usedTargetCategories);
      if (event) {
        drawn.push(event);
        this.markTarget(event, usedTargetCategories);
        gotSecond = true;
        break;
      }
    }
    if (!gotSecond) {
      // Fallback: draw any remaining
      const fallback = this.drawWeighted(rng, pool, usedTargetCategories, config);
      if (fallback) {
        drawn.push(fallback);
        this.markTarget(fallback, usedTargetCategories);
      }
    }

    // Step 3: Fill remaining slots with weighted draws
    while (drawn.length < count && pool.length > 0) {
      const event = this.drawWeighted(rng, pool, usedTargetCategories, config);
      if (!event) break;

      drawn.push(event);
      this.markTarget(event, usedTargetCategories);
    }

    // Shuffle the drawn events deterministically (Fisher-Yates)
    for (let i = drawn.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [drawn[i], drawn[j]] = [drawn[j], drawn[i]];
    }

    return drawn;
  }

  /** Determine how many events to draw based on config and RNG */
  drawEventCount(rng: () => number, config: GameConfig): number {
    if (typeof config.eventCount === 'number') return config.eventCount;

    // Weighted: 30% get 3, 45% get 4, 25% get 5
    const roll = rng();
    if (roll < 0.30) return 3;
    if (roll < 0.75) return 4;
    return 5;
  }

  /**
   * Resolve a single event against the student's current allocation.
   * Returns the resolution result with hard floor applied.
   */
  resolveEvent(
    event: GameEvent,
    allocations: Allocations,
    currentBeans: number,
    minRequired: number,
    categories: readonly CategoryConfig[],
  ): EventResult {
    const resolution = this.getResolution(event, allocations, categories);

    // Apply hard floor to bean penalty
    const rawBeans = resolution.beans;
    const actualBeans = this.allocationService.applyHardFloor(rawBeans, currentBeans, minRequired);
    const hardFloorApplied = actualBeans !== rawBeans;

    let text = resolution.text;
    if (hardFloorApplied && rawBeans < 0) {
      const reduced = Math.abs(actualBeans);
      const original = Math.abs(rawBeans);
      text += ` (This would normally cost you ${original} bean${original !== 1 ? 's' : ''}, but you can only afford to lose ${reduced} without going below your essentials.)`;
    }

    return {
      eventId: event.id,
      conditionMet: event.condition ? resolution === event.condition.met : null,
      beansChanged: actualBeans,
      hardFloorApplied,
      resolutionText: text,
      playerChoice: !!resolution.playerChoice && actualBeans !== 0,
      protectedCategories: resolution.protectedCategories ?? [],
    };
  }

  /** Check which resolution path applies for a conditional event */
  checkCondition(
    event: GameEvent,
    allocations: Allocations,
    categories: readonly CategoryConfig[],
  ): boolean | null {
    if (!event.condition) return null;
    const resolution = this.getResolution(event, allocations, categories);
    return resolution === event.condition.met;
  }

  // ─── Private helpers ───────────────────────────────

  private getResolution(
    event: GameEvent,
    allocations: Allocations,
    categories: readonly CategoryConfig[],
  ): EventConditionResult {
    if (!event.condition) {
      return event.consequence!;
    }

    const condition = event.condition;
    const met = this.evaluateCondition(condition.type, condition.check, allocations, categories);
    return met ? condition.met : condition.notMet;
  }

  private evaluateCondition(
    type: string,
    check: string,
    allocations: Allocations,
    categories: readonly CategoryConfig[],
  ): boolean {
    switch (type) {
      case 'has-option': {
        if (check === '__any_insurance__') {
          return this.hasAnyInsurance(allocations, categories);
        }
        // Check if the student has a specific option selected
        for (const key of Object.keys(allocations)) {
          if (allocations[key] === check) return true;
        }
        return false;
      }

      case 'has-car': {
        const transport = allocations['transportation'] as string | undefined;
        // Has car if transport is fuel for family car, used car, or new car
        return !!transport && transport !== 'transport-1' && transport !== 'transport-2';
      }

      case 'has-phone': {
        const phone = allocations['communication-phone'] as string | undefined;
        return !!phone && phone !== 'comm-phone-0';
      }

      case 'has-savings': {
        const savings = allocations['savings'] as string | undefined;
        return !!savings && savings !== 'savings-0';
      }

      case 'housing-type': {
        const housing = allocations['housing'] as string | undefined;
        return housing === check;
      }

      case 'clothing-level': {
        const clothing = allocations['clothing-clothes'] as string | undefined;
        return clothing === check;
      }

      default:
        return false;
    }
  }

  private hasAnyInsurance(
    allocations: Allocations,
    _categories: readonly CategoryConfig[],
  ): boolean {
    const auto = allocations['insurance-auto'] as string | undefined;
    const health = allocations['insurance-health'] as string | undefined;
    const property = allocations['insurance-property'] as string | undefined;

    return (
      (!!auto && auto !== 'ins-auto-0') ||
      (!!health && health !== 'ins-health-0') ||
      (!!property && property !== 'ins-property-0')
    );
  }

  /** Draw a random event of a specific type from the pool */
  private drawFromType(
    rng: () => number,
    pool: GameEvent[],
    type: string,
    usedTargets: Set<string>,
  ): GameEvent | null {
    const candidates = pool.filter(
      (e) => e.type === type && !this.conflictsWithTarget(e, usedTargets),
    );
    if (candidates.length === 0) return null;

    const idx = Math.floor(rng() * candidates.length);
    const event = candidates[idx];
    this.removeFromPool(pool, event);
    return event;
  }

  /** Draw a weighted random event from the remaining pool */
  private drawWeighted(
    rng: () => number,
    pool: GameEvent[],
    usedTargets: Set<string>,
    config: GameConfig,
  ): GameEvent | null {
    const candidates = pool.filter((e) => !this.conflictsWithTarget(e, usedTargets));
    if (candidates.length === 0) return null;

    // Apply difficulty bias weights
    const weights = candidates.map((e) => this.getWeight(e, config.difficulty));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let roll = rng() * totalWeight;

    for (let i = 0; i < candidates.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        const event = candidates[i];
        this.removeFromPool(pool, event);
        return event;
      }
    }

    // Fallback to last candidate
    const event = candidates[candidates.length - 1];
    this.removeFromPool(pool, event);
    return event;
  }

  private getWeight(event: GameEvent, difficulty: GameConfig['difficulty']): number {
    // Base weights: 55% setback, 25% forced-choice, 20% advantage
    const baseWeights: Record<string, number> = {
      'setback': 55,
      'forced-choice': 25,
      'advantage': 20,
    };

    let weight = baseWeights[event.type] ?? 25;

    if (difficulty === 'easy') {
      if (event.type === 'advantage') weight *= 1.5;
      if (event.type === 'setback') weight *= 0.7;
    } else if (difficulty === 'tough') {
      if (event.type === 'setback') weight *= 1.5;
      if (event.type === 'advantage') weight *= 0.5;
    }

    return weight;
  }

  private conflictsWithTarget(event: GameEvent, usedTargets: Set<string>): boolean {
    if (!event.targetCategory) return false;
    return usedTargets.has(event.targetCategory);
  }

  private markTarget(event: GameEvent, usedTargets: Set<string>): void {
    if (event.targetCategory) {
      usedTargets.add(event.targetCategory);
    }
  }

  private removeFromPool(pool: GameEvent[], event: GameEvent): void {
    const idx = pool.indexOf(event);
    if (idx >= 0) pool.splice(idx, 1);
  }
}

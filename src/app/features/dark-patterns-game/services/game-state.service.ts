import { Injectable, computed, signal } from '@angular/core';
import {
  ChallengeDefinition,
  ChallengeOutcome,
  ChallengeResult,
  DarkPatternKey,
} from '../models/challenge.model';
import { GamePhase, SCORE_TIERS, ScoreTier } from '../models/game-state.model';
import { CHALLENGES } from '../data/challenges';

@Injectable()
export class GameStateService {
  private readonly _phase = signal<GamePhase>('intro');
  private readonly _completedChallengeIds = signal<ReadonlySet<string>>(new Set());
  private readonly _activeChallengeId = signal<string | null>(null);
  private readonly _results = signal<ChallengeResult[]>([]);
  private readonly _discoveredPatterns = signal<Set<DarkPatternKey>>(new Set());

  readonly phase = this._phase.asReadonly();

  readonly completedChallengeIds = this._completedChallengeIds.asReadonly();

  readonly activeChallengeId = this._activeChallengeId.asReadonly();

  readonly currentChallenge = computed<ChallengeDefinition | undefined>(() => {
    const id = this._activeChallengeId();
    if (!id) return undefined;
    return CHALLENGES.find((c) => c.id === id);
  });

  readonly allChallengesComplete = computed(
    () => this._completedChallengeIds().size === CHALLENGES.length,
  );

  readonly results = computed(() => [...this._results()]);

  readonly totalFinancialDamage = computed(() =>
    this._results().reduce((sum, r) => sum + r.financialDamage, 0),
  );

  readonly passCount = computed(
    () => this._results().filter((r) => r.outcome === 'pass').length,
  );

  readonly discoveredPatterns = computed(() => new Set(this._discoveredPatterns()));

  readonly scoreTier = computed<ScoreTier>(() => {
    const score = this.passCount();
    return (
      SCORE_TIERS.find((t) => score >= t.minScore && score <= t.maxScore) ??
      SCORE_TIERS[SCORE_TIERS.length - 1]
    );
  });

  readonly totalChallenges = CHALLENGES.length;

  startGame(): void {
    this._phase.set('hub');
    this._completedChallengeIds.set(new Set());
    this._activeChallengeId.set(null);
    this._results.set([]);
    this._discoveredPatterns.set(new Set());
  }

  startChallenge(id: string): void {
    const exists = CHALLENGES.some((c) => c.id === id);
    if (!exists) return;
    if (this._completedChallengeIds().has(id)) return;

    this._activeChallengeId.set(id);
    this._phase.set('challenge');
  }

  submitResult(outcome: ChallengeOutcome): void {
    if (this._phase() !== 'challenge') return;
    const challengeId = this._activeChallengeId();
    if (!challengeId) return;
    const challenge = CHALLENGES.find((c) => c.id === challengeId);
    if (!challenge) return;

    const financialDamage = outcome === 'pass' ? 0 : challenge.financialImpact;

    const result: ChallengeResult = {
      challengeId: challenge.id,
      outcome,
      financialDamage,
      patternsEncountered: challenge.darkPatterns,
    };

    this._results.update((prev) => [...prev, result]);

    const patterns = new Set(this._discoveredPatterns());
    for (const pattern of challenge.darkPatterns) {
      patterns.add(pattern);
    }
    this._discoveredPatterns.set(patterns);

    const completed = new Set(this._completedChallengeIds());
    completed.add(challengeId);
    this._completedChallengeIds.set(completed);
    this._activeChallengeId.set(null);

    if (completed.size === CHALLENGES.length) {
      this._phase.set('summary');
    } else {
      this._phase.set('hub');
    }
  }

  getResultForChallenge(challengeId: string): ChallengeResult | undefined {
    return this._results().find((r) => r.challengeId === challengeId);
  }

  isPatternDiscovered(key: DarkPatternKey): boolean {
    return this._discoveredPatterns().has(key);
  }

  reset(): void {
    this._phase.set('intro');
    this._completedChallengeIds.set(new Set());
    this._activeChallengeId.set(null);
    this._results.set([]);
    this._discoveredPatterns.set(new Set());
  }
}

import { Injectable, computed, signal } from '@angular/core';
import {
  ChallengeId,
  ChallengePhase,
  ChallengePredictions,
  ChallengeState,
} from '../models/compound-interest.models';

/**
 * Signal-based state machine for the five-challenge guided sequence.
 * Provided at component level (not 'root') so it resets when navigating away.
 */
@Injectable()
export class ChallengeStateService {
  private readonly _state = signal<ChallengeState>({
    currentChallenge: 1,
    phase: 'intro',
    completedChallenges: new Set(),
    predictions: {},
  });

  // ── Derived signals ────────────────────────────────

  readonly currentChallenge = computed(() => this._state().currentChallenge);
  readonly currentPhase = computed(() => this._state().phase);
  readonly completedChallenges = computed(() => this._state().completedChallenges);
  readonly predictions = computed(() => this._state().predictions);

  readonly isComplete = computed(
    () => this._state().completedChallenges.size === 4 && this._state().currentChallenge === 5,
  );

  readonly showingSummary = computed(() => this._state().phase === 'summary');
  readonly showingIntro = computed(() => this._state().phase === 'intro');

  // ── Transition methods ─────────────────────────────

  /** Move from intro → challenge 1's predict phase. */
  startChallenges(): void {
    this._state.update((s) => {
      if (s.phase !== 'intro') return s;
      return { ...s, phase: 'predict' as ChallengePhase };
    });
  }

  /** Move from predict → reveal for the current challenge. */
  submitPrediction(predictions: Partial<ChallengePredictions>): void {
    this._state.update((s) => {
      if (s.phase !== 'predict') return s;
      return {
        ...s,
        phase: 'reveal' as ChallengePhase,
        predictions: { ...s.predictions, ...predictions },
      };
    });
  }

  /** Move from reveal → reflect for the current challenge. */
  advanceToReflect(): void {
    this._state.update((s) => {
      if (s.phase !== 'reveal') return s;
      return { ...s, phase: 'reflect' as ChallengePhase };
    });
  }

  /** Move from reflect → next challenge's predict phase. */
  advanceToNextChallenge(): void {
    this._state.update((s) => {
      if (s.phase !== 'reflect') return s;
      const current = s.currentChallenge;
      if (current >= 5) return s;

      const completed = new Set(s.completedChallenges);
      completed.add(current);

      const next = (current + 1) as ChallengeId;
      return {
        ...s,
        currentChallenge: next,
        phase: (next === 5 ? 'sandbox' : 'predict') as ChallengePhase,
        completedChallenges: completed,
      };
    });
  }

  /** Mark Challenge 5 sandbox as finished → show summary. */
  finishSandbox(): void {
    this._state.update((s) => {
      if (s.currentChallenge !== 5) return s;
      if (s.phase !== 'sandbox') return s;
      const completed = new Set(s.completedChallenges);
      completed.add(5);
      return { ...s, phase: 'summary' as ChallengePhase, completedChallenges: completed };
    });
  }

  /** Get the full state snapshot (for testing / debugging). */
  getState(): ChallengeState {
    return this._state();
  }
}

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

  private readonly _history = signal<ChallengeState[]>([]);

  // ── Derived signals ────────────────────────────────

  readonly currentChallenge = computed(() => this._state().currentChallenge);
  readonly currentPhase = computed(() => this._state().phase);
  readonly completedChallenges = computed(() => this._state().completedChallenges);
  readonly predictions = computed(() => this._state().predictions);
  readonly canGoBack = computed(() => this._history().length > 0);

  readonly isComplete = computed(
    () => this._state().completedChallenges.size === 4 && this._state().currentChallenge === 5,
  );

  readonly showingSummary = computed(() => this._state().phase === 'summary');
  readonly showingIntro = computed(() => this._state().phase === 'intro');

  // ── Transition methods ─────────────────────────────

  /** Move from intro → challenge 1's predict phase. */
  startChallenges(): void {
    const prev = this._state();
    if (prev.phase !== 'intro') return;
    this.pushHistory(prev);
    this._state.set({ ...prev, phase: 'predict' as ChallengePhase });
  }

  /** Move from predict → reveal for the current challenge. */
  submitPrediction(predictions: Partial<ChallengePredictions>): void {
    const prev = this._state();
    if (prev.phase !== 'predict') return;
    this.pushHistory(prev);
    this._state.set({
      ...prev,
      phase: 'reveal' as ChallengePhase,
      predictions: { ...prev.predictions, ...predictions },
    });
  }

  /** Move from reveal → reflect for the current challenge. */
  advanceToReflect(): void {
    const prev = this._state();
    if (prev.phase !== 'reveal') return;
    this.pushHistory(prev);
    this._state.set({ ...prev, phase: 'reflect' as ChallengePhase });
  }

  /** Move from reflect → next challenge's predict phase. */
  advanceToNextChallenge(): void {
    const prev = this._state();
    if (prev.phase !== 'reflect') return;
    const current = prev.currentChallenge;
    if (current >= 5) return;

    const completed = new Set(prev.completedChallenges);
    completed.add(current);

    const next = (current + 1) as ChallengeId;
    this.pushHistory(prev);
    this._state.set({
      ...prev,
      currentChallenge: next,
      phase: (next === 5 ? 'sandbox' : 'predict') as ChallengePhase,
      completedChallenges: completed,
    });
  }

  /** Mark Challenge 5 sandbox as finished → show summary. */
  finishSandbox(): void {
    const prev = this._state();
    if (prev.currentChallenge !== 5) return;
    if (prev.phase !== 'sandbox') return;
    const completed = new Set(prev.completedChallenges);
    completed.add(5);
    this.pushHistory(prev);
    this._state.set({
      ...prev,
      phase: 'summary' as ChallengePhase,
      completedChallenges: completed,
    });
  }

  /** Undo the most recent forward transition. */
  goBack(): void {
    const h = this._history();
    if (h.length === 0) return;
    const prev = h[h.length - 1];
    this._history.set(h.slice(0, -1));
    this._state.set(prev);
  }

  /** Get the full state snapshot (for testing / debugging). */
  getState(): ChallengeState {
    return this._state();
  }

  private pushHistory(snapshot: ChallengeState): void {
    this._history.update((h) => [
      ...h,
      { ...snapshot, completedChallenges: new Set(snapshot.completedChallenges) },
    ]);
  }
}

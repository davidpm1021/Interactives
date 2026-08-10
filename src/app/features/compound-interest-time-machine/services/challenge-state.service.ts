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

/**
 * The rate of return used throughout the activity.
 *
 * Pinned at 7%. An earlier version drew a random rate per session (5-9%) so
 * students couldn't copy a neighbour's numbers, but review found two problems:
 * the varying figures read as mistakes ("Remember that $1,000 at 6%..." drew
 * "there is no 6%, numbers are wrong"), and the upper end overstated a
 * realistic post-inflation return. 7% is roughly the long-run S&P 500 average
 * after inflation.
 */
const SESSION_RATE = 0.07;

@Injectable()
export class ChallengeStateService {
  /**
   * Base rate for Challenges 1 and 3 and the sandbox default. Kept as a signal
   * so consumers read it uniformly, but it is constant — see SESSION_RATE.
   */
  readonly sessionRate = signal(SESSION_RATE);

  private readonly _state = signal<ChallengeState>({
    currentChallenge: 1,
    phase: 'intro',
    completedChallenges: new Set(),
    predictions: {},
  });

  /**
   * Reflection text lives outside the history-tracked state so Back/Next
   * navigation never rewinds a student's in-progress writing.
   */
  private readonly _reflections = signal<Record<string, string>>({});

  private readonly _history = signal<ChallengeState[]>([]);

  // ── Derived signals ────────────────────────────────

  readonly currentChallenge = computed(() => this._state().currentChallenge);
  readonly currentPhase = computed(() => this._state().phase);
  readonly completedChallenges = computed(() => this._state().completedChallenges);
  readonly predictions = computed(() => this._state().predictions);
  readonly reflections = computed(() => this._reflections());
  readonly canGoBack = computed(() => this._history().length > 0);

  readonly isComplete = computed(
    () => this._state().completedChallenges.size === 4 && this._state().currentChallenge === 5,
  );

  readonly showingSummary = computed(() => this._state().phase === 'summary');
  readonly showingIntro = computed(() => this._state().phase === 'intro');
  readonly showingConcept = computed(() => this._state().phase === 'concept');

  // ── Transition methods ─────────────────────────────

  /** Move from intro → concept phase (the "interest earns interest" demo). */
  startConcept(): void {
    const prev = this._state();
    if (prev.phase !== 'intro') return;
    this.pushHistory(prev);
    this._state.set({ ...prev, phase: 'concept' as ChallengePhase });
  }

  /** Move from concept → challenge 1's predict phase. */
  advanceFromConcept(): void {
    const prev = this._state();
    if (prev.phase !== 'concept') return;
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

  /**
   * Move from reveal → reflect for the current challenge.
   *
   * Deliberately does NOT push history. 'reveal' is a transient animation
   * state that auto-advances here via the chart's `animationComplete` output,
   * so it is never a meaningful Back destination — and landing on it would
   * strand the student, because the reveal branch renders no Next/Back control
   * and the already-rendered chart never re-emits `animationComplete`.
   * Skipping the push makes Back from a reflect card land on 'predict'.
   */
  advanceToReflect(): void {
    const prev = this._state();
    if (prev.phase !== 'reveal') return;
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

  /**
   * Undo the most recent forward transition.
   *
   * Navigation state rewinds, but submitted predictions do not. `submitPrediction`
   * snapshots the state *before* the answer was recorded, so a naive restore
   * would discard the very guess the student came Back to adjust. Predictions
   * are the student's work — like reflections — so they carry forward and the
   * predict screen can re-seed its widget from them.
   */
  goBack(): void {
    const h = this._history();
    if (h.length === 0) return;
    const prev = h[h.length - 1];
    this._history.set(h.slice(0, -1));
    this._state.set({ ...prev, predictions: this._state().predictions });
  }

  /**
   * Persist a freeform reflection entry keyed by prompt id. Not gated on phase
   * so reflect-cards and the final-summary form can both call it. Stored in a
   * separate signal so Back/Next never rewinds a student's writing.
   */
  saveReflection(promptId: string, text: string): void {
    this._reflections.update((r) => ({ ...r, [promptId]: text }));
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

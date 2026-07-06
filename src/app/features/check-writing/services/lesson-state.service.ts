import { Injectable, computed, signal } from '@angular/core';
import { LessonPhase } from '../models/check.models';

const PHASE_ORDER: readonly LessonPhase[] = [
  'intro',
  'i-do',
  'we-do',
  'you-do',
  'show-understanding',
  'complete',
];

@Injectable()
export class LessonStateService {
  private readonly _phase = signal<LessonPhase>('intro');
  private readonly _errorSpottingIndex = signal(0);
  private readonly _errorsCompleted = signal(0);

  readonly phase = this._phase.asReadonly();
  readonly errorSpottingIndex = this._errorSpottingIndex.asReadonly();
  readonly errorsCompleted = this._errorsCompleted.asReadonly();

  readonly currentStepNumber = computed(() => {
    const idx = PHASE_ORDER.indexOf(this._phase());
    return Math.max(0, idx);
  });

  readonly totalSteps = computed(() => PHASE_ORDER.length - 2); // exclude intro + complete

  /** Move forward to the next phase. */
  advance(): void {
    const idx = PHASE_ORDER.indexOf(this._phase());
    if (idx < 0 || idx >= PHASE_ORDER.length - 1) return;
    this._phase.set(PHASE_ORDER[idx + 1]);
  }

  /** Advance to the next error-spotting scenario, or finish the phase. */
  nextErrorScenario(total: number): boolean {
    const next = this._errorSpottingIndex() + 1;
    this._errorsCompleted.update((n) => n + 1);
    if (next >= total) {
      this.advance();
      return false;
    }
    this._errorSpottingIndex.set(next);
    return true;
  }

  /** Restart the lesson from the beginning. */
  reset(): void {
    this._phase.set('intro');
    this._errorSpottingIndex.set(0);
    this._errorsCompleted.set(0);
  }
}

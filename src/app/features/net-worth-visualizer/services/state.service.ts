import { Injectable, computed, signal } from '@angular/core';
import { Phase, PredictionChoice, RevealStage, REVEAL_ORDER } from '../models/net-worth.models';

@Injectable()
export class NetWorthStateService {
  private readonly _phase = signal<Phase>('predict');
  private readonly _prediction = signal<PredictionChoice | null>(null);
  private readonly _revealStageIndex = signal(-1); // -1 = not started; final = REVEAL_ORDER.length - 1

  readonly phase = this._phase.asReadonly();
  readonly prediction = this._prediction.asReadonly();

  readonly revealedStages = computed<Set<RevealStage>>(() => {
    const idx = this._revealStageIndex();
    if (idx < 0) return new Set();
    return new Set(REVEAL_ORDER.slice(0, idx + 1));
  });

  readonly revealComplete = computed(() => this._revealStageIndex() >= REVEAL_ORDER.length - 1);

  submitPrediction(choice: PredictionChoice): void {
    this._prediction.set(choice);
    this._phase.set('reveal');
    this._revealStageIndex.set(-1);
  }

  advanceReveal(): void {
    const next = this._revealStageIndex() + 1;
    if (next < REVEAL_ORDER.length) {
      this._revealStageIndex.set(next);
    }
  }

  goToSummary(): void {
    this._phase.set('summary');
  }

  reset(): void {
    this._phase.set('predict');
    this._prediction.set(null);
    this._revealStageIndex.set(-1);
  }
}

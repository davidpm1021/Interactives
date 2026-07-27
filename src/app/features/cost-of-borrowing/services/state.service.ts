import { Injectable, signal } from '@angular/core';

export interface AnswerRecord {
  submitted: boolean;
  correct: boolean | null; // null for short-text (self-graded)
  value: string | number;  // what the student entered
  /** How many times "Check" was pressed before this submission was finalized. */
  attempts: number;
  /** How many times the student hit "Try again" AFTER seeing the full reveal for this question. */
  resetsAfterReveal: number;
}

@Injectable()
export class CostOfBorrowingStateService {
  private readonly _answers = signal<Record<string, AnswerRecord>>({});

  readonly answers = this._answers.asReadonly();

  submit(
    id: string,
    value: string | number,
    correct: boolean | null,
    attempts: number,
  ): void {
    this._answers.update((a) => {
      const prior = a[id];
      return {
        ...a,
        [id]: {
          submitted: true,
          correct,
          value,
          attempts,
          resetsAfterReveal: prior?.resetsAfterReveal ?? 0,
        },
      };
    });
  }

  /**
   * Clear the student's response for a single question so they can try again.
   * Preserves the resetsAfterReveal counter and increments it if they had
   * already seen the reveal. Passing no id wipes every record (used for a
   * hard reset scenario, not currently invoked from the UI).
   */
  reset(id?: string): void {
    if (!id) {
      this._answers.set({});
      return;
    }
    this._answers.update((a) => {
      const prior = a[id];
      if (!prior) return a;
      const bumpedResets = prior.submitted ? prior.resetsAfterReveal + 1 : prior.resetsAfterReveal;
      return {
        ...a,
        [id]: {
          submitted: false,
          correct: null,
          value: '',
          attempts: 0,
          resetsAfterReveal: bumpedResets,
        },
      };
    });
  }

  getAnswer(id: string): AnswerRecord | null {
    return this._answers()[id] ?? null;
  }
}

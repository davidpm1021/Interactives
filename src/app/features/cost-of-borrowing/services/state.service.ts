import { Injectable, signal } from '@angular/core';

export interface AnswerRecord {
  submitted: boolean;
  correct: boolean | null; // null for short-text (self-graded)
  value: string | number;  // what the student entered
}

@Injectable()
export class CostOfBorrowingStateService {
  private readonly _answers = signal<Record<string, AnswerRecord>>({});

  readonly answers = this._answers.asReadonly();

  submit(id: string, value: string | number, correct: boolean | null): void {
    this._answers.update((a) => ({
      ...a,
      [id]: { submitted: true, correct, value },
    }));
  }

  reset(id?: string): void {
    if (!id) {
      this._answers.set({});
      return;
    }
    this._answers.update((a) => {
      const next = { ...a };
      delete next[id];
      return next;
    });
  }

  getAnswer(id: string): AnswerRecord | null {
    return this._answers()[id] ?? null;
  }
}

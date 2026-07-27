import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MultipleChoiceQuestion,
  NumericQuestion,
  Question,
  ShortTextQuestion,
} from '../../models/question.models';
import { CostOfBorrowingStateService } from '../../services/state.service';

@Component({
  selector: 'app-question-item',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './question-item.html',
  styleUrl: './question-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionItem {
  readonly question = input.required<Question>();
  readonly index = input.required<number>();
  /** Label for the "advance" state of the primary button (after full reveal). */
  readonly advanceLabel = input<string>('Next question →');
  /** True when this is the last question; hides the advance button after reveal so the parent can render the Review step instead. */
  readonly isLast = input<boolean>(false);

  readonly advanceRequested = output<void>();

  private readonly state = inject(CostOfBorrowingStateService);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  /**
   * Attempt budget for MC and numeric before the correct answer is revealed.
   * First wrong pick: soft "not quite" nudge, no highlights on the correct
   * option, no explanation. Second attempt (right or wrong): full reveal.
   */
  private static readonly MAX_ATTEMPTS = 2;

  protected readonly selectedIndex = signal<number | null>(null);
  protected readonly numericInput = signal<string>('');
  protected readonly textInput = signal<string>('');
  protected readonly reveal = signal(false);
  protected readonly attempts = signal(0);
  /** True after a wrong first attempt while the student still has a retry. */
  protected readonly nudge = signal(false);

  protected readonly submitted = computed(() => this.reveal());

  protected readonly correct = computed(() => {
    if (!this.reveal()) return null;
    const q = this.question();
    if (q.answerType === 'multiple-choice' || q.answerType === 'numeric') {
      return this.evaluateCorrect();
    }
    return null; // short-text: self-graded
  });

  protected readonly canCheck = computed(() => {
    const q = this.question();
    if (q.answerType === 'multiple-choice') return this.selectedIndex() !== null;
    if (q.answerType === 'numeric') return this.numericInput().trim().length > 0;
    return this.textInput().trim().length > 0;
  });

  private evaluateCorrect(): boolean {
    const q = this.question();
    if (q.answerType === 'multiple-choice') return this.selectedIndex() === q.correctIndex;
    if (q.answerType === 'numeric') {
      const v = parseFloat(this.numericInput());
      if (!Number.isFinite(v)) return false;
      return Math.abs(v - q.correctValue) <= q.tolerance;
    }
    return false;
  }

  protected asMc(q: Question): MultipleChoiceQuestion { return q as MultipleChoiceQuestion; }
  protected asNumeric(q: Question): NumericQuestion { return q as NumericQuestion; }
  protected asShortText(q: Question): ShortTextQuestion { return q as ShortTextQuestion; }

  protected onSelect(i: number): void {
    if (this.reveal()) return;
    this.selectedIndex.set(i);
  }

  protected onOptionKeydown(event: KeyboardEvent): void {
    if (this.reveal()) return;
    const q = this.question();
    if (q.answerType !== 'multiple-choice') return;
    const total = q.options.length;
    if (total === 0) return;
    const key = event.key;
    const current = this.selectedIndex() ?? 0;
    let next = current;
    if (key === 'ArrowRight' || key === 'ArrowDown') next = (current + 1) % total;
    else if (key === 'ArrowLeft' || key === 'ArrowUp') next = (current - 1 + total) % total;
    else if (key === 'Home') next = 0;
    else if (key === 'End') next = total - 1;
    else return;
    event.preventDefault();
    this.selectedIndex.set(next);
    requestAnimationFrame(() => {
      const el = this.host.nativeElement.querySelector<HTMLButtonElement>(
        `button[data-option-index="${next}"]`,
      );
      el?.focus();
    });
  }

  protected onCheck(): void {
    if (!this.canCheck()) return;
    const q = this.question();

    if (q.answerType === 'short-text') {
      // Short-text is not graded; go straight to the model answer.
      this.reveal.set(true);
      this.state.submit(q.id, this.textInput(), null);
      return;
    }

    const isCorrect = this.evaluateCorrect();
    const nextAttempts = this.attempts() + 1;
    this.attempts.set(nextAttempts);

    if (isCorrect || nextAttempts >= QuestionItem.MAX_ATTEMPTS) {
      // Correct at any attempt, or exhausted retries — full reveal.
      this.nudge.set(false);
      this.reveal.set(true);
      const value =
        q.answerType === 'multiple-choice' ? (this.selectedIndex() ?? -1) : this.numericInput();
      this.state.submit(q.id, value, isCorrect);
      return;
    }

    // First wrong attempt — soft nudge, no highlight on correct, no explanation.
    this.nudge.set(true);
  }

  protected onAdvance(): void {
    this.advanceRequested.emit();
  }

  protected onReset(): void {
    this.reveal.set(false);
    this.nudge.set(false);
    this.attempts.set(0);
    this.selectedIndex.set(null);
    this.numericInput.set('');
    this.textInput.set('');
    this.state.reset(this.question().id);
  }
}

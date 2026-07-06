import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
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

  private readonly state = inject(CostOfBorrowingStateService);

  protected readonly selectedIndex = signal<number | null>(null);
  protected readonly numericInput = signal<string>('');
  protected readonly textInput = signal<string>('');
  protected readonly reveal = signal(false);

  protected readonly submitted = computed(() => this.reveal());

  protected readonly correct = computed(() => {
    if (!this.reveal()) return null;
    const q = this.question();
    if (q.answerType === 'multiple-choice') {
      return this.selectedIndex() === q.correctIndex;
    }
    if (q.answerType === 'numeric') {
      const v = parseFloat(this.numericInput());
      if (!Number.isFinite(v)) return false;
      return Math.abs(v - q.correctValue) <= q.tolerance;
    }
    return null; // short-text: self-graded
  });

  protected readonly canCheck = computed(() => {
    const q = this.question();
    if (q.answerType === 'multiple-choice') return this.selectedIndex() !== null;
    if (q.answerType === 'numeric') return this.numericInput().trim().length > 0;
    return this.textInput().trim().length > 0;
  });

  protected asMc(q: Question): MultipleChoiceQuestion { return q as MultipleChoiceQuestion; }
  protected asNumeric(q: Question): NumericQuestion { return q as NumericQuestion; }
  protected asShortText(q: Question): ShortTextQuestion { return q as ShortTextQuestion; }

  protected onSelect(i: number): void {
    if (this.reveal()) return;
    this.selectedIndex.set(i);
  }

  protected onCheck(): void {
    if (!this.canCheck()) return;
    this.reveal.set(true);
    const q = this.question();
    const value =
      q.answerType === 'multiple-choice' ? (this.selectedIndex() ?? -1)
      : q.answerType === 'numeric' ? this.numericInput()
      : this.textInput();
    this.state.submit(q.id, value, this.correct());
  }

  protected onReset(): void {
    this.reveal.set(false);
    this.selectedIndex.set(null);
    this.numericInput.set('');
    this.textInput.set('');
    this.state.reset(this.question().id);
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import {
  MultipleChoiceQuestion,
  NumericQuestion,
  Question,
} from '../../models/question.models';
import { CostOfBorrowingStateService } from '../../services/state.service';
import { QuestionItem } from '../question-item/question-item';

interface ReviewRow {
  index: number;
  prompt: string;
  answered: boolean;
  answerText: string;
  verdict: 'correct' | 'wrong' | 'self-graded' | 'skipped';
}

@Component({
  selector: 'app-question-stack',
  standalone: true,
  imports: [QuestionItem],
  templateUrl: './question-stack.html',
  styleUrl: './question-stack.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionStack {
  readonly questions = input.required<Question[]>();

  private readonly state = inject(CostOfBorrowingStateService);

  /** 0-indexed position in the questions array; equals `questions().length` on the review step. */
  protected readonly currentIndex = signal(0);

  protected readonly total = computed(() => this.questions().length);
  protected readonly onReview = computed(() => this.currentIndex() >= this.total());
  protected readonly canGoPrev = computed(() => this.currentIndex() > 0);
  protected readonly nextLabel = computed(() => {
    if (this.currentIndex() >= this.total() - 1) return 'Review answers';
    return 'Next question';
  });

  protected readonly reviewRows = computed<ReviewRow[]>(() => {
    const answers = this.state.answers();
    return this.questions().map((q, i) => {
      const record = answers[q.id];
      if (!record) {
        return { index: i, prompt: q.prompt, answered: false, answerText: '', verdict: 'skipped' };
      }
      const answerText = this.formatAnswerValue(q, record.value);
      let verdict: ReviewRow['verdict'];
      if (record.correct === true) verdict = 'correct';
      else if (record.correct === false) verdict = 'wrong';
      else verdict = 'self-graded';
      return { index: i, prompt: q.prompt, answered: true, answerText, verdict };
    });
  });

  protected onPrev(): void {
    if (this.currentIndex() > 0) this.currentIndex.update((n) => n - 1);
  }

  protected onNext(): void {
    if (this.currentIndex() < this.total()) this.currentIndex.update((n) => n + 1);
  }

  protected goTo(i: number): void {
    if (i < 0 || i > this.total()) return;
    this.currentIndex.set(i);
  }

  private formatAnswerValue(q: Question, value: string | number): string {
    if (q.answerType === 'multiple-choice') {
      const idx = Number(value);
      const options = (q as MultipleChoiceQuestion).options;
      return options[idx] ?? `Option ${idx}`;
    }
    if (q.answerType === 'numeric') {
      const unit = (q as NumericQuestion).unit;
      if (unit === '$') return `$${value}`;
      if (unit) return `${value} ${unit}`;
      return String(value);
    }
    return String(value);
  }
}

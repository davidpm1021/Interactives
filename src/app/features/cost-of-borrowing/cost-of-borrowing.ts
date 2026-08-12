import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { RATE_SERIES, REFRESHED_AT_DISPLAY } from './data/rates.generated';
import { QUESTIONS } from './data/questions';
import { CostOfBorrowingStateService } from './services/state.service';
import { RateTable } from './components/rate-table/rate-table';
import { TrendChart } from './components/trend-chart/trend-chart';
import { QuestionStack } from './components/question-stack/question-stack';
import { BehindTheNumbers } from './components/behind-the-numbers/behind-the-numbers';
import { formatAnswerValue } from './utils/formatters';
import { ScrollCueComponent } from '../../shared/scroll-cue/scroll-cue.component';

@Component({
  selector: 'app-cost-of-borrowing',
  standalone: true,
  imports: [TopHeader, RateTable, TrendChart, QuestionStack, BehindTheNumbers, ScrollCueComponent],
  providers: [CostOfBorrowingStateService],
  templateUrl: './cost-of-borrowing.html',
  styleUrl: './cost-of-borrowing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostOfBorrowing {
  private readonly stateService = inject(CostOfBorrowingStateService);

  protected readonly rateSeries = RATE_SERIES;
  protected readonly questions = QUESTIONS;
  protected readonly refreshedAt = REFRESHED_AT_DISPLAY;
  /** Data pane view. Chart is the default; students toggle to the table when they want the raw numbers. */
  protected readonly dataView = signal<'chart' | 'table'>('chart');

  protected setDataView(view: 'chart' | 'table'): void {
    this.dataView.set(view);
  }

  protected onPrint(): void {
    window.print();
  }

  /**
   * Download a plain-text summary of the student's submitted answers so
   * teachers can collect a Data Crunch artifact. Unanswered questions are
   * included and marked as such so the file reflects the whole worksheet.
   */
  protected onExportAnswers(): void {
    const answers = this.stateService.answers();
    const lines: string[] = [
      'Cost of Borrowing (Data Crunch)',
      'Name: ______________________________',
      'Date: ______________________________',
      '',
    ];

    this.questions.forEach((q, i) => {
      lines.push(`Q${i + 1} (DOK ${q.dok}): ${q.prompt}`);
      const record = answers[q.id];
      if (!record) {
        lines.push('Your answer: (not answered)');
      } else if (q.answerType === 'short-text') {
        lines.push('Your answer:');
        lines.push(String(record.value));
      } else {
        lines.push(`Your answer: ${formatAnswerValue(q, record.value)}`);
        if (record.correct === true) lines.push('Correct.');
        else if (record.correct === false) lines.push('Not the model answer.');
        if (record.attempts > 1) lines.push(`Attempts: ${record.attempts}`);
      }
      if (record && record.resetsAfterReveal > 0) {
        lines.push(
          `Redone ${record.resetsAfterReveal} time${record.resetsAfterReveal === 1 ? '' : 's'} after seeing the answer.`,
        );
      }
      lines.push('');
    });

    lines.push('---');
    lines.push(`Data as of ${this.refreshedAt}. Source: Federal Reserve (FRED).`);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cost-of-borrowing-answers.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { RATE_SERIES, REFRESHED_AT_DISPLAY } from './data/rates.generated';
import { QUESTIONS } from './data/questions';
import { CostOfBorrowingStateService } from './services/state.service';
import { RateTable } from './components/rate-table/rate-table';
import { TrendChart } from './components/trend-chart/trend-chart';
import { QuestionStack } from './components/question-stack/question-stack';
import { BehindTheNumbers } from './components/behind-the-numbers/behind-the-numbers';

@Component({
  selector: 'app-cost-of-borrowing',
  standalone: true,
  imports: [TopHeader, RateTable, TrendChart, QuestionStack, BehindTheNumbers],
  providers: [CostOfBorrowingStateService],
  templateUrl: './cost-of-borrowing.html',
  styleUrl: './cost-of-borrowing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostOfBorrowing {
  protected readonly rateSeries = RATE_SERIES;
  protected readonly questions = QUESTIONS;
  protected readonly refreshedAt = REFRESHED_AT_DISPLAY;

  protected onPrint(): void {
    window.print();
  }
}

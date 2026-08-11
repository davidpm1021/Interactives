import { Component, inject } from '@angular/core';
import { MultiLineChartComponent } from '../multi-line-chart/multi-line-chart.component';
import { RoiSummaryTableComponent } from '../roi-summary-table/roi-summary-table.component';
import { ReflectionFormComponent, ReflectionKey } from '../reflection-form/reflection-form.component';
import { StockTrackerStateService } from '../../services/stock-tracker-state.service';
import { StockReport } from '../../models/stock-tracker.models';

@Component({
  selector: 'app-compare-step',
  standalone: true,
  imports: [
    MultiLineChartComponent,
    RoiSummaryTableComponent,
    ReflectionFormComponent,
  ],
  templateUrl: './compare-step.component.html',
  styleUrl: './compare-step.component.scss',
})
export class CompareStepComponent {
  protected readonly state = inject(StockTrackerStateService);

  /**
   * Includes the closing "what did this teach you" question, which used to
   * live alone on the report screen. There it sat below three answers carried
   * over from earlier steps, so the only field still needing work looked
   * exactly like three that were already done, and students printed without
   * noticing it. Asking it here means every question is answered before the
   * report exists.
   */
  protected readonly compareFields: ReflectionKey[] = [
    'mostValuableAnalysis',
    'biggestSurprise',
    'lessonsLearned',
  ];

  protected onReportChange(partial: Partial<StockReport>): void {
    this.state.updateReport(partial);
  }

  protected onAdvance(): void {
    this.state.advanceStep();
  }
}

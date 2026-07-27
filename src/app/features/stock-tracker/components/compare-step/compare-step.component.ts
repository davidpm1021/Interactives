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

  protected readonly compareFields: ReflectionKey[] = [
    'mostValuableAnalysis',
    'biggestSurprise',
  ];

  protected onReportChange(partial: Partial<StockReport>): void {
    this.state.updateReport(partial);
  }

  protected onAdvance(): void {
    this.state.advanceStep();
  }
}

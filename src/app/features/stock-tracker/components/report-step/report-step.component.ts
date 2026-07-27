import { Component, inject, computed } from '@angular/core';
import { RoiSummaryTableComponent } from '../roi-summary-table/roi-summary-table.component';
import { MultiLineChartComponent } from '../multi-line-chart/multi-line-chart.component';
import { ReflectionFormComponent } from '../reflection-form/reflection-form.component';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { StockTrackerStateService } from '../../services/stock-tracker-state.service';
import { StockReport } from '../../models/stock-tracker.models';

@Component({
  selector: 'app-report-step',
  standalone: true,
  imports: [
    RoiSummaryTableComponent,
    MultiLineChartComponent,
    ReflectionFormComponent,
    ExportButtonsComponent,
  ],
  templateUrl: './report-step.component.html',
  styleUrl: './report-step.component.scss',
})
export class ReportStepComponent {
  protected readonly state = inject(StockTrackerStateService);

  protected readonly hasContent = computed(() => {
    const r = this.state.report();
    return !!(r.bestPerformerAnalysis || r.mostValuableAnalysis || r.biggestSurprise || r.lessonsLearned);
  });

  protected onReportChange(partial: Partial<StockReport>): void {
    this.state.updateReport(partial);
  }
}

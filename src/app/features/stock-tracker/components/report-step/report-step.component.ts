import { Component, inject, computed, afterNextRender, Injector } from '@angular/core';
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
  private readonly injector = inject(Injector);

  /**
   * Time given to Chart.js before the print dialog opens.
   *
   * The report's chart is a canvas, and printing before it has drawn produces
   * a blank plot on the sheet. Two animation frames put us past the component's
   * own afterNextRender and the chart's first paint; the extra margin covers a
   * slow machine.
   */
  private static readonly CHART_SETTLE_MS = 350;

  constructor() {
    // Students arrive here by pressing "Print My Report" on the previous step,
    // so open the dialog for them rather than making them find a second Print
    // button. They still land on this page afterwards, which shows the report
    // and offers Print / PDF and Copy Text if they cancelled or want it again.
    afterNextRender(
      () => {
        if (typeof window === 'undefined') return;
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            setTimeout(() => window.print(), ReportStepComponent.CHART_SETTLE_MS),
          ),
        );
      },
      { injector: this.injector },
    );
  }

  protected readonly hasContent = computed(() => {
    const r = this.state.report();
    return !!(r.bestPerformerAnalysis || r.mostValuableAnalysis || r.biggestSurprise || r.lessonsLearned);
  });

  protected onReportChange(partial: Partial<StockReport>): void {
    this.state.updateReport(partial);
  }
}

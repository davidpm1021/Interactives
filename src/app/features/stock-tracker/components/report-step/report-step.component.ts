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

  /** How often to re-check whether the chart has drawn. */
  private static readonly CHART_POLL_MS = 100;

  /** Give up waiting for the chart and print anyway after this long. */
  private static readonly CHART_WAIT_CEILING_MS = 2500;

  constructor() {
    // Students arrive here by pressing "Print My Report" on the previous step,
    // so open the dialog for them rather than making them find a second Print
    // button. They still land on this page afterwards, which shows the report
    // and offers Print / PDF and Copy Text if they cancelled or want it again.
    afterNextRender(
      () => {
        if (typeof window === 'undefined') return;
        this.printWhenChartIsDrawn();
      },
      { injector: this.injector },
    );
  }

  /** Consecutive identical samples that count as "the chart has settled". */
  private static readonly STABLE_SAMPLES_NEEDED = 2;

  /**
   * Waits for the report's chart to finish drawing before printing.
   *
   * The chart is a canvas, and printing before Chart.js has painted puts a
   * blank plot on the sheet. An earlier version waited two animation frames
   * plus a fixed delay, which fails outright in a tab that isn't animating:
   * requestAnimationFrame never fires there, so the dialog never opened and
   * nothing said why. Timers keep running regardless, so poll on a timer and
   * look at the canvas rather than guessing at a duration.
   *
   * "Has ink" alone isn't enough, because the chart animates in and would be
   * caught half-drawn, so wait for its contents to stop changing. An empty
   * chart never produces ink at all, hence the ceiling: a report with no data
   * still reaches the print dialog.
   */
  private printWhenChartIsDrawn(): void {
    const started = Date.now();
    let lastSignature: number | null = null;
    let stableCount = 0;

    const tick = (): void => {
      const signature = this.chartSignature();
      if (signature !== null && signature > 0 && signature === lastSignature) {
        stableCount++;
      } else {
        stableCount = 0;
      }
      lastSignature = signature;

      const settled = stableCount >= ReportStepComponent.STABLE_SAMPLES_NEEDED;
      const timedOut = Date.now() - started >= ReportStepComponent.CHART_WAIT_CEILING_MS;
      if (settled || timedOut) {
        window.print();
        return;
      }
      setTimeout(tick, ReportStepComponent.CHART_POLL_MS);
    };

    setTimeout(tick, ReportStepComponent.CHART_POLL_MS);
  }

  /**
   * A cheap fingerprint of what the report canvas currently shows: 0 for blank,
   * a value that shifts as the chart animates, and null if there's no canvas
   * yet or it can't be read.
   */
  private chartSignature(): number | null {
    const canvas = document.querySelector<HTMLCanvasElement>('app-report-step canvas');
    if (!canvas || !canvas.width || !canvas.height) return null;
    // Downscale into a small offscreen canvas so the pixel scan stays cheap
    // even though it runs every poll.
    const probe = document.createElement('canvas');
    probe.width = 64;
    probe.height = 64;
    const ctx = probe.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    try {
      ctx.drawImage(canvas, 0, 0, probe.width, probe.height);
      const { data } = ctx.getImageData(0, 0, probe.width, probe.height);
      let signature = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue;
        const white = data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250;
        if (white) continue;
        signature = (signature + (i >> 2) * (data[i] + data[i + 1] * 3 + data[i + 2] * 7)) % 2147483647;
      }
      return signature;
    } catch {
      return null; // Tainted or unreadable canvas: let the ceiling handle it.
    }
  }

  protected readonly hasContent = computed(() => {
    const r = this.state.report();
    return !!(r.bestPerformerAnalysis || r.mostValuableAnalysis || r.biggestSurprise || r.lessonsLearned);
  });

  protected onReportChange(partial: Partial<StockReport>): void {
    this.state.updateReport(partial);
  }
}

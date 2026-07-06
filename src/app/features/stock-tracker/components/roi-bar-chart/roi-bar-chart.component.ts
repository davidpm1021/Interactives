import {
  Component, input, inject, viewChild, ElementRef,
  AfterViewInit, OnDestroy, computed, effect,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { StockPick } from '../../models/stock-tracker.models';
import { formatPercent, STOCK_COLORS } from '../../services/format.utils';
import { ExportService } from '../../services/export.service';
import { DownloadButtonComponent } from '../download-button/download-button.component';

Chart.register(...registerables);

@Component({
  selector: 'app-roi-bar-chart',
  standalone: true,
  imports: [DownloadButtonComponent],
  template: `
    <div class="roi-bar-chart">
      <div class="roi-bar-chart__header">
        <h4 class="roi-bar-chart__title">Return on Investment (ROI) Comparison</h4>
        <app-download-button label="Download chart as PNG" (download)="onDownload()"></app-download-button>
      </div>
      <div class="roi-bar-chart__canvas-wrap">
        <canvas #chartCanvas role="img" [attr.aria-label]="chartAriaLabel()"></canvas>
      </div>
    </div>
  `,
  styles: [`
    .roi-bar-chart {
      background: white;
      border-radius: var(--ngpf-radius-md);
      box-shadow: var(--ngpf-shadow-sm);
      padding: var(--ngpf-spacing-md);

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--ngpf-spacing-sm);
      }

      &__title {
        font-family: var(--ngpf-font-heading);
        font-size: 1rem;
        font-weight: 700;
        color: var(--ngpf-text-primary);
        margin: 0;
      }

      &__canvas-wrap {
        position: relative;
        width: 100%;
        height: 300px;
      }
    }
  `],
})
export class RoiBarChartComponent implements AfterViewInit, OnDestroy {
  readonly picks = input.required<StockPick[]>();

  private readonly exportService = inject(ExportService);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart: Chart | null = null;

  protected readonly chartAriaLabel = computed(() => {
    const picks = this.picks();
    if (picks.length === 0) return 'Bar chart comparing Return on Investment across selected stocks';
    const parts = picks.map((p) => `${p.ticker} ${formatPercent(p.roi)}`);
    return `Bar chart comparing ROI across selected stocks: ${parts.join(', ')}. Exact values also appear in the ROI summary table on this page.`;
  });

  constructor() {
    effect(() => {
      const picks = this.picks();
      if (this.chart && picks.length > 0) {
        this.updateChart(picks);
      }
    });
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  protected onDownload(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas) {
      this.exportService.downloadChartAsImage(canvas, 'roi-bar-chart.png');
    }
  }

  private createChart(): void {
    const picks = this.picks();
    if (picks.length === 0) return;

    const bestRoi = Math.max(...picks.map(p => p.roi));

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: picks.map(p => `${p.companyName} (${p.ticker})`),
        datasets: [{
          data: picks.map(p => Math.round(p.roi * 10) / 10),
          backgroundColor: picks.map((p, i) =>
            p.roi < 0 ? STOCK_COLORS[i] + '60' : STOCK_COLORS[i]
          ),
          borderColor: picks.map((_, i) => STOCK_COLORS[i]),
          borderWidth: picks.map(p => p.roi === bestRoi ? 3 : 1),
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `ROI: ${formatPercent(ctx.parsed.x ?? 0)}`,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'ROI (%)',
              font: { size: 12, weight: 'bold' },
            },
            ticks: {
              callback: (val) => `${val}%`,
              font: { size: 11 },
            },
          },
          y: {
            ticks: { font: { size: 11 } },
          },
        },
      },
    };

    this.chart = new Chart(this.canvasRef().nativeElement, config);
  }

  private updateChart(picks: StockPick[]): void {
    if (!this.chart) {
      this.createChart();
      return;
    }

    const bestRoi = Math.max(...picks.map(p => p.roi));
    this.chart.data.labels = picks.map(p => `${p.companyName} (${p.ticker})`);
    this.chart.data.datasets[0].data = picks.map(p => Math.round(p.roi * 10) / 10);
    this.chart.data.datasets[0].backgroundColor = picks.map((p, i) =>
      p.roi < 0 ? STOCK_COLORS[i] + '60' : STOCK_COLORS[i]
    ) as string[];
    this.chart.data.datasets[0].borderWidth = picks.map(p =>
      p.roi === bestRoi ? 3 : 1
    );
    this.chart.update();
  }
}

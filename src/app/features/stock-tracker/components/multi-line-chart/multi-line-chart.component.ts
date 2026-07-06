import {
  Component, input, inject, viewChild, ElementRef,
  OnInit, OnDestroy, AfterViewInit, computed, effect,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { StockPick } from '../../models/stock-tracker.models';
import { formatCurrency, STOCK_COLORS } from '../../services/format.utils';
import { ExportService } from '../../services/export.service';
import { DownloadButtonComponent } from '../download-button/download-button.component';

Chart.register(...registerables);

@Component({
  selector: 'app-multi-line-chart',
  standalone: true,
  imports: [DownloadButtonComponent],
  template: `
    <div class="multi-line-chart">
      <div class="multi-line-chart__header">
        <h4 class="multi-line-chart__title">Value of 100 Shares Over Time</h4>
        <app-download-button label="Download chart as PNG" (download)="onDownload()"></app-download-button>
      </div>
      <div class="multi-line-chart__canvas-wrap">
        <canvas #chartCanvas role="img" [attr.aria-label]="chartAriaLabel()"></canvas>
      </div>
    </div>
  `,
  styles: [`
    .multi-line-chart {
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
        height: 400px;
      }
    }

    @media (max-width: 768px) {
      .multi-line-chart__canvas-wrap {
        height: 300px;
        overflow-x: auto;
      }
    }
  `],
})
export class MultiLineChartComponent implements AfterViewInit, OnDestroy {
  readonly picks = input.required<StockPick[]>();
  readonly showAge = input(false);

  private readonly exportService = inject(ExportService);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart: Chart | null = null;

  protected readonly chartAriaLabel = computed(() => {
    const picks = this.picks();
    if (picks.length === 0 || picks[0].annualData.length === 0) {
      return 'Line chart showing the value of 100 shares over time';
    }
    const rows = picks[0].annualData;
    const startYear = rows[0].year;
    const endYear = rows[rows.length - 1].year;
    const tickers = picks.map((p) => p.ticker).join(', ');
    return `Line chart. Value of 100 shares from ${startYear} to ${endYear} for ${tickers}. Exact final values are in the ROI summary table on this page.`;
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
      this.exportService.downloadChartAsImage(canvas, 'stock-comparison-chart.png');
    }
  }

  private createChart(): void {
    const picks = this.picks();
    if (picks.length === 0) return;

    const labels = this.getLabels(picks);
    const datasets = picks.map((pick, i) => ({
      label: `${pick.companyName} (${pick.ticker})`,
      data: pick.annualData.map(d => d.valueOf100Shares),
      borderColor: STOCK_COLORS[i],
      backgroundColor: STOCK_COLORS[i] + '20',
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
      tension: 0.1,
      fill: false,
    }));

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 16,
              font: { size: 12 },
            },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}`,
            },
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (val) => formatCurrency(val as number),
              font: { size: 11 },
            },
            title: {
              display: true,
              text: 'Value of 100 Shares ($)',
              font: { size: 12, weight: 'bold' },
            },
          },
          x: {
            ticks: { font: { size: 11 }, autoSkip: false, maxRotation: 45 },
            title: {
              display: true,
              text: this.showAge() ? 'Age' : 'Year',
              font: { size: 12, weight: 'bold' },
            },
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

    const labels = this.getLabels(picks);
    this.chart.data.labels = labels;
    this.chart.data.datasets = picks.map((pick, i) => ({
      label: `${pick.companyName} (${pick.ticker})`,
      data: pick.annualData.map(d => d.valueOf100Shares),
      borderColor: STOCK_COLORS[i],
      backgroundColor: STOCK_COLORS[i] + '20',
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
      tension: 0.1,
      fill: false,
    }));
    this.chart.update();
  }

  private getLabels(picks: StockPick[]): string[] {
    if (picks.length === 0 || picks[0].annualData.length === 0) return [];
    return picks[0].annualData.map(d =>
      this.showAge() ? `Age ${d.age}` : `${d.year}`
    );
  }
}

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  Chart,
  Filler,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { PreferenceCategory } from '../../models/car-preferences.models';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

const whiteBackgroundPlugin = {
  id: 'whiteBackground',
  beforeDraw(chart: Chart) {
    const { ctx, width, height } = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  },
};

@Component({
  selector: 'app-preference-radar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preference-radar.component.html',
  styleUrl: './preference-radar.component.scss',
})
export class PreferenceRadarComponent implements AfterViewInit, OnDestroy {
  readonly categories = input.required<PreferenceCategory[]>();
  readonly values = input.required<Record<string, number>>();

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart<'radar'> | null = null;

  protected readonly copyStatus = signal('');

  protected readonly summary = computed(() => {
    const cats = this.categories();
    const v = this.values();
    const parts = cats.map((c) => `${c.label} ${v[c.id] ?? 0}`).join(', ');
    return `Radar chart of your driving preferences. ${parts}.`;
  });

  constructor() {
    effect(() => {
      this.values();
      this.categories();
      if (this.chart) {
        this.applyData();
        this.chart.update('none');
      }
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const lineColor = readVar('--ngpf-bright-blue', '#275ce4');
    const fillColor = hexToRgba(lineColor, 0.25);
    const gridColor = readVar('--ngpf-light-gray-blue', '#d2d8e9');
    const labelColor = readVar('--ngpf-text-primary', '#333');

    this.chart = new Chart<'radar'>(canvas, {
      type: 'radar',
      plugins: [whiteBackgroundPlugin],
      data: {
        labels: this.categories().map((c) => c.label),
        datasets: [
          {
            data: this.categories().map((c) => this.values()[c.id] ?? 0),
            backgroundColor: fillColor,
            borderColor: lineColor,
            borderWidth: 2,
            pointBackgroundColor: lineColor,
            pointBorderColor: '#fff',
            pointRadius: 3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: reduceMotion ? false : { duration: 150, easing: 'easeOutQuad' },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: { stepSize: 1, display: false },
            grid: { color: gridColor },
            angleLines: { color: gridColor },
            pointLabels: { font: { size: 13, weight: 'bold' }, color: labelColor },
          },
        },
      },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private applyData(): void {
    if (!this.chart) return;
    const cats = this.categories();
    const v = this.values();
    this.chart.data.labels = cats.map((c) => c.label);
    this.chart.data.datasets[0].data = cats.map((c) => v[c.id] ?? 0);
  }

  protected async copyImage(): Promise<void> {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
      this.copyStatus.set('Copy not supported in this browser.');
      return;
    }
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      );
      if (!blob) {
        this.copyStatus.set('Could not capture image.');
        return;
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      this.copyStatus.set('Image copied to clipboard.');
    } catch (err) {
      this.copyStatus.set('Could not copy image.');
    }
  }
}

function readVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw || fallback;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 3 && h.length !== 6) return `rgba(39, 92, 228, ${alpha})`;
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

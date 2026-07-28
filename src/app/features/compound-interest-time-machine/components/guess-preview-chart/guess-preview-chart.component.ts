import { Component, computed, input } from '@angular/core';
import { SimulationResult } from '../../models/compound-interest.models';
import { formatCurrency } from '../../utils/formatters';

/**
 * Small illustrative preview for Challenge 2. Shows the 5% baseline curve
 * alongside a synthetic line whose year-40 value equals baseline_final ×
 * `multiple`. Used while the student picks a multiple-choice option so they
 * see what their guess "looks like" before revealing the real answer.
 */
@Component({
  selector: 'app-guess-preview-chart',
  standalone: true,
  imports: [],
  templateUrl: './guess-preview-chart.component.html',
  styleUrl: './guess-preview-chart.component.scss',
})
export class GuessPreviewChartComponent {
  readonly baseline = input.required<SimulationResult>();
  readonly multiple = input<number | null>(null);

  protected readonly viewBoxWidth = 320;
  protected readonly viewBoxHeight = 160;
  private readonly padding = { top: 12, right: 12, bottom: 24, left: 12 };
  private readonly principal = 1000;
  private readonly maxYear = 40;

  protected readonly baselineFinal = computed(() => this.baseline().summary.finalBalance);

  protected readonly guessFinal = computed(() => {
    const m = this.multiple();
    return m !== null ? this.baselineFinal() * m : 0;
  });

  private readonly yMax = computed(() => {
    const m = this.multiple();
    const guessCeiling = m !== null ? this.baselineFinal() * m : this.baselineFinal();
    return Math.max(this.baselineFinal(), guessCeiling) * 1.1;
  });

  protected readonly baselinePoints = computed(() =>
    this.pointsForFinal(this.baselineFinal()),
  );

  protected readonly guessPoints = computed(() => {
    const m = this.multiple();
    if (m === null) return '';
    return this.pointsForFinal(this.guessFinal());
  });

  protected formatCurrency = (n: number) => formatCurrency(Math.round(n), true);

  /** Back-calculate a smooth compound curve that ends at `finalValue`. */
  private pointsForFinal(finalValue: number): string {
    if (finalValue <= 0) return '';
    const r = Math.pow(finalValue / this.principal, 1 / this.maxYear) - 1;
    const w = this.viewBoxWidth - this.padding.left - this.padding.right;
    const h = this.viewBoxHeight - this.padding.top - this.padding.bottom;
    const yMax = this.yMax();
    const pts: string[] = [];
    for (let year = 0; year <= this.maxYear; year++) {
      const bal = this.principal * Math.pow(1 + r, year);
      const px = this.padding.left + (year / this.maxYear) * w;
      const py = this.padding.top + h - (bal / yMax) * h;
      pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return pts.join(' ');
  }
}

import { Component, computed, input } from '@angular/core';
import { SimulationResult } from '../../models/compound-interest.models';
import { formatCurrency } from '../../utils/formatters';

@Component({
  selector: 'app-growth-table',
  standalone: true,
  imports: [],
  templateUrl: './growth-table.component.html',
  styleUrl: './growth-table.component.scss',
})
export class GrowthTableComponent {
  readonly result = input.required<SimulationResult>();
  /** When set, the first column shows ages instead of raw year offsets. */
  readonly startAge = input<number | null>(null);
  /**
   * Last year to show. Mirrors the growth chart's curtain so the table can't
   * reveal the final balance before the student has played or scrubbed to it.
   * Null shows every row.
   */
  readonly maxYear = input<number | null>(null);

  protected readonly rows = computed(() => {
    const limit = this.maxYear();
    const points = this.result().dataPoints;
    return limit === null ? points : points.filter((d) => d.year <= limit);
  });

  protected format = (n: number) => formatCurrency(Math.round(n));
}

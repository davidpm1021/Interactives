import { Component, input } from '@angular/core';
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

  protected format = (n: number) => formatCurrency(Math.round(n));
}

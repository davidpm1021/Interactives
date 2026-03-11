import { Component, input } from '@angular/core';
import { LoanSummary } from '../../models/amortization.models';
import { formatCurrency } from '../../utils/formatters';

@Component({
  selector: 'app-summary-bar',
  standalone: true,
  templateUrl: './summary-bar.html',
  styleUrl: './summary-bar.scss',
})
export class SummaryBar {
  readonly summary = input.required<LoanSummary>();

  protected format(value: number): string {
    return formatCurrency(value);
  }
}

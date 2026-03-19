import { Component, input, output } from '@angular/core';
import { Payment } from '../../models/amortization.models';
import { formatCurrency } from '../../utils/formatters';

@Component({
  selector: 'app-amortization-table',
  standalone: true,
  templateUrl: './amortization-table.html',
  styleUrl: './amortization-table.scss',
})
export class AmortizationTable {
  readonly visibleRows = input.required<Payment[]>();
  readonly hasMoreRows = input(false);
  readonly fullSchedule = input.required<Payment[]>();

  readonly loadMore = output<void>();

  protected format(value: number): string {
    return formatCurrency(value);
  }

  protected formatExtra(value: number | undefined): string {
    return formatCurrency(value ?? 0);
  }

  protected onLoadMore(): void {
    this.loadMore.emit();
  }

  protected exportCsv(): void {
    const schedule = this.fullSchedule();
    const headers = [
      'Payment #',
      'Payment Amount',
      'Principal',
      'Interest',
      'Extra Payment',
      'Total Payment',
      'Remaining Balance',
    ];

    const rows = schedule.map((p) =>
      [
        p.paymentNumber,
        p.paymentAmount.toFixed(2),
        p.principal.toFixed(2),
        p.interest.toFixed(2),
        (p.extraPayment ?? 0).toFixed(2),
        p.totalPayment.toFixed(2),
        p.remainingBalance.toFixed(2),
      ].join(','),
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amortization_schedule_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

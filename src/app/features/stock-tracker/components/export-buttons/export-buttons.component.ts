import { Component, input, inject, signal } from '@angular/core';
import { StockPick, StockReport } from '../../models/stock-tracker.models';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-export-buttons',
  standalone: true,
  template: `
    <div class="export-buttons">
      <button class="ngpf-btn ngpf-btn-secondary export-buttons__btn"
              aria-label="Print full report as PDF"
              (click)="onPrint()">
        <span aria-hidden="true">&#x1F5A8;</span> Print / PDF
      </button>
      <button class="ngpf-btn ngpf-btn-secondary export-buttons__btn"
              aria-label="Copy written responses to clipboard"
              (click)="onCopy()">
        @if (copied()) {
          <span aria-hidden="true">&#10003;</span> Copied!
        } @else {
          <span aria-hidden="true">&#x1F4CB;</span> Copy Text
        }
      </button>
    </div>
  `,
  styles: [`
    .export-buttons {
      display: flex;
      gap: var(--ngpf-spacing-sm);
      flex-wrap: wrap;
      justify-content: center;

      &__btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.85rem;
      }
    }
  `],
})
export class ExportButtonsComponent {
  readonly report = input.required<StockReport>();
  readonly picks = input.required<StockPick[]>();

  protected readonly copied = signal(false);

  private readonly exportService = inject(ExportService);

  protected onPrint(): void {
    this.exportService.printReport();
  }

  protected async onCopy(): Promise<void> {
    const success = await this.exportService.copyReportText(this.report(), this.picks());
    if (success) {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }
}

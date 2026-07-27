import { Component, input, inject, viewChild, ElementRef } from '@angular/core';
import { StockPick } from '../../models/stock-tracker.models';
import { formatCurrency, formatPercent, formatDate, STOCK_COLORS } from '../../services/format.utils';
import { ExportService } from '../../services/export.service';
import { DownloadButtonComponent } from '../download-button/download-button.component';
import { REFRESHED_AT_DISPLAY } from '../../data/stock-prices.generated';

@Component({
  selector: 'app-roi-summary-table',
  standalone: true,
  imports: [DownloadButtonComponent],
  templateUrl: './roi-summary-table.component.html',
  styleUrl: './roi-summary-table.component.scss',
})
export class RoiSummaryTableComponent {
  readonly picks = input.required<StockPick[]>();

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatPercent = formatPercent;
  protected readonly formatDate = formatDate;
  protected readonly STOCK_COLORS = STOCK_COLORS;
  protected readonly refreshedAt = REFRESHED_AT_DISPLAY;

  private readonly exportService = inject(ExportService);
  private readonly tableRef = viewChild<ElementRef<HTMLElement>>('tableEl');

  protected async onDownload(): Promise<void> {
    const el = this.tableRef()?.nativeElement;
    if (el) {
      await this.exportService.downloadTableAsImage(el, 'roi-summary-table.png');
    }
  }
}

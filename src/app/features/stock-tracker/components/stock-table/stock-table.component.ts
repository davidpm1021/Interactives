import { Component, input, inject, viewChild, ElementRef } from '@angular/core';
import { StockPick } from '../../models/stock-tracker.models';
import { formatCurrency, formatPercent, formatDate, STOCK_COLORS } from '../../services/format.utils';
import { ExportService } from '../../services/export.service';
import { DownloadButtonComponent } from '../download-button/download-button.component';

@Component({
  selector: 'app-stock-table',
  standalone: true,
  imports: [DownloadButtonComponent],
  templateUrl: './stock-table.component.html',
  styleUrl: './stock-table.component.scss',
})
export class StockTableComponent {
  readonly pick = input.required<StockPick>();
  readonly colorIndex = input(0);

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatPercent = formatPercent;
  protected readonly formatDate = formatDate;
  protected readonly STOCK_COLORS = STOCK_COLORS;

  private readonly exportService = inject(ExportService);
  private readonly tableRef = viewChild<ElementRef<HTMLElement>>('tableEl');

  protected async onDownload(): Promise<void> {
    const el = this.tableRef()?.nativeElement;
    if (el) {
      await this.exportService.downloadTableAsImage(el, `annual-prices-${this.pick().ticker}.png`);
    }
  }
}

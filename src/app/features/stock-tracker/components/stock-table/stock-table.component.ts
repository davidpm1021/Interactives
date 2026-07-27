import { Component, computed, input, inject, signal, viewChild, ElementRef } from '@angular/core';
import { StockPick } from '../../models/stock-tracker.models';
import { formatCurrency, formatPercent, formatDate, STOCK_COLORS } from '../../services/format.utils';
import { ExportService } from '../../services/export.service';
import { DownloadButtonComponent } from '../download-button/download-button.component';

/**
 * Row cap for the annual-price table. A student born ~2010 has ~15 years of
 * history, which fits comfortably. Anything longer than this (older birth
 * years, teacher-testing) collapses to the most-recent rows with an expand
 * toggle so the page doesn't drown in a 40-row table.
 */
const DEFAULT_ROW_CAP = 15;

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

  protected readonly expanded = signal(false);

  /** True when annualData is short enough to render everything and no toggle is needed. */
  protected readonly fitsWithoutCap = computed(
    () => this.pick().annualData.length <= DEFAULT_ROW_CAP,
  );

  /** Number of rows hidden between the age-10 anchor row and the visible tail. */
  protected readonly hiddenRowCount = computed(() => {
    if (this.expanded() || this.fitsWithoutCap()) return 0;
    // Anchor row + last (DEFAULT_ROW_CAP - 1) rows visible; everything between is hidden.
    return this.pick().annualData.length - DEFAULT_ROW_CAP;
  });

  /**
   * Rows to actually render. When collapsed, we keep the very first row (age 10
   * anchor / starting price) so students never lose the reference point, and
   * show the most recent DEFAULT_ROW_CAP - 1 rows, with a "hidden years" marker
   * standing in between (rendered via the hiddenRowCount signal in the template).
   */
  protected readonly visibleRows = computed(() => {
    const rows = this.pick().annualData;
    if (this.expanded() || this.fitsWithoutCap()) return rows;
    return [rows[0], ...rows.slice(-(DEFAULT_ROW_CAP - 1))];
  });

  protected toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }

  private readonly exportService = inject(ExportService);
  private readonly tableRef = viewChild<ElementRef<HTMLElement>>('tableEl');

  protected async onDownload(): Promise<void> {
    const el = this.tableRef()?.nativeElement;
    if (el) {
      await this.exportService.downloadTableAsImage(el, `annual-prices-${this.pick().ticker}.png`);
    }
  }
}

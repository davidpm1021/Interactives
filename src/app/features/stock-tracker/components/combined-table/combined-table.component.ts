import { Component, input, inject, viewChild, ElementRef, computed } from '@angular/core';
import { StockPick } from '../../models/stock-tracker.models';
import { formatCurrency, STOCK_COLORS } from '../../services/format.utils';
import { ExportService } from '../../services/export.service';
import { DownloadButtonComponent } from '../download-button/download-button.component';

interface CombinedRow {
  year: number;
  age: number;
  values: (number | null)[];
}

@Component({
  selector: 'app-combined-table',
  standalone: true,
  imports: [DownloadButtonComponent],
  templateUrl: './combined-table.component.html',
  styleUrl: './combined-table.component.scss',
})
export class CombinedTableComponent {
  readonly picks = input.required<StockPick[]>();

  protected readonly formatCurrency = formatCurrency;
  protected readonly STOCK_COLORS = STOCK_COLORS;

  private readonly exportService = inject(ExportService);
  private readonly tableRef = viewChild<ElementRef<HTMLElement>>('tableEl');

  protected readonly rows = computed<CombinedRow[]>(() => {
    const picks = this.picks();
    if (picks.length === 0) return [];

    // Collect all years across all picks
    const yearSet = new Set<number>();
    for (const pick of picks) {
      for (const d of pick.annualData) {
        yearSet.add(d.year);
      }
    }

    const years = [...yearSet].sort((a, b) => a - b);
    return years.map(year => {
      const values = picks.map(pick => {
        const point = pick.annualData.find(d => d.year === year);
        return point ? point.valueOf100Shares : null;
      });
      const firstPick = picks[0]?.annualData.find(d => d.year === year);
      return { year, age: firstPick?.age ?? 0, values };
    });
  });

  protected async onDownload(): Promise<void> {
    const el = this.tableRef()?.nativeElement;
    if (el) {
      await this.exportService.downloadTableAsImage(el, 'stock-comparison-table.png');
    }
  }
}

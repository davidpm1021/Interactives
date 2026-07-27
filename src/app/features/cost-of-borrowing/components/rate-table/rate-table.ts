import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RateSeries } from '../../models/rates.models';

interface YearRow {
  year: number;
  values: (number | null)[];
}

// Kept in sync with SERIES_COLORS in trend-chart so the table column swatch
// matches the chart line for the same product.
const SERIES_COLORS: Record<string, string> = {
  'credit-card': '#c62828',
  'personal-loan': '#e28f10',
  'auto-loan': '#1f78b4',
  'mortgage': '#33a02c',
};

// Trim the parenthetical qualifier ("(avg)", "(24mo)", …) so column headers
// fit inside a narrow data column without wrapping onto three lines.
function stripQualifier(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

@Component({
  selector: 'app-rate-table',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './rate-table.html',
  styleUrl: './rate-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RateTable {
  readonly series = input.required<RateSeries[]>();

  protected readonly rows = computed<YearRow[]>(() => {
    const s = this.series();
    const years = new Set<number>();
    for (const one of s) for (const h of one.history) years.add(h.year);
    const sortedYears = Array.from(years).sort((a, b) => a - b);
    return sortedYears.map((year) => ({
      year,
      values: s.map((one) => one.history.find((h) => h.year === year)?.value ?? null),
    }));
  });

  protected readonly latestYear = computed(() => {
    const rs = this.rows();
    return rs.length === 0 ? null : rs[rs.length - 1].year;
  });

  protected colorFor(id: string): string {
    return SERIES_COLORS[id] ?? '#666';
  }

  protected shortLabel(label: string): string {
    return stripQualifier(label);
  }
}

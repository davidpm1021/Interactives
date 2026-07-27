import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RateSeries } from '../../models/rates.models';

interface YearRow {
  year: number;
  values: (number | null)[];
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
}

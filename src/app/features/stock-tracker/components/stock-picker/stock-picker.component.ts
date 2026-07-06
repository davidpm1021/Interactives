import { Component, input, output, signal, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StockPick, TickerSearchResult } from '../../models/stock-tracker.models';
import { StockDataService } from '../../services/stock-data.service';
import { formatCurrency, formatDate } from '../../services/format.utils';

@Component({
  selector: 'app-stock-picker',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './stock-picker.component.html',
  styleUrl: './stock-picker.component.scss',
})
export class StockPickerComponent implements OnDestroy {
  readonly tenthBirthday = input.required<Date>();
  readonly index = input.required<number>();
  readonly existingTickers = input<string[]>([]);
  readonly existingPick = input<StockPick | null>(null);

  readonly pickSelected = output<StockPick>();
  readonly pickRemoved = output<string>();

  protected readonly query = signal('');
  protected readonly results = signal<TickerSearchResult[]>([]);
  protected readonly showDropdown = signal(false);
  protected readonly loading = signal(false);
  protected readonly validating = signal(false);
  protected readonly error = signal('');
  protected readonly confirmedPick = signal<StockPick | null>(null);

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;

  private readonly stockDataService = inject(StockDataService);
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  protected onQueryChange(value: string): void {
    this.query.set(value);
    this.error.set('');

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    if (value.trim().length < 1) {
      this.results.set([]);
      this.showDropdown.set(false);
      return;
    }

    this.debounceTimer = setTimeout(() => this.doSearch(value), 300);
  }

  protected onInputFocus(): void {
    if (this.results().length > 0) {
      this.showDropdown.set(true);
    }
  }

  protected onInputBlur(): void {
    // Delay to allow click on result
    setTimeout(() => this.showDropdown.set(false), 200);
  }

  protected async onSelectResult(result: TickerSearchResult): Promise<void> {
    this.showDropdown.set(false);
    this.query.set(`${result.shortname} (${result.symbol})`);
    this.results.set([]);

    // Check for duplicates
    if (this.existingTickers().includes(result.symbol)) {
      this.error.set(`You've already picked ${result.symbol}. Choose a different company.`);
      return;
    }

    // Validate and get price
    this.validating.set(true);
    this.error.set('');

    try {
      const priceResult = await this.stockDataService.getPriceOnDate(result.symbol, this.tenthBirthday());

      const pick: StockPick = {
        companyName: priceResult.companyName,
        ticker: priceResult.ticker,
        priceOnBirthday: priceResult.adjClose,
        dateUsed: priceResult.dateUsed,
        sharesOwned: 100,
        annualData: [],
        currentPrice: 0,
        currentValue: 0,
        roi: 0,
        totalReturn: 0,
      };

      this.confirmedPick.set(pick);
      this.pickSelected.emit(pick);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to look up this stock.');
    } finally {
      this.validating.set(false);
    }
  }

  protected onRemove(): void {
    const pick = this.confirmedPick() || this.existingPick();
    if (pick) {
      this.pickRemoved.emit(pick.ticker);
    }
    this.confirmedPick.set(null);
    this.query.set('');
    this.error.set('');
  }

  protected get displayPick(): StockPick | null {
    return this.confirmedPick() || this.existingPick();
  }

  private async doSearch(query: string): Promise<void> {
    this.loading.set(true);
    try {
      const results = await this.stockDataService.searchTickers(query);
      const taken = new Set(this.existingTickers());
      const filtered = results.filter((r) => !taken.has(r.symbol)).slice(0, 6);
      this.results.set(filtered);
      this.showDropdown.set(filtered.length > 0);
    } catch {
      this.results.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}

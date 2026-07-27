import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CURATED_SUGGESTIONS,
  CuratedSuggestion,
  SECTORS,
  Sector,
} from '../../data/curated-suggestions';
import { MOCK_STOCKS } from '../../data/stock-prices.generated';

const CHIP_COUNT = 8;

@Component({
  selector: 'app-suggestion-chips',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './suggestion-chips.component.html',
  styleUrl: './suggestion-chips.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestionChipsComponent {
  /** Student's 10th-birthday year. Chips are filtered to companies with price data for that year. */
  readonly tenthBirthdayYear = input.required<number>();
  /** Tickers already picked — excluded from suggestions so the same chip doesn't appear twice. */
  readonly existingTickers = input<string[]>([]);

  /** Emitted when the student clicks a chip. Parent runs its normal pick-added flow. */
  readonly pickSelected = output<string>();

  protected readonly sectors = SECTORS;
  protected readonly selectedSector = signal<Sector | 'All'>('All');
  /** Bump to force a re-shuffle. Signal-based so it re-runs the computed. */
  protected readonly shuffleToken = signal(0);

  /** Suggestions that actually have data for the student's 10th-birthday year and aren't already picked. */
  private readonly eligible = computed<CuratedSuggestion[]>(() => {
    const year = this.tenthBirthdayYear();
    const taken = new Set(this.existingTickers());
    return CURATED_SUGGESTIONS.filter((s) => {
      if (taken.has(s.ticker)) return false;
      const stock = MOCK_STOCKS.find((m) => m.symbol === s.ticker);
      if (!stock) return false;
      return stock.priceHistory[year] !== undefined;
    });
  });

  /** Shuffled sample of up to CHIP_COUNT chips, filtered by the sector select. */
  protected readonly chips = computed<CuratedSuggestion[]>(() => {
    this.shuffleToken(); // re-run on shuffle
    const sector = this.selectedSector();
    const pool =
      sector === 'All'
        ? this.eligible()
        : this.eligible().filter((s) => s.sector === sector);
    return sampleN(pool, CHIP_COUNT);
  });

  /** Convenience for the parent — hide the strip when nothing useful is left to suggest. */
  protected readonly hasChips = computed(() => this.chips().length > 0);

  protected onShuffle(): void {
    this.shuffleToken.update((n) => n + 1);
  }

  protected onSectorChange(next: Sector | 'All'): void {
    this.selectedSector.set(next);
  }

  protected onChipClick(ticker: string): void {
    this.pickSelected.emit(ticker);
  }
}

/** Fisher-Yates shuffle, return first n. Non-mutating on the input array. */
function sampleN<T>(items: readonly T[], n: number): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

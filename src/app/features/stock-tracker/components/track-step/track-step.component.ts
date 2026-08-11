import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { StockTableComponent } from '../stock-table/stock-table.component';
import { ReflectionFormComponent, ReflectionKey } from '../reflection-form/reflection-form.component';
import { StockTrackerStateService } from '../../services/stock-tracker-state.service';
import { StockDataService } from '../../services/stock-data.service';
import { StockReport } from '../../models/stock-tracker.models';
import { formatPercent, STOCK_COLORS } from '../../services/format.utils';

@Component({
  selector: 'app-track-step',
  standalone: true,
  imports: [StockTableComponent, ReflectionFormComponent],
  templateUrl: './track-step.component.html',
  styleUrl: './track-step.component.scss',
})
export class TrackStepComponent implements OnInit {
  protected readonly state = inject(StockTrackerStateService);
  private readonly stockDataService = inject(StockDataService);

  protected readonly bestPerformerFields: ReflectionKey[] = ['bestPerformerAnalysis'];

  protected onReportChange(partial: Partial<StockReport>): void {
    this.state.updateReport(partial);
  }

  protected readonly loadingTickers = signal<Set<string>>(new Set());
  protected readonly failedTickers = signal<Map<string, string>>(new Map());
  protected readonly allLoaded = signal(false);

  protected readonly STOCK_COLORS = STOCK_COLORS;
  protected readonly formatPercent = formatPercent;

  /** The student's guess for the best-performing ticker. Null = unanswered. */
  protected readonly bestGuess = signal<string | null>(null);

  /** The ticker with the highest ROI once all data is loaded. */
  protected readonly actualBest = computed(() => {
    const picks = this.state.picks();
    if (picks.length === 0 || !this.state.allDataLoaded()) return null;
    return picks.reduce((a, b) => (b.roi > a.roi ? b : a));
  });

  protected readonly guessIsCorrect = computed(() => {
    const guess = this.bestGuess();
    const best = this.actualBest();
    return guess !== null && best !== null && guess === best.ticker;
  });

  protected onGuess(ticker: string): void {
    this.bestGuess.set(ticker);
  }

  protected resetGuess(): void {
    this.bestGuess.set(null);
  }

  ngOnInit(): void {
    // Auto-fetch if data not already loaded
    const picks = this.state.picks();
    const needsFetch = picks.some(p => p.annualData.length === 0);
    if (needsFetch) {
      this.fetchAllData();
    } else {
      this.allLoaded.set(true);
    }
  }

  protected async fetchAllData(): Promise<void> {
    const profile = this.state.profile();
    if (!profile) return;

    const picks = this.state.picks();
    const loading = new Set<string>();
    const failed = new Map<string, string>();

    for (const pick of picks) {
      if (pick.annualData.length > 0) continue;
      loading.add(pick.ticker);
    }
    this.loadingTickers.set(new Set(loading));
    this.failedTickers.set(new Map());

    const fetchPromises = picks
      .filter(p => p.annualData.length === 0)
      .map(async (pick) => {
        try {
          const result = await this.stockDataService.getAnnualBirthdayPrices(
            pick.ticker,
            profile.tenthBirthday.getMonth(),
            profile.tenthBirthday.getDate(),
            profile.tenthBirthday.getFullYear(),
            profile.birthday.getFullYear(),
          );

          this.state.updatePickData(pick.ticker, result.annualData, result.currentPrice);

          this.loadingTickers.update(set => {
            const next = new Set(set);
            next.delete(pick.ticker);
            return next;
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load data';
          failed.set(pick.ticker, message);

          this.loadingTickers.update(set => {
            const next = new Set(set);
            next.delete(pick.ticker);
            return next;
          });
          this.failedTickers.update(map => {
            const next = new Map(map);
            next.set(pick.ticker, message);
            return next;
          });
        }
      });

    await Promise.all(fetchPromises);
    this.allLoaded.set(true);
  }

  protected async retryTicker(ticker: string): Promise<void> {
    this.failedTickers.update(map => {
      const next = new Map(map);
      next.delete(ticker);
      return next;
    });
    this.loadingTickers.update(set => {
      const next = new Set(set);
      next.add(ticker);
      return next;
    });

    const profile = this.state.profile()!;
    const pick = this.state.picks().find(p => p.ticker === ticker);
    if (!pick) return;

    try {
      const result = await this.stockDataService.getAnnualBirthdayPrices(
        ticker,
        profile.tenthBirthday.getMonth(),
        profile.tenthBirthday.getDate(),
        profile.tenthBirthday.getFullYear(),
        profile.birthday.getFullYear(),
      );
      this.state.updatePickData(ticker, result.annualData, result.currentPrice);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      this.failedTickers.update(map => {
        const next = new Map(map);
        next.set(ticker, message);
        return next;
      });
    } finally {
      this.loadingTickers.update(set => {
        const next = new Set(set);
        next.delete(ticker);
        return next;
      });
    }
  }

  protected onAdvance(): void {
    this.state.advanceStep();
  }
}

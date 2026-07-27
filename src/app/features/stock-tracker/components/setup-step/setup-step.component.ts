import { Component, inject, computed } from '@angular/core';
import { BirthdayInputComponent } from '../birthday-input/birthday-input.component';
import { StockPickerComponent } from '../stock-picker/stock-picker.component';
import { SuggestionChipsComponent } from '../suggestion-chips/suggestion-chips.component';
import { StockTrackerStateService } from '../../services/stock-tracker-state.service';
import { StockDataService } from '../../services/stock-data.service';
import { StockPick, StudentProfile } from '../../models/stock-tracker.models';
import { REFRESHED_AT_DISPLAY } from '../../services/mock-data';

@Component({
  selector: 'app-setup-step',
  standalone: true,
  imports: [BirthdayInputComponent, StockPickerComponent, SuggestionChipsComponent],
  templateUrl: './setup-step.component.html',
  styleUrl: './setup-step.component.scss',
})
export class SetupStepComponent {
  protected readonly state = inject(StockTrackerStateService);
  private readonly stockDataService = inject(StockDataService);
  protected readonly refreshedAt = REFRESHED_AT_DISPLAY;

  protected readonly pickerSlots = computed(() => {
    const picks = this.state.picks();
    const slots: (StockPick | null)[] = [];
    for (let i = 0; i < 5; i++) {
      slots.push(picks[i] || null);
    }
    return slots;
  });

  protected readonly existingTickers = computed(() =>
    this.state.picks().map(p => p.ticker)
  );

  protected readonly tenthBirthdayYear = computed(() => {
    const profile = this.state.profile();
    return profile ? profile.tenthBirthday.getFullYear() : 0;
  });

  protected onProfileSet(profile: StudentProfile): void {
    this.state.setProfile(profile);
  }

  protected onPickSelected(pick: StockPick): void {
    this.state.addPick(pick);
  }

  protected onPickRemoved(ticker: string): void {
    this.state.removePick(ticker);
  }

  /**
   * A student clicked one of the "Not sure where to start?" chips. Look up
   * the price for the ticker and add it as a pick — same shape stock-picker
   * uses when the student picks from search results.
   */
  protected async onChipPick(ticker: string): Promise<void> {
    const profile = this.state.profile();
    if (!profile) return;
    if (this.existingTickers().includes(ticker)) return;
    try {
      const priceResult = await this.stockDataService.getPriceOnDate(ticker, profile.tenthBirthday);
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
      this.state.addPick(pick);
    } catch {
      // Chip failed to resolve (e.g. no price for the target year). The chip
      // strip already filters against MOCK_STOCKS + birthday year, so this
      // is a rare fallback path; silently ignore rather than showing a
      // top-level error.
    }
  }

  protected onAdvance(): void {
    this.state.advanceStep();
  }
}

import { Component, inject, computed } from '@angular/core';
import { BirthdayInputComponent } from '../birthday-input/birthday-input.component';
import { StockPickerComponent } from '../stock-picker/stock-picker.component';
import { StockTrackerStateService } from '../../services/stock-tracker-state.service';
import { StockPick, StudentProfile } from '../../models/stock-tracker.models';
import { REFRESHED_AT_DISPLAY } from '../../services/mock-data';

@Component({
  selector: 'app-setup-step',
  standalone: true,
  imports: [BirthdayInputComponent, StockPickerComponent],
  templateUrl: './setup-step.component.html',
  styleUrl: './setup-step.component.scss',
})
export class SetupStepComponent {
  protected readonly state = inject(StockTrackerStateService);
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

  protected onProfileSet(profile: StudentProfile): void {
    this.state.setProfile(profile);
  }

  protected onPickSelected(pick: StockPick): void {
    this.state.addPick(pick);
  }

  protected onPickRemoved(ticker: string): void {
    this.state.removePick(ticker);
  }

  protected onAdvance(): void {
    this.state.advanceStep();
  }
}

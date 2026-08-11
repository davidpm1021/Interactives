import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RetirementProjection } from '../../models/retirement.models';
import { StatCounterComponent } from '../shared/stat-counter/stat-counter.component';
import { formatCurrency } from '../../utils/formatters';

@Component({
  selector: 'app-results-panel',
  standalone: true,
  imports: [StatCounterComponent],
  templateUrl: './results-panel.html',
  styleUrl: './results-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsPanel {
  readonly projection = input.required<RetirementProjection>();
  readonly monthlyContribution = input.required<number>();

  protected readonly hasGap = computed(() => this.projection().gapAtRetirement > 0);
  protected readonly saveMore = computed(
    () => this.projection().requiredMonthlyToHitGoal > this.monthlyContribution(),
  );

  /**
   * Whether the student has asked for the required-contribution figure.
   *
   * Stays revealed once asked for, and keeps updating live: the point is that
   * they choose to see it, not that it's rationed. Deliberately not reset when
   * inputs change, which would make it feel like a glitch.
   */
  protected readonly revealed = signal(false);

  protected reveal(): void {
    this.revealed.set(true);
  }

  protected readonly formatCurrency = formatCurrency;
}

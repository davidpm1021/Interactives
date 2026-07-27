import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
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

  protected readonly formatCurrency = formatCurrency;
}

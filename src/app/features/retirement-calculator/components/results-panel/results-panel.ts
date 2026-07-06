import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RetirementProjection } from '../../models/retirement.models';
import { StatCounterComponent } from '../shared/stat-counter/stat-counter.component';

@Component({
  selector: 'app-results-panel',
  standalone: true,
  imports: [DecimalPipe, StatCounterComponent],
  templateUrl: './results-panel.html',
  styleUrl: './results-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsPanel {
  readonly projection = input.required<RetirementProjection>();
  readonly monthlyContribution = input.required<number>();

  protected readonly hasGap = computed(() => this.projection().gapAtRetirement > 0);
  protected readonly saveMore = computed(() => this.projection().requiredMonthlyToHitGoal > this.monthlyContribution());
  protected readonly gapPercent = computed(() => {
    const t = this.projection().targetNestEgg;
    return t > 0 ? Math.round((this.projection().gapAtRetirement / t) * 100) : 0;
  });
}

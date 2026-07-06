import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FinancialProfile, RevealStage } from '../../models/net-worth.models';
import { computeBreakdown } from '../../services/net-worth.calc';
import { StatCounterComponent } from '../shared/stat-counter/stat-counter.component';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [DecimalPipe, StatCounterComponent],
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileCard {
  readonly profile = input.required<FinancialProfile>();
  /** Which stages should render. Empty set = only header + salary + cash. */
  readonly revealedStages = input.required<Set<RevealStage>>();
  /** Force showing only salary and cash (predict phase). */
  readonly teaserMode = input(false);

  protected readonly breakdown = computed(() => computeBreakdown(this.profile()));

  protected shouldShow(stage: RevealStage): boolean {
    if (this.teaserMode()) return stage === 'salary-cash';
    return this.revealedStages().has(stage);
  }

  protected readonly netWorthColor = computed(() =>
    this.breakdown().netWorth >= 0 ? 'var(--ngpf-success, #2e7d32)' : 'var(--ngpf-error, #c62828)',
  );
}

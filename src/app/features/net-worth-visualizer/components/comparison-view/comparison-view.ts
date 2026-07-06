import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { FinancialProfile, PredictionChoice, REVEAL_ORDER, RevealStage } from '../../models/net-worth.models';
import { NetWorthStateService } from '../../services/state.service';
import { computeBreakdown } from '../../services/net-worth.calc';
import { ProfileCard } from '../profile-card/profile-card';

const STAGE_LABELS: Record<RevealStage, string> = {
  'salary-cash': 'Salary and cash',
  'assets': 'Assets',
  'debts': 'Debts',
  'net-worth': 'Net worth',
};

@Component({
  selector: 'app-comparison-view',
  standalone: true,
  imports: [ProfileCard],
  templateUrl: './comparison-view.html',
  styleUrl: './comparison-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparisonView {
  readonly profileA = input.required<FinancialProfile>();
  readonly profileB = input.required<FinancialProfile>();
  readonly prediction = input.required<PredictionChoice | null>();
  readonly finish = output<void>();

  protected readonly state = inject(NetWorthStateService);

  protected readonly revealedStages = computed(() => this.state.revealedStages());
  protected readonly revealComplete = computed(() => this.state.revealComplete());

  protected readonly stageLabels = STAGE_LABELS;
  protected readonly revealOrder = REVEAL_ORDER;

  /** The most-recently added stage, used for the sr-only live region. */
  protected readonly latestRevealedLabel = computed(() => {
    const stages = this.revealedStages();
    if (stages.size === 0) return '';
    for (let i = REVEAL_ORDER.length - 1; i >= 0; i--) {
      const stage = REVEAL_ORDER[i];
      if (stages.has(stage)) return `${STAGE_LABELS[stage]} revealed`;
    }
    return '';
  });

  /** Show the "your prediction vs reality" summary text after the final stage. */
  protected readonly predictionSummary = computed(() => {
    if (!this.revealComplete()) return null;
    const a = computeBreakdown(this.profileA()).netWorth;
    const b = computeBreakdown(this.profileB()).netWorth;
    const higher = a > b ? 'a' : b > a ? 'b' : 'same';
    const higherName = higher === 'a' ? this.profileA().name : higher === 'b' ? this.profileB().name : 'They are roughly tied';
    const guessedName = this.prediction() === 'a' ? this.profileA().name
      : this.prediction() === 'b' ? this.profileB().name
      : 'about the same';
    return {
      correct: this.prediction() === higher,
      higher,
      higherName,
      guessedName,
    };
  });

  constructor() {
    // Auto-advance through reveal stages. Each effect run schedules its own
    // timeout; the cleanup cancels only that run's timeout.
    effect((onCleanup) => {
      const stages = this.revealedStages();
      if (stages.size >= REVEAL_ORDER.length) return;
      const id = setTimeout(() => this.state.advanceReveal(), 700);
      onCleanup(() => clearTimeout(id));
    });
  }

  protected onContinue(): void {
    this.finish.emit();
  }
}

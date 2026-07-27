import { Component, computed, inject } from '@angular/core';
import { ChallengeStateService } from '../../services/challenge-state.service';
import { CompoundInterestService } from '../../services/compound-interest.service';
import { CHALLENGE_CONTENT, SUMMARY_TAKEAWAYS } from '../../data/challenge-content';
import { formatCurrency } from '../../utils/formatters';

interface RecapRow {
  challenge: number;
  title: string;
  guess: string;
  reality: string;
}

@Component({
  selector: 'app-final-summary',
  standalone: true,
  imports: [],
  templateUrl: './final-summary.component.html',
  styleUrl: './final-summary.component.scss',
})
export class FinalSummaryComponent {
  private readonly stateService = inject(ChallengeStateService);
  private readonly service = inject(CompoundInterestService);

  protected readonly takeaways = SUMMARY_TAKEAWAYS;

  protected readonly recapRows = computed<RecapRow[]>(() => {
    const preds = this.stateService.predictions();
    const rows: RecapRow[] = [];
    const fmt = (n: number) => formatCurrency(Math.round(n));
    const optionLabel = (key: 'challenge2' | 'challenge4', id: string | null | undefined) => {
      if (!id) return 'N/A';
      const match = CHALLENGE_CONTENT[key].options?.find(o => o.id === id);
      return match ? `${id}: ${match.label}` : `Option ${id}`;
    };

    // Challenge 1
    const c1Actual = this.service.calculateChallenge1().summary.finalBalance;
    rows.push({
      challenge: 1,
      title: CHALLENGE_CONTENT['challenge1'].title,
      guess: preds.challenge1Year40 != null
        ? fmt(preds.challenge1Year40)
        : 'N/A',
      reality: fmt(c1Actual),
    });

    // Challenge 2
    const c2Low = this.service.calculateChallenge2Low().summary.finalBalance;
    const c2High = this.service.calculateChallenge2High().summary.finalBalance;
    const ratio = c2High / c2Low;
    rows.push({
      challenge: 2,
      title: CHALLENGE_CONTENT['challenge2'].title,
      guess: optionLabel('challenge2', preds.challenge2RateGuess),
      reality: `${ratio.toFixed(1)}x (${fmt(c2High)} vs ${fmt(c2Low)})`,
    });

    // Challenge 3
    const c3Actual = this.service.calculateChallenge3().summary.finalBalance;
    rows.push({
      challenge: 3,
      title: CHALLENGE_CONTENT['challenge3'].title,
      guess: preds.challenge3ContributionGuess != null
        ? fmt(preds.challenge3ContributionGuess)
        : 'N/A',
      reality: fmt(c3Actual),
    });

    // Challenge 4
    const c4Early = this.service.calculateChallenge4Early().summary.finalBalance;
    const c4Late = this.service.calculateChallenge4Late().summary.finalBalance;
    const gap = c4Early - c4Late;
    rows.push({
      challenge: 4,
      title: CHALLENGE_CONTENT['challenge4'].title,
      guess: optionLabel('challenge4', preds.challenge4WaitGuess),
      reality: `${fmt(gap)} more by starting early`,
    });

    return rows;
  });

  protected onPrint(): void {
    window.print();
  }
}

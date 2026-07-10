import { Component, computed, input } from '@angular/core';
import { ChallengeId } from '../../models/compound-interest.models';

@Component({
  selector: 'app-challenge-progress',
  standalone: true,
  imports: [],
  templateUrl: './challenge-progress.component.html',
  styleUrl: './challenge-progress.component.scss',
})
export class ChallengeProgressComponent {
  readonly currentChallenge = input.required<ChallengeId>();
  readonly completedChallenges = input.required<Set<ChallengeId>>();

  protected readonly steps: { id: ChallengeId; label: string }[] = [
    { id: 1, label: 'The Guess' },
    { id: 2, label: 'Rate' },
    { id: 3, label: 'Adding' },
    { id: 4, label: 'Waiting' },
    { id: 5, label: 'Sandbox' },
  ];

  protected readonly progressPercent = computed(() => {
    const completed = this.completedChallenges().size;
    return Math.round((completed / 5) * 100);
  });

  protected isCompleted(id: ChallengeId): boolean {
    return this.completedChallenges().has(id);
  }

  protected isCurrent(id: ChallengeId): boolean {
    return this.currentChallenge() === id;
  }
}

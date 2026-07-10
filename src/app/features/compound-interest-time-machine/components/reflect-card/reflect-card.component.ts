import { Component, input, output } from '@angular/core';
import { ChallengeId } from '../../models/compound-interest.models';

@Component({
  selector: 'app-reflect-card',
  standalone: true,
  imports: [],
  templateUrl: './reflect-card.component.html',
  styleUrl: './reflect-card.component.scss',
})
export class ReflectCardComponent {
  readonly challengeId = input.required<ChallengeId>();
  readonly insightText = input.required<string>();
  readonly isLastChallenge = input(false);
  readonly nextChallenge = output<void>();

  protected onNext(): void {
    this.nextChallenge.emit();
  }
}

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
  readonly canGoBack = input(false);
  /** Optional open-ended prompt shown above a small textarea. */
  readonly reflectPrompt = input<string | null>(null);
  /** Prefill value when the student navigates back to this card. */
  readonly reflectionValue = input('');
  readonly nextChallenge = output<void>();
  readonly goBack = output<void>();
  readonly reflectionText = output<string>();

  protected onNext(): void {
    this.nextChallenge.emit();
  }

  protected onBack(): void {
    this.goBack.emit();
  }

  protected onReflectionInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.reflectionText.emit(el.value);
  }
}

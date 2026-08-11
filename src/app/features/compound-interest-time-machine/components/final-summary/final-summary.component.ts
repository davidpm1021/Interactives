import { Component, computed, inject, input, output } from '@angular/core';
import { ChallengeStateService } from '../../services/challenge-state.service';
import { CHALLENGE_CONTENT } from '../../data/challenge-content';
import { TakeawaysFillComponent } from '../takeaways-fill/takeaways-fill.component';
import { ReflectionFormComponent } from '../reflection-form/reflection-form.component';

interface ChallengeReflection {
  challenge: number;
  prompt: string;
  answer: string;
}

const REFLECTED_CHALLENGES = [
  'challenge1',
  'challenge2',
  'challenge3',
  'challenge4',
] as const;

@Component({
  selector: 'app-final-summary',
  standalone: true,
  imports: [TakeawaysFillComponent, ReflectionFormComponent],
  templateUrl: './final-summary.component.html',
  styleUrl: './final-summary.component.scss',
})
export class FinalSummaryComponent {
  readonly canGoBack = input(false);
  readonly goBack = output<void>();

  private readonly stateService = inject(ChallengeStateService);

  protected onBack(): void {
    this.goBack.emit();
  }

  /**
   * The reflect-card prompts the student answered during the flow, replayed
   * with their own answers.
   *
   * This replaced a Challenge / Your Guess / Reality recap table. Review:
   * "the actual values aren't super important, as much as the students'
   * experiences of going through the module. It also makes it seem like the
   * guesses were more of a 'try to get the right answer' question, than the
   * entry point to an exploratory activity."
   *
   * Unanswered prompts still render, as a blank line to write on after
   * printing, so the report is complete either way.
   */
  protected readonly challengeReflections = computed<ChallengeReflection[]>(() => {
    const saved = this.stateService.reflections();
    return REFLECTED_CHALLENGES.flatMap((key, i) => {
      const prompt = CHALLENGE_CONTENT[key].reflectPrompt;
      if (!prompt) return [];
      return [{ challenge: i + 1, prompt, answer: (saved[key] ?? '').trim() }];
    });
  });

  protected onPrint(): void {
    window.print();
  }
}

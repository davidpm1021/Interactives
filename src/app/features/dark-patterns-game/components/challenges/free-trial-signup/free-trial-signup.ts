import { Component, output, signal } from '@angular/core';
import { ChallengeOutcome } from '../../../models/challenge.model';

@Component({
  selector: 'app-free-trial-signup',
  standalone: true,
  templateUrl: './free-trial-signup.html',
  styleUrl: './free-trial-signup.scss',
})
export class FreeTrialSignup {
  readonly completed = output<ChallengeOutcome>();

  protected readonly emailQuestion = signal<'yes' | 'no' | null>(null);
  protected readonly noticedTerms = signal(false);

  protected onToggleTermsNotice(): void {
    this.noticedTerms.update((v) => !v);
  }

  protected onStartWatching(): void {
    const noticedAutoRenewal = this.noticedTerms();
    // "Yes" to "Would you like to NOT receive promotional emails" = opt OUT (correct)
    const answeredEmailCorrectly = this.emailQuestion() === 'yes';

    if (noticedAutoRenewal && answeredEmailCorrectly) {
      this.completed.emit('pass');
    } else if (noticedAutoRenewal || answeredEmailCorrectly) {
      this.completed.emit('partial-fail');
    } else {
      this.completed.emit('full-fail');
    }
  }
}

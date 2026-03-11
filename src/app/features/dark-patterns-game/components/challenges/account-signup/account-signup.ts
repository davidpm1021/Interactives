import { Component, output, signal } from '@angular/core';
import { ChallengeOutcome } from '../../../models/challenge.model';

@Component({
  selector: 'app-account-signup',
  standalone: true,
  templateUrl: './account-signup.html',
  styleUrl: './account-signup.scss',
})
export class AccountSignup {
  readonly completed = output<ChallengeOutcome>();

  protected readonly termsChecked = signal(true);
  protected readonly marketingChecked = signal(true);
  protected readonly sharingChecked = signal(true);

  protected onCreateAccount(): void {
    const marketingOn = this.marketingChecked();
    const sharingOn = this.sharingChecked();

    if (!marketingOn && !sharingOn) {
      this.completed.emit('pass');
    } else if (!marketingOn || !sharingOn) {
      this.completed.emit('partial-fail');
    } else {
      this.completed.emit('full-fail');
    }
  }
}

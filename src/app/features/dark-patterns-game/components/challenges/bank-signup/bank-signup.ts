import { Component, output, signal } from '@angular/core';
import { ChallengeOutcome } from '../../../models/challenge.model';

@Component({
  selector: 'app-bank-signup',
  standalone: true,
  templateUrl: './bank-signup.html',
  styleUrl: './bank-signup.scss',
})
export class BankSignup {
  readonly completed = output<ChallengeOutcome>();

  protected readonly identityShieldEnabled = signal(true);
  protected readonly clickedCreditCardAd = signal(false);

  protected onApplyCreditCard(): void {
    this.clickedCreditCardAd.set(true);
  }

  protected onSubmitApplication(): void {
    const shieldOn = this.identityShieldEnabled();
    const clickedAd = this.clickedCreditCardAd();

    if (!shieldOn && !clickedAd) {
      this.completed.emit('pass');
    } else if (!shieldOn || !clickedAd) {
      this.completed.emit('partial-fail');
    } else {
      this.completed.emit('full-fail');
    }
  }
}

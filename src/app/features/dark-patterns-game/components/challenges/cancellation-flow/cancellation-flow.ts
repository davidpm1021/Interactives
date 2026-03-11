import { Component, output, signal } from '@angular/core';
import { ChallengeOutcome } from '../../../models/challenge.model';

@Component({
  selector: 'app-cancellation-flow',
  standalone: true,
  templateUrl: './cancellation-flow.html',
  styleUrl: './cancellation-flow.scss',
})
export class CancellationFlow {
  readonly completed = output<ChallengeOutcome>();

  protected readonly step = signal(1);
  protected readonly cancelReason = signal('');
  protected readonly acceptedOffer = signal(false);

  protected onKeepSubscription(): void {
    this.completed.emit('full-fail');
  }

  protected onContinueCancel(): void {
    this.step.update((s) => s + 1);
  }

  protected onAcceptDiscount(): void {
    this.acceptedOffer.set(true);
    this.completed.emit('partial-fail');
  }

  protected onConfirmCancellation(): void {
    this.completed.emit('pass');
  }
}

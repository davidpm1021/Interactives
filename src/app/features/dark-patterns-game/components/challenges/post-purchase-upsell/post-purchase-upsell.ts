import { Component, output } from '@angular/core';
import { ChallengeOutcome } from '../../../models/challenge.model';

@Component({
  selector: 'app-post-purchase-upsell',
  standalone: true,
  templateUrl: './post-purchase-upsell.html',
  styleUrl: './post-purchase-upsell.scss',
})
export class PostPurchaseUpsell {
  readonly completed = output<ChallengeOutcome>();

  protected onStartTrial(): void {
    this.completed.emit('full-fail');
  }

  protected onDecline(): void {
    this.completed.emit('pass');
  }
}

import { Component, output } from '@angular/core';
import { ChallengeOutcome } from '../../../models/challenge.model';

@Component({
  selector: 'app-notification-popup',
  standalone: true,
  templateUrl: './notification-popup.html',
  styleUrl: './notification-popup.scss',
})
export class NotificationPopup {
  readonly completed = output<ChallengeOutcome>();

  protected onAccept(): void {
    this.completed.emit('full-fail');
  }

  protected onDecline(): void {
    this.completed.emit('pass');
  }
}

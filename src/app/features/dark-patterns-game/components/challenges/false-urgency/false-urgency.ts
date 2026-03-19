import { Component, output, signal, OnInit, OnDestroy } from '@angular/core';
import { ChallengeOutcome } from '../../../models/challenge.model';

@Component({
  selector: 'app-false-urgency',
  standalone: true,
  templateUrl: './false-urgency.html',
  styleUrl: './false-urgency.scss',
})
export class FalseUrgency implements OnInit, OnDestroy {
  readonly completed = output<ChallengeOutcome>();

  protected readonly countdown = signal('2:47:13');
  protected readonly viewers = signal(17);

  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private viewerInterval: ReturnType<typeof setInterval> | null = null;
  private totalSeconds = 2 * 3600 + 47 * 60 + 13;

  ngOnInit(): void {
    this.countdownInterval = setInterval(() => {
      this.totalSeconds--;
      if (this.totalSeconds <= 0) this.totalSeconds = 2 * 3600 + 47 * 60 + 13;
      const h = Math.floor(this.totalSeconds / 3600);
      const m = Math.floor((this.totalSeconds % 3600) / 60);
      const s = this.totalSeconds % 60;
      this.countdown.set(
        `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
      );
    }, 1000);

    this.viewerInterval = setInterval(() => {
      this.viewers.set(Math.floor(Math.random() * 12) + 12);
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.viewerInterval) clearInterval(this.viewerInterval);
  }

  protected onAddToCart(): void {
    this.completed.emit('pass');
  }

  protected onSaveForLater(): void {
    this.completed.emit('pass');
  }
}

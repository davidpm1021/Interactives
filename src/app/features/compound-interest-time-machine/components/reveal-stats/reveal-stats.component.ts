import { Component, input } from '@angular/core';
import { StatCounterComponent } from '../shared/stat-counter/stat-counter.component';

export interface RevealStat {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
}

@Component({
  selector: 'app-reveal-stats',
  standalone: true,
  imports: [StatCounterComponent],
  templateUrl: './reveal-stats.component.html',
  styleUrl: './reveal-stats.component.scss',
})
export class RevealStatsComponent {
  readonly guessValue = input<number | null>(null);
  readonly guessLabel = input('Your Guess');
  readonly actualValue = input.required<number>();
  readonly label = input('Final Balance');
  readonly additionalStats = input<RevealStat[]>([]);
}

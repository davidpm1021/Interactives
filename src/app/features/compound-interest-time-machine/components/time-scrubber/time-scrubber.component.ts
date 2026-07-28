import { Component, input, output, signal, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-time-scrubber',
  standalone: true,
  imports: [],
  templateUrl: './time-scrubber.component.html',
  styleUrl: './time-scrubber.component.scss',
})
export class TimeScrubberComponent implements OnDestroy {
  readonly maxYear = input.required<number>();
  readonly currentYear = input.required<number>();
  /** When set, the scrubber displays ages instead of raw year offsets. */
  readonly startAge = input<number | null>(null);
  readonly yearChange = output<number>();
  readonly playStateChange = output<boolean>();

  protected readonly isPlaying = signal(false);
  private animationId: number | null = null;
  private lastTimestamp = 0;
  private fractionalYear = 0;

  protected onSliderInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const year = parseInt(el.value, 10);
    this.yearChange.emit(year);
    this.fractionalYear = year;
  }

  protected onKeydown(event: KeyboardEvent): void {
    const current = this.currentYear();
    const max = this.maxYear();

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        this.yearChange.emit(Math.min(max, current + 1));
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        this.yearChange.emit(Math.max(0, current - 1));
        break;
      case 'PageUp':
        event.preventDefault();
        this.yearChange.emit(Math.min(max, current + 5));
        break;
      case 'PageDown':
        event.preventDefault();
        this.yearChange.emit(Math.max(0, current - 5));
        break;
      case ' ':
        event.preventDefault();
        this.togglePlay();
        break;
    }
  }

  protected togglePlay(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  /** Start auto-play from year 0. Called externally by parent. */
  startAutoPlay(): void {
    this.yearChange.emit(0);
    this.fractionalYear = 0;
    this.isPlaying.set(true);
    this.playStateChange.emit(true);
    this.lastTimestamp = 0;
    this.animationId = requestAnimationFrame((t) => this.tick(t));
  }

  private play(): void {
    if (this.currentYear() >= this.maxYear()) {
      // Already at end — stay there, don't reset
      return;
    }
    this.fractionalYear = this.currentYear();
    this.isPlaying.set(true);
    this.playStateChange.emit(true);
    this.lastTimestamp = 0;
    this.animationId = requestAnimationFrame((t) => this.tick(t));
  }

  pause(): void {
    this.isPlaying.set(false);
    this.playStateChange.emit(false);
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /** Adaptive speed: targets ~10-20s total playback regardless of time horizon */
  private get yearsPerSecond(): number {
    const max = this.maxYear();
    if (max <= 5) return 1.0;
    if (max <= 15) return 1.5;
    if (max <= 30) return 2.0;
    return 2.5;
  }

  private tick(timestamp: number): void {
    if (!this.isPlaying()) return;

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
    }

    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.fractionalYear += (delta / 1000) * this.yearsPerSecond;
    const year = Math.round(this.fractionalYear);

    if (year >= this.maxYear()) {
      this.yearChange.emit(this.maxYear());
      this.pause();
      return;
    }

    if (year !== this.currentYear()) {
      this.yearChange.emit(year);
    }

    this.animationId = requestAnimationFrame((t) => this.tick(t));
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isPlaying.set(false);
  }
}

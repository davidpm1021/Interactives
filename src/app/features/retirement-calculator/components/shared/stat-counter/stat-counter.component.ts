import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  Injector,
} from '@angular/core';

@Component({
  selector: 'app-stat-counter',
  standalone: true,
  imports: [],
  template: `
    <span
      class="stat-counter"
      [style.color]="'var(--counter-color, var(--ngpf-navy-blue))'"
      aria-live="polite"
    >
      {{ prefix() }}{{ displayValue() }}{{ suffix() }}
    </span>
  `,
  styles: `
    .stat-counter {
      font-family: var(--ngpf-font-heading);
      font-size: 1.6rem;
      font-weight: 700;
      display: inline-block;
    }
  `,
})
export class StatCounterComponent implements OnDestroy {
  readonly value = input.required<number>();
  readonly prefix = input('');
  readonly suffix = input('');
  readonly showSign = input(false);
  readonly duration = input(800);

  protected readonly displayValue = signal('0');

  private readonly injector = inject(Injector);
  private animationFrameId: number | null = null;
  private reducedMotion = false;

  constructor() {
    afterNextRender(
      () => {
        this.reducedMotion =
          typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      },
      { injector: this.injector },
    );

    effect(() => {
      const target = this.value();
      this.animateTo(target);
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private animateTo(target: number): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.reducedMotion) {
      this.displayValue.set(this.formatNumber(target));
      return;
    }

    const dur = this.duration();
    const start = performance.now();
    const startVal = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      const current = startVal + (target - startVal) * eased;

      this.displayValue.set(this.formatNumber(current));

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(tick);
      } else {
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private formatNumber(value: number): string {
    const sign = this.showSign() && value > 0 ? '+' : '';
    const absVal = Math.abs(value);
    const formatted = absVal >= 1000
      ? absVal.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : absVal.toFixed(absVal < 10 ? 2 : 0);
    return `${sign}${value < 0 ? '-' : ''}${formatted}`;
  }
}

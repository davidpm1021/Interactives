import { Component, input, computed, signal, effect, untracked, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SimulationResult, YearlyDataPoint } from '../../models/compound-interest.models';
import { formatCurrency, formatPercent } from '../../utils/formatters';

@Component({
  selector: 'app-summary-panel',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './summary-panel.component.html',
  styleUrl: './summary-panel.component.scss',
})
export class SummaryPanelComponent implements OnDestroy {
  readonly result = input.required<SimulationResult>();
  readonly selectedYear = input<number | null>(null);
  readonly comparisonResult = input<SimulationResult | null>(null);
  /**
   * When true, changes to the values tween over 300ms. When false, they snap
   * instantly. Sandbox turns this on only during auto-play so slider/scrub
   * updates don't leave the numbers chasing the target.
   */
  readonly animate = input(false);
  /**
   * When set, callouts and headings render "age N" instead of "year N".
   * The header year label uses (startAge + displayData.year).
   */
  readonly startAge = input<number | null>(null);
  /**
   * Copy for the comparison-delta callout. Sandbox passes the "wait 5 years"
   * phrasing; other consumers can override. Not used unless comparisonResult
   * is set.
   */
  readonly comparisonLabel = input('Starting earlier earned you');
  /**
   * Text after the dollar amount. Lives alongside comparisonLabel because the
   * sentence reads differently depending on framing: "Starting earlier earned
   * you $X more!" vs "Waiting 5 years cost you $X." A hardcoded " more."
   * suffix made the second phrasing say the opposite of what it means.
   */
  readonly comparisonSuffix = input(' more!');

  protected readonly displayData = computed(() => {
    const res = this.result();
    const year = this.selectedYear();
    const dp = year !== null
      ? res.dataPoints.find((d) => d.year === year) ?? this.lastPoint(res)
      : this.lastPoint(res);
    return {
      balance: dp.compoundBalance,
      contributions: dp.totalContributions,
      interestEarned: dp.totalInterestEarned,
      interestPercent: dp.compoundBalance > 0
        ? (dp.totalInterestEarned / dp.compoundBalance) * 100
        : 0,
      year: dp.year,
    };
  });

  // Animated values for smooth number transitions
  protected readonly animatedBalance = signal(0);
  protected readonly animatedContributions = signal(0);
  protected readonly animatedInterest = signal(0);
  protected readonly animatedInterestPercent = signal(0);

  private animationId: number | null = null;
  private readonly reducedMotion: boolean;

  protected readonly showDoublingCallout = computed(() => {
    const res = this.result();
    const year = this.selectedYear() ?? res.dataPoints[res.dataPoints.length - 1].year;
    return res.summary.doublingYear !== null && year >= res.summary.doublingYear;
  });

  protected readonly doublingYear = computed(() => this.result().summary.doublingYear);

  protected readonly comparisonDelta = computed(() => {
    const comp = this.comparisonResult();
    if (!comp) return null;
    const primary = this.result().summary.finalBalance;
    const secondary = comp.summary.finalBalance;
    return primary - secondary;
  });

  protected formatCurrency = (n: number) => formatCurrency(Math.round(n));
  protected formatPercent = formatPercent;

  constructor() {
    this.reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    effect(() => {
      const data = this.displayData();
      // untracked: animateToValues reads the four `animated*` signals to pick
      // up the tween's starting point, and its rAF tick writes those same
      // signals. A tracked read would make every animation frame re-run this
      // effect, cancelling and restarting the tween each frame so the 300ms
      // ease never completes. Only displayData should drive it.
      untracked(() =>
        this.animateToValues(
          data.balance,
          data.contributions,
          data.interestEarned,
          data.interestPercent,
        ),
      );
    });
  }

  private animateToValues(
    targetBalance: number,
    targetContributions: number,
    targetInterest: number,
    targetPercent: number,
  ): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.reducedMotion || !this.animate()) {
      this.animatedBalance.set(targetBalance);
      this.animatedContributions.set(targetContributions);
      this.animatedInterest.set(targetInterest);
      this.animatedInterestPercent.set(targetPercent);
      return;
    }

    const startBalance = this.animatedBalance();
    const startContributions = this.animatedContributions();
    const startInterest = this.animatedInterest();
    const startPercent = this.animatedInterestPercent();

    const duration = 300;
    let startTime: number | null = null;

    const tick = (timestamp: number): void => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);

      this.animatedBalance.set(startBalance + (targetBalance - startBalance) * eased);
      this.animatedContributions.set(startContributions + (targetContributions - startContributions) * eased);
      this.animatedInterest.set(startInterest + (targetInterest - startInterest) * eased);
      this.animatedInterestPercent.set(startPercent + (targetPercent - startPercent) * eased);

      if (progress < 1) {
        this.animationId = requestAnimationFrame(tick);
      } else {
        this.animationId = null;
      }
    };

    this.animationId = requestAnimationFrame(tick);
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private lastPoint(result: SimulationResult): YearlyDataPoint {
    return result.dataPoints[result.dataPoints.length - 1];
  }
}

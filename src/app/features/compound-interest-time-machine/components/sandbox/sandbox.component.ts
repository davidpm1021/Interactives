import { Component, computed, effect, inject, input, output, signal, OnInit } from '@angular/core';
import { CompoundInterestService } from '../../services/compound-interest.service';
import { GrowthChartComponent } from '../growth-chart/growth-chart.component';
import { SummaryPanelComponent } from '../summary-panel/summary-panel.component';
import { TimeScrubberComponent } from '../time-scrubber/time-scrubber.component';
import { SimulationInputs, SimulationResult } from '../../models/compound-interest.models';
import { CHALLENGE_CONTENT } from '../../data/challenge-content';

@Component({
  selector: 'app-sandbox',
  standalone: true,
  imports: [GrowthChartComponent, SummaryPanelComponent, TimeScrubberComponent],
  templateUrl: './sandbox.component.html',
  styleUrl: './sandbox.component.scss',
})
export class SandboxComponent implements OnInit {
  readonly canGoBack = input(false);
  readonly finish = output<void>();
  readonly goBack = output<void>();

  protected onBack(): void {
    this.goBack.emit();
  }

  private readonly service = inject(CompoundInterestService);

  protected readonly content = CHALLENGE_CONTENT['challenge5'];

  // ── Input signals (smart defaults from challenges) ──
  protected readonly principal = signal(1000);
  protected readonly contributionAmount = signal(100);
  protected readonly interestRatePercent = signal(7);
  protected readonly startAge = signal(22);
  protected readonly endAge = signal(62);

  protected readonly timeHorizon = computed(() =>
    Math.max(1, this.endAge() - this.startAge()),
  );

  // ── Simulation results ──
  protected readonly result = computed<SimulationResult>(() => {
    const inputs: SimulationInputs = {
      principal: this.principal(),
      interestRate: this.interestRatePercent() / 100,
      timeHorizon: this.timeHorizon(),
      contributionAmount: this.contributionAmount(),
      contributionFrequency: this.contributionAmount() > 0 ? 'monthly' : 'none',
      compoundingFrequency: 'monthly',
    };
    return this.service.calculate(inputs);
  });

  // ── Wait comparison ──
  protected readonly showWaitComparison = signal(false);

  protected readonly waitResult = computed<SimulationResult | null>(() => {
    if (!this.showWaitComparison()) return null;
    const waitYears = 5;
    const horizon = this.timeHorizon() - waitYears;
    if (horizon < 1) return null;
    const inputs: SimulationInputs = {
      principal: this.principal(),
      interestRate: this.interestRatePercent() / 100,
      timeHorizon: horizon,
      contributionAmount: this.contributionAmount(),
      contributionFrequency: this.contributionAmount() > 0 ? 'monthly' : 'none',
      compoundingFrequency: 'monthly',
    };
    return this.service.calculate(inputs);
  });

  // ── Time scrubber ──
  /**
   * The year the scrubber is set to. Also drives the growth-chart curtain
   * (data drawn up to this year). Not affected by hover, so cursor movement
   * doesn't retract/extend the chart on every mouse pixel.
   */
  protected readonly selectedYear = signal<number | null>(null);
  /** Year the mouse is hovering over. Drives the marker + tooltip only. */
  protected readonly hoverYear = signal<number | null>(null);
  protected readonly isAutoPlaying = signal(false);

  /**
   * Y-axis ceiling passed to the growth chart. Frozen on init and re-frozen
   * each time the student presses Play so sliding rate/contribution mid-idle
   * doesn't leak the answer through a rescaling axis.
   */
  protected readonly frozenYMax = signal<number | null>(null);

  ngOnInit(): void {
    // Start at year 0 so the user scrubs or plays to reveal
    this.selectedYear.set(0);
    this.refitYAxis();
  }

  // ── Input handlers ──
  protected onPrincipalInput(event: Event): void {
    this.principal.set(this.clamp(this.parseNumber(event), 0, 100000));
  }

  protected onContributionInput(event: Event): void {
    this.contributionAmount.set(this.clamp(this.parseNumber(event), 0, 2000));
  }

  protected onRateInput(event: Event): void {
    this.interestRatePercent.set(this.clamp(this.parseNumber(event), 0, 15));
  }

  protected onStartAgeInput(event: Event): void {
    const val = Math.round(this.parseNumber(event));
    this.startAge.set(this.clamp(val, 18, this.endAge() - 1));
  }

  protected onEndAgeInput(event: Event): void {
    const val = Math.round(this.parseNumber(event));
    this.endAge.set(this.clamp(val, this.startAge() + 1, 80));
  }

  protected toggleWaitComparison(): void {
    this.showWaitComparison.update((v) => !v);
  }

  protected onYearChange(year: number): void {
    this.selectedYear.set(year);
  }

  protected onPlayStateChange(playing: boolean): void {
    this.isAutoPlaying.set(playing);
    if (playing) {
      this.refitYAxis();
    }
  }

  private refitYAxis(): void {
    const base = this.result().summary.finalBalance;
    const wait = this.waitResult()?.summary.finalBalance ?? 0;
    const ceiling = Math.max(base, wait) * 1.1;
    this.frozenYMax.set(ceiling > 0 ? ceiling : null);
  }

  protected onYearHover(year: number | null): void {
    this.hoverYear.set(year);
  }

  protected onFinish(): void {
    this.finish.emit();
  }

  private parseNumber(event: Event): number {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    return isNaN(val) ? 0 : val;
  }

  private clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }
}

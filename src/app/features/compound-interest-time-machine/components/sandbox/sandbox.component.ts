import { Component, computed, effect, inject, output, signal, OnInit } from '@angular/core';
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
  readonly finish = output<void>();

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
  /** The year the scrubber is set to (persists across hovers). */
  private readonly scrubberYear = signal<number | null>(null);
  /** The year shown on the chart (may temporarily differ during hover). */
  protected readonly selectedYear = signal<number | null>(null);
  protected readonly isAutoPlaying = signal(false);

  ngOnInit(): void {
    // Start at year 0 so the user scrubs or plays to reveal
    this.scrubberYear.set(0);
    this.selectedYear.set(0);
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
    this.scrubberYear.set(year);
    this.selectedYear.set(year);
  }

  protected onPlayStateChange(playing: boolean): void {
    this.isAutoPlaying.set(playing);
  }

  protected onYearHover(year: number | null): void {
    if (year !== null) {
      this.selectedYear.set(year);
    } else {
      // Mouse left the chart — snap back to scrubber position
      this.selectedYear.set(this.scrubberYear());
    }
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

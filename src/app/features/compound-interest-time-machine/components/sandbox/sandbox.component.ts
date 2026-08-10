import { Component, computed, effect, inject, input, output, signal, OnInit } from '@angular/core';
import { CompoundInterestService } from '../../services/compound-interest.service';
import { GrowthChartComponent } from '../growth-chart/growth-chart.component';
import { GrowthTableComponent } from '../growth-table/growth-table.component';
import { SummaryPanelComponent } from '../summary-panel/summary-panel.component';
import { TimeScrubberComponent } from '../time-scrubber/time-scrubber.component';
import { SimulationInputs, SimulationResult } from '../../models/compound-interest.models';
import { CHALLENGE_CONTENT } from '../../data/challenge-content';

@Component({
  selector: 'app-sandbox',
  standalone: true,
  imports: [GrowthChartComponent, GrowthTableComponent, SummaryPanelComponent, TimeScrubberComponent],
  templateUrl: './sandbox.component.html',
  styleUrl: './sandbox.component.scss',
})
export class SandboxComponent implements OnInit {
  readonly canGoBack = input(false);
  /**
   * Rate the sandbox opens on, as a whole percent. The parent passes the
   * randomized session rate so "Your Time Machine" continues the same
   * scenario the student just worked through, instead of silently switching
   * to a different rate and producing different numbers for identical inputs.
   */
  readonly initialRatePercent = input(7);
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
  protected readonly waitYears = 5;

  protected readonly waitResult = computed<SimulationResult | null>(() => {
    if (!this.showWaitComparison()) return null;
    const horizon = this.timeHorizon() - this.waitYears;
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

  /**
   * True once the student has seen the curve reach the end of the timeline.
   * Gates whether later input changes are allowed to rescale the y-axis.
   */
  protected readonly hasRevealed = signal(false);

  /**
   * True when inputs changed after a completed run, so the figures on screen
   * no longer match what the student last watched.
   *
   * Review: "I ran the animation, then adjusted my inputs... it was hard to
   * tell that it had re-run the estimate with my new input." Drives a prompt
   * on the play control rather than silently updating.
   */
  protected readonly needsRerun = signal(false);

  ngOnInit(): void {
    // Carry the session's rate over from the challenges before the first
    // refit, so the frozen ceiling matches the scenario we open on.
    // Rounded to the slider's 0.5 step: the caller derives this from a decimal
    // rate, and 0.07 * 100 lands on 7.000000000000001, which rendered in full
    // in the number field.
    const seeded = Math.round(this.clamp(this.initialRatePercent(), 0, 15) * 2) / 2;
    this.interestRatePercent.set(seeded);
    // Start at year 0 so the user scrubs or plays to reveal
    this.selectedYear.set(0);
    this.refitYAxis();
  }

  // ── Input handlers ──
  protected onPrincipalInput(event: Event): void {
    this.principal.set(this.clamp(this.parseNumber(event), 0, 100000));
    this.onInputsChanged();
  }

  protected onContributionInput(event: Event): void {
    this.contributionAmount.set(this.clamp(this.parseNumber(event), 0, 2000));
    this.onInputsChanged();
  }

  protected onRateInput(event: Event): void {
    this.interestRatePercent.set(this.clamp(this.parseNumber(event), 0, 15));
    this.onInputsChanged();
  }

  protected onStartAgeInput(event: Event): void {
    const val = Math.round(this.parseNumber(event));
    this.startAge.set(this.clamp(val, 18, this.endAge() - 1));
    this.onInputsChanged();
  }

  protected onEndAgeInput(event: Event): void {
    const val = Math.round(this.parseNumber(event));
    this.endAge.set(this.clamp(val, this.startAge() + 1, 80));
    this.onInputsChanged();
  }

  protected toggleWaitComparison(): void {
    this.showWaitComparison.update((v) => !v);
    this.onInputsChanged();
  }

  /**
   * Rescale the y-axis on input changes, but only once the student has already
   * watched the curve reach the end.
   *
   * Before the reveal the ceiling stays pinned so nudging the rate can't
   * telegraph the final balance. After it, there is nothing left to withhold,
   * and keeping the stale ceiling would leave the curve pressed against (or
   * clipped at) the top of the plot with no way to recover short of pressing
   * Play again.
   */
  private onInputsChanged(): void {
    if (!this.hasRevealed()) return;
    this.refitYAxis();
    this.needsRerun.set(true);
  }

  protected readonly showTable = signal(false);

  protected toggleTable(): void {
    this.showTable.update((v) => !v);
  }

  protected onYearChange(year: number): void {
    this.selectedYear.set(year);
    // Once the timeline reaches the end the final balance is on screen, so the
    // axis no longer needs to be withheld from later input changes.
    if (year >= this.timeHorizon()) this.hasRevealed.set(true);
  }

  protected onPlayStateChange(playing: boolean): void {
    this.isAutoPlaying.set(playing);
    if (playing) {
      this.refitYAxis();
      // The run now reflects the current inputs, so the prompt has served
      // its purpose.
      this.needsRerun.set(false);
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

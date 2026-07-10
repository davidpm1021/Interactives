import {
  Component,
  input,
  output,
  signal,
  effect,
  OnInit,
} from '@angular/core';
import {
  CompoundingFrequency,
  SimulationInputs,
} from '../../models/compound-interest.models';

@Component({
  selector: 'app-input-panel',
  standalone: true,
  imports: [],
  templateUrl: './input-panel.component.html',
  styleUrl: './input-panel.component.scss',
})
export class InputPanelComponent implements OnInit {
  readonly initialInputs = input.required<SimulationInputs>();
  readonly inputsChange = output<SimulationInputs>();
  readonly isCollapsed = signal(false);

  protected readonly principal = signal(1000);
  protected readonly interestRatePercent = signal(7);
  protected readonly timeHorizon = signal(10);
  protected readonly contributionAmount = signal(100);
  protected readonly compoundingFrequency = signal<CompoundingFrequency>('monthly');

  private initialized = false;

  constructor() {
    effect(() => {
      if (!this.initialized) return;
      const inputs = this.buildInputs();
      this.inputsChange.emit(inputs);
    });
  }

  ngOnInit(): void {
    const init = this.initialInputs();
    this.principal.set(init.principal);
    this.interestRatePercent.set(Math.round(init.interestRate * 10000) / 100);
    this.timeHorizon.set(init.timeHorizon);
    this.contributionAmount.set(init.contributionAmount);
    this.compoundingFrequency.set(init.compoundingFrequency);
    this.initialized = true;
    this.inputsChange.emit(this.buildInputs());
  }

  protected onPrincipalInput(event: Event): void {
    const value = this.parseNumber(event);
    this.principal.set(Math.max(0, Math.min(50000, value)));
  }

  protected onPrincipalBlur(): void {
    this.principal.set(Math.max(0, Math.min(50000, this.principal())));
  }

  protected onRateInput(event: Event): void {
    const value = this.parseNumber(event);
    this.interestRatePercent.set(Math.max(0, Math.min(15, value)));
  }

  protected onRateBlur(): void {
    this.interestRatePercent.set(Math.max(0, Math.min(15, this.interestRatePercent())));
  }

  protected onTimeInput(event: Event): void {
    const value = Math.round(this.parseNumber(event));
    this.timeHorizon.set(Math.max(1, Math.min(50, value)));
  }

  protected onTimeBlur(): void {
    this.timeHorizon.set(Math.max(1, Math.min(50, Math.round(this.timeHorizon()))));
  }

  protected onContributionInput(event: Event): void {
    const value = this.parseNumber(event);
    this.contributionAmount.set(Math.max(0, Math.min(2000, value)));
  }

  protected onContributionBlur(): void {
    this.contributionAmount.set(Math.max(0, Math.min(2000, this.contributionAmount())));
  }

  protected onCompoundingChange(freq: CompoundingFrequency): void {
    this.compoundingFrequency.set(freq);
  }

  protected toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }

  private parseNumber(event: Event): number {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    return isNaN(val) ? 0 : val;
  }

  private buildInputs(): SimulationInputs {
    return {
      principal: this.principal(),
      interestRate: this.interestRatePercent() / 100,
      timeHorizon: this.timeHorizon(),
      contributionAmount: this.contributionAmount(),
      contributionFrequency: this.contributionAmount() > 0 ? 'monthly' : 'none',
      compoundingFrequency: this.compoundingFrequency(),
    };
  }
}

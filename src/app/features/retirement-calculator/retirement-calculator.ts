import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { InputsPanel } from './components/inputs-panel/inputs-panel';
import { ResultsPanel } from './components/results-panel/results-panel';
import { GrowthChart } from './components/growth-chart/growth-chart';
import { RetirementService } from './services/retirement.service';
import { DEFAULT_INPUTS, RetirementInputs } from './models/retirement.models';

@Component({
  selector: 'app-retirement-calculator',
  standalone: true,
  imports: [TopHeader, InputsPanel, ResultsPanel, GrowthChart],
  providers: [RetirementService],
  templateUrl: './retirement-calculator.html',
  styleUrl: './retirement-calculator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetirementCalculator {
  private readonly service = inject(RetirementService);

  protected readonly inputs = signal<RetirementInputs>(DEFAULT_INPUTS);

  protected readonly projection = computed(() => this.service.project(this.inputs()));

  protected onInputsChange(next: RetirementInputs): void {
    this.inputs.set(next);
  }

  protected onPrint(): void {
    window.print();
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { InputsPanel } from './components/inputs-panel/inputs-panel';
import { ResultsPanel } from './components/results-panel/results-panel';
import { GrowthChart } from './components/growth-chart/growth-chart';
import { AssumptionsPanel } from './components/assumptions-panel/assumptions-panel';
import { RetirementService } from './services/retirement.service';
import { ScrollCueComponent } from '../../shared/scroll-cue/scroll-cue.component';
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_INPUTS,
  RetirementAssumptions,
  RetirementInputs,
} from './models/retirement.models';

@Component({
  selector: 'app-retirement-calculator',
  standalone: true,
  imports: [TopHeader, InputsPanel, ResultsPanel, GrowthChart, AssumptionsPanel, ScrollCueComponent],
  providers: [RetirementService],
  templateUrl: './retirement-calculator.html',
  styleUrl: './retirement-calculator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetirementCalculator {
  private readonly service = inject(RetirementService);

  protected readonly inputs = signal<RetirementInputs>(DEFAULT_INPUTS);
  protected readonly assumptions = signal<RetirementAssumptions>(DEFAULT_ASSUMPTIONS);

  protected readonly projection = computed(() =>
    this.service.project(this.inputs(), this.assumptions()),
  );

  protected onInputsChange(next: RetirementInputs): void {
    this.inputs.set(next);
  }

  protected onAssumptionsChange(next: RetirementAssumptions): void {
    this.assumptions.set(next);
  }

  protected onPrint(): void {
    window.print();
  }
}

import { Component, input, output } from '@angular/core';
import { StepConfig, StepId, StepStatus } from '../../models/stock-tracker.models';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  templateUrl: './step-indicator.component.html',
  styleUrl: './step-indicator.component.scss',
})
export class StepIndicatorComponent {
  readonly steps = input.required<(StepConfig & { status: StepStatus })[]>();
  readonly currentStepNumber = input.required<number>();

  readonly stepClick = output<StepId>();

  protected onStepClick(step: StepConfig & { status: StepStatus }): void {
    if (step.status !== 'locked') {
      this.stepClick.emit(step.id);
    }
  }

  protected totalSteps(): number {
    return this.steps().length;
  }
}

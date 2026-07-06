import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CheckData, WalkthroughScenario } from '../../models/check.models';
import { CheckDisplayComponent } from '../check-display/check-display.component';

const FIELD_LABELS: Record<keyof CheckData, string> = {
  date: 'Date',
  payee: 'Payee',
  amountNumeric: 'Numeric amount',
  amountWritten: 'Written amount',
  memo: 'Memo',
  signature: 'Signature',
  checkNumber: 'Check number',
  routingNumber: 'Routing number',
  accountNumber: 'Account number',
};

@Component({
  selector: 'app-walkthrough',
  standalone: true,
  imports: [CheckDisplayComponent],
  templateUrl: './walkthrough.component.html',
  styleUrl: './walkthrough.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalkthroughComponent {
  readonly scenario = input.required<WalkthroughScenario>();
  readonly finish = output<void>();

  protected readonly currentStepIndex = signal(0);

  protected readonly currentStep = computed(() => this.scenario().steps[this.currentStepIndex()]);

  protected readonly highlightedFields = computed(() => {
    const field = this.currentStep()?.field;
    return field ? new Set<string>([field]) : new Set<string>();
  });

  protected readonly partialCheck = computed<CheckData>(() => {
    const idx = this.currentStepIndex();
    const steps = this.scenario().steps;
    const full = this.scenario().check;

    const built: CheckData = {
      date: '',
      payee: '',
      amountNumeric: '',
      amountWritten: '',
      memo: '',
      signature: '',
      checkNumber: full.checkNumber,
      routingNumber: full.routingNumber,
      accountNumber: full.accountNumber,
    };

    for (let i = 0; i <= idx && i < steps.length; i++) {
      const step = steps[i];
      built[step.field] = step.value;
    }
    return built;
  });

  protected readonly stepNumber = computed(() => this.currentStepIndex() + 1);
  protected readonly totalSteps = computed(() => this.scenario().steps.length);
  protected readonly isLastStep = computed(() =>
    this.currentStepIndex() >= this.scenario().steps.length - 1,
  );
  protected readonly isFirstStep = computed(() => this.currentStepIndex() === 0);

  protected readonly currentFieldLabel = computed(() => {
    const field = this.currentStep()?.field;
    return field ? FIELD_LABELS[field] : '';
  });

  protected next(): void {
    if (this.isLastStep()) {
      this.finish.emit();
      return;
    }
    this.currentStepIndex.update((i) => i + 1);
  }

  protected previous(): void {
    if (this.isFirstStep()) return;
    this.currentStepIndex.update((i) => i - 1);
  }
}

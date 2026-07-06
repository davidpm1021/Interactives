import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CheckData, CheckError, ErrorScenario } from '../../models/check.models';
import { CheckDisplayComponent } from '../check-display/check-display.component';

const FLAGGABLE_FIELDS: (keyof CheckData)[] = [
  'date',
  'payee',
  'amountNumeric',
  'amountWritten',
  'memo',
  'signature',
];

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
  selector: 'app-error-spotting',
  standalone: true,
  imports: [CheckDisplayComponent],
  templateUrl: './error-spotting.component.html',
  styleUrl: './error-spotting.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorSpottingComponent {
  readonly scenario = input.required<ErrorScenario>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();
  readonly next = output<void>();

  protected readonly flaggedFields = signal<Set<string>>(new Set());
  protected readonly submitted = signal(false);
  protected readonly flaggedNoErrors = signal(false);

  protected readonly errorFields = computed(() => {
    return new Set(this.scenario().errors.map((e) => e.field as string));
  });

  protected readonly verdictText = computed(() => {
    const errorCount = this.scenario().errors.length;
    const flagged = this.flaggedFields();
    const errorFields = this.errorFields();

    if (errorCount === 0) {
      if (flagged.size === 0) {
        return { kind: 'correct' as const, text: 'Correct. Nothing on this check is wrong.' };
      }
      return {
        kind: 'incorrect' as const,
        text: 'This check is actually fine. Sometimes there\'s nothing to flag.',
      };
    }

    const allFound = [...errorFields].every((f) => flagged.has(f));
    const onlyCorrect = [...flagged].every((f) => errorFields.has(f));

    if (allFound && onlyCorrect) {
      return { kind: 'correct' as const, text: 'Spot on. Good catch.' };
    }
    if (allFound && !onlyCorrect) {
      return {
        kind: 'partial' as const,
        text: 'You found the real problem, but flagged some fields that were fine.',
      };
    }
    return { kind: 'incorrect' as const, text: 'Take another look at the highlighted fields below.' };
  });

  protected readonly fieldErrorMap = computed(() => {
    if (!this.submitted()) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const error of this.scenario().errors) {
      map.set(error.field, error.description);
    }
    return map;
  });

  protected readonly highlightedFields = computed(() => {
    if (this.submitted()) return new Set<string>();
    return this.flaggedFields();
  });

  protected readonly flaggableFields = FLAGGABLE_FIELDS;

  protected fieldLabel(field: keyof CheckData): string {
    return FIELD_LABELS[field];
  }

  protected isFlagged(field: keyof CheckData): boolean {
    return this.flaggedFields().has(field);
  }

  protected toggleField(field: keyof CheckData): void {
    if (this.submitted()) return;
    this.flaggedFields.update((set) => {
      const next = new Set(set);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }

  protected submit(): void {
    this.submitted.set(true);
  }

  protected onNext(): void {
    this.flaggedFields.set(new Set());
    this.submitted.set(false);
    this.next.emit();
  }

  protected get errors(): readonly CheckError[] {
    return this.scenario().errors;
  }
}

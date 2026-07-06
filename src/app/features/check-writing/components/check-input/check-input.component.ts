import { Component, input, output, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckData } from '../../models/check.models';
import { WrittenAmountService } from '../../services/written-amount.service';

export type FieldStatus = 'neutral' | 'valid' | 'invalid';

export interface FieldState {
  value: string;
  status: FieldStatus;
  feedback: string;
}

export interface FieldHints {
  [field: string]: string;
}

type GuidedField = 'date' | 'payee' | 'amountNumeric' | 'amountWritten' | 'memo' | 'signature';
type GuidedStep = GuidedField | 'done';

const GUIDED_FIELD_ORDER: GuidedField[] = [
  'date',
  'payee',
  'amountNumeric',
  'amountWritten',
  'memo',
  'signature',
];

const STEP_LABELS: Record<string, string> = {
  date: 'Date',
  payee: 'Payee',
  amountNumeric: 'Amount ($)',
  amountWritten: 'Written Amount',
  memo: 'Memo',
  signature: 'Signature',
};

@Component({
  selector: 'app-check-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './check-input.component.html',
  styleUrl: './check-input.component.scss',
})
export class CheckInputComponent {
  readonly expectedCheck = input.required<CheckData>();
  readonly playerName = input.required<string>();
  readonly showFieldFeedback = input(false);
  readonly prefilledFields = input<Partial<CheckData>>({});
  readonly fieldHints = input<FieldHints>({});
  readonly guidedMode = input(false);

  readonly submitCheck = output<CheckData>();

  private readonly writtenAmountService = inject(WrittenAmountService);

  protected readonly date = signal('');
  protected readonly payee = signal('');
  protected readonly amountNumeric = signal('');
  protected readonly amountWritten = signal('');
  protected readonly memo = signal('');
  protected readonly signed = signal(false);

  protected readonly activeStep = signal<GuidedStep>('date');
  protected readonly validationError = signal('');
  protected readonly fieldFeedback = signal<Map<string, string>>(new Map());

  // ── Guided mode computed helpers ──

  protected isActiveField(field: string): boolean {
    return this.guidedMode() && this.activeStep() === field;
  }

  protected isCompletedField(field: string): boolean {
    if (!this.guidedMode()) return false;
    const step = this.activeStep();
    if (step === 'done') return true;
    const activeIdx = GUIDED_FIELD_ORDER.indexOf(step as GuidedField);
    const fieldIdx = GUIDED_FIELD_ORDER.indexOf(field as GuidedField);
    return fieldIdx >= 0 && fieldIdx < activeIdx;
  }

  protected isLockedField(field: string): boolean {
    if (!this.guidedMode()) return false;
    if (this.isFieldPrefilled(field)) return false;
    const step = this.activeStep();
    if (step === 'done') return false;
    const activeIdx = GUIDED_FIELD_ORDER.indexOf(step as GuidedField);
    const fieldIdx = GUIDED_FIELD_ORDER.indexOf(field as GuidedField);
    return fieldIdx > activeIdx;
  }

  protected isFieldPrefilled(field: string): boolean {
    const pf = this.prefilledFields();
    return !!pf && field in pf && !!(pf as Record<string, string>)[field];
  }

  protected readonly activeHint = computed(() => {
    if (!this.guidedMode()) return '';
    const hints = this.fieldHints();
    const step = this.activeStep();
    return hints[step] ?? '';
  });

  protected readonly activeStepLabel = computed(() => {
    return STEP_LABELS[this.activeStep()] ?? '';
  });

  protected readonly currentStepNumber = computed(() => {
    const step = this.activeStep();
    if (step === 'done') return GUIDED_FIELD_ORDER.length;
    return GUIDED_FIELD_ORDER.indexOf(step as GuidedField) + 1;
  });

  protected readonly totalSteps = computed(() => GUIDED_FIELD_ORDER.length);

  protected readonly isMemoStep = computed(() => this.activeStep() === 'memo');

  // ── Validation per field ──

  private validateField(field: GuidedField): string | null {
    const expected = this.expectedCheck();

    switch (field) {
      case 'date': {
        const val = this.date().trim();
        if (!val) return 'Please enter the date.';
        // Accept if it parses to the same date as expected
        return this.datesMatch(val, expected.date)
          ? null
          : "That doesn't look like today's date. Use MM/DD/YYYY format.";
      }

      case 'payee': {
        const val = this.payee().trim();
        if (!val) return 'Please enter the payee.';
        return val.toLowerCase() === expected.payee.toLowerCase()
          ? null
          : 'Check the prompt again. Who should this check be paid to?';
      }

      case 'amountNumeric': {
        const val = this.amountNumeric().trim();
        if (!val) return 'Please enter the dollar amount.';
        const parsed = parseFloat(val.replace(/,/g, ''));
        const expectedVal = parseFloat(expected.amountNumeric.replace(/,/g, ''));
        if (isNaN(parsed)) return 'Enter a valid number like 45.00';
        return Math.abs(parsed - expectedVal) < 0.001
          ? null
          : "That amount doesn't match. Check the prompt above.";
      }

      case 'amountWritten': {
        const val = this.amountWritten().trim();
        if (!val) return 'Please write the amount in words.';
        const expectedVal = parseFloat(
          expected.amountNumeric.replace(/,/g, '')
        );
        const result = this.writtenAmountService.validate(val, expectedVal);
        if (result.isValid) return null;
        // Return the first error as a friendly message
        return result.errors[0] ?? "That doesn't match the dollar amount.";
      }

      case 'memo':
        // Memo is always valid — it's optional
        return null;

      case 'signature':
        return this.signed() ? null : 'Click the signature area to sign.';

      default:
        return null;
    }
  }

  /** Fuzzy date matching — both should resolve to the same calendar day */
  private datesMatch(input: string, expected: string): boolean {
    const parse = (s: string): string | null => {
      // Accept M/D/YYYY, MM/DD/YYYY, M-D-YYYY, etc.
      const m = s.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
      if (!m) return null;
      const month = m[1].padStart(2, '0');
      const day = m[2].padStart(2, '0');
      const year = m[3].length === 2 ? '20' + m[3] : m[3];
      return `${year}-${month}-${day}`;
    };
    const a = parse(input);
    const b = parse(expected);
    return a !== null && b !== null && a === b;
  }

  /** Called when Enter is pressed or confirm button clicked in guided mode */
  protected onConfirmStep(): void {
    if (!this.guidedMode()) return;
    const step = this.activeStep();
    if (step === 'done') return;

    const error = this.validateField(step as GuidedField);
    if (error) {
      this.validationError.set(error);
      return;
    }

    this.validationError.set('');
    this.advanceStep();
  }

  /** Skip the memo field */
  protected onSkipMemo(): void {
    if (this.activeStep() !== 'memo') return;
    this.validationError.set('');
    this.advanceStep();
  }

  /** Handle Enter key on input fields in guided mode */
  protected onFieldKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.guidedMode()) {
      event.preventDefault();
      this.onConfirmStep();
    }
  }

  private advanceStep(): void {
    const current = this.activeStep();
    const currentIdx = GUIDED_FIELD_ORDER.indexOf(current as GuidedField);
    if (currentIdx < GUIDED_FIELD_ORDER.length - 1) {
      this.activeStep.set(GUIDED_FIELD_ORDER[currentIdx + 1]);
    } else {
      this.activeStep.set('done');
    }
  }

  // ── Signature ──

  protected onSign(): void {
    this.signed.set(true);
    if (this.guidedMode() && this.activeStep() === 'signature') {
      this.validationError.set('');
      this.advanceStep();
    }
  }

  // ── Check data ──

  protected readonly currentCheckData = computed<CheckData>(() => ({
    date: this.date(),
    payee: this.payee(),
    amountNumeric: this.amountNumeric(),
    amountWritten: this.amountWritten(),
    memo: this.memo(),
    signature: this.signed() ? this.playerName() : '',
    checkNumber: this.expectedCheck().checkNumber,
    routingNumber: this.expectedCheck().routingNumber,
    accountNumber: this.expectedCheck().accountNumber,
  }));

  protected readonly canSubmit = computed(() => {
    if (this.guidedMode() && this.activeStep() !== 'done') return false;
    return (
      this.date().trim() !== '' &&
      this.payee().trim() !== '' &&
      this.amountNumeric().trim() !== '' &&
      this.amountWritten().trim() !== '' &&
      this.signed()
    );
  });

  protected onSubmit(): void {
    if (this.canSubmit()) {
      this.submitCheck.emit(this.currentCheckData());
    }
  }

  resetFields(): void {
    this.date.set('');
    this.payee.set('');
    this.amountNumeric.set('');
    this.amountWritten.set('');
    this.memo.set('');
    this.signed.set(false);
    this.fieldFeedback.set(new Map());
    this.activeStep.set('date');
    this.validationError.set('');
  }
}

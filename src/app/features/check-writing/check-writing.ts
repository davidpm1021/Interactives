import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { LessonStateService } from './services/lesson-state.service';
import { WrittenAmountService } from './services/written-amount.service';
import { CheckData } from './models/check.models';
import { CheckInputComponent } from './components/check-input/check-input.component';
import { CheckDisplayComponent } from './components/check-display/check-display.component';
import { ReferencePanelComponent } from './components/reference-panel/reference-panel.component';
import { WalkthroughComponent } from './components/walkthrough/walkthrough.component';
import { ErrorSpottingComponent } from './components/error-spotting/error-spotting.component';
import { LessonSummaryComponent } from './components/lesson-summary/lesson-summary.component';
import { ERROR_SCENARIOS, GUIDED, PRACTICE, WALKTHROUGH } from './data/lesson-content';

const PHASE_LABELS = {
  'i-do': 'Watch',
  'we-do': 'Practice with help',
  'you-do': 'Try on your own',
  'show-understanding': 'Spot the problems',
} as const;

interface PracticeGrade {
  correct: Set<string>;
  errors: Map<string, string>;
  errorEntries: { field: string; label: string; message: string }[];
  allCorrect: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  date: 'Date',
  payee: 'Payee',
  amountNumeric: 'Numeric amount',
  amountWritten: 'Written amount',
  memo: 'Memo',
  signature: 'Signature',
};

@Component({
  selector: 'app-check-writing',
  standalone: true,
  imports: [
    TopHeader,
    CheckInputComponent,
    CheckDisplayComponent,
    ReferencePanelComponent,
    WalkthroughComponent,
    ErrorSpottingComponent,
    LessonSummaryComponent,
  ],
  providers: [LessonStateService, WrittenAmountService],
  templateUrl: './check-writing.html',
  styleUrl: './check-writing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckWriting {
  protected readonly title = 'Writing a Check';
  protected readonly state = inject(LessonStateService);
  private readonly writtenAmount = inject(WrittenAmountService);

  protected readonly walkthrough = WALKTHROUGH;
  protected readonly guided = GUIDED;
  protected readonly practice = PRACTICE;
  protected readonly errorScenarios = ERROR_SCENARIOS;
  protected readonly signerName = WALKTHROUGH.check.signature;

  protected readonly youDoGrade = signal<PracticeGrade | null>(null);
  protected readonly youDoSubmittedCheck = signal<CheckData | null>(null);
  protected readonly checkInputKey = signal(0);

  protected readonly currentErrorScenario = computed(
    () => this.errorScenarios[this.state.errorSpottingIndex()],
  );

  protected readonly phaseLabel = computed(() => {
    const p = this.state.phase();
    if (p === 'intro' || p === 'complete') return '';
    return PHASE_LABELS[p];
  });

  protected readonly stepNumber = computed(() => this.state.currentStepNumber());
  protected readonly stepCount = computed(() => this.state.totalSteps());

  // ── Intro → I do ──

  protected startLesson(): void {
    this.state.advance();
  }

  // ── I do → We do ──

  protected onWalkthroughDone(): void {
    this.state.advance();
  }

  // ── We do → You do ──

  protected onGuidedSubmit(_check: CheckData): void {
    this.checkInputKey.update((n) => n + 1);
    this.state.advance();
  }

  // ── You do: grade then advance ──

  protected onPracticeSubmit(check: CheckData): void {
    const grade = this.gradePractice(check);
    this.youDoGrade.set(grade);
    this.youDoSubmittedCheck.set(check);
  }

  protected retryPractice(): void {
    this.youDoGrade.set(null);
    this.youDoSubmittedCheck.set(null);
    this.checkInputKey.update((n) => n + 1);
  }

  protected continueFromPractice(): void {
    this.youDoGrade.set(null);
    this.youDoSubmittedCheck.set(null);
    this.checkInputKey.update((n) => n + 1);
    this.state.advance();
  }

  // ── Show understanding ──

  protected onErrorNext(): void {
    this.state.nextErrorScenario(this.errorScenarios.length);
  }

  // ── Complete → restart ──

  protected onRestart(): void {
    this.state.reset();
    this.youDoGrade.set(null);
    this.youDoSubmittedCheck.set(null);
    this.checkInputKey.update((n) => n + 1);
  }

  // ── Grading the you-do check ──

  private gradePractice(submitted: CheckData): PracticeGrade {
    const expected = this.practice.expectedCheck;
    const correct = new Set<string>();
    const errors = new Map<string, string>();

    if (this.datesMatch(submitted.date, expected.date)) {
      correct.add('date');
    } else {
      errors.set('date', "Use today's date in MM/DD/YYYY format.");
    }

    if (submitted.payee.trim().toLowerCase() === expected.payee.trim().toLowerCase()) {
      correct.add('payee');
    } else {
      errors.set('payee', `Expected "${expected.payee}".`);
    }

    const submittedNum = parseFloat(submitted.amountNumeric.replace(/,/g, ''));
    const expectedNum = parseFloat(expected.amountNumeric.replace(/,/g, ''));
    if (!isNaN(submittedNum) && Math.abs(submittedNum - expectedNum) < 0.001) {
      correct.add('amountNumeric');
    } else {
      errors.set('amountNumeric', `Expected ${expected.amountNumeric}.`);
    }

    const writtenValidation = this.writtenAmount.validate(submitted.amountWritten, expectedNum);
    if (writtenValidation.isValid) {
      correct.add('amountWritten');
    } else {
      errors.set('amountWritten', writtenValidation.errors[0] ?? 'Written amount is incorrect.');
    }

    // Memo is optional — never an error, but mark correct when present
    if (submitted.memo.trim()) {
      correct.add('memo');
    }

    if (submitted.signature.trim()) {
      correct.add('signature');
    } else {
      errors.set('signature', 'Sign the check to authorize it.');
    }

    const errorEntries = [...errors.entries()].map(([field, message]) => ({
      field,
      label: FIELD_LABELS[field] ?? field,
      message,
    }));

    return {
      correct,
      errors,
      errorEntries,
      allCorrect: errors.size === 0,
    };
  }

  private datesMatch(input: string, expected: string): boolean {
    const parse = (s: string): string | null => {
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
}

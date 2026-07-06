// ── Check Fields ──────────────────────────────────────

export interface CheckData {
  date: string;
  payee: string;
  amountNumeric: string;
  amountWritten: string;
  memo: string;
  signature: string;
  checkNumber: string;
  routingNumber: string;
  accountNumber: string;
}

// ── Errors (used by error-spotting phase) ─────────────

export interface CheckError {
  field: keyof CheckData;
  errorType: CheckErrorType;
  description: string;
  bestPractice: string;
}

export type CheckErrorType =
  | 'missing'
  | 'format'
  | 'mismatch'
  | 'security'
  | 'invalid';

// ── Lesson scenarios ──────────────────────────────────

export interface WalkthroughStep {
  field: keyof CheckData;
  value: string;
  callout: string;
}

export interface WalkthroughScenario {
  prompt: string;
  check: CheckData;
  steps: WalkthroughStep[];
}

export interface GuidedScenario {
  prompt: string;
  expectedCheck: CheckData;
  fieldHints: Partial<Record<keyof CheckData, string>>;
}

export interface PracticeScenario {
  prompt: string;
  expectedCheck: CheckData;
}

export interface ErrorScenario {
  id: string;
  prompt: string;
  check: CheckData;
  errors: CheckError[];
}

// ── Lesson state ──────────────────────────────────────

export type LessonPhase =
  | 'intro'
  | 'i-do'
  | 'we-do'
  | 'you-do'
  | 'show-understanding'
  | 'complete';

// ── Amount validation ─────────────────────────────────

export interface AmountValidation {
  isValid: boolean;
  normalized: string;
  errors: string[];
}

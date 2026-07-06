export type DokLevel = 1 | 2 | 3;

export interface MultipleChoiceQuestion {
  id: string;
  dok: DokLevel;
  answerType: 'multiple-choice';
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface NumericQuestion {
  id: string;
  dok: DokLevel;
  answerType: 'numeric';
  prompt: string;
  correctValue: number;
  tolerance: number;               // absolute tolerance for accepted answer
  unit?: string;
  explanation: string;
}

/**
 * A concept the student's answer should touch. `matchers` is a list of
 * case-insensitive substrings; a hit on any of them counts the concept as
 * covered. Recognition is advisory — nothing is scored, just surfaced so the
 * student can compare their language against the model answer.
 */
export interface KeyConcept {
  label: string;
  matchers: string[];
}

export interface ShortTextQuestion {
  id: string;
  dok: DokLevel;
  answerType: 'short-text';
  prompt: string;
  modelAnswer: string;
  /** Concepts the model answer expects. Rendered as a "you touched on…" list. */
  keyConcepts?: KeyConcept[];
  explanation: string;
}

export type Question = MultipleChoiceQuestion | NumericQuestion | ShortTextQuestion;

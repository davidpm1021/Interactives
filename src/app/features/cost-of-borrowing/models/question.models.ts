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

export interface ShortTextQuestion {
  id: string;
  dok: DokLevel;
  answerType: 'short-text';
  prompt: string;
  modelAnswer: string;
  explanation: string;
}

export type Question = MultipleChoiceQuestion | NumericQuestion | ShortTextQuestion;

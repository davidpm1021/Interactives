export interface VocabularyData {
  metadata: VocabularyMetadata;
  units: Unit[];
}

export interface VocabularyMetadata {
  version: string;
  generatedAt: string;
  sourceDocument: string;
  totalTerms: number;
}

export interface Unit {
  id: number;
  name: string;
  slug: string;
  terms: Term[];
}

export interface Term {
  id: string;
  term: string;
  definition: string;
  spanish: SpanishTranslation;
}

export interface SpanishTranslation {
  term: string;
  definition: string;
}

export interface Flashcard {
  term: Term;
  unitId: number;
  unitName: string;
  frontSide: 'term' | 'definition';
  isFlipped: boolean;
  isMissed: boolean;
}

export type StudyMode = 'term-first' | 'definition-first' | 'mixed';

export interface StudySession {
  cards: Flashcard[];
  currentIndex: number;
  totalCards: number;
  completedCards: number;
  missedCards: Flashcard[];
  studyMode: StudyMode;
  isSpanish: boolean;
  isReviewRound: boolean;
}

export type ViewState = 'unit-selection' | 'study-settings' | 'studying' | 'completion';

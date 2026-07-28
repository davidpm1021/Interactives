export interface FillPart {
  /** Literal text between/around blanks. */
  text?: string;
  /** Blank slot with the correct answer token. */
  blankId?: string;
  answer?: string;
}

export interface FillSentence {
  id: string;
  parts: FillPart[];
}

/**
 * Three key takeaway sentences with two blanks each, mirroring the summary
 * takeaways students used to read passively. Answers are drawn from a shared
 * word bank of the six correct tokens plus a few plausible distractors so
 * they can't succeed by clicking the first chip.
 */
export const TAKEAWAY_SENTENCES: readonly FillSentence[] = [
  {
    id: 't1',
    parts: [
      { text: 'Compound growth ' },
      { blankId: 't1-a', answer: 'accelerates' },
      { text: '. Most of the gains come in the ' },
      { blankId: 't1-b', answer: 'later' },
      { text: ' years.' },
    ],
  },
  {
    id: 't2',
    parts: [
      { text: 'A small difference in ' },
      { blankId: 't2-a', answer: 'rate' },
      { text: ' creates an enormous difference in ' },
      { blankId: 't2-b', answer: 'outcome' },
      { text: '.' },
    ],
  },
  {
    id: 't3',
    parts: [
      { blankId: 't3-a', answer: 'Time' },
      { text: ' is the most powerful variable. Starting ' },
      { blankId: 't3-b', answer: 'early' },
      { text: ' matters more than investing more later.' },
    ],
  },
];

/** Plausible-but-wrong tokens mixed into the word bank alongside the answers. */
export const TAKEAWAY_DISTRACTORS: readonly string[] = [
  'simple',
  'linear',
  'amount',
  'principal',
];

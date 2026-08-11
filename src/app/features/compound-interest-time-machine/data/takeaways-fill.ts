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

/**
 * Plausible-but-wrong tokens mixed into the word bank alongside the answers.
 *
 * A distractor has to be wrong in *every* blank, not just the one it looks
 * closest to. "amount" was replaced because "a small difference in rate
 * creates an enormous difference in amount" reads perfectly well, so students
 * reasoning correctly were being told they were wrong.
 *
 * Adjectives are the safest choice here: the blanks all want a noun or a
 * specific adverb, so an adjective cannot complete them. Avoid plausible nouns
 * like "fees" or "inflation" — both make the rate sentence *true*.
 *
 * "steady" is deliberately tempting: choosing it for "most of the gains come
 * in the ___ years" surfaces exactly the misconception the activity corrects.
 */
export const TAKEAWAY_DISTRACTORS: readonly string[] = [
  'simple',
  'linear',
  'steady',
  'principal',
];

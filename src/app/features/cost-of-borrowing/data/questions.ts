import { Question } from '../models/question.models';

/**
 * DOK-leveled questions for the Cost-of-Borrowing Data Crunch.
 *
 * If a quarterly refresh shifts rates dramatically, spot-check the numeric
 * answers below and widen the tolerance or edit values as needed.
 */
export const QUESTIONS: Question[] = [
  {
    id: 'q1-highest-rate',
    dok: 1,
    answerType: 'multiple-choice',
    prompt: 'Which product has the highest current interest rate?',
    options: ['Credit card', 'Personal loan', 'Auto loan', 'Mortgage'],
    correctIndex: 0,
    explanation:
      'Credit cards have the highest current interest rate of the four products.',
  },
  {
    id: 'q2-gap-cc-auto',
    dok: 1,
    answerType: 'numeric',
    prompt:
      'About how many percentage points higher is the current credit card APR than the current auto loan rate?',
    correctValue: 14,
    tolerance: 1,
    unit: 'points',
    explanation:
      'Credit card APRs currently run around 21% while auto loan rates are around 7%. The gap is roughly 14 percentage points.',
  },
  {
    id: 'q3-biggest-mover',
    dok: 2,
    answerType: 'short-text',
    prompt:
      'Between 2020 and 2026, which product\'s interest rate increased the most? By roughly how many percentage points did it rise?',
    modelAnswer:
      'Credit cards rose the most. The credit card rate was about 14.7% in 2020 and is now about 21%, a jump of roughly 6 percentage points. No other product on the chart moved by that much over the same window.',
    explanation:
      'Compare each product\'s 2020 value to its 2026 value on the chart or table. Credit cards moved from about 14.7% to about 21%; that is the largest jump.',
  },
  // Deliberately not another "read two values and subtract". Q2 is already
  // that shape (and is levelled DOK 1 for it), and Q3 has students compute
  // every product's change from 2020, mortgage included. This asks them to
  // read the four lines as a group across the whole 20 years and generalise,
  // which is the skill/concept work DOK 2 is meant to capture.
  //
  // The pattern holds: credit card > personal loan > {auto, mortgage} in
  // every year of the series (auto and mortgage swap places once, in 2013,
  // which doesn't disturb the secured/unsecured split). Every distractor is
  // falsifiable from the same chart — see the explanation.
  {
    id: 'q4-secured-vs-unsecured',
    dok: 2,
    answerType: 'multiple-choice',
    prompt:
      'Look at all four lines across the whole 20 years. Rates rise and fall a lot over that time. Which statement stays true anyway?',
    options: [
      'The loans backed by something you own always cost less than the ones that are not',
      'All four rates move up and down by about the same amount',
      'When mortgage rates fall, credit card rates fall too',
      'The gap between the cheapest and most expensive product stays about the same',
    ],
    correctIndex: 0,
    explanation:
      'The auto loan and the mortgage are secured, backed by the car or the house, and they sit below the credit card and personal loan in every year on the chart. The others do not hold: credit card rates swung about 10 percentage points while personal loans moved about 3; mortgage rates fell from 2006 to 2020 while credit card rates rose; and the gap between the cheapest and priciest product roughly doubled, from about 7 points to about 15.',
  },
  {
    id: 'q5-history-cc',
    dok: 3,
    answerType: 'short-text',
    prompt:
      'Look at the 20-year trend for credit cards. Rates were around 14% for most of that time and are now over 20%. What does that mean for someone who has been carrying a credit card balance the last few years?',
    modelAnswer:
      'The cost of carrying a balance has climbed sharply. Someone who is only paying the minimum is now paying much more in interest each month than they were a few years ago, which makes it even harder to pay off the balance. Paying it down aggressively, or moving it to a lower-rate product, is worth more than it used to be.',
    explanation:
      'Focus on the practical impact: higher interest means more of each payment goes to interest instead of principal, so balances shrink slower unless the person pays more.',
  },
];

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
  // Deliberately looks at 2006-2020, not 2020-now. Q3 already has students
  // compute every product's 2020-to-now change in order to find the biggest
  // mover, mortgage included, so asking for that same figure again here was
  // arithmetic they had just done. The earlier window is a fall rather than a
  // rise and covers the fourteen years Q3 never touches.
  {
    id: 'q4-mortgage-decline',
    dok: 2,
    answerType: 'numeric',
    prompt:
      'Before it started climbing, the 30-year mortgage rate spent years falling. By roughly how many percentage points did it drop between 2006 and its 2020 low?',
    correctValue: 3.5,
    tolerance: 1,
    unit: 'points',
    explanation:
      'The mortgage line starts around 6.2% in 2006 and bottoms out around 2.7% in 2020, a fall of roughly 3.5 percentage points. Rates moved in both directions over these 20 years, not just up.',
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

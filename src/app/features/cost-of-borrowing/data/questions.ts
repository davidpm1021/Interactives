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
      'Credit cards top the list. Take a look at the rate table to see how far above the others they sit. You will unpack why in a later question.',
  },
  {
    id: 'q2-gap-cc-auto',
    dok: 1,
    answerType: 'numeric',
    prompt:
      'About how many percentage points higher is the current credit card APR than the current auto loan rate?',
    correctValue: 14,
    tolerance: 3,
    unit: 'points',
    explanation:
      'Credit card APRs currently run around 21% while auto loan rates are around 7%. The gap is roughly 14 percentage points. Anything within 3 counts as a good read of the data.',
  },
  {
    id: 'q3-why-higher',
    dok: 2,
    answerType: 'short-text',
    prompt:
      'In one sentence, explain why credit cards typically charge higher interest rates than auto loans.',
    modelAnswer:
      'An auto loan is secured by the car itself (the bank can repossess it if you stop paying), while a credit card is unsecured, so the bank charges more to cover the risk of not getting repaid.',
    keyConcepts: [
      { label: 'Secured vs. unsecured', matchers: ['secured', 'unsecured'] },
      { label: 'Collateral (the car)', matchers: ['collateral', 'car', 'vehicle', 'repossess'] },
      { label: 'Risk to the lender', matchers: ['risk', 'default', 'not get paid', "won't get paid", "won't be paid", 'lose money'] },
    ],
    explanation:
      'The word to look for is "secured" or "collateral." Auto loans have collateral (the car). Credit cards do not.',
  },
  {
    id: 'q4-cc-interest-year',
    dok: 2,
    answerType: 'numeric',
    prompt:
      'If you borrowed $2,000 on a credit card at 21% APR and paid only $50 per month, roughly how much would you pay in interest over one year?',
    correctValue: 380,
    tolerance: 80,
    unit: '$',
    explanation:
      'A rough estimate: $50/month barely covers the interest, so the balance stays close to $2,000 all year. Roughly $2,000 × 21% ≈ $420, minus a bit because the balance does shrink slightly. About $350 to $450 is a reasonable answer.',
  },
  {
    id: 'q5-history-cc',
    dok: 3,
    answerType: 'short-text',
    prompt:
      'Look at the 20-year trend for credit cards. Rates were around 14% for most of that time and are now over 20%. What does that mean for someone who has been carrying a credit card balance the last few years?',
    modelAnswer:
      'The cost of carrying a balance has climbed sharply. Someone who is only paying the minimum is now paying much more in interest each month than they were a few years ago, which makes it even harder to pay off the balance. Paying it down aggressively, or moving it to a lower-rate product, is worth more than it used to be.',
    keyConcepts: [
      { label: 'Higher interest cost', matchers: ['higher', 'more interest', 'costs more', 'more expensive', 'sharp', 'sharply', 'climbed', 'increased', 'grown'] },
      { label: 'Balance is harder to pay off', matchers: ['harder to pay', 'takes longer', 'longer to pay', 'shrinks slower', 'hard to pay off', 'stuck', "can't pay off"] },
      { label: 'Action: pay down faster', matchers: ['pay down', 'pay off', 'pay more', 'minimum', 'aggressive', 'transfer', 'lower rate', 'consolid', 'refinanc'] },
    ],
    explanation:
      'Focus on the practical impact: higher interest means more of each payment goes to interest instead of principal, so balances shrink slower unless the person pays more.',
  },
];

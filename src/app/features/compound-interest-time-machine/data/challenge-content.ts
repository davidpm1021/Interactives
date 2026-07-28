export interface ChallengeOption {
  id: string;
  label: string;
}

export interface ChallengeContent {
  title: string;
  setup: string;
  setupDetail?: string;
  predictPrompt?: string;
  predictPrompt10?: string;
  predictPrompt40?: string;
  revealButton?: string;
  options?: ChallengeOption[];
  reflectInsight?: string;
  reflectInsightAccurate?: string;
  inputPrompts?: Record<string, string>;
  waitToggle?: string;
}

export const CHALLENGE_CONTENT: Record<string, ChallengeContent> = {
  challenge1: {
    title: 'The Guess',
    setup:
      'Your friend receives $1,000 as a graduation gift. They invest it and earn 7% interest every year. They don\'t add any more money. They just let it sit.',
    predictPrompt10: 'Where do you think the balance will be at Year 10?',
    predictPrompt40: 'Now, where do you think it will be at Year 40?',
    revealButton: 'Show me reality',
    reflectInsight:
      'The growth looks slow at first, then accelerates. That\'s the "compound" effect. Your money doesn\'t just earn interest. It earns interest on the interest.',
    reflectInsightAccurate:
      'Impressive. Most people guess way lower. But did you expect it to curve like that? The growth isn\'t steady. It accelerates.',
  },
  challenge2: {
    title: 'Does Double the Rate Mean Double the Money?',
    setup: 'Same $1,000. Same 40 years. One account earns 5%. The other earns 10%, exactly double the rate.',
    predictPrompt:
      'If the rate doubles, how much more money do you end up with after 40 years?',
    options: [
      { id: 'A', label: 'About 2x (double)' },
      { id: 'B', label: 'About 3x' },
      { id: 'C', label: 'About 4-5x' },
      { id: 'D', label: 'About 6-7x' },
      { id: 'E', label: 'About 8-10x' },
      { id: 'F', label: 'More than 10x' },
    ],
    revealButton: 'Show me',
    reflectInsight:
      'Doubling the rate didn\'t double the outcome. It did way more than that. With compound interest, small rate differences get magnified over time. That\'s why it\'s worth knowing what different accounts and investments actually earn.',
  },
  challenge3: {
    title: 'The Power of Adding a Little',
    setup:
      'Remember that $1,000 at 7% for 40 years? It grew to about $14,974 on its own. Now let\'s add $100 every month, like a small automatic transfer from a paycheck. Over 40 years, that\'s $49,000 of your own money on top of the original $1,000.',
    predictPrompt:
      'Combined with compound interest, how much do you think you\'ll end up with?',
    revealButton: 'Show me',
    reflectInsight:
      '$100/month is about $3.30/day. Compound interest turned $49,000 of your money into over $260,000. That\'s the power of consistent investing over time.',
  },
  challenge4: {
    title: 'The Cost of Waiting',
    setup:
      'Meet Alex and Jordan. Both invest $200/month at 7%. Same plan, same discipline. The only difference is when they start.',
    setupDetail:
      'Alex starts at age 22. Jordan starts at age 32, just 10 years later. Both invest until age 62.',
    predictPrompt:
      'Alex puts in $24,000 more than Jordan. How much more does Alex end up with?',
    options: [
      { id: 'A', label: 'About $24,000 more (just the extra contributions)' },
      { id: 'B', label: 'About $50,000 more' },
      { id: 'C', label: 'About $100,000 more' },
      { id: 'D', label: 'About $200,000 more' },
      { id: 'E', label: 'More than $200,000 more' },
    ],
    revealButton: 'Show me',
    reflectInsight:
      'Jordan didn\'t do anything wrong. They invested consistently for 30 years. But those first 10 years of compound growth are the most valuable years you\'ll ever have. Every dollar has the longest time to multiply. That\'s time you can never get back.',
  },
  challenge5: {
    title: 'Your Time Machine',
    setup: 'Now it\'s your turn. Use what you\'ve learned to explore your own future.',
    inputPrompts: {
      principal: 'How much could you start with?',
      contribution: 'How much could you set aside each month?',
      rate: 'What growth rate do you expect?',
      rateHelper: 'The stock market has historically averaged about 7-10% per year',
      startAge: 'When do you want to start?',
      endAge: 'When do you want this money?',
    },
    waitToggle: 'What if I wait 5 years?',
  },
  summary: {
    title: 'Your Results',
    setup: '',
    reflectInsight:
      'Compound growth accelerates over time. Rate matters more than you expect. And time is the most powerful variable of all.',
  },
} as const;

export const SUMMARY_TAKEAWAYS = [
  'Compound growth accelerates. Most of the gains come in the later years.',
  'A small difference in rate creates an enormous difference in outcome.',
  'Time is the most powerful variable. Starting early matters more than investing more later.',
] as const;

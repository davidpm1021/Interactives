export interface ChallengeOption {
  id: string;
  label: string;
  /**
   * Numeric interpretation of the option used for guess previews. For
   * Challenge 2 (double the rate) it's the multiple of the baseline. Not all
   * options carry one — Challenge 4 uses dollar amounts framed in the label.
   */
  multiple?: number;
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
  /** Optional open-ended prompt shown in the reflect card to nudge synthesis. */
  reflectPrompt?: string;
  inputPrompts?: Record<string, string>;
  waitToggle?: string;
}

export const CHALLENGE_CONTENT: Record<string, ChallengeContent> = {
  challenge1: {
    title: 'The Guess',
    setup:
      'Your friend receives $1,000 as a graduation gift. They invest it and earn a {{rate}} return every year. They don\'t add any more money. They just let it sit.',
    predictPrompt10: 'Where do you think the balance will be at Year 10?',
    predictPrompt40: 'Now, where do you think it will be at Year 40?',
    revealButton: 'Show me reality',
    reflectInsight:
      'The growth looks slow at first, then accelerates. That\'s the "compound" effect. Your money doesn\'t just earn interest. It earns interest on the interest.',
    reflectInsightAccurate:
      'Impressive. Most people guess way lower. But did you expect it to curve like that? The growth isn\'t steady. It accelerates.',
    // Not "what surprised you": a student whose guess was close gets told they
    // were surprised when they weren't. Review: "in case anyone was correct."
    reflectPrompt:
      'What did you notice about how the curve grew? Did anything surprise you?',
  },
  challenge2: {
    title: 'Does Double the Rate of Return Mean Double the Money?',
    setup: 'Same $1,000. Same 40 years. One account earns a 5% return. The other earns 10%, exactly double the rate of return.',
    predictPrompt:
      'If the rate of return doubles, how much bigger is the final balance after 40 years?',
    options: [
      { id: 'A', label: 'About 2x (double)', multiple: 2 },
      { id: 'B', label: 'About 3x', multiple: 3 },
      { id: 'C', label: 'About 4-5x', multiple: 4.5 },
      { id: 'D', label: 'About 6-7x', multiple: 6.5 },
      { id: 'E', label: 'About 8-10x', multiple: 9 },
      { id: 'F', label: 'More than 10x', multiple: 12 },
    ],
    revealButton: 'Show me',
    reflectInsight:
      'Doubling the rate of return didn\'t double the outcome. It did way more than that. With compound interest, small differences in return get magnified over time. That\'s why it\'s worth knowing what different accounts and investments actually earn.',
    reflectPrompt:
      'In your own words: why does doubling the rate of return more than double the final balance?',
  },
  challenge3: {
    title: 'The Power of Adding a Little',
    setup:
      // Short by design. The scenario table below carries the figures; review
      // found the prose version too easy to skim past before guessing.
      'Same $1,000. Same 40 years. The only thing that changes is adding $100 every month, like a small automatic transfer from a paycheck.',
    predictPrompt: 'Fill in the missing number: what does it grow to?',
    revealButton: 'Show me',
    // Deliberately omits the "$3.30/day" framing and "of your money": review
    // found both read as sales-y and potentially out of touch for
    // lower-income students.
    reflectInsight:
      'Compound interest turned $49,000 into {{c3Final}}. That\'s the power of consistent investing over time.',
    reflectPrompt:
      'What does this make you want to change (or keep doing) with your own money?',
  },
  // NOTE: Challenge 4 is deliberately pinned to 7% rather than the randomized
  // session rate. The "$24,000 more" framing and the dollar-denominated answer
  // options below are calibrated to a 7% outcome (Alex ends ~$281k ahead, so
  // option E is correct). At 5% the gap is ~$139k, which falls between options
  // C and D with no correct answer.
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
    reflectPrompt:
      'What would you tell a friend who says "I\'ll just start investing later"?',
  },
  challenge5: {
    title: 'Your Time Machine',
    setup: 'Now it\'s your turn. Adjust the inputs, press Play to watch your money grow, then click Finish when you\'re done exploring.',
    inputPrompts: {
      principal: 'How much could you start with?',
      contribution: 'How much could you invest each month?',
      rate: 'What rate of return do you expect?',
      rateHelper:
        'The stock market has historically averaged about 7-10% per year before inflation',
      startAge: 'When do you want to start?',
      endAge: 'When do you want this money?',
    },
    waitToggle: 'What if I wait 5 years?',
  },
  summary: {
    title: 'Your Results',
    setup: '',
    reflectInsight:
      'Compound growth accelerates over time. Your rate of return matters more than you expect. And time is the most powerful variable of all.',
  },
} as const;


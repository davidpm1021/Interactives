export type GamePhase = 'intro' | 'hub' | 'challenge' | 'summary';

export interface ScoreTier {
  readonly minScore: number;
  readonly maxScore: number;
  readonly title: string;
  readonly description: string;
}

export const SCORE_TIERS: readonly ScoreTier[] = [
  {
    minScore: 9,
    maxScore: 10,
    title: 'Dark Pattern Detective',
    description: "Corporations hate this one weird trick: you actually read things.",
  },
  {
    minScore: 7,
    maxScore: 8,
    title: 'Privacy Pro',
    description: "You caught most of the tricks. The ones you missed? Yeah, they get everybody.",
  },
  {
    minScore: 5,
    maxScore: 6,
    title: 'Getting Wiser',
    description: "You fell for some classics. Don't feel bad \u2014 billion-dollar companies designed them to get you.",
  },
  {
    minScore: 0,
    maxScore: 4,
    title: 'Easy Target',
    description:
      "Hey, at least you're honest. But now that you've seen the tricks, good luck ever clicking \"Accept All\" with a clear conscience again.",
  },
];

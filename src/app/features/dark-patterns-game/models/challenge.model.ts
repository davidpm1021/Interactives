export type DarkPatternKey =
  | 'confirmshaming'
  | 'misdirection'
  | 'preselection'
  | 'hidden-costs'
  | 'false-urgency'
  | 'trick-questions'
  | 'hidden-subscription'
  | 'roach-motel'
  | 'forced-continuity'
  | 'disguised-ads';

export type ChallengeOutcome = 'pass' | 'partial-fail' | 'full-fail';

export interface Act {
  readonly id: number;
  readonly title: string;
  readonly timeOfDay: string;
  readonly subtitle: string;
  readonly description: string;
  readonly accentColor: string;
}

export interface ChallengeDefinition {
  readonly id: string;
  readonly actId: number;
  readonly title: string;
  readonly taskLabel: string;
  readonly darkPatterns: readonly DarkPatternKey[];
  readonly setupText: string;
  readonly correctActionDescription: string;
  readonly failConsequence: string;
  readonly partialFailConsequence?: string;
  readonly financialImpact: number;
  readonly financialNote?: string;
  readonly realWorldCallout: string;
  readonly hasPartialFail: boolean;
}

export interface ChallengeResult {
  readonly challengeId: string;
  readonly outcome: ChallengeOutcome;
  readonly financialDamage: number;
  readonly patternsEncountered: readonly DarkPatternKey[];
}

export interface GlossaryEntry {
  readonly key: DarkPatternKey;
  readonly name: string;
  readonly definition: string;
  readonly financialConnection: string;
}

import { Component, computed, input, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  ChallengeDefinition,
  ChallengeResult,
  DarkPatternKey,
  GlossaryEntry,
} from '../../models/challenge.model';
import { ScoreTier } from '../../models/game-state.model';
import { CHALLENGES } from '../../data/challenges';
import { GLOSSARY } from '../../data/glossary';

type RevealStep = 'done' | 'wait' | 'receipt' | 'reveal' | 'tips';

interface DamageLineItem {
  title: string;
  amount: number;
  outcome: string;
}

@Component({
  selector: 'app-summary-screen',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './summary-screen.html',
  styleUrl: './summary-screen.scss',
})
export class SummaryScreen {
  readonly results = input.required<readonly ChallengeResult[]>();
  readonly passCount = input.required<number>();
  readonly totalChallenges = input.required<number>();
  readonly totalDamage = input.required<number>();
  readonly scoreTier = input.required<ScoreTier>();
  readonly discoveredPatterns = input.required<ReadonlySet<DarkPatternKey>>();
  readonly playAgain = output<void>();

  protected readonly revealStep = signal<RevealStep>('done');

  protected readonly scorePercent = computed(
    () => (this.passCount() / this.totalChallenges()) * 100,
  );

  protected readonly damageReport = computed<DamageLineItem[]>(() => {
    return this.results()
      .filter((r) => r.financialDamage > 0)
      .map((r) => {
        const def = CHALLENGES.find((c) => c.id === r.challengeId);
        return {
          title: def?.title ?? r.challengeId,
          amount: r.financialDamage,
          outcome: r.outcome === 'partial-fail' ? 'Partial' : 'Failed',
        };
      });
  });

  protected readonly glossaryEntries = computed<GlossaryEntry[]>(() => {
    const entries: GlossaryEntry[] = [];
    for (const [, entry] of GLOSSARY) {
      entries.push(entry);
    }
    return entries;
  });

  protected readonly tips: readonly string[] = [
    'The tiniest, ugliest button on the screen is usually the one that protects you. Funny how that works.',
    'If a box is pre-checked, a designer somewhere is hoping you won\'t uncheck it. Disappoint them.',
    'The moment you sign up for a "free trial," set a calendar reminder to cancel. Your future self will thank you.',
    'If canceling a subscription takes more steps than signing up, that\'s not an accident \u2014 it\'s a strategy.',
    'If a checkbox sentence contains "not" or "un-," read it three times. They\'re banking on you reading it zero.',
    'Check your bank statements monthly. Surprise charges are only a surprise if you\'re not looking.',
  ];

  protected isPatternTripped(key: DarkPatternKey): boolean {
    return this.results().some(
      (r) =>
        r.outcome !== 'pass' && r.patternsEncountered.includes(key),
    );
  }

  protected advance(): void {
    const order: RevealStep[] = ['done', 'wait', 'receipt', 'reveal', 'tips'];
    const current = this.revealStep();
    const idx = order.indexOf(current);
    if (idx < order.length - 1) {
      this.revealStep.set(order[idx + 1]);
    }
  }

  protected get isLastStep(): boolean {
    return this.revealStep() === 'tips';
  }
}

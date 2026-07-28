import { Component, computed, input, output, signal } from '@angular/core';

interface ConceptStep {
  /** Year the step is illustrating (0 = principal only). */
  year: number;
  /** Total balance shown that step. */
  balance: number;
  /** Interest earned THAT year (0 for year 0). */
  interestThisYear: number;
  /** Story text — the "why". */
  narrative: string;
}

/**
 * Pre-guess concept demo: shows $1 at 10% for 3 years so students see the
 * "interest earns interest" mechanic before Challenge 1's hockey-stick reveal.
 * Uses simple SVG stacked bars (principal vs. accumulated interest) rather
 * than d3, because the numbers are so small and the point is qualitative.
 */
@Component({
  selector: 'app-concept-demo',
  standalone: true,
  imports: [],
  templateUrl: './concept-demo.component.html',
  styleUrl: './concept-demo.component.scss',
})
export class ConceptDemoComponent {
  readonly canGoBack = input(false);
  readonly finish = output<void>();
  readonly goBack = output<void>();

  protected readonly stepIndex = signal(0);

  protected readonly steps: readonly ConceptStep[] = [
    {
      year: 0,
      balance: 1.0,
      interestThisYear: 0,
      narrative:
        'You start with $1. Imagine you put it in an account that pays 10% every year.',
    },
    {
      year: 1,
      balance: 1.1,
      interestThisYear: 0.1,
      narrative:
        'After year 1, you\'ve earned 10 cents. Now you have $1.10. Simple so far.',
    },
    {
      year: 2,
      balance: 1.21,
      interestThisYear: 0.11,
      narrative:
        'After year 2, you earn 11 cents instead of 10. Why? You\'re earning 10% on $1.10, not on $1. That extra cent is interest earning interest. That\'s what makes it "compound".',
    },
    {
      year: 3,
      balance: 1.33,
      interestThisYear: 0.12,
      narrative:
        'After year 3, you earn 12 cents. Small amounts here. But now imagine this happens for 40 years, on more than a dollar. That\'s the story you\'re about to explore.',
    },
  ];

  protected readonly currentStep = computed(() => this.steps[this.stepIndex()]);
  protected readonly isFirstStep = computed(() => this.stepIndex() === 0);
  protected readonly isLastStep = computed(() => this.stepIndex() === this.steps.length - 1);

  /** Bar heights, normalized to the max final balance (1.33). Percent height. */
  protected readonly bars = computed(() => {
    const max = this.steps[this.steps.length - 1].balance;
    const shownUpTo = this.stepIndex();
    return this.steps.map((step, i) => {
      const shown = i <= shownUpTo;
      const principalPct = shown ? (1 / max) * 100 : 0;
      const interestPct = shown ? ((step.balance - 1) / max) * 100 : 0;
      return {
        year: step.year,
        principalPct,
        interestPct,
        highlight: i === shownUpTo,
        shown,
      };
    });
  });

  protected onNext(): void {
    if (this.isLastStep()) {
      this.finish.emit();
    } else {
      this.stepIndex.update((i) => i + 1);
    }
  }

  protected onPrevStep(): void {
    if (this.stepIndex() > 0) {
      this.stepIndex.update((i) => i - 1);
    }
  }

  protected onBack(): void {
    this.goBack.emit();
  }
}

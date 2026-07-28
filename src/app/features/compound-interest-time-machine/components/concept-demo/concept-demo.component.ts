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

  /**
   * Uses $100 (not $1) as the principal so the yearly interest chunks are
   * $10 / $11 / $12.10 — big enough to actually SEE the sliver grow. The
   * pedagogy (interest earns interest) is identical to the $1 case; the
   * numbers just render as meaningful bar segments instead of hairlines.
   */
  protected readonly steps: readonly ConceptStep[] = [
    {
      year: 0,
      balance: 100,
      interestThisYear: 0,
      narrative:
        'You start with $100. Imagine you put it in an account that pays 10% every year.',
    },
    {
      year: 1,
      balance: 110,
      interestThisYear: 10,
      narrative:
        'After year 1, you\'ve earned $10. Now you have $110. Simple so far.',
    },
    {
      year: 2,
      balance: 121,
      interestThisYear: 11,
      narrative:
        'After year 2, you earn $11 instead of $10. Why? You\'re earning 10% on $110, not on $100. That extra dollar is interest earning interest. That\'s what makes it "compound".',
    },
    {
      year: 3,
      balance: 133.1,
      interestThisYear: 12.1,
      narrative:
        'After year 3, you earn about $12. Small amounts at first. Now imagine this same effect running for 40 years, on more than $100. That\'s the story you\'re about to explore.',
    },
  ];

  protected readonly currentStep = computed(() => this.steps[this.stepIndex()]);
  protected readonly isFirstStep = computed(() => this.stepIndex() === 0);
  protected readonly isLastStep = computed(() => this.stepIndex() === this.steps.length - 1);

  /** Bar heights, normalized to the max final balance. Percent height. */
  protected readonly bars = computed(() => {
    const principal = this.steps[0].balance;
    const max = this.steps[this.steps.length - 1].balance;
    const shownUpTo = this.stepIndex();
    return this.steps.map((step, i) => {
      const shown = i <= shownUpTo;
      const principalPct = shown ? (principal / max) * 100 : 0;
      const interestPct = shown ? ((step.balance - principal) / max) * 100 : 0;
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

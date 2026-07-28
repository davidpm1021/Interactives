import { Component, computed, inject, signal, effect, ElementRef, Injector, afterNextRender } from '@angular/core';
import { DecimalPipe, CurrencyPipe } from '@angular/common';
import { TopHeader } from '../../shared/top-header/top-header';
import { CompoundInterestService } from './services/compound-interest.service';
import { ChallengeStateService } from './services/challenge-state.service';
import { ChallengeProgressComponent } from './components/challenge-progress/challenge-progress.component';
import { ChallengeIntroComponent } from './components/challenge-intro/challenge-intro.component';
import { ReflectCardComponent } from './components/reflect-card/reflect-card.component';
import { RevealStatsComponent } from './components/reveal-stats/reveal-stats.component';
import { PredictionChartComponent } from './components/prediction-chart/prediction-chart.component';
import { PredictionChoiceComponent } from './components/prediction-choice/prediction-choice.component';
import { PredictionInputComponent } from './components/prediction-input/prediction-input.component';
import { RevealChartComponent } from './components/reveal-chart/reveal-chart.component';
import { SandboxComponent } from './components/sandbox/sandbox.component';
import { FinalSummaryComponent } from './components/final-summary/final-summary.component';
import { IntroComponent } from './components/intro/intro.component';
import { ConceptDemoComponent } from './components/concept-demo/concept-demo.component';
import { CHALLENGE_CONTENT, ChallengeContent } from './data/challenge-content';
import { ChallengeId, ChallengePredictions, PredictionPoint } from './models/compound-interest.models';
import { formatCurrency, formatPercent } from './utils/formatters';

@Component({
  selector: 'app-compound-interest-time-machine',
  standalone: true,
  imports: [
    DecimalPipe,
    CurrencyPipe,
    TopHeader,
    ChallengeProgressComponent,
    ChallengeIntroComponent,
    ReflectCardComponent,
    RevealStatsComponent,
    PredictionChartComponent,
    PredictionChoiceComponent,
    PredictionInputComponent,
    RevealChartComponent,
    SandboxComponent,
    FinalSummaryComponent,
    IntroComponent,
    ConceptDemoComponent,
  ],
  providers: [ChallengeStateService],
  templateUrl: './compound-interest-time-machine.html',
  styleUrl: './compound-interest-time-machine.scss',
})
export class CompoundInterestTimeMachine {
  protected readonly title = 'Compound Interest Time Machine';
  private readonly service = inject(CompoundInterestService);
  protected readonly stateService = inject(ChallengeStateService);
  private readonly elementRef = inject(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly liveAnnouncement = signal('');
  protected readonly challengeContent = CHALLENGE_CONTENT;

  // ── Derived state ──────────────────────────────────

  protected readonly currentChallenge = this.stateService.currentChallenge;
  protected readonly currentPhase = this.stateService.currentPhase;
  protected readonly completedChallenges = this.stateService.completedChallenges;
  protected readonly predictions = this.stateService.predictions;
  protected readonly showingSummary = this.stateService.showingSummary;
  protected readonly showingIntro = this.stateService.showingIntro;
  protected readonly showingConcept = this.stateService.showingConcept;
  protected readonly canGoBack = this.stateService.canGoBack;
  protected readonly reflections = this.stateService.reflections;

  protected readonly sessionRate = this.stateService.sessionRate;

  // ── Challenge results (computed from service) ──────

  protected readonly challenge1Result = computed(() => this.service.calculateChallenge1(this.sessionRate()));
  protected readonly challenge2LowResult = computed(() => this.service.calculateChallenge2Low());
  protected readonly challenge2HighResult = computed(() => this.service.calculateChallenge2High());
  protected readonly challenge3Result = computed(() => this.service.calculateChallenge3(this.sessionRate()));
  protected readonly challenge4EarlyResult = computed(() => this.service.calculateChallenge4Early(this.sessionRate()));
  protected readonly challenge4LateResult = computed(() => this.service.calculateChallenge4Late(this.sessionRate()));

  protected readonly currentContent = computed<ChallengeContent>(() => {
    const raw = CHALLENGE_CONTENT[`challenge${this.currentChallenge()}`];
    return this.interpolate(raw);
  });

  private interpolate(content: ChallengeContent): ChallengeContent {
    const tokens: Record<string, string> = {
      '{{rate}}': formatPercent(this.sessionRate()),
      '{{c1Final}}': formatCurrency(Math.round(this.challenge1Result().summary.finalBalance)),
      '{{c3Final}}': formatCurrency(Math.round(this.challenge3Result().summary.finalBalance)),
    };
    const swap = (s: string | undefined): string | undefined =>
      s === undefined ? s : Object.entries(tokens).reduce((acc, [k, v]) => acc.split(k).join(v), s);
    return {
      ...content,
      setup: swap(content.setup) ?? '',
      setupDetail: swap(content.setupDetail),
      predictPrompt: swap(content.predictPrompt),
      predictPrompt10: swap(content.predictPrompt10),
      predictPrompt40: swap(content.predictPrompt40),
      reflectInsight: swap(content.reflectInsight),
      reflectInsightAccurate: swap(content.reflectInsightAccurate),
      reflectPrompt: swap(content.reflectPrompt),
    };
  }

  // ── Challenge 1 specifics ──────────────────────────

  protected readonly challenge1PredictionPoints = signal<PredictionPoint[]>([]);
  protected readonly challenge1Ready = signal(false);

  protected readonly challenge1Accurate = computed(() => {
    const guess = this.predictions().challenge1Year40;
    if (guess == null) return false;
    const actual = this.challenge1Result().summary.finalBalance;
    return Math.abs(guess - actual) / actual <= 0.2;
  });

  // ── Challenge 1 insight text ───────────────────────

  protected readonly challenge1Insight = computed(() => {
    const content = CHALLENGE_CONTENT['challenge1'];
    return this.challenge1Accurate()
      ? content.reflectInsightAccurate ?? content.reflectInsight ?? ''
      : content.reflectInsight ?? '';
  });

  constructor() {
    effect(() => {
      const challenge = this.currentChallenge();
      const phase = this.currentPhase();
      this.liveAnnouncement.set(`Challenge ${challenge}, ${phase} phase`);

      if (phase === 'intro') return;

      afterNextRender(
        () => {
          const heading = this.elementRef.nativeElement.querySelector('h2');
          if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus();
          }
        },
        { injector: this.injector },
      );
    });
  }

  // ── Actions ────────────────────────────────────────

  protected onStartConcept(): void {
    this.stateService.startConcept();
  }

  protected onConceptFinished(): void {
    this.stateService.advanceFromConcept();
  }

  protected onReflection(promptId: string, text: string): void {
    this.stateService.saveReflection(promptId, text);
  }

  protected onSubmitPrediction(predictions: Partial<ChallengePredictions>): void {
    this.stateService.submitPrediction(predictions);
  }

  protected onAdvanceToReflect(): void {
    this.stateService.advanceToReflect();
  }

  protected onNextChallenge(): void {
    this.stateService.advanceToNextChallenge();
  }

  protected onFinishSandbox(): void {
    this.stateService.finishSandbox();
  }

  protected onGoBack(): void {
    this.stateService.goBack();
  }

  // ── Challenge 1 handlers ────────────────────────────

  protected onChallenge1PredictionChange(points: PredictionPoint[]): void {
    this.challenge1PredictionPoints.set(points);
  }

  protected onChallenge1AllLocked(): void {
    this.challenge1Ready.set(true);
  }

  protected onChallenge1ShowMe(): void {
    const points = this.challenge1PredictionPoints();
    const year10 = points.find((p) => p.year === 10)?.value;
    const year40 = points.find((p) => p.year === 40)?.value;
    this.stateService.submitPrediction({
      challenge1Year10: year10,
      challenge1Year40: year40,
    });
  }

  // ── Challenge 2 specifics ──────────────────────────

  protected readonly challenge2Selection = signal<string | null>(null);
  protected readonly challenge2Ready = computed(() => this.challenge2Selection() !== null);

  protected readonly challenge2Ratio = computed(() => {
    const low = this.challenge2LowResult().summary.finalBalance;
    const high = this.challenge2HighResult().summary.finalBalance;
    return low > 0 ? high / low : 0;
  });

  protected readonly challenge2Insight = computed(() => {
    const ratio = this.challenge2Ratio();
    const ratioText = `${ratio.toFixed(1)}x`;
    return `The rate doubled, but the outcome didn't just double. The 10% account ended up with ${ratioText} as much as the 5% account. With compound interest, small rate differences get magnified over time. After year one, the 10% account is only $50 ahead. But that $50 earns interest too, and so does every dollar of interest after it. The gap widens by more each year until "twice as much" becomes ${ratioText} at the finish line.`;
  });

  protected onChallenge2Select(id: string): void {
    this.challenge2Selection.set(id);
  }

  protected onChallenge2ShowMe(): void {
    this.stateService.submitPrediction({
      challenge2RateGuess: this.challenge2Selection() ?? undefined,
    });
  }

  // ── Challenge 3 specifics ──────────────────────────

  protected readonly challenge3Guess = signal<number | null>(null);
  protected readonly challenge3Ready = computed(() => this.challenge3Guess() !== null);

  protected onChallenge3Input(value: number): void {
    this.challenge3Guess.set(value);
  }

  protected onChallenge3ShowMe(): void {
    this.stateService.submitPrediction({
      challenge3ContributionGuess: this.challenge3Guess() ?? undefined,
    });
  }

  // ── Challenge 4 specifics ──────────────────────────

  protected readonly challenge4Selection = signal<string | null>(null);
  protected readonly challenge4Ready = computed(() => this.challenge4Selection() !== null);

  protected readonly challenge4Gap = computed(() => {
    return this.challenge4EarlyResult().summary.finalBalance -
      this.challenge4LateResult().summary.finalBalance;
  });

  protected readonly challenge4GuessLabel = computed(() => {
    const id = this.predictions().challenge4WaitGuess;
    if (!id) return null;
    const opt = CHALLENGE_CONTENT['challenge4'].options?.find((o) => o.id === id);
    return opt?.label ?? null;
  });

  protected onChallenge4Select(id: string): void {
    this.challenge4Selection.set(id);
  }

  protected onChallenge4ShowMe(): void {
    this.stateService.submitPrediction({
      challenge4WaitGuess: this.challenge4Selection() as 'A' | 'B' | 'C' | 'D' | 'E',
    });
  }

  // ── Shared helpers ────────────────────────────────

  protected getReflectInsight(): string {
    const c = this.currentChallenge();
    if (c === 1) return this.challenge1Insight();
    if (c === 2) return this.challenge2Insight();
    // Use currentContent (interpolated) rather than raw CHALLENGE_CONTENT so
    // tokens like {{c3Final}} render as the actual dollar figure.
    return this.currentContent().reflectInsight ?? '';
  }
}

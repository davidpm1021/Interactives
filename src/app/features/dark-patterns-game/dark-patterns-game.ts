import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { GameStateService } from './services/game-state.service';
import { IntroScreen } from './components/intro-screen/intro-screen';
import { HubScreen } from './components/hub-screen/hub-screen';
import { SummaryScreen } from './components/summary-screen/summary-screen';
import { NotificationPopup } from './components/challenges/notification-popup/notification-popup';
import { CookieBanner } from './components/challenges/cookie-banner/cookie-banner';
import { AccountSignup } from './components/challenges/account-signup/account-signup';
import { FalseUrgency } from './components/challenges/false-urgency/false-urgency';
import { HiddenCosts } from './components/challenges/hidden-costs/hidden-costs';
import { PostPurchaseUpsell } from './components/challenges/post-purchase-upsell/post-purchase-upsell';
import { FreeTrialSignup } from './components/challenges/free-trial-signup/free-trial-signup';
import { CancellationFlow } from './components/challenges/cancellation-flow/cancellation-flow';
import { BankSignup } from './components/challenges/bank-signup/bank-signup';
import { PrivacySettings } from './components/challenges/privacy-settings/privacy-settings';
import { ChallengeOutcome } from './models/challenge.model';

@Component({
  selector: 'app-dark-patterns-game',
  standalone: true,
  imports: [
    TopHeader,
    IntroScreen,
    HubScreen,
    SummaryScreen,
    NotificationPopup,
    CookieBanner,
    AccountSignup,
    FalseUrgency,
    HiddenCosts,
    PostPurchaseUpsell,
    FreeTrialSignup,
    CancellationFlow,
    BankSignup,
    PrivacySettings,
  ],
  providers: [GameStateService],
  templateUrl: './dark-patterns-game.html',
  styleUrl: './dark-patterns-game.scss',
})
export class DarkPatternsGame {
  private readonly gameState = inject(GameStateService);

  protected readonly phase = this.gameState.phase;
  protected readonly currentChallenge = this.gameState.currentChallenge;
  protected readonly activeChallengeId = this.gameState.activeChallengeId;
  protected readonly completedChallengeIds = this.gameState.completedChallengeIds;
  protected readonly results = this.gameState.results;
  protected readonly totalChallenges = this.gameState.totalChallenges;
  protected readonly passCount = this.gameState.passCount;
  protected readonly totalFinancialDamage = this.gameState.totalFinancialDamage;
  protected readonly scoreTier = this.gameState.scoreTier;
  protected readonly discoveredPatterns = this.gameState.discoveredPatterns;

  protected readonly liveAnnouncement = signal('');

  private readonly phaseRegion = viewChild<ElementRef<HTMLElement>>('phaseRegion');

  constructor() {
    effect(() => {
      const phase = this.phase();
      const el = this.phaseRegion()?.nativeElement;
      if (el) {
        setTimeout(() => {
          const focusTarget = el.querySelector<HTMLElement>('[autofocus], h1, h2, button');
          focusTarget?.focus();
        });
      }
      if (phase === 'summary') {
        this.liveAnnouncement.set('All tasks complete. Showing your results.');
      }
    });
  }

  protected onStart(): void {
    this.gameState.startGame();
  }

  protected onSelectChallenge(id: string): void {
    this.gameState.startChallenge(id);
  }

  protected onSubmitResult(outcome: ChallengeOutcome): void {
    this.gameState.submitResult(outcome);
  }

  protected onPlayAgain(): void {
    this.gameState.reset();
  }
}

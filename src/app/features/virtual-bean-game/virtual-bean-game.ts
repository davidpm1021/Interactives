import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TopHeader } from '../../shared/top-header/top-header';
import { BottomHeader } from '../../shared/bottom-header/bottom-header';
import { GameBoard } from './components/game-board/game-board';
import { RoundTransition, type TransitionType } from './components/round-transition/round-transition';
import { AllocationDiffComponent } from './components/allocation-diff/allocation-diff';
import { EventCard } from './components/event-card/event-card';
import { ReportComponent } from './components/report/report';
import { StartScreen } from './components/start-screen/start-screen';
import { InstructionsScreen } from './components/instructions-screen/instructions-screen';
import { type AllocationChange } from './components/category-card/category-card';
import { GameStateService } from './services/game-state.service';
import { generateRound1Narrative } from './services/round-summary';
import { type EventResult, type GameConfig } from './models/game.models';

@Component({
  selector: 'app-virtual-bean-game',
  standalone: true,
  imports: [TopHeader, BottomHeader, GameBoard, RoundTransition, AllocationDiffComponent, EventCard, ReportComponent, StartScreen, InstructionsScreen],
  providers: [GameStateService],
  templateUrl: './virtual-bean-game.html',
  styleUrl: './virtual-bean-game.scss',
})
export class VirtualBeanGame implements OnInit {
  protected readonly title = 'Virtual Bean Game';
  protected readonly gameState = inject(GameStateService);
  private readonly route = inject(ActivatedRoute);

  /** Overlay transition state */
  protected readonly showTransition = signal(false);
  protected readonly transitionType = signal<TransitionType>('round1-to-round2');

  /** Show instructions before round 1 */
  protected readonly showInstructions = signal(false);

  /** Show diff between rounds */
  protected readonly showDiff = signal(false);

  /** Current event result (after reveal, before next) */
  protected readonly currentResult = signal<EventResult | null>(null);

  /** Personalized narrative summary of Round 1 choices */
  protected readonly round1Summary = computed(() => {
    const snapshot = this.gameState.round1Snapshot();
    if (!snapshot) return '';
    return generateRound1Narrative(snapshot);
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const config: { -readonly [K in keyof GameConfig]?: GameConfig[K] } = {};

    const round3 = params.get('round3');
    if (round3 !== null) config.round3Enabled = round3 !== 'false';

    const events = params.get('events');
    if (events !== null) {
      const num = parseInt(events, 10);
      config.eventCount = num >= 3 && num <= 5 ? num : 'random';
    }

    const difficulty = params.get('difficulty');
    if (difficulty === 'easy' || difficulty === 'balanced' || difficulty === 'tough') {
      config.difficulty = difficulty;
    }

    const seed = params.get('seed');
    if (seed && /^[A-Z0-9]{4}$/i.test(seed)) {
      config.seed = seed.toUpperCase();
    }

    const replay = params.get('replay');
    if (replay !== null) config.allowReplay = replay !== 'false';

    this.gameState.initGame(config);
  }

  private pendingSeed: string | null = null;

  protected startGame(seed: string | null): void {
    this.pendingSeed = seed;
    this.showInstructions.set(true);
  }

  protected onInstructionsReady(): void {
    if (this.pendingSeed) {
      this.gameState.initGame({ ...this.gameState.config(), seed: this.pendingSeed });
    }
    this.showInstructions.set(false);
    this.gameState.startRound1();
  }

  protected onReplaySameLife(): void {
    this.showInstructions.set(false);
    this.gameState.startReplay(true);
    this.gameState.startRound1();
  }

  protected onReplayNewLife(): void {
    this.showInstructions.set(false);
    this.gameState.startReplay(false);
    this.gameState.startRound1();
  }

  protected onAllocationChange(change: AllocationChange): void {
    this.gameState.updateAllocation(change.slotId, change.optionId);
  }

  protected onSubmitRound(): void {
    const phase = this.gameState.phase();
    if (phase === 'round1') {
      const ok = this.gameState.submitRound1();
      if (ok) {
        this.transitionType.set('round1-to-round2');
        this.showTransition.set(true);
      }
    } else if (phase === 'round2') {
      this.showDiff.set(true);
    }
  }

  protected onConfirmRound2(): void {
    this.showDiff.set(false);
    const ok = this.gameState.submitRound2();
    if (ok && this.gameState.phase() === 'round3') {
      this.transitionType.set('round2-to-round3');
      this.showTransition.set(true);
    }
  }

  protected onTransitionProceed(): void {
    this.showTransition.set(false);
  }

  protected onRevealEvent(): void {
    const result = this.gameState.resolveCurrentEvent();
    this.currentResult.set(result);
  }

  protected onNextEvent(): void {
    this.currentResult.set(null);
    this.gameState.advanceToNextEvent();
  }
}

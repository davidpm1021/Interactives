import {
  Component,
  input,
  output,
  computed,
  effect,
  signal,
  untracked,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { StudySession, Flashcard } from '../../models/flashcard.models';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

@Component({
  selector: 'app-flashcard-viewer',
  standalone: true,
  imports: [ProgressBarComponent],
  templateUrl: './flashcard-viewer.component.html',
  styleUrl: './flashcard-viewer.component.scss',
})
export class FlashcardViewerComponent implements OnDestroy {
  readonly session = input.required<StudySession>();
  readonly currentCard = input.required<Flashcard | null>();

  readonly flipCard = output<void>();
  readonly cardResult = output<{ card: Flashcard; result: 'correct' | 'missed' }>();
  readonly reviewMissed = output<void>();
  readonly finish = output<void>();
  readonly exit = output<void>();

  /**
   * When the card is edge-on (rotated 90deg) and neither face is visible.
   *
   * NOT half the transition duration: the SCSS uses `transition: transform
   * 0.5s ease`, and `ease` front-loads the motion, so the card passes 90deg
   * at ~143ms rather than 250ms.
   *
   * Biased deliberately late. Swapping too early re-exposes the next answer
   * on the back face (the bug this exists to fix); swapping a touch late only
   * changes the front-face text while the card is ~75deg over and barely a
   * quarter of its width. Measured against the live animation — re-measure if
   * the duration or easing in flashcard-viewer.component.scss changes.
   */
  private static readonly FLIP_EDGE_ON_MS = 140;

  /**
   * The card whose text is currently rendered.
   *
   * Deliberately lags `currentCard()` when advancing away from a revealed
   * card. The parent swaps in the next card immediately, but the flip-back
   * animation still runs for 0.5s — so rendering the new card right away
   * briefly shows the next answer on the rotating back face. Holding the old
   * content until the midpoint hides the swap entirely.
   */
  private readonly displayCard = signal<Flashcard | null>(null);
  private swapTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const incoming = this.currentCard();
      const shown = untracked(() => this.displayCard());
      const advancingFromRevealed =
        !!shown && !!incoming && shown.term.id !== incoming.term.id && shown.isFlipped;

      this.clearSwapTimer();

      if (advancingFromRevealed) {
        this.swapTimer = setTimeout(() => {
          this.displayCard.set(incoming);
          this.swapTimer = null;
        }, FlashcardViewerComponent.FLIP_EDGE_ON_MS);
      } else {
        this.displayCard.set(incoming);
      }
    });
  }

  ngOnDestroy(): void {
    this.clearSwapTimer();
  }

  private clearSwapTimer(): void {
    if (this.swapTimer !== null) {
      clearTimeout(this.swapTimer);
      this.swapTimer = null;
    }
  }

  // Flip state tracks the live card so the rotation starts immediately; only
  // the text content is deferred.
  protected readonly isFlipped = computed(() => this.currentCard()?.isFlipped ?? false);

  protected readonly isSessionComplete = computed(
    () => this.session().currentIndex >= this.session().cards.length
  );

  protected readonly hasMissedCards = computed(
    () => this.session().missedCards.length > 0
  );

  protected readonly missedCount = computed(
    () => this.session().missedCards.length
  );

  protected readonly cardNumber = computed(
    () => this.session().currentIndex + 1
  );

  /** The card being rendered — see `displayCard` for why this lags. */
  protected readonly visibleCard = computed(() => this.displayCard());

  protected readonly frontContent = computed(() => {
    const card = this.visibleCard();
    const isSpanish = this.session().isSpanish;
    if (!card) return '';

    if (card.frontSide === 'term') {
      return isSpanish ? card.term.spanish.term : card.term.term;
    } else {
      return isSpanish ? card.term.spanish.definition : card.term.definition;
    }
  });

  protected readonly backContent = computed(() => {
    const card = this.visibleCard();
    const isSpanish = this.session().isSpanish;
    if (!card) return '';

    if (card.frontSide === 'term') {
      return isSpanish ? card.term.spanish.definition : card.term.definition;
    } else {
      return isSpanish ? card.term.spanish.term : card.term.term;
    }
  });

  protected readonly frontIsTerm = computed(() => {
    const card = this.visibleCard();
    if (!card) return false;
    return card.frontSide === 'term';
  });

  protected readonly frontFontSize = computed(() => this.scaledFontSize(this.frontContent()));
  protected readonly backFontSize = computed(() => this.scaledFontSize(this.backContent()));

  protected readonly frontLabel = computed(() => {
    const card = this.visibleCard();
    if (!card) return '';
    return card.frontSide === 'term' ? 'Term' : 'Definition';
  });

  protected readonly backLabel = computed(() => {
    const card = this.visibleCard();
    if (!card) return '';
    return card.frontSide === 'term' ? 'Definition' : 'Term';
  });

  protected readonly cardAnnouncement = computed(() => {
    const card = this.currentCard();
    if (!card) return '';
    if (card.isFlipped) {
      return `${this.backLabel()}: ${this.backContent()}`;
    }
    return `Card ${this.cardNumber()} of ${this.session().totalCards}. ${this.frontLabel()}: ${this.frontContent()}`;
  });

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    // Skip when a real <button>/<a> owns focus so Space/Enter activate it, not the card.
    // (The flashcard itself is a <div role="button">, so its tag is 'DIV' — still handled here.)
    if (tag === 'BUTTON' || tag === 'A') return;

    if (this.isSessionComplete()) return;

    const card = this.currentCard();
    if (!card) return;

    if (event.code === 'Space') {
      event.preventDefault();
      this.onFlip();
    } else if (!card.isFlipped && event.code === 'Enter') {
      event.preventDefault();
      this.onFlip();
    } else if ((event.code === 'Enter' || event.code === 'ArrowRight') && card.isFlipped) {
      event.preventDefault();
      this.onGotIt();
    } else if (event.code === 'ArrowLeft' && card.isFlipped) {
      event.preventDefault();
      this.onMissed();
    } else if (event.code === 'Escape') {
      event.preventDefault();
      this.onExit();
    }
  }

  protected onFlip(): void {
    this.flipCard.emit();
  }

  protected onGotIt(): void {
    const card = this.currentCard();
    if (card && card.isFlipped) {
      this.cardResult.emit({ card, result: 'correct' });
    }
  }

  protected onMissed(): void {
    const card = this.currentCard();
    if (card && card.isFlipped) {
      this.cardResult.emit({ card, result: 'missed' });
    }
  }

  protected onReviewMissed(): void {
    this.reviewMissed.emit();
  }

  protected onFinish(): void {
    this.finish.emit();
  }

  protected onExit(): void {
    this.exit.emit();
  }

  private scaledFontSize(text: string): string {
    const len = text.length;
    if (len <= 50) return '24px';
    if (len <= 100) return '22px';
    if (len <= 180) return '19px';
    if (len <= 280) return '17px';
    return '15px';
  }
}

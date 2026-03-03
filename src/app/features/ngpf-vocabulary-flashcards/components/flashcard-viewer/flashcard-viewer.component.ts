import { Component, input, output, computed, HostListener } from '@angular/core';
import { StudySession, Flashcard } from '../../models/flashcard.models';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

@Component({
  selector: 'app-flashcard-viewer',
  standalone: true,
  imports: [ProgressBarComponent],
  templateUrl: './flashcard-viewer.component.html',
  styleUrl: './flashcard-viewer.component.scss',
})
export class FlashcardViewerComponent {
  readonly session = input.required<StudySession>();
  readonly currentCard = input.required<Flashcard | null>();

  readonly flipCard = output<void>();
  readonly cardResult = output<{ card: Flashcard; result: 'correct' | 'missed' }>();
  readonly reviewMissed = output<void>();
  readonly finish = output<void>();
  readonly exit = output<void>();

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

  protected readonly frontContent = computed(() => {
    const card = this.currentCard();
    const isSpanish = this.session().isSpanish;
    if (!card) return '';

    if (card.frontSide === 'term') {
      return isSpanish ? card.term.spanish.term : card.term.term;
    } else {
      return isSpanish ? card.term.spanish.definition : card.term.definition;
    }
  });

  protected readonly backContent = computed(() => {
    const card = this.currentCard();
    const isSpanish = this.session().isSpanish;
    if (!card) return '';

    if (card.frontSide === 'term') {
      return isSpanish ? card.term.spanish.definition : card.term.definition;
    } else {
      return isSpanish ? card.term.spanish.term : card.term.term;
    }
  });

  protected readonly frontIsTerm = computed(() => {
    const card = this.currentCard();
    if (!card) return false;
    return card.frontSide === 'term';
  });

  protected readonly frontFontSize = computed(() => this.scaledFontSize(this.frontContent()));
  protected readonly backFontSize = computed(() => this.scaledFontSize(this.backContent()));

  protected readonly frontLabel = computed(() => {
    const card = this.currentCard();
    if (!card) return '';
    return card.frontSide === 'term' ? 'Term' : 'Definition';
  });

  protected readonly backLabel = computed(() => {
    const card = this.currentCard();
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
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (this.isSessionComplete()) return;

    const card = this.currentCard();
    if (!card) return;

    if ((event.code === 'Space' || event.code === 'Enter') && !card.isFlipped) {
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
    if (!this.currentCard()?.isFlipped) {
      this.flipCard.emit();
    }
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
    if (len <= 40) return '24px';
    if (len <= 80) return '20px';
    if (len <= 150) return '17px';
    if (len <= 250) return '15px';
    return '14px';
  }
}

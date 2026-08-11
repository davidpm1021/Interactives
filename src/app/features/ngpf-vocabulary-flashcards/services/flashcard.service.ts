import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  VocabularyData,
  Unit,
  Term,
  Flashcard,
  StudySession,
  StudyMode,
} from '../models/flashcard.models';

@Injectable({ providedIn: 'root' })
export class FlashcardService {
  private readonly http = inject(HttpClient);
  private readonly dataUrl = 'features/ngpf-vocabulary-flashcards/data/flashcard-vocabulary.json';

  loadVocabulary(): Observable<VocabularyData> {
    return this.http.get<VocabularyData>(this.dataUrl);
  }

  /**
   * Matches the placeholder text the dictionary uses for terms awaiting
   * translation. The source doc is inconsistent about the wording — observed
   * variants include "Spanish translation coming soon!" (in the definition
   * only) and "Coming soon!" (in both the term and the definition) — so this
   * matches on the common phrase rather than a full string.
   */
  private static readonly UNTRANSLATED_PATTERN = /coming soon/i;

  /**
   * True when a term has a real Spanish translation on both sides.
   *
   * The source dictionary ships placeholder text for terms awaiting
   * translation. Those are fine in English mode but must not become cards in
   * Spanish mode, where the "definition" would just read
   * "Spanish translation coming soon!".
   */
  /**
   * How many of a unit's terms will actually become cards in the given
   * language. In Spanish this is smaller than `unit.terms.length` because
   * untranslated entries are skipped, and the picker must advertise this
   * number rather than the raw one or it promises cards it won't deal.
   */
  studiableTermCount(unit: Unit, isSpanish: boolean): number {
    if (!isSpanish) return unit.terms.length;
    return unit.terms.filter((t) => this.hasUsableSpanish(t)).length;
  }

  private hasUsableSpanish(term: Term): boolean {
    const spanishTerm = term.spanish?.term?.trim() ?? '';
    const spanishDefinition = term.spanish?.definition?.trim() ?? '';
    if (!spanishTerm || !spanishDefinition) return false;
    return (
      !FlashcardService.UNTRANSLATED_PATTERN.test(spanishTerm) &&
      !FlashcardService.UNTRANSLATED_PATTERN.test(spanishDefinition)
    );
  }

  createSession(
    units: Unit[],
    mode: StudyMode,
    isSpanish: boolean
  ): StudySession {
    const cards: Flashcard[] = [];

    for (const unit of units) {
      for (const term of unit.terms) {
        // Skip untranslated terms when studying in Spanish — they would
        // otherwise show placeholder text as the answer.
        if (isSpanish && !this.hasUsableSpanish(term)) continue;

        const frontSide = this.determineFrontSide(mode);
        cards.push({
          term,
          unitId: unit.id,
          unitName: unit.name,
          frontSide,
          isFlipped: false,
          isMissed: false,
        });
      }
    }

    const shuffledCards = this.shuffleCards(cards);

    return {
      cards: shuffledCards,
      currentIndex: 0,
      totalCards: shuffledCards.length,
      completedCards: 0,
      missedCards: [],
      studyMode: mode,
      isSpanish,
      isReviewRound: false,
    };
  }

  shuffleCards<T>(cards: T[]): T[] {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getCurrentCard(session: StudySession): Flashcard | null {
    if (session.currentIndex >= session.cards.length) {
      return null;
    }
    return session.cards[session.currentIndex];
  }

  advanceCard(
    session: StudySession,
    result: 'correct' | 'missed'
  ): StudySession {
    const currentCard = this.getCurrentCard(session);
    if (!currentCard) {
      return session;
    }

    const updatedCards = session.cards.map((card, index) =>
      index === session.currentIndex
        ? { ...card, isFlipped: false, isMissed: result === 'missed' }
        : card
    );

    const missedCards =
      result === 'missed'
        ? [...session.missedCards, { ...currentCard, isMissed: true }]
        : session.missedCards;

    return {
      ...session,
      cards: updatedCards,
      currentIndex: session.currentIndex + 1,
      completedCards: session.completedCards + 1,
      missedCards,
    };
  }

  flipCard(session: StudySession): StudySession {
    const currentCard = this.getCurrentCard(session);
    if (!currentCard) {
      return session;
    }

    const updatedCards = session.cards.map((card, index) =>
      index === session.currentIndex ? { ...card, isFlipped: !card.isFlipped } : card
    );

    return {
      ...session,
      cards: updatedCards,
    };
  }

  createReviewSession(session: StudySession): StudySession {
    const reviewCards = session.missedCards.map((card) => ({
      ...card,
      isFlipped: false,
      isMissed: false,
    }));

    const shuffledCards = this.shuffleCards(reviewCards);

    return {
      ...session,
      cards: shuffledCards,
      currentIndex: 0,
      totalCards: shuffledCards.length,
      completedCards: 0,
      missedCards: [],
      isReviewRound: true,
    };
  }

  isSessionComplete(session: StudySession): boolean {
    return session.currentIndex >= session.cards.length;
  }

  hasMissedCards(session: StudySession): boolean {
    return session.missedCards.length > 0;
  }

  private determineFrontSide(mode: StudyMode): 'term' | 'definition' {
    switch (mode) {
      case 'term-first':
        return 'term';
      case 'definition-first':
        return 'definition';
      case 'mixed':
        return Math.random() < 0.5 ? 'term' : 'definition';
    }
  }
}

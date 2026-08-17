import { Component, inject, signal, computed, effect, OnInit, afterNextRender, ElementRef, Injector } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { TopHeader } from '../../shared/top-header/top-header';
import { UnitSelectionComponent } from './components/unit-selection/unit-selection.component';
import { StudySettingsComponent, StudySettings } from './components/study-settings/study-settings.component';
import { FlashcardViewerComponent } from './components/flashcard-viewer/flashcard-viewer.component';
import { CompletionScreenComponent, CompletionStats } from './components/completion-screen/completion-screen.component';
import { FlashcardService } from './services/flashcard.service';
import {
  VocabularyData,
  Unit,
  StudySession,
  ViewState,
  Flashcard,
  StudyMode,
} from './models/flashcard.models';
import { AnalyticsService } from '../../shared/services/analytics.service';
import { ScrollCueComponent } from '../../shared/scroll-cue/scroll-cue.component';

@Component({
  selector: 'app-ngpf-vocabulary-flashcards',
  standalone: true,
  imports: [
    HttpClientModule,
    TopHeader,
    UnitSelectionComponent,
    StudySettingsComponent,
    FlashcardViewerComponent,
    CompletionScreenComponent,
    ScrollCueComponent,
  ],
  templateUrl: './ngpf-vocabulary-flashcards.html',
  styleUrl: './ngpf-vocabulary-flashcards.scss',
})
export class NgpfVocabularyFlashcards implements OnInit {
  private readonly flashcardService = inject(FlashcardService);
  private readonly analytics = inject(AnalyticsService);
  private readonly elementRef = inject(ElementRef);
  private readonly injector = inject(Injector);
  private sessionStartTime = 0;

  protected readonly title = 'NGPF Vocabulary Flashcards';
  protected readonly liveAnnouncement = signal('');

  protected readonly currentView = signal<ViewState>('unit-selection');
  protected readonly vocabularyData = signal<VocabularyData | null>(null);
  protected readonly selectedUnits = signal<Unit[]>([]);
  protected readonly studySession = signal<StudySession | null>(null);
  protected readonly studyMode = signal<StudyMode>('term-first');
  protected readonly isSpanish = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly originalTotalCards = signal(0);
  private readonly firstPassCorrect = signal(0);
  private readonly totalReviewedCards = signal(0);

  protected readonly units = computed(() => this.vocabularyData()?.units ?? []);

  private readonly viewAnnouncementEffect = effect(() => {
    const view = this.currentView();
    const announcements: Record<ViewState, string> = {
      'unit-selection': 'Unit selection view loaded',
      'study-settings': 'Study settings view loaded',
      'studying': 'Flashcard study session started',
      'completion': 'Study session complete',
    };
    this.liveAnnouncement.set(announcements[view]);
    afterNextRender(() => {
      const heading =
        this.elementRef.nativeElement.querySelector('h2') ||
        this.elementRef.nativeElement.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
    }, { injector: this.injector });
  });

  protected readonly currentCard = computed(() => {
    const session = this.studySession();
    if (!session) return null;
    return this.flashcardService.getCurrentCard(session);
  });

  protected readonly completionStats = computed<CompletionStats>(() => {
    return {
      totalCards: this.originalTotalCards(),
      correctOnFirstPass: this.firstPassCorrect(),
      neededReview: this.totalReviewedCards(),
      unitNames: this.selectedUnits().map((u) => u.name),
      studyMode: this.studyMode(),
      isSpanish: this.isSpanish(),
    };
  });

  ngOnInit(): void {
    this.loadVocabulary();
  }

  protected loadVocabulary(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.flashcardService.loadVocabulary().subscribe({
      next: (data) => {
        this.vocabularyData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load vocabulary:', err);
        this.error.set('Failed to load vocabulary data. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  protected onUnitsSelected(units: Unit[]): void {
    this.selectedUnits.set(units);
    this.currentView.set('study-settings');

    this.analytics.trackEvent('flashcard_units_selected', {
      unit_count: units.length,
      unit_names: units.map(u => u.name).join(', '),
      total_terms: units.reduce((sum, u) => sum + u.terms.length, 0),
    });
  }

  protected onSettingsConfirmed(settings: StudySettings): void {
    this.studyMode.set(settings.mode);
    this.isSpanish.set(settings.isSpanish);

    const session = this.flashcardService.createSession(
      this.selectedUnits(),
      settings.mode,
      settings.isSpanish
    );

    this.studySession.set(session);
    this.originalTotalCards.set(session.totalCards);
    this.firstPassCorrect.set(0);
    this.totalReviewedCards.set(0);
    this.sessionStartTime = Date.now();
    this.currentView.set('studying');

    this.analytics.trackEvent('flashcard_session_start', {
      study_mode: settings.mode,
      is_spanish: settings.isSpanish,
      total_cards: session.totalCards,
      unit_names: this.selectedUnits().map(u => u.name).join(', '),
    });
  }

  protected onSettingsBack(): void {
    this.currentView.set('unit-selection');
  }

  protected onFlipCard(): void {
    const session = this.studySession();
    if (!session) return;

    const updatedSession = this.flashcardService.flipCard(session);
    this.studySession.set(updatedSession);
  }

  protected onCardResult(event: { card: Flashcard; result: 'correct' | 'missed' }): void {
    const session = this.studySession();
    if (!session) return;

    if (!session.isReviewRound && event.result === 'correct') {
      this.firstPassCorrect.update((v) => v + 1);
    }

    const updatedSession = this.flashcardService.advanceCard(session, event.result);
    this.studySession.set(updatedSession);
  }

  protected onReviewMissed(): void {
    const session = this.studySession();
    if (!session) return;

    this.analytics.trackEvent('flashcard_review_started', {
      missed_count: session.missedCards.length,
      total_cards: session.totalCards,
    });

    this.totalReviewedCards.update((v) => v + session.missedCards.length);
    const reviewSession = this.flashcardService.createReviewSession(session);
    this.studySession.set(reviewSession);
  }

  protected onFinish(): void {
    const session = this.studySession();
    if (session && session.missedCards.length > 0) {
      this.totalReviewedCards.update((v) => v + session.missedCards.length);
    }
    this.currentView.set('completion');

    const durationSec = Math.round((Date.now() - this.sessionStartTime) / 1000);
    const total = this.originalTotalCards();
    const correct = this.firstPassCorrect();
    this.analytics.trackEvent('flashcard_session_complete', {
      total_cards: total,
      correct_first_pass: correct,
      accuracy_pct: total > 0 ? Math.round((correct / total) * 100) : 0,
      needed_review: this.totalReviewedCards(),
      duration_seconds: durationSec,
      study_mode: this.studyMode(),
      is_spanish: this.isSpanish(),
      unit_names: this.selectedUnits().map(u => u.name).join(', '),
    });
  }

  protected onStudyAgain(): void {
    this.analytics.trackEvent('flashcard_study_again', {
      unit_names: this.selectedUnits().map(u => u.name).join(', '),
      study_mode: this.studyMode(),
    });

    const session = this.flashcardService.createSession(
      this.selectedUnits(),
      this.studyMode(),
      this.isSpanish()
    );

    this.studySession.set(session);
    this.originalTotalCards.set(session.totalCards);
    this.firstPassCorrect.set(0);
    this.totalReviewedCards.set(0);
    this.sessionStartTime = Date.now();
    this.currentView.set('studying');
  }

  protected onChangeUnits(): void {
    this.studySession.set(null);
    this.selectedUnits.set([]);
    this.currentView.set('unit-selection');
  }

  protected onExitStudy(): void {
    const session = this.studySession();
    this.analytics.trackEvent('flashcard_exit_early', {
      cards_completed: session?.currentIndex ?? 0,
      total_cards: session?.totalCards ?? 0,
    });

    this.studySession.set(null);
    this.selectedUnits.set([]);
    this.currentView.set('unit-selection');
  }
}

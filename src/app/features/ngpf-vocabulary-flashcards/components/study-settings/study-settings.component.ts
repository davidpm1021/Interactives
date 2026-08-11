import { Component, ElementRef, inject, input, output, signal, computed } from '@angular/core';
import { Unit, StudyMode } from '../../models/flashcard.models';
import { FlashcardService } from '../../services/flashcard.service';

export interface StudySettings {
  mode: StudyMode;
  isSpanish: boolean;
}

@Component({
  selector: 'app-study-settings',
  standalone: true,
  imports: [],
  templateUrl: './study-settings.component.html',
  styleUrl: './study-settings.component.scss',
})
export class StudySettingsComponent {
  readonly selectedUnits = input.required<Unit[]>();
  readonly settingsConfirmed = output<StudySettings>();
  readonly back = output<void>();

  protected readonly studyMode = signal<StudyMode>('term-first');
  protected readonly isSpanish = signal(false);

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly flashcardService = inject(FlashcardService);
  protected readonly modeOrder: readonly StudyMode[] = ['term-first', 'definition-first', 'mixed'];

  /**
   * Cards the session will actually deal, which in Spanish is fewer than the
   * raw term count because untranslated entries are skipped when the deck is
   * built. The unit picker runs before the language is chosen, so this screen
   * is the first and only place the real number can be shown.
   */
  protected readonly totalTerms = computed(() =>
    this.selectedUnits().reduce(
      (sum, unit) => sum + this.flashcardService.studiableTermCount(unit, this.isSpanish()),
      0,
    )
  );

  /** How many terms Spanish study would drop, for the explanatory note. */
  protected readonly untranslatedCount = computed(() => {
    if (!this.isSpanish()) return 0;
    const all = this.selectedUnits().reduce((sum, unit) => sum + unit.terms.length, 0);
    return all - this.totalTerms();
  });

  /** Nothing to study: every selected unit is untranslated in this language. */
  protected readonly hasNoCards = computed(() => this.totalTerms() === 0);

  protected readonly unitCount = computed(() => this.selectedUnits().length);

  protected setStudyMode(mode: StudyMode): void {
    this.studyMode.set(mode);
  }

  protected onModeKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const currentIdx = this.modeOrder.indexOf(this.studyMode());
    let nextIdx = currentIdx;
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      nextIdx = (currentIdx + 1) % this.modeOrder.length;
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      nextIdx = (currentIdx - 1 + this.modeOrder.length) % this.modeOrder.length;
    } else if (key === 'Home') {
      nextIdx = 0;
    } else if (key === 'End') {
      nextIdx = this.modeOrder.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const nextMode = this.modeOrder[nextIdx];
    this.setStudyMode(nextMode);
    requestAnimationFrame(() => {
      const el = this.host.nativeElement.querySelector<HTMLButtonElement>(
        `button[data-mode="${nextMode}"]`,
      );
      el?.focus();
    });
  }

  protected toggleSpanish(): void {
    this.isSpanish.update((v) => !v);
  }

  protected onStartStudying(): void {
    this.settingsConfirmed.emit({
      mode: this.studyMode(),
      isSpanish: this.isSpanish(),
    });
  }

  protected onBack(): void {
    this.back.emit();
  }
}

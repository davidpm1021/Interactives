import { Component, ElementRef, inject, input, output, signal, computed } from '@angular/core';
import { Unit, StudyMode } from '../../models/flashcard.models';

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
  protected readonly modeOrder: readonly StudyMode[] = ['term-first', 'definition-first', 'mixed'];

  protected readonly totalTerms = computed(() =>
    this.selectedUnits().reduce((sum, unit) => sum + unit.terms.length, 0)
  );

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

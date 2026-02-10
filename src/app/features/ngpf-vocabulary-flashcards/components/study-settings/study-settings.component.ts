import { Component, input, output, signal, computed } from '@angular/core';
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

  protected readonly totalTerms = computed(() =>
    this.selectedUnits().reduce((sum, unit) => sum + unit.terms.length, 0)
  );

  protected readonly unitCount = computed(() => this.selectedUnits().length);

  protected setStudyMode(mode: StudyMode): void {
    this.studyMode.set(mode);
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

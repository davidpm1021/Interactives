import { Component, input, output, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudySession, StudyMode } from '../../models/flashcard.models';

export interface CompletionStats {
  totalCards: number;
  correctOnFirstPass: number;
  neededReview: number;
  unitNames: string[];
  studyMode: StudyMode;
  isSpanish: boolean;
}

@Component({
  selector: 'app-completion-screen',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './completion-screen.component.html',
  styleUrl: './completion-screen.component.scss',
})
export class CompletionScreenComponent {
  readonly stats = input.required<CompletionStats>();

  readonly studyAgain = output<void>();
  readonly changeUnits = output<void>();

  protected readonly studyModeLabel = computed(() => {
    switch (this.stats().studyMode) {
      case 'term-first':
        return 'Term → Definition';
      case 'definition-first':
        return 'Definition → Term';
      case 'mixed':
        return 'Mixed';
    }
  });

  protected readonly accuracyPercentage = computed(() => {
    const s = this.stats();
    if (s.totalCards === 0) return 0;
    return Math.round((s.correctOnFirstPass / s.totalCards) * 100);
  });

  protected onStudyAgain(): void {
    this.studyAgain.emit();
  }

  protected onChangeUnits(): void {
    this.changeUnits.emit();
  }
}

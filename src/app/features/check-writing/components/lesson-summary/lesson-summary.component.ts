import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-lesson-summary',
  standalone: true,
  imports: [],
  templateUrl: './lesson-summary.component.html',
  styleUrl: './lesson-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonSummaryComponent {
  readonly restart = output<void>();

  protected onRestart(): void {
    this.restart.emit();
  }
}

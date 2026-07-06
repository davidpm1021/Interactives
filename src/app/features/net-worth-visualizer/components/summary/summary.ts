import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Summary {
  readonly restart = output<void>();

  protected onRestart(): void {
    this.restart.emit();
  }
}

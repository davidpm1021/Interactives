import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntroComponent {
  readonly begin = output<void>();

  protected onBegin(): void {
    this.begin.emit();
  }
}

import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss',
})
export class ProgressBarComponent {
  readonly current = input.required<number>();
  readonly total = input.required<number>();

  protected readonly percentage = computed(() => {
    const t = this.total();
    if (t === 0) return 0;
    return (this.current() / t) * 100;
  });
}

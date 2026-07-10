import { Component, input, output, signal } from '@angular/core';
import { ChallengeOption } from '../../data/challenge-content';

@Component({
  selector: 'app-prediction-choice',
  standalone: true,
  imports: [],
  templateUrl: './prediction-choice.component.html',
  styleUrl: './prediction-choice.component.scss',
})
export class PredictionChoiceComponent {
  readonly prompt = input('');
  readonly options = input<ChallengeOption[]>([]);

  readonly selectionChanged = output<string>();

  protected readonly selectedId = signal<string | null>(null);

  protected onSelect(id: string): void {
    this.selectedId.set(id);
    this.selectionChanged.emit(id);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const opts = this.options();
    let newIndex = index;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (index + 1) % opts.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = (index - 1 + opts.length) % opts.length;
        break;
      default:
        return;
    }

    this.onSelect(opts[newIndex].id);
    // Focus the new radio button
    const container = (event.target as HTMLElement).closest('[role="radiogroup"]');
    const buttons = container?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons?.[newIndex]?.focus();
  }
}

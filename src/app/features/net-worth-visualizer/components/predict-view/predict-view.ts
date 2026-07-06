import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal } from '@angular/core';
import { FinancialProfile, PredictionChoice } from '../../models/net-worth.models';
import { ProfileCard } from '../profile-card/profile-card';

@Component({
  selector: 'app-predict-view',
  standalone: true,
  imports: [ProfileCard],
  templateUrl: './predict-view.html',
  styleUrl: './predict-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PredictView {
  readonly profileA = input.required<FinancialProfile>();
  readonly profileB = input.required<FinancialProfile>();
  readonly submit = output<PredictionChoice>();

  protected readonly selected = signal<PredictionChoice | null>(null);

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  protected readonly choiceOrder: readonly PredictionChoice[] = ['a', 'b', 'same'];

  protected select(choice: PredictionChoice): void {
    this.selected.set(choice);
  }

  protected confirm(): void {
    const c = this.selected();
    if (c) this.submit.emit(c);
  }

  protected onChoiceKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const current = this.selected() ?? this.choiceOrder[0];
    const currentIdx = this.choiceOrder.indexOf(current);
    let nextIdx = currentIdx;
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      nextIdx = (currentIdx + 1) % this.choiceOrder.length;
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      nextIdx = (currentIdx - 1 + this.choiceOrder.length) % this.choiceOrder.length;
    } else if (key === 'Home') {
      nextIdx = 0;
    } else if (key === 'End') {
      nextIdx = this.choiceOrder.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const next = this.choiceOrder[nextIdx];
    this.select(next);
    requestAnimationFrame(() => {
      const el = this.host.nativeElement.querySelector<HTMLButtonElement>(
        `button[data-choice="${next}"]`,
      );
      el?.focus();
    });
  }

  protected readonly emptySet = new Set<never>();
}

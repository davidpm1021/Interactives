import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
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

  protected select(choice: PredictionChoice): void {
    this.selected.set(choice);
  }

  protected confirm(): void {
    const c = this.selected();
    if (c) this.submit.emit(c);
  }

  protected readonly emptySet = new Set<never>();
}

import { Component, computed, input, output } from '@angular/core';
import { CategoryCard, type AllocationChange } from '../category-card/category-card';
import { BeanCounter } from '../bean-counter/bean-counter';
import { CATEGORIES } from '../../data/categories';
import { type Allocations, type ValidationResult } from '../../models/game.models';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CategoryCard, BeanCounter],
  templateUrl: './game-board.html',
  styleUrl: './game-board.scss',
})
export class GameBoard {
  readonly allocations = input.required<Allocations>();
  readonly totalBudget = input.required<number>();
  readonly beansRemaining = input.required<number>();
  readonly validation = input.required<ValidationResult>();
  readonly round = input.required<number>();
  readonly disabled = input(false);

  readonly allocationChange = output<AllocationChange>();
  readonly submitRound = output<void>();

  protected readonly categories = CATEGORIES;

  protected readonly totalAllocated = computed(
    () => this.totalBudget() - this.beansRemaining(),
  );

  protected readonly canSubmit = computed(() => {
    const v = this.validation();
    return v.valid && !this.disabled();
  });

  protected readonly submitLabel = computed(
    () => `Submit Round ${this.round()} Choices`,
  );

  protected readonly overBudgetText = computed(() => {
    const over = Math.abs(this.validation().budgetRemaining);
    return `You are ${over} bean${over !== 1 ? 's' : ''} over budget. Remove some selections to continue.`;
  });

  protected readonly missingRequiredText = computed(() => {
    const count = this.validation().missingRequired.length;
    return `You still need to make selections in ${count} required categor${count !== 1 ? 'ies' : 'y'}.`;
  });

  protected onAllocationChange(change: AllocationChange): void {
    this.allocationChange.emit(change);
  }

  protected onSubmit(): void {
    if (this.canSubmit()) {
      this.submitRound.emit();
    }
  }
}

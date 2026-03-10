import { Component, computed, input } from '@angular/core';

export type BudgetStatus = 'under' | 'at' | 'over';

@Component({
  selector: 'app-bean-counter',
  standalone: true,
  templateUrl: './bean-counter.html',
  styleUrl: './bean-counter.scss',
})
export class BeanCounter {
  readonly beansRemaining = input.required<number>();
  readonly totalBudget = input.required<number>();
  readonly totalAllocated = input.required<number>();

  protected readonly status = computed<BudgetStatus>(() => {
    const remaining = this.beansRemaining();
    if (remaining < 0) return 'over';
    if (remaining === 0) return 'at';
    return 'under';
  });

  protected readonly statusIcon = computed(() => {
    switch (this.status()) {
      case 'under':
        return '✓';
      case 'at':
        return '—';
      case 'over':
        return '⚠';
    }
  });

  protected readonly statusText = computed(() => {
    const remaining = this.beansRemaining();
    switch (this.status()) {
      case 'under':
        return 'Under budget';
      case 'at':
        return 'At budget';
      case 'over':
        return `Over budget (${Math.abs(remaining)} bean${Math.abs(remaining) !== 1 ? 's' : ''} over)`;
    }
  });

  protected readonly fillWidth = computed(() => {
    const budget = this.totalBudget();
    if (budget <= 0) return '0%';
    const pct = Math.min((this.totalAllocated() / budget) * 100, 100);
    return `${pct}%`;
  });

  protected readonly announcement = computed(
    () => `${this.beansRemaining()} beans remaining. ${this.totalAllocated()} beans allocated. ${this.statusText()}.`,
  );
}

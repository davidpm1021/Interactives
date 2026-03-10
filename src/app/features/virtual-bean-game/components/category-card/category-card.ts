import { Component, computed, input, output, signal } from '@angular/core';
import {
  type Allocations,
  type CategoryConfig,
  type CategoryOption,
  type DependencyRule,
  type SubCategoryConfig,
} from '../../models/game.models';

export interface AllocationChange {
  slotId: string;
  optionId: string;
}

@Component({
  selector: 'app-category-card',
  standalone: true,
  templateUrl: './category-card.html',
  styleUrl: './category-card.scss',
})
export class CategoryCard {
  readonly category = input.required<CategoryConfig>();
  readonly allocations = input.required<Allocations>();
  readonly disabled = input(false);

  readonly selectionChange = output<AllocationChange>();

  protected readonly expanded = signal(false);

  protected toggleExpand(): void {
    this.expanded.update((v) => !v);
  }

  /** Total beans allocated across all slots in this category */
  protected readonly totalBeans = computed(() => {
    let total = 0;
    for (const slot of this.slots()) {
      total += this.getSelectedBeans(slot.id);
    }
    return total;
  });

  /** Summary text for collapsed state */
  protected readonly summaryText = computed(() => {
    const allSlots = this.slots();
    const alloc = this.allocations();
    const parts: string[] = [];

    for (const slot of allSlots) {
      const selectedId = alloc[slot.id] as string | undefined;
      if (!selectedId) continue;
      const opt = slot.options.find((o) => o.id === selectedId);
      if (opt) {
        if (allSlots.length > 1) {
          parts.push(`${slot.name}: ${opt.label}`);
        } else {
          parts.push(opt.label);
        }
      }
    }

    return parts.length > 0 ? parts.join(', ') : '';
  });

  protected readonly slots = computed(() => {
    const cat = this.category();
    if (cat.subCategories) {
      return cat.subCategories.map((sub) => ({
        id: sub.id,
        name: sub.name,
        options: sub.options,
        dependencies: sub.dependencies,
        isSubCategory: true,
        maxBeans: Math.max(...sub.options.map((o) => o.beans)),
      }));
    }
    return [
      {
        id: cat.id,
        name: cat.name,
        options: cat.options!,
        dependencies: cat.dependencies,
        isSubCategory: false,
        maxBeans: Math.max(...cat.options!.map((o) => o.beans)),
      },
    ];
  });

  protected getSelectedOption(slotId: string): string {
    const val = this.allocations()[slotId];
    return typeof val === 'string' ? val : '';
  }

  protected isOptionDisabled(
    option: CategoryOption,
    slot: { dependencies?: readonly DependencyRule[] },
  ): boolean {
    if (this.disabled()) return true;
    if (!slot.dependencies) return false;

    const alloc = this.allocations();
    for (const rule of slot.dependencies) {
      const depValue = alloc[rule.dependsOnCategory] as string | undefined;
      if (!depValue) continue;

      if (depValue === rule.dependsOnOptionId) {
        if (rule.effect === 'require' && option.beans > 0) return true;
        if (rule.effect === 'prohibit' && option.beans > 0) return true;
      }
    }
    return false;
  }

  protected getDisabledMessage(
    option: CategoryOption,
    slot: { dependencies?: readonly DependencyRule[] },
  ): string {
    if (!slot.dependencies) return '';
    const alloc = this.allocations();

    for (const rule of slot.dependencies) {
      const depValue = alloc[rule.dependsOnCategory] as string | undefined;
      if (!depValue) continue;

      if (depValue === rule.dependsOnOptionId && option.beans > 0) {
        return rule.message;
      }
    }
    return '';
  }

  protected beanPositions(max: number): number[] {
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  protected getSelectedBeans(slotId: string): number {
    const selectedId = this.getSelectedOption(slotId);
    if (!selectedId) return 0;
    for (const slot of this.slots()) {
      if (slot.id === slotId) {
        const option = slot.options.find((o) => o.id === selectedId);
        return option ? option.beans : 0;
      }
    }
    return 0;
  }

  protected onBeanTap(
    slot: { id: string; options: readonly CategoryOption[] },
    position: number,
  ): void {
    if (this.disabled()) return;

    const currentBeans = this.getSelectedBeans(slot.id);

    if (position === currentBeans) {
      // Tapping the last filled bean → deselect to next-cheaper or cheapest
      const cheaperOptions = slot.options
        .filter((o) => o.beans < currentBeans)
        .sort((a, b) => b.beans - a.beans);
      const target = cheaperOptions[0] ?? slot.options.reduce((min, o) => (o.beans < min.beans ? o : min));
      this.selectionChange.emit({ slotId: slot.id, optionId: target.id });
      return;
    }

    // Find exact match first, then closest option with beans <= position
    const exact = slot.options.find((o) => o.beans === position);
    if (exact) {
      this.selectionChange.emit({ slotId: slot.id, optionId: exact.id });
      return;
    }

    const closest = slot.options
      .filter((o) => o.beans <= position)
      .sort((a, b) => b.beans - a.beans)[0];
    if (closest) {
      this.selectionChange.emit({ slotId: slot.id, optionId: closest.id });
    }
  }

  protected onSelect(slotId: string, optionId: string): void {
    if (this.disabled()) return;
    this.selectionChange.emit({ slotId, optionId });
  }
}

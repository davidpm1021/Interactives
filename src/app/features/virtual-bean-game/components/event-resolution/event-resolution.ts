import { Component, computed, input, output, signal } from '@angular/core';
import {
  type Allocations,
  type CategoryConfig,
  type EventResult,
} from '../../models/game.models';
import { CATEGORIES } from '../../data/categories';
import { AllocationService } from '../../services/allocation.service';

/**
 * Sub-component for player-action events where the student must choose
 * which categories to remove (or add) beans from.
 */
@Component({
  selector: 'app-event-resolution',
  standalone: true,
  templateUrl: './event-resolution.html',
  styleUrl: './event-resolution.scss',
})
export class EventResolution {
  readonly beansToAllocate = input.required<number>();
  readonly allocations = input.required<Allocations>();
  readonly protectedCategories = input<readonly string[]>([]);
  readonly isAdding = input(false);

  readonly resolved = output<void>();

  protected readonly beansHandled = signal(0);

  protected readonly beansLeft = computed(
    () => Math.abs(this.beansToAllocate()) - this.beansHandled(),
  );

  protected readonly isDone = computed(() => this.beansLeft() <= 0);

  protected readonly slots = computed(() => {
    const protectedIds = new Set(this.protectedCategories());
    const alloc = this.allocations();
    const result: Array<{
      slotId: string;
      name: string;
      currentBeans: number;
      canModify: boolean;
    }> = [];

    for (const cat of CATEGORIES) {
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          const selected = alloc[sub.id] as string | undefined;
          if (!selected) continue;
          const opt = sub.options.find((o) => o.id === selected);
          if (!opt) continue;

          const isProtected =
            protectedIds.has(cat.id) || protectedIds.has(sub.id);
          const canModify = this.isAdding() ? true : !isProtected && opt.beans > 0;

          result.push({
            slotId: sub.id,
            name: `${cat.name} — ${sub.name}`,
            currentBeans: opt.beans,
            canModify,
          });
        }
      } else if (cat.options) {
        const selected = alloc[cat.id] as string | undefined;
        if (!selected) continue;
        const opt = cat.options.find((o) => o.id === selected);
        if (!opt) continue;

        const isProtected = protectedIds.has(cat.id);
        const canModify = this.isAdding() ? true : !isProtected && opt.beans > 0;

        result.push({
          slotId: cat.id,
          name: cat.name,
          currentBeans: opt.beans,
          canModify,
        });
      }
    }

    return result.filter((s) => s.canModify);
  });

  protected onSelectSlot(slotId: string): void {
    if (this.isDone()) return;
    this.beansHandled.update((n) => n + 1);
    if (this.beansLeft() <= 1) {
      this.resolved.emit();
    }
  }
}

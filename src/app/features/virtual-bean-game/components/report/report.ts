import { Component, computed, inject, input, output } from '@angular/core';
import {
  type Allocations,
  type AllocationDiff,
  type CategoryConfig,
  type EventResult,
} from '../../models/game.models';
import { AllocationDiffComponent } from '../allocation-diff/allocation-diff';
import { ReportService } from '../../services/report.service';
import { AllocationService } from '../../services/allocation.service';
import { CATEGORIES } from '../../data/categories';
import { EVENTS } from '../../data/events';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [AllocationDiffComponent],
  templateUrl: './report.html',
  styleUrl: './report.scss',
})
export class ReportComponent {
  private readonly reportService = inject(ReportService);
  private readonly allocationService = inject(AllocationService);

  readonly seed = input.required<string>();
  readonly round1 = input.required<Allocations>();
  readonly round2 = input.required<Allocations>();
  readonly diffs = input.required<readonly AllocationDiff[]>();
  readonly eventResults = input.required<readonly EventResult[]>();
  readonly finalBeans = input.required<number>();
  readonly isReplay = input(false);
  readonly previousRunFinal = input<Allocations | null>(null);
  readonly round3Enabled = input(true);
  readonly allowReplay = input(true);

  readonly replaySameLife = output<void>();
  readonly replayNewLife = output<void>();

  protected readonly encodedResult = computed(() =>
    this.reportService.encodeResult(
      this.seed(),
      this.round1(),
      this.round2(),
      this.eventResults(),
    ),
  );

  protected readonly insights = computed(() =>
    this.reportService.generateInsights(
      this.round1(),
      this.round2(),
      this.eventResults(),
      this.finalBeans(),
      CATEGORIES,
    ),
  );

  protected readonly allocationSummary = computed(() => {
    const alloc = this.round2();
    const items: { name: string; beans: number }[] = [];
    for (const cat of CATEGORIES) {
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          const optId = alloc[sub.id] as string | undefined;
          const opt = optId ? sub.options.find((o) => o.id === optId) : null;
          if (opt && opt.beans > 0) {
            items.push({ name: sub.name, beans: opt.beans });
          }
        }
      } else if (cat.options) {
        const optId = alloc[cat.id] as string | undefined;
        const opt = optId ? cat.options.find((o) => o.id === optId) : null;
        if (opt && opt.beans > 0) {
          items.push({ name: cat.name, beans: opt.beans });
        }
      }
    }
    return items.sort((a, b) => b.beans - a.beans);
  });

  protected readonly maxBeans = computed(() => {
    const items = this.allocationSummary();
    return items.length > 0 ? items[0].beans : 1;
  });

  protected readonly replayComparison = computed(() => {
    const prev = this.previousRunFinal();
    if (!this.isReplay() || !prev) return null;
    const prevBeans = this.allocationService.calculateTotalBeans(prev, CATEGORIES);
    const currBeans = this.allocationService.calculateTotalBeans(this.round2(), CATEGORIES);
    const delta = currBeans - prevBeans;
    return { prevBeans, currBeans, delta };
  });

  protected readonly finalRating = computed(() => {
    const beans = this.finalBeans();
    if (beans >= 18) return 'Outstanding! You navigated life like a pro.';
    if (beans >= 14) return 'Great job! You handled the surprises well.';
    if (beans >= 10) return 'Solid work. Life threw some curveballs but you adapted.';
    if (beans >= 6) return 'It was tough, but you made it through.';
    return 'Life hit hard this round. Every experience is a lesson.';
  });

  protected copiedState = false;

  protected async onCopyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.encodedResult());
      this.copiedState = true;
      setTimeout(() => { this.copiedState = false; }, 2000);
    } catch {
      // Fallback: select text in the code element
      const el = document.querySelector('.report__code-text');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  protected onPrint(): void {
    window.print();
  }

  protected eventTitle(eventId: string): string {
    const event = EVENTS.find((e) => e.id === eventId);
    return event ? event.title : eventId;
  }

  protected barWidth(beans: number): string {
    const max = this.maxBeans();
    return max > 0 ? `${(beans / max) * 100}%` : '0%';
  }
}

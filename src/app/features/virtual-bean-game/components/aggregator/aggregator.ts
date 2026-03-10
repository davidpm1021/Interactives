import { Component, inject, signal } from '@angular/core';
import { TopHeader } from '../../../../shared/top-header/top-header';
import { BottomHeader } from '../../../../shared/bottom-header/bottom-header';
import { AggregatorService, type ParseResult } from '../../services/aggregator.service';
import { type ClassSummary } from '../../models/aggregator.models';
import { type DecodedGameResult } from '../../services/report.service';

@Component({
  selector: 'app-aggregator',
  standalone: true,
  imports: [TopHeader, BottomHeader],
  templateUrl: './aggregator.html',
  styleUrl: './aggregator.scss',
})
export class AggregatorComponent {
  private readonly aggregatorService = inject(AggregatorService);

  protected readonly inputText = signal('');
  protected readonly parseResult = signal<ParseResult | null>(null);
  protected readonly summary = signal<ClassSummary | null>(null);
  protected readonly showTable = signal(false);
  protected readonly activeRound = signal<'round1' | 'round2'>('round2');
  protected readonly copiedState = signal(false);

  protected onInputChange(event: Event): void {
    this.inputText.set((event.target as HTMLTextAreaElement).value);
  }

  protected onProcess(): void {
    const text = this.inputText().trim();
    if (!text) return;

    const result = this.aggregatorService.parseResultStrings(text);
    this.parseResult.set(result);

    if (result.valid.length > 0) {
      this.summary.set(this.aggregatorService.buildClassSummary(result.valid));
    } else {
      this.summary.set(null);
    }
  }

  protected onClear(): void {
    this.inputText.set('');
    this.parseResult.set(null);
    this.summary.set(null);
  }

  protected toggleView(): void {
    this.showTable.update((v) => !v);
  }

  protected setRound(round: 'round1' | 'round2'): void {
    this.activeRound.set(round);
  }

  protected async onCopySummary(): Promise<void> {
    const s = this.summary();
    if (!s) return;

    const text = this.aggregatorService.formatClassSummaryText(s);
    try {
      await navigator.clipboard.writeText(text);
      this.copiedState.set(true);
      setTimeout(() => this.copiedState.set(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.body.removeChild(textarea);
    }
  }

  protected getDistribution(round: 'round1' | 'round2') {
    const s = this.summary();
    if (!s) return [];
    return round === 'round1' ? s.round1Distribution : s.round2Distribution;
  }

  protected maxOptionCount(categoryId: string): number {
    const dist = this.getDistribution(this.activeRound());
    const cat = dist.find((d) => d.categoryId === categoryId);
    if (!cat) return 1;
    return Math.max(1, ...cat.optionBreakdown.map((o) => o.count));
  }

  protected barWidthPct(count: number, total: number): string {
    return total > 0 ? `${(count / total) * 100}%` : '0%';
  }
}

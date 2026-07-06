import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Checkbook, CheckbookEntry, emptyEntry, sampleCheckbook } from '../../models/checkbook.model';
import { randomCheckbook } from '../../utils/random-checkbook.util';
import { FirstItemMutator } from '../../utils/first-item-mutator.util';
import { parseNumber } from '../../utils/input-parsers.util';
import { EditorShell } from '../editor-shell/editor-shell';

function emptyCheckbook(): Checkbook {
  return { accountHolder: '', accountNumber: '', openingBalance: 0, entries: [emptyEntry()] };
}

/** One checkbook row enriched with its running balance and a sort index. */
export interface CheckbookRow extends CheckbookEntry {
  origIndex: number;
  runningBalance: number;
}

@Component({
  selector: 'app-checkbook-editor',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, EditorShell],
  templateUrl: './checkbook-editor.html',
  styleUrl: './checkbook-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckbookEditor {
  protected readonly checkbooks = signal<Checkbook[]>([sampleCheckbook()]);
  protected readonly current = computed(() => this.checkbooks()[0] ?? sampleCheckbook());

  protected readonly randomFnRef = (): Checkbook => randomCheckbook();
  protected readonly clearFnRef = (): Checkbook => emptyCheckbook();

  // Cache computed rows per Checkbook object so the preview doesn't rerun the
  // O(N) prefix-sum for every row on every change detection cycle.
  private readonly rowsCache = new WeakMap<Checkbook, CheckbookRow[]>();

  /**
   * Rows sorted chronologically with a running balance per row. Undated rows
   * stay in insertion order at the bottom.
   */
  protected rowsOf(c: Checkbook): CheckbookRow[] {
    const cached = this.rowsCache.get(c);
    if (cached) return cached;

    const withIndex = c.entries.map((e, i) => ({ ...e, origIndex: i }));
    withIndex.sort((a, b) => {
      const da = a.date || '';
      const db = b.date || '';
      if (da === db) return a.origIndex - b.origIndex;
      if (!da) return 1;
      if (!db) return -1;
      return da < db ? -1 : 1;
    });

    let balance = c.openingBalance;
    const rows: CheckbookRow[] = withIndex.map((e) => {
      balance = balance + (e.credit || 0) - (e.debit || 0);
      return { ...e, runningBalance: balance };
    });

    this.rowsCache.set(c, rows);
    return rows;
  }

  protected endingBalanceOf(c: Checkbook): number {
    const rows = this.rowsOf(c);
    return rows.length ? rows[rows.length - 1].runningBalance : c.openingBalance;
  }

  private readonly mutator = new FirstItemMutator(this.checkbooks, sampleCheckbook);
  private mutateFirst(fn: (c: Checkbook) => Checkbook): void {
    this.mutator.mutate(fn);
  }

  protected readonly parseNumber = parseNumber;

  protected updateField<K extends keyof Checkbook>(key: K, value: Checkbook[K]): void {
    this.mutateFirst((c) => ({ ...c, [key]: value }));
  }
  protected updateEntry(index: number, patch: Partial<CheckbookEntry>): void {
    this.mutateFirst((c) => ({
      ...c,
      entries: c.entries.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    }));
  }
  protected addEntry(): void {
    this.mutateFirst((c) => ({ ...c, entries: [...c.entries, emptyEntry()] }));
  }
  protected removeEntry(index: number): void {
    this.mutateFirst((c) => ({ ...c, entries: c.entries.filter((_, i) => i !== index) }));
  }
}

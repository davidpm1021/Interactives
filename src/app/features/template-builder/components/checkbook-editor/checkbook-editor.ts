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

  protected runningBalancesOf(c: Checkbook): number[] {
    let balance = c.openingBalance;
    return c.entries.map((e) => {
      balance = balance + (e.credit || 0) - (e.debit || 0);
      return balance;
    });
  }
  protected endingBalanceOf(c: Checkbook): number {
    const bals = this.runningBalancesOf(c);
    return bals.length ? bals[bals.length - 1] : c.openingBalance;
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

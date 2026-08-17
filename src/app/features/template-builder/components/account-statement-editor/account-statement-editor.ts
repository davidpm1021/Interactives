import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  AccountStatement,
  AccountTransaction,
  emptyTxn,
  sampleChecking,
  sampleSavings,
} from '../../models/account-statement.model';
import { randomChecking, randomSavings } from '../../utils/random-account-statement.util';
import { FirstItemMutator } from '../../utils/first-item-mutator.util';
import {
  parseNonNegative,
  parseNullableNonNegative,
} from '../../utils/input-parsers.util';
import { EditorShell } from '../editor-shell/editor-shell';

function emptyStatement(forSavings: boolean): AccountStatement {
  return {
    bank: { name: '', tagline: '' },
    customer: { name: '', addressLine1: '', addressLine2: '' },
    accountNumber: '',
    accountType: forSavings ? 'High-Yield Savings' : 'Free Checking',
    periodStart: '',
    periodEnd: '',
    beginningBalance: 0,
    transactions: [emptyTxn()],
    fees: 0,
    interestEarned: 0,
    apy: forSavings ? 0 : null,
  };
}

interface EnrichedTxn extends AccountTransaction {
  runningBalance: number;
  origIndex: number;
  /**
   * True for the interest and fee rows derived from the summary fields. They
   * have no typed transaction behind them, so they are not editable and the
   * preview must not offer to jump to one.
   */
  synthetic?: boolean;
}

@Component({
  selector: 'app-account-statement-editor',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, EditorShell],
  templateUrl: './account-statement-editor.html',
  styleUrl: './account-statement-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountStatementEditor {
  readonly variant = input<'checking' | 'savings'>('checking');

  protected readonly statements = signal<AccountStatement[]>([sampleChecking()]);
  protected readonly current = computed(() => this.statements()[0] ?? sampleChecking());

  protected readonly randomFnRef = (): AccountStatement =>
    this.variant() === 'savings' ? randomSavings() : randomChecking();
  protected readonly clearFnRef = (): AccountStatement => emptyStatement(this.variant() === 'savings');

  private lastVariant: 'checking' | 'savings' | null = null;

  /** One ref per editor transaction row; used to scroll + focus on preview click. */
  private readonly txnRowRefs = viewChildren<ElementRef<HTMLElement>>('editorTxn');

  /** Which row is currently "highlighted" by a preview click; nulled after the flash animation. */
  protected readonly highlightedTxn = signal<number | null>(null);
  private highlightTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Scroll the editor row for `index` into view, focus its first input, and
   * briefly highlight it. Called when the teacher clicks the matching row in
   * the preview.
   */
  protected jumpToTxn(index: number): void {
    const el = this.txnRowRefs()[index]?.nativeElement;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Focus the first editable input inside the row, if any.
    el.querySelector<HTMLInputElement | HTMLSelectElement>('input, select')?.focus();
    this.highlightedTxn.set(index);
    if (this.highlightTimer !== null) clearTimeout(this.highlightTimer);
    this.highlightTimer = setTimeout(() => this.highlightedTxn.set(null), 1500);
  }

  constructor() {
    effect(() => {
      const v = this.variant();
      if (v === this.lastVariant) return;
      this.lastVariant = v;
      // Load the sample for the newly-selected variant.
      this.statements.set([v === 'savings' ? sampleSavings() : sampleChecking()]);
    });
  }

  protected totalDepositsOf(s: AccountStatement): number {
    return s.transactions
      .filter((t) => t.kind === 'credit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }
  protected totalWithdrawalsOf(s: AccountStatement): number {
    return s.transactions
      .filter((t) => t.kind === 'debit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }
  protected endingBalanceOf(s: AccountStatement): number {
    return (
      s.beginningBalance +
      this.totalDepositsOf(s) +
      (s.interestEarned || 0) -
      this.totalWithdrawalsOf(s) -
      s.fees
    );
  }

  /**
   * Chronologically-sorted transactions with a running balance per row,
   * used by the preview. Falls back to array order when dates are missing.
   */
  protected sortedTxnsOf(s: AccountStatement): EnrichedTxn[] {
    const withIndex = s.transactions.map((t, i) => ({ ...t, origIndex: i }));
    withIndex.sort((a, b) => {
      const da = a.date || '';
      const db = b.date || '';
      if (da === db) return a.origIndex - b.origIndex;
      if (!da) return 1; // undated go last
      if (!db) return -1;
      return da < db ? -1 : 1;
    });
    let running = s.beginningBalance;
    const rows: EnrichedTxn[] = withIndex.map((t) => {
      const amt = t.amount || 0;
      running += t.kind === 'credit' ? amt : -amt;
      return { ...t, runningBalance: running };
    });

    // Interest and fees are entered as summary figures rather than typed
    // transactions, but they still move the balance, so they post here as
    // rows dated the last day of the period. Without them the running column
    // stopped short of the stated ending balance: every generated savings
    // statement was out by exactly its interest, which made the standard
    // exercise of reconciling a statement impossible to complete.
    if (s.interestEarned > 0) {
      running += s.interestEarned;
      rows.push({
        date: s.periodEnd,
        description: 'INTEREST CREDIT',
        amount: s.interestEarned,
        kind: 'credit',
        runningBalance: running,
        origIndex: -1,
        synthetic: true,
      });
    }
    if (s.fees > 0) {
      running -= s.fees;
      rows.push({
        date: s.periodEnd,
        description: 'SERVICE FEES',
        amount: s.fees,
        kind: 'debit',
        runningBalance: running,
        origIndex: -2,
        synthetic: true,
      });
    }
    return rows;
  }

  private readonly mutator = new FirstItemMutator(this.statements, sampleChecking);
  private mutateFirst(fn: (s: AccountStatement) => AccountStatement): void {
    this.mutator.mutate(fn);
  }

  protected readonly parseNumber = parseNonNegative;
  protected readonly parseNullableNumber = parseNullableNonNegative;

  protected updateBank<K extends keyof AccountStatement['bank']>(key: K, value: string): void {
    this.mutateFirst((s) => ({ ...s, bank: { ...s.bank, [key]: value } }));
  }
  protected updateCustomer<K extends keyof AccountStatement['customer']>(key: K, value: string): void {
    this.mutateFirst((s) => ({ ...s, customer: { ...s.customer, [key]: value } }));
  }
  protected updateField<K extends keyof AccountStatement>(key: K, value: AccountStatement[K]): void {
    this.mutateFirst((s) => ({ ...s, [key]: value }));
  }
  protected updateTxn(index: number, patch: Partial<AccountTransaction>): void {
    this.mutateFirst((s) => ({
      ...s,
      transactions: s.transactions.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    }));
  }
  protected addTxn(): void {
    this.mutateFirst((s) => ({ ...s, transactions: [...s.transactions, emptyTxn()] }));
  }
  protected removeTxn(index: number): void {
    this.mutateFirst((s) => ({ ...s, transactions: s.transactions.filter((_, i) => i !== index) }));
  }

  protected addMaintenanceFee(): void {
    this.addFeeTxn('MONTHLY MAINTENANCE FEE', 12);
  }
  protected addAtmFee(): void {
    this.addFeeTxn('ATM FEE OUT-OF-NETWORK', 3.5);
  }

  /**
   * Append a debit transaction with a fixed description + amount, dated the
   * day before the statement period ends when possible (matches how random
   * generation places recurring fees). Skips insertion if a transaction with
   * the same description already exists so the button doesn't double-add.
   */
  private addFeeTxn(description: string, amount: number): void {
    const s = this.current();
    if (s.transactions.some((t) => t.description === description)) return;
    const endDate = s.periodEnd
      ? new Date(new Date(s.periodEnd).getTime() - 86_400_000).toISOString().slice(0, 10)
      : '';
    this.mutateFirst((next) => ({
      ...next,
      transactions: [...next.transactions, { date: endDate, description, amount, kind: 'debit' }],
    }));
  }
}

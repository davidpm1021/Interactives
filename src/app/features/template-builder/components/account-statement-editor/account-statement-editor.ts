import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
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
    return withIndex.map((t) => {
      const amt = t.amount || 0;
      running += t.kind === 'credit' ? amt : -amt;
      return { ...t, runningBalance: running };
    });
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

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
import { parseNumber } from '../../utils/input-parsers.util';
import { EditorShell } from '../editor-shell/editor-shell';

function emptyStatement(forSavings: boolean): AccountStatement {
  return {
    bank: { name: '', tagline: '' },
    customer: { name: '', addressLine1: '', addressLine2: '' },
    accountNumber: '',
    accountType: '',
    periodStart: '',
    periodEnd: '',
    beginningBalance: 0,
    transactions: [emptyTxn()],
    fees: 0,
    interestEarned: 0,
    apy: forSavings ? 0 : null,
  };
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

  constructor() {
    effect(() => {
      // Load the variant-appropriate sample once the input is bound
      if (this.variant() === 'savings' && this.statements()[0]?.accountType !== 'High-Yield Savings') {
        this.statements.set([sampleSavings()]);
      }
    });
  }

  protected totalDepositsOf(s: AccountStatement): number {
    return s.transactions.filter((t) => t.kind === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0);
  }
  protected totalWithdrawalsOf(s: AccountStatement): number {
    return s.transactions.filter((t) => t.kind === 'debit').reduce((sum, t) => sum + (t.amount || 0), 0);
  }
  protected endingBalanceOf(s: AccountStatement): number {
    return s.beginningBalance + this.totalDepositsOf(s) - this.totalWithdrawalsOf(s) - s.fees;
  }

  private readonly mutator = new FirstItemMutator(this.statements, sampleChecking);
  private mutateFirst(fn: (s: AccountStatement) => AccountStatement): void {
    this.mutator.mutate(fn);
  }

  protected readonly parseNumber = parseNumber;

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

}

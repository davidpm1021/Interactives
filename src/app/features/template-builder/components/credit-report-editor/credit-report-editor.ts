import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  CreditAccount,
  CreditInquiry,
  CreditReport,
  emptyAccount,
  emptyInquiry,
  sampleCreditReport,
} from '../../models/credit-report.model';
import { randomCreditReport } from '../../utils/random-credit-report.util';
import { FirstItemMutator } from '../../utils/first-item-mutator.util';
import { parseNumber, parseScore } from '../../utils/input-parsers.util';
import { EditorShell } from '../editor-shell/editor-shell';

function emptyReport(): CreditReport {
  return {
    consumer: { name: '', currentAddressLine1: '', currentAddressLine2: '', previousAddress: '', dobMasked: '', ssnMasked: '' },
    reportDate: '',
    bureau: 'Experian',
    score: 700,
    accounts: [],
    inquiries: [],
  };
}

@Component({
  selector: 'app-credit-report-editor',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, EditorShell],
  templateUrl: './credit-report-editor.html',
  styleUrl: './credit-report-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditReportEditor {
  protected readonly reports = signal<CreditReport[]>([sampleCreditReport()]);
  protected readonly current = computed(() => this.reports()[0] ?? sampleCreditReport());

  protected readonly randomFnRef = (): CreditReport => randomCreditReport();
  protected readonly clearFnRef = (): CreditReport => emptyReport();

  protected scoreCategoryOf(r: CreditReport): { label: string; color: string } {
    const s = r.score;
    if (s >= 800) return { label: 'Exceptional', color: '#2e7d32' };
    if (s >= 740) return { label: 'Very Good', color: '#558b2f' };
    if (s >= 670) return { label: 'Good', color: '#ef6c00' };
    if (s >= 580) return { label: 'Fair', color: '#e65100' };
    return { label: 'Poor', color: '#c62828' };
  }

  protected scoreFractionOf(r: CreditReport): number {
    const s = Math.max(300, Math.min(850, r.score));
    return ((s - 300) / 550) * 100;
  }

  private readonly mutator = new FirstItemMutator(this.reports, sampleCreditReport);
  private mutateFirst(fn: (r: CreditReport) => CreditReport): void {
    this.mutator.mutate(fn);
  }

  protected readonly parseNumber = parseNumber;
  protected readonly parseScore = parseScore;

  protected updateConsumer<K extends keyof CreditReport['consumer']>(key: K, value: string): void {
    this.mutateFirst((r) => ({ ...r, consumer: { ...r.consumer, [key]: value } }));
  }
  protected updateField<K extends keyof CreditReport>(key: K, value: CreditReport[K]): void {
    this.mutateFirst((r) => ({ ...r, [key]: value }));
  }
  protected updateAccount(index: number, patch: Partial<CreditAccount>): void {
    this.mutateFirst((r) => ({
      ...r,
      accounts: r.accounts.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    }));
  }
  protected addAccount(): void {
    this.mutateFirst((r) => ({ ...r, accounts: [...r.accounts, emptyAccount()] }));
  }
  protected removeAccount(index: number): void {
    this.mutateFirst((r) => ({ ...r, accounts: r.accounts.filter((_, i) => i !== index) }));
  }
  protected updateInquiry(index: number, patch: Partial<CreditInquiry>): void {
    this.mutateFirst((r) => ({
      ...r,
      inquiries: r.inquiries.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }));
  }
  protected addInquiry(): void {
    this.mutateFirst((r) => ({ ...r, inquiries: [...r.inquiries, emptyInquiry()] }));
  }
  protected removeInquiry(index: number): void {
    this.mutateFirst((r) => ({ ...r, inquiries: r.inquiries.filter((_, i) => i !== index) }));
  }

}

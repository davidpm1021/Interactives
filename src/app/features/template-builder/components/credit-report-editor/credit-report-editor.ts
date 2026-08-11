import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  CreditAccount,
  CreditInquiry,
  CreditReport,
  MonthStatus,
  PAYMENT_HISTORY_MONTHS,
  PublicRecord,
  emptyAccount,
  emptyInquiry,
  emptyPublicRecord,
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
    publicRecords: [],
    inquiries: [],
  };
}

/** Rotate a month cell through OK → 30 → 60 → 90 → CO → NA → OK on click. */
const CYCLE: MonthStatus[] = ['OK', '30', '60', '90', 'CO', 'NA'];
function nextStatus(cur: MonthStatus): MonthStatus {
  const i = CYCLE.indexOf(cur);
  return CYCLE[(i + 1) % CYCLE.length];
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

  /** Click a cell to cycle through payment-history statuses. */
  protected cyclePaymentMonth(accountIndex: number, monthIndex: number): void {
    this.mutateFirst((r) => ({
      ...r,
      accounts: r.accounts.map((a, i) => {
        if (i !== accountIndex) return a;
        const hist = [...a.paymentHistory];
        while (hist.length < PAYMENT_HISTORY_MONTHS) hist.push('OK');
        hist[monthIndex] = nextStatus(hist[monthIndex] ?? 'OK');
        return { ...a, paymentHistory: hist };
      }),
    }));
  }

  /** Reset an account's payment history to 24 months of on-time. */
  protected resetPaymentHistory(accountIndex: number): void {
    this.mutateFirst((r) => ({
      ...r,
      accounts: r.accounts.map((a, i) =>
        i === accountIndex ? { ...a, paymentHistory: Array(PAYMENT_HISTORY_MONTHS).fill('OK' as MonthStatus) } : a,
      ),
    }));
  }

  protected updatePublicRecord(index: number, patch: Partial<PublicRecord>): void {
    this.mutateFirst((r) => ({
      ...r,
      publicRecords: r.publicRecords.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }
  protected addPublicRecord(): void {
    this.mutateFirst((r) => ({ ...r, publicRecords: [...r.publicRecords, emptyPublicRecord()] }));
  }
  protected removePublicRecord(index: number): void {
    this.mutateFirst((r) => ({ ...r, publicRecords: r.publicRecords.filter((_, i) => i !== index) }));
  }

  /** Month label helper: given the report date and an offset, return e.g. "Feb '26". */
  protected monthLabel(reportDate: string, monthsAgo: number): string {
    const base = reportDate ? new Date(reportDate) : new Date();
    const d = new Date(base.getFullYear(), base.getMonth() - monthsAgo, 1);
    const m = d.toLocaleString('en-US', { month: 'short' });
    const y = String(d.getFullYear()).slice(-2);
    return `${m} '${y}`;
  }

  /** Cell-color mapping for the payment-history grid. */
  protected monthColor(status: MonthStatus): string {
    switch (status) {
      case 'OK': return '#2e7d32';
      case '30': return '#f9a825';
      case '60': return '#ef6c00';
      case '90': return '#c62828';
      case 'CO': return '#4a148c';
      case 'NA': return '#bdbdbd';
    }
  }

  /** Summary counts for the top "Accounts summary" block. */
  protected accountsSummary(r: CreditReport): {
    total: number;
    open: number;
    closed: number;
    pastDue: number;
    totalBalance: number;
    totalLimit: number;
  } {
    let open = 0, closed = 0, pastDue = 0, totalBalance = 0, totalLimit = 0;
    for (const a of r.accounts) {
      if (a.status === 'Open') open++;
      else closed++;
      if (a.paymentStatus !== 'Current') pastDue++;
      totalBalance += a.balance;
      totalLimit += a.creditLimit;
    }
    return { total: r.accounts.length, open, closed, pastDue, totalBalance, totalLimit };
  }

  /** Month indices 0..N-1 for the template's @for loop. */
  protected readonly monthIndices = Array.from({ length: PAYMENT_HISTORY_MONTHS }, (_, i) => i);
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

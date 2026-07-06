import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import {
  MEDICARE_RATE,
  Paystub,
  PaystubEarning,
  PaystubLineItem,
  SOCIAL_SECURITY_RATE,
  earningCurrent,
  emptyLineItem,
  emptyEarning,
  samplePaystub,
} from '../../models/paystub.model';
import { randomPaystub } from '../../utils/random-paystub.util';
import { FirstItemMutator } from '../../utils/first-item-mutator.util';
import {
  parseNonNegative,
  parseNullableNonNegative,
} from '../../utils/input-parsers.util';
import { EditorShell } from '../editor-shell/editor-shell';

function emptyPaystub(): Paystub {
  return {
    employer: { name: '', addressLine1: '', addressLine2: '' },
    employee: { name: '', addressLine1: '', addressLine2: '', employeeId: '' },
    period: { start: '', end: '', payDate: '', checkNumber: '' },
    periodsYTD: 1,
    earnings: [emptyEarning()],
    includeFICA: true,
    otherTaxes: [emptyLineItem()],
    deductions: [emptyLineItem()],
  };
}

@Component({
  selector: 'app-paystub-editor',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, DecimalPipe, PercentPipe, EditorShell],
  templateUrl: './paystub-editor.html',
  styleUrl: './paystub-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaystubEditor {
  protected readonly SOCIAL_SECURITY_RATE = SOCIAL_SECURITY_RATE;
  protected readonly MEDICARE_RATE = MEDICARE_RATE;

  protected readonly paystubs = signal<Paystub[]>([samplePaystub()]);
  protected readonly current = computed(() => this.paystubs()[0] ?? samplePaystub());

  protected readonly randomFnRef = (): Paystub => randomPaystub();
  protected readonly clearFnRef = (): Paystub => emptyPaystub();

  // Helpers that operate on a given paystub (used inside the preview template)
  protected earningCurrentFor(e: PaystubEarning): number {
    return earningCurrent(e);
  }
  protected earningYTDFor(e: PaystubEarning, p: Paystub): number {
    return earningCurrent(e) * p.periodsYTD;
  }
  protected itemYTDFor(item: PaystubLineItem, p: Paystub): number {
    return item.current * p.periodsYTD;
  }
  protected grossCurrentOf(p: Paystub): number {
    return p.earnings.reduce((sum, e) => sum + earningCurrent(e), 0);
  }
  protected grossYTDOf(p: Paystub): number {
    return this.grossCurrentOf(p) * p.periodsYTD;
  }
  protected ssCurrentOf(p: Paystub): number {
    return p.includeFICA ? this.grossCurrentOf(p) * SOCIAL_SECURITY_RATE : 0;
  }
  protected ssYTDOf(p: Paystub): number {
    return this.ssCurrentOf(p) * p.periodsYTD;
  }
  protected medicareCurrentOf(p: Paystub): number {
    return p.includeFICA ? this.grossCurrentOf(p) * MEDICARE_RATE : 0;
  }
  protected medicareYTDOf(p: Paystub): number {
    return this.medicareCurrentOf(p) * p.periodsYTD;
  }
  protected otherTaxesCurrentOf(p: Paystub): number {
    return p.otherTaxes.reduce((s, t) => s + (t.current || 0), 0);
  }
  protected taxesCurrentOf(p: Paystub): number {
    return this.ssCurrentOf(p) + this.medicareCurrentOf(p) + this.otherTaxesCurrentOf(p);
  }
  protected taxesYTDOf(p: Paystub): number {
    return this.taxesCurrentOf(p) * p.periodsYTD;
  }
  protected deductionsCurrentOf(p: Paystub): number {
    return p.deductions.reduce((s, d) => s + (d.current || 0), 0);
  }
  protected deductionsYTDOf(p: Paystub): number {
    return this.deductionsCurrentOf(p) * p.periodsYTD;
  }
  protected netCurrentOf(p: Paystub): number {
    return this.grossCurrentOf(p) - this.taxesCurrentOf(p) - this.deductionsCurrentOf(p);
  }
  protected netYTDOf(p: Paystub): number {
    return this.netCurrentOf(p) * p.periodsYTD;
  }

  // Form totals — operate on the first/edited paystub
  protected readonly ssCurrent = computed(() => this.ssCurrentOf(this.current()));
  protected readonly ssYTD = computed(() => this.ssYTDOf(this.current()));
  protected readonly medicareCurrent = computed(() => this.medicareCurrentOf(this.current()));
  protected readonly medicareYTD = computed(() => this.medicareYTDOf(this.current()));

  private readonly mutator = new FirstItemMutator(this.paystubs, samplePaystub);
  private mutateFirst(fn: (p: Paystub) => Paystub): void {
    this.mutator.mutate(fn);
  }

  protected readonly parseNumber = parseNonNegative;
  protected readonly parseNullableNumber = parseNullableNonNegative;

  protected updateEmployer<K extends keyof Paystub['employer']>(key: K, value: string): void {
    this.mutateFirst((p) => ({ ...p, employer: { ...p.employer, [key]: value } }));
  }
  protected updateEmployee<K extends keyof Paystub['employee']>(key: K, value: string): void {
    this.mutateFirst((p) => ({ ...p, employee: { ...p.employee, [key]: value } }));
  }
  protected updatePeriod<K extends keyof Paystub['period']>(key: K, value: string): void {
    this.mutateFirst((p) => ({ ...p, period: { ...p.period, [key]: value } }));
  }
  protected updatePeriodsYTD(value: string): void {
    const n = Math.max(1, Math.round(Number(value) || 1));
    this.mutateFirst((p) => ({ ...p, periodsYTD: n }));
  }
  protected updateIncludeFICA(value: boolean): void {
    this.mutateFirst((p) => ({ ...p, includeFICA: value }));
  }
  protected updateEarning(index: number, patch: Partial<PaystubEarning>): void {
    this.mutateFirst((p) => ({
      ...p,
      earnings: p.earnings.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    }));
  }
  protected updateOtherTax(index: number, patch: Partial<PaystubLineItem>): void {
    this.mutateFirst((p) => ({
      ...p,
      otherTaxes: p.otherTaxes.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    }));
  }
  protected updateDeduction(index: number, patch: Partial<PaystubLineItem>): void {
    this.mutateFirst((p) => ({
      ...p,
      deductions: p.deductions.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    }));
  }
  protected addEarning(): void {
    this.mutateFirst((p) => ({ ...p, earnings: [...p.earnings, emptyEarning()] }));
  }
  protected removeEarning(index: number): void {
    this.mutateFirst((p) => ({ ...p, earnings: p.earnings.filter((_, i) => i !== index) }));
  }
  protected addOtherTax(): void {
    this.mutateFirst((p) => ({ ...p, otherTaxes: [...p.otherTaxes, emptyLineItem()] }));
  }
  protected removeOtherTax(index: number): void {
    this.mutateFirst((p) => ({ ...p, otherTaxes: p.otherTaxes.filter((_, i) => i !== index) }));
  }
  protected addDeduction(): void {
    this.mutateFirst((p) => ({ ...p, deductions: [...p.deductions, emptyLineItem()] }));
  }
  protected removeDeduction(index: number): void {
    this.mutateFirst((p) => ({ ...p, deductions: p.deductions.filter((_, i) => i !== index) }));
  }

  /**
   * Show the flat-amount input only when BOTH hours and rate are blank.
   * If either is filled, the earning is hours*rate and the flat amount is
   * unreachable (would silently override).
   */
  protected showAmountField(e: PaystubEarning): boolean {
    return e.hours === null && e.rate === null;
  }

  /** Sanity readout: annualized gross implied by current × periodsYTD. */
  protected readonly ytdGrossReadout = computed(() => this.grossYTDOf(this.current()));
}

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
  lineItemAmount,
  samplePaystub,
} from '../../models/paystub.model';
import { EMPLOYER_STATES, PaystubRandomOptions, randomPaystub } from '../../utils/random-paystub.util';
import { FirstItemMutator } from '../../utils/first-item-mutator.util';
import {
  parseNonNegative,
  parseNullableNonNegative,
} from '../../utils/input-parsers.util';
import { effectiveFederalRate, effectiveStateRate } from '../../utils/tax-rates.util';
import { EditorShell } from '../editor-shell/editor-shell';

/** Preset picker options for common deductions. */
interface DeductionPreset {
  id: string;
  description: string;
  kind: '$' | '%';
  value: number;
}

const DEDUCTION_PRESETS: DeductionPreset[] = [
  { id: 'health-50', description: 'Health Insurance', kind: '$', value: 50 },
  { id: 'dental-12', description: 'Dental Insurance', kind: '$', value: 12 },
  { id: 'vision-8',  description: 'Vision Insurance', kind: '$', value: 8  },
  { id: '401k-3',    description: '401(k) Contribution', kind: '%', value: 3 },
  { id: '401k-5',    description: '401(k) Contribution', kind: '%', value: 5 },
  { id: '401k-7',    description: '401(k) Contribution', kind: '%', value: 7 },
  { id: 'roth-3',    description: 'Roth 401(k)', kind: '%', value: 3 },
  { id: 'hsa-100',   description: 'HSA Contribution', kind: '$', value: 100 },
  { id: 'fsa-50',    description: 'FSA Contribution', kind: '$', value: 50 },
];

/** Two-letter state abbreviations we know how to compute withholding for. */
const STATES_WITH_TAX = [
  'CA', 'CO', 'CT', 'GA', 'IL', 'IN', 'KY', 'MA', 'MI', 'MN', 'MT', 'NC', 'NJ',
  'NY', 'OR', 'PA', 'UT', 'VT', 'WI',
];

function emptyPaystub(): Paystub {
  return {
    employer: { name: '', addressLine1: '', addressLine2: '' },
    employee: { name: '', addressLine1: '', addressLine2: '', employeeId: '' },
    period: { start: '', end: '', payDate: '', checkNumber: '' },
    periodsYTD: 1,
    earnings: [emptyEarning()],
    includeFICA: true,
    includeFederalTax: false,
    stateForTax: '',
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
  protected readonly deductionPresets = DEDUCTION_PRESETS;
  protected readonly statesWithTax = STATES_WITH_TAX;

  protected readonly paystubs = signal<Paystub[]>([samplePaystub()]);
  protected readonly current = computed(() => this.paystubs()[0] ?? samplePaystub());

  protected readonly randomFnRef = (): Paystub => randomPaystub();

  // ── Configured random ──
  protected readonly employerStates = EMPLOYER_STATES;
  /** Preset income bands. "custom" defers to configCustomIncome. */
  protected readonly incomeBand = signal<'any' | 'low' | 'mid' | 'high' | 'custom'>('any');
  protected readonly configCustomIncome = signal<number>(45000);
  protected readonly configState = signal<string>('');
  protected readonly configSmallOnly = signal<boolean>(false);
  protected readonly configOvertime = signal<'random' | 'yes' | 'no'>('random');

  protected setIncomeBand(value: 'any' | 'low' | 'mid' | 'high' | 'custom'): void {
    this.incomeBand.set(value);
  }
  protected setConfigCustomIncome(value: string | number): void {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isFinite(n)) this.configCustomIncome.set(Math.max(0, n));
  }
  protected setConfigState(value: string): void {
    this.configState.set(value);
  }
  protected setConfigSmallOnly(value: boolean): void {
    this.configSmallOnly.set(value);
  }
  protected setConfigOvertime(value: 'random' | 'yes' | 'no'): void {
    this.configOvertime.set(value);
  }

  /** Translate the panel signals into a PaystubRandomOptions object. */
  private buildOptions(): PaystubRandomOptions {
    const band = this.incomeBand();
    let annualIncomeTarget: number | undefined;
    switch (band) {
      case 'low':    annualIncomeTarget = 18_000 + Math.random() * 7_000;  break; // $18-25k
      case 'mid':    annualIncomeTarget = 28_000 + Math.random() * 17_000; break; // $28-45k
      case 'high':   annualIncomeTarget = 50_000 + Math.random() * 40_000; break; // $50-90k
      case 'custom': annualIncomeTarget = this.configCustomIncome();            break;
      default:       annualIncomeTarget = undefined;
    }
    const ot = this.configOvertime();
    return {
      annualIncomeTarget,
      state: this.configState() || undefined,
      smallEmployerOnly: this.configSmallOnly() || undefined,
      includeOvertime: ot === 'yes' ? true : ot === 'no' ? false : undefined,
    };
  }

  /** "Generate with these settings" — replaces the first paystub. */
  protected generateConfigured(): void {
    const next = randomPaystub(new Date(), this.buildOptions());
    this.paystubs.update((list) => [next, ...list.slice(1)]);
  }
  protected readonly clearFnRef = (): Paystub => emptyPaystub();

  // Helpers that operate on a given paystub (used inside the preview template)
  protected earningCurrentFor(e: PaystubEarning): number {
    return earningCurrent(e);
  }
  protected earningYTDFor(e: PaystubEarning, p: Paystub): number {
    return earningCurrent(e) * p.periodsYTD;
  }
  protected itemYTDFor(item: PaystubLineItem, p: Paystub): number {
    return this.itemCurrentFor(item, p) * p.periodsYTD;
  }
  protected itemCurrentFor(item: PaystubLineItem, p: Paystub): number {
    return lineItemAmount(item, this.grossCurrentOf(p));
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
    return p.otherTaxes.reduce((s, t) => s + this.itemCurrentFor(t, p), 0);
  }
  protected federalCurrentOf(p: Paystub): number {
    if (!p.includeFederalTax) return 0;
    const gross = this.grossCurrentOf(p);
    if (gross <= 0) return 0;
    return Math.round(gross * effectiveFederalRate(gross * 26) * 100) / 100;
  }
  protected federalYTDOf(p: Paystub): number {
    return this.federalCurrentOf(p) * p.periodsYTD;
  }
  protected stateCurrentOf(p: Paystub): number {
    if (!p.stateForTax) return 0;
    const gross = this.grossCurrentOf(p);
    if (gross <= 0) return 0;
    return Math.round(gross * effectiveStateRate(p.stateForTax, gross * 26) * 100) / 100;
  }
  protected stateYTDOf(p: Paystub): number {
    return this.stateCurrentOf(p) * p.periodsYTD;
  }
  protected taxesCurrentOf(p: Paystub): number {
    return this.ssCurrentOf(p)
      + this.medicareCurrentOf(p)
      + this.federalCurrentOf(p)
      + this.stateCurrentOf(p)
      + this.otherTaxesCurrentOf(p);
  }
  protected taxesYTDOf(p: Paystub): number {
    return this.taxesCurrentOf(p) * p.periodsYTD;
  }
  protected deductionsCurrentOf(p: Paystub): number {
    return p.deductions.reduce((s, d) => s + this.itemCurrentFor(d, p), 0);
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
  protected readonly federalCurrent = computed(() => this.federalCurrentOf(this.current()));
  protected readonly federalYTD = computed(() => this.federalYTDOf(this.current()));
  protected readonly stateCurrent = computed(() => this.stateCurrentOf(this.current()));
  protected readonly stateYTD = computed(() => this.stateYTDOf(this.current()));

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
  protected updateIncludeFederalTax(value: boolean): void {
    this.mutateFirst((p) => ({ ...p, includeFederalTax: value }));
  }
  protected updateStateForTax(value: string): void {
    this.mutateFirst((p) => ({ ...p, stateForTax: value }));
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

  /** Toggle a single deduction row between $-fixed and %-of-gross mode. */
  protected setDeductionKind(index: number, kind: '$' | '%'): void {
    this.mutateFirst((p) => ({
      ...p,
      deductions: p.deductions.map((d, i) =>
        i === index
          ? kind === '%'
            ? { ...d, percentOfGross: d.percentOfGross ?? 5 }
            : { ...d, percentOfGross: null }
          : d,
      ),
    }));
  }

  /** Insert a deduction row from a preset. */
  protected addDeductionPreset(presetId: string): void {
    const preset = DEDUCTION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const row: PaystubLineItem = preset.kind === '%'
      ? { description: preset.description, current: 0, percentOfGross: preset.value }
      : { description: preset.description, current: preset.value, percentOfGross: null };
    this.mutateFirst((p) => ({ ...p, deductions: [...p.deductions, row] }));
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

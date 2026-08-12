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
import { EMPLOYER_STATES, PaystubRandomOptions, randomPaystub } from '../../utils/random-paystub.util';
import { FirstItemMutator } from '../../utils/first-item-mutator.util';
import {
  parseNonNegative,
  parseNullableNonNegative,
} from '../../utils/input-parsers.util';
import { EditorShell } from '../editor-shell/editor-shell';
import * as math from '../../utils/paystub-math.util';

/** Preset picker options for common deductions. */
interface DeductionPreset {
  id: string;
  description: string;
  kind: '$' | '%';
  value: number;
  /** Comes out before income tax, lowering the FIT/state base. */
  preTax?: boolean;
}

// Traditional 401(k) is pre-tax and Roth 401(k) is not, which is the whole
// contrast a teacher is usually after. Health, dental and vision are left
// post-tax here so the paystub agrees with the W-2 generator, which excludes
// only the 401(k) deferral from Box 1; the per-row Pre-tax box can override
// any of them.
const DEDUCTION_PRESETS: DeductionPreset[] = [
  { id: 'health-50', description: 'Health Insurance', kind: '$', value: 50 },
  { id: 'dental-12', description: 'Dental Insurance', kind: '$', value: 12 },
  { id: 'vision-8',  description: 'Vision Insurance', kind: '$', value: 8  },
  { id: '401k-3',    description: '401(k) Contribution', kind: '%', value: 3, preTax: true },
  { id: '401k-5',    description: '401(k) Contribution', kind: '%', value: 5, preTax: true },
  { id: '401k-7',    description: '401(k) Contribution', kind: '%', value: 7, preTax: true },
  { id: 'roth-3',    description: 'Roth 401(k)', kind: '%', value: 3 },
  { id: 'hsa-100',   description: 'HSA Contribution', kind: '$', value: 100, preTax: true },
  { id: 'fsa-50',    description: 'FSA Contribution', kind: '$', value: 50, preTax: true },
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
    // A blank sheet a teacher fills in by hand: mid-window, so whatever they
    // type gets the published rate rather than an arbitrary offset.
    taxJitter: 0.5,
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

  /**
   * Preview is hidden until the teacher generates something — one-click
   * random via the shell button, custom-configured via generateConfigured(),
   * or a blank sheet via the shell's Clear all button. Two-way bound to the
   * shell's hidePreview model.
   */
  protected readonly hidePreview = signal(true);

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

  /** "Generate with these settings" — replaces the first paystub and reveals the preview. */
  protected generateConfigured(): void {
    const next = randomPaystub(new Date(), this.buildOptions());
    this.paystubs.update((list) => [next, ...list.slice(1)]);
    this.hidePreview.set(false);
  }
  protected readonly clearFnRef = (): Paystub => emptyPaystub();

  // Helpers that operate on a given paystub (used inside the preview template)
  protected earningCurrentFor(e: PaystubEarning): number {
    return earningCurrent(e);
  }
  protected earningYTDFor(e: PaystubEarning, p: Paystub): number {
    return math.earningYTD(e, p);
  }
  protected itemYTDFor(item: PaystubLineItem, p: Paystub): number {
    return math.lineItemYTD(item, p);
  }
  protected itemCurrentFor(item: PaystubLineItem, p: Paystub): number {
    return math.lineItemCurrent(item, p);
  }
  protected grossCurrentOf(p: Paystub): number {
    return math.grossCurrent(p);
  }
  protected grossYTDOf(p: Paystub): number {
    return math.grossYTD(p);
  }
  protected ssCurrentOf(p: Paystub): number {
    return math.socialSecurityCurrent(p);
  }
  protected ssYTDOf(p: Paystub): number {
    return math.socialSecurityYTD(p);
  }
  protected medicareCurrentOf(p: Paystub): number {
    return math.medicareCurrent(p);
  }
  protected medicareYTDOf(p: Paystub): number {
    return math.medicareYTD(p);
  }
  protected otherTaxesCurrentOf(p: Paystub): number {
    return math.otherTaxesCurrent(p);
  }
  protected federalCurrentOf(p: Paystub): number {
    return math.federalCurrent(p);
  }
  protected federalYTDOf(p: Paystub): number {
    return math.federalYTD(p);
  }
  protected stateCurrentOf(p: Paystub): number {
    return math.stateCurrent(p);
  }
  protected stateYTDOf(p: Paystub): number {
    return math.stateYTD(p);
  }
  protected taxesCurrentOf(p: Paystub): number {
    return math.taxesCurrent(p);
  }
  protected taxesYTDOf(p: Paystub): number {
    return math.taxesYTD(p);
  }
  protected deductionsCurrentOf(p: Paystub): number {
    return math.deductionsCurrent(p);
  }
  protected deductionsYTDOf(p: Paystub): number {
    return math.deductionsYTD(p);
  }
  protected netCurrentOf(p: Paystub): number {
    return math.netCurrent(p);
  }
  protected netYTDOf(p: Paystub): number {
    return math.netYTD(p);
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
      ? { description: preset.description, current: 0, percentOfGross: preset.value, preTax: !!preset.preTax }
      : { description: preset.description, current: preset.value, percentOfGross: null, preTax: !!preset.preTax };
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

import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEFAULT_MATCH, EmployerMatch, RetirementInputs } from '../../models/retirement.models';

@Component({
  selector: 'app-inputs-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './inputs-panel.html',
  styleUrl: './inputs-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputsPanel {
  readonly inputs = input.required<RetirementInputs>();
  readonly inputsChange = output<RetirementInputs>();

  /** Display mode for the monthly contribution field. Model always stores $/mo. */
  protected readonly contributionMode = signal<'$' | '%'>('$');

  /** Derived percent-of-salary for the current $/mo contribution. */
  protected readonly contributionPct = computed(() => {
    const salary = this.inputs().currentSalary;
    if (!Number.isFinite(salary) || salary <= 0) return 0;
    return (this.inputs().monthlyContribution * 12 * 100) / salary;
  });

  protected setContributionMode(mode: '$' | '%'): void {
    this.contributionMode.set(mode);
  }

  /**
   * Format the % contribution for display: one decimal, no trailing zeros
   * beyond that. Zero salary → empty (student needs to fill in salary first).
   */
  protected formatPct(v: number): string {
    if (!Number.isFinite(v) || v <= 0) return '';
    return v.toFixed(1);
  }

  /** Parse a "10.0" style input and emit an updated monthlyContribution ($/mo). */
  protected onPctContributionInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const pct = parseFloat(raw);
    if (!Number.isFinite(pct) || pct < 0) return;
    const salary = this.inputs().currentSalary;
    if (!Number.isFinite(salary) || salary <= 0) return;
    const monthly = Math.round((salary * (pct / 100)) / 12);
    this.update('monthlyContribution', monthly);
  }

  // ── Employer match ─────────────────────────────────────────────────────

  protected readonly matchEnabled = computed(() => this.inputs().employerMatch !== undefined);

  protected readonly matchRatePct = computed(() => {
    const m = this.inputs().employerMatch;
    return m ? +(m.matchRate * 100).toFixed(1) : DEFAULT_MATCH.matchRate * 100;
  });

  protected readonly matchCapPct = computed(() => {
    const m = this.inputs().employerMatch;
    return m ? +(m.capPct * 100).toFixed(1) : DEFAULT_MATCH.capPct * 100;
  });

  protected toggleMatch(): void {
    if (this.matchEnabled()) {
      this.update('employerMatch', undefined);
    } else {
      this.update('employerMatch', { ...DEFAULT_MATCH });
    }
  }

  protected onMatchRateInput(event: Event): void {
    const pct = parseFloat((event.target as HTMLInputElement).value);
    if (!Number.isFinite(pct) || pct < 0) return;
    const clamped = Math.min(200, pct);
    this.updateMatch({ matchRate: clamped / 100 });
  }

  protected onMatchCapInput(event: Event): void {
    const pct = parseFloat((event.target as HTMLInputElement).value);
    if (!Number.isFinite(pct) || pct < 0) return;
    const clamped = Math.min(25, pct);
    this.updateMatch({ capPct: clamped / 100 });
  }

  private updateMatch(partial: Partial<EmployerMatch>): void {
    const current = this.inputs().employerMatch ?? DEFAULT_MATCH;
    this.update('employerMatch', { ...current, ...partial });
  }

  protected update<K extends keyof RetirementInputs>(key: K, value: RetirementInputs[K]): void {
    this.inputsChange.emit({ ...this.inputs(), [key]: value });
  }

  protected updateNumber<K extends keyof RetirementInputs>(key: K, raw: string | number): void {
    const n = typeof raw === 'string' ? parseFloat(raw) : raw;
    if (!Number.isFinite(n)) return;
    this.update(key, n as RetirementInputs[K]);
  }

  /** Display helper for money fields: 100000 → "100,000", 0 → "0". */
  protected formatMoney(n: number): string {
    if (!Number.isFinite(n)) return '';
    return Math.round(n).toLocaleString('en-US');
  }

  /**
   * Handles input on a comma-formatted money field. Strips non-digits from the
   * raw text, updates the model with the parsed integer, and reformats the
   * displayed value so commas appear as the student types. Caret position is
   * pinned by distance-from-end so it doesn't jump when a comma is inserted or
   * removed by the reformat.
   */
  protected onMoneyInput<K extends keyof RetirementInputs>(key: K, event: Event): void {
    const target = event.target as HTMLInputElement;
    const stripped = target.value.replace(/[^0-9]/g, '');
    const n = stripped === '' ? 0 : parseInt(stripped, 10);
    if (!Number.isFinite(n)) return;

    const formatted = this.formatMoney(n);
    if (target.value !== formatted) {
      const caretFromEnd = target.value.length - (target.selectionStart ?? target.value.length);
      target.value = formatted;
      const newPos = Math.max(0, formatted.length - caretFromEnd);
      target.setSelectionRange(newPos, newPos);
    }

    this.update(key, n as RetirementInputs[K]);
  }
}

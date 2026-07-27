import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DEFAULT_ASSUMPTIONS, RetirementAssumptions } from '../../models/retirement.models';

/** UI-facing metadata for each editable assumption. */
interface AssumptionField {
  key: keyof RetirementAssumptions;
  label: string;
  hint: string;
  max: number; // upper bound in percent
}

const FIELDS: AssumptionField[] = [
  { key: 'preReturn', label: 'Pre-retirement return', hint: 'How much your investments grow each year while working.', max: 15 },
  { key: 'postReturn', label: 'Post-retirement return', hint: 'How much the balance keeps growing during drawdown.', max: 15 },
  { key: 'inflation', label: 'Inflation', hint: 'How much prices rise each year.', max: 10 },
  { key: 'incomeGrowth', label: 'Salary growth', hint: 'How much your income (and monthly contribution) grows each year.', max: 10 },
];

@Component({
  selector: 'app-assumptions-panel',
  standalone: true,
  imports: [],
  templateUrl: './assumptions-panel.html',
  styleUrl: './assumptions-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssumptionsPanel {
  readonly assumptions = input.required<RetirementAssumptions>();
  readonly assumptionsChange = output<RetirementAssumptions>();

  protected readonly fields = FIELDS;

  /** Display value: 0.06 → "6.0". */
  protected pct(fraction: number): string {
    return (fraction * 100).toFixed(1);
  }

  protected isDefault(): boolean {
    const a = this.assumptions();
    return (
      a.preReturn === DEFAULT_ASSUMPTIONS.preReturn &&
      a.postReturn === DEFAULT_ASSUMPTIONS.postReturn &&
      a.inflation === DEFAULT_ASSUMPTIONS.inflation &&
      a.incomeGrowth === DEFAULT_ASSUMPTIONS.incomeGrowth
    );
  }

  /**
   * Parse a "6.0" style input into a fraction (0.06). Clamped to [0, max/100].
   * Non-finite input is ignored (no state change).
   */
  protected onPctInput(field: AssumptionField, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const pct = parseFloat(raw);
    if (!Number.isFinite(pct)) return;
    const clamped = Math.max(0, Math.min(field.max, pct));
    this.assumptionsChange.emit({ ...this.assumptions(), [field.key]: clamped / 100 });
  }

  protected onReset(): void {
    this.assumptionsChange.emit({ ...DEFAULT_ASSUMPTIONS });
  }
}

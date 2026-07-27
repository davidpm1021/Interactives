import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RetirementInputs } from '../../models/retirement.models';

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

import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
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

  protected readonly returnPct = computed(() => Math.round(this.inputs().expectedReturn * 1000) / 10);

  protected update<K extends keyof RetirementInputs>(key: K, value: RetirementInputs[K]): void {
    this.inputsChange.emit({ ...this.inputs(), [key]: value });
  }

  protected updateNumber<K extends keyof RetirementInputs>(key: K, raw: string | number): void {
    const n = typeof raw === 'string' ? parseFloat(raw) : raw;
    if (!Number.isFinite(n)) return;
    this.update(key, n as RetirementInputs[K]);
  }

  protected updateReturnPct(raw: string | number): void {
    const pct = typeof raw === 'string' ? parseFloat(raw) : raw;
    if (!Number.isFinite(pct)) return;
    this.update('expectedReturn', pct / 100);
  }
}

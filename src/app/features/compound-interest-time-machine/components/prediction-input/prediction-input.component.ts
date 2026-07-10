import { Component, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-prediction-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './prediction-input.component.html',
  styleUrl: './prediction-input.component.scss',
})
export class PredictionInputComponent {
  readonly prompt = input('');
  readonly min = input(0);
  readonly max = input(1_000_000);
  readonly hint = input('');

  readonly valueChanged = output<number>();

  protected readonly rawValue = signal('');

  protected readonly parsedValue = computed(() => {
    const cleaned = this.rawValue().replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : null;
  });

  protected readonly isValid = computed(() => {
    const val = this.parsedValue();
    return val !== null && val >= this.min() && val <= this.max();
  });

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Strip non-numeric, format with commas
    const digits = input.value.replace(/[^0-9]/g, '');
    const num = digits ? parseInt(digits, 10) : 0;
    const formatted = num > 0 ? num.toLocaleString('en-US') : '';
    this.rawValue.set(formatted);
    input.value = formatted;

    // Emit whenever the value is valid so parent can enable "Show me"
    if (num > 0 && num >= this.min() && num <= this.max()) {
      this.valueChanged.emit(num);
    }
  }
}

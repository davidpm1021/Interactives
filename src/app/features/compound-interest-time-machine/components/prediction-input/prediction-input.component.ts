import { Component, effect, input, output, signal, computed, untracked } from '@angular/core';
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
  /**
   * Value to pre-fill. Set when the student navigates Back into this screen
   * so their previous guess is restored and visible rather than silently
   * retained or discarded.
   */
  readonly initialValue = input<number | null>(null);
  /**
   * Strips the prompt, hint and outer spacing so the field can sit inside a
   * table cell as the missing entry in a comparison.
   */
  readonly compact = input(false);
  /**
   * Defaults to "?" rather than "0": a bare zero renders like a real entry,
   * and in the scenario table it sat alongside genuine figures as if the cell
   * were already answered.
   */
  readonly placeholder = input('?');

  /**
   * Emits null when the field no longer holds a usable number.
   *
   * Emitting only on valid input let the parent keep an earlier value while
   * the field showed a newer, out-of-range one: typing 82000 then backspacing
   * to 8200 submitted 82,000 and the reveal quoted a guess the student never
   * made.
   */
  readonly valueChanged = output<number | null>();

  protected readonly rawValue = signal('');

  constructor() {
    // Seed once from the restored value; later edits come from onInput.
    effect(() => {
      const initial = this.initialValue();
      if (initial !== null && untracked(() => this.rawValue()) === '') {
        this.rawValue.set(initial.toLocaleString('en-US'));
        this.valueChanged.emit(initial);
      }
    });
  }

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

    // Emit either way, so the parent's guess always matches what's on screen.
    const valid = num > 0 && num >= this.min() && num <= this.max();
    this.valueChanged.emit(valid ? num : null);
  }

  /**
   * True once the student has typed something that isn't a usable answer.
   * Drives an inline message, because `compact` mode hides the hint and the
   * only other feedback was the forward button quietly failing to appear.
   */
  protected readonly showRangeHint = computed(
    () => this.parsedValue() !== null && !this.isValid(),
  );

  protected readonly rangeHintText = computed(
    () => `Enter an amount between ${this.min().toLocaleString('en-US')} and ` +
      `${this.max().toLocaleString('en-US')}.`,
  );
}

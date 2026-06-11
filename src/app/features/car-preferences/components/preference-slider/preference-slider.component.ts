import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PreferenceCategory } from '../../models/car-preferences.models';
import { nearestAnchor } from '../../utils/nearest-anchor.util';

@Component({
  selector: 'app-preference-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preference-slider.component.html',
  styleUrl: './preference-slider.component.scss',
})
export class PreferenceSliderComponent {
  readonly category = input.required<PreferenceCategory>();
  readonly value = input.required<number>();
  readonly disabled = input(false);

  readonly valueChange = output<number>();
  readonly interacted = output<void>();

  protected readonly anchor = computed(() => nearestAnchor(this.value(), this.category().anchors));
  protected readonly ariaValueText = computed(() => {
    const a = this.anchor();
    return `${this.value()}, ${a.tag}: ${a.description}`;
  });
  protected readonly tickPositions = computed(() =>
    this.category().anchors.map((a) => ({ value: a.value, leftPct: a.value * 10 })),
  );

  protected onInput(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    this.valueChange.emit(v);
    this.interacted.emit();
  }
}

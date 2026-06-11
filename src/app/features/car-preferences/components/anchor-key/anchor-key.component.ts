import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PreferenceCategory } from '../../models/car-preferences.models';

@Component({
  selector: 'app-anchor-key',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './anchor-key.component.html',
  styleUrl: './anchor-key.component.scss',
})
export class AnchorKeyComponent {
  readonly categories = input.required<PreferenceCategory[]>();

  protected readonly anchorValues = computed(() => {
    const cats = this.categories();
    if (cats.length === 0) return [];
    const set = new Set<number>();
    for (const cat of cats) for (const a of cat.anchors) set.add(a.value);
    return [...set].sort((a, b) => a - b);
  });

  protected tagAt(cat: PreferenceCategory, value: number): string {
    return cat.anchors.find((a) => a.value === value)?.tag ?? '';
  }
}

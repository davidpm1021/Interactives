import { Component, input, output, computed, signal } from '@angular/core';
import { Unit } from '../../models/flashcard.models';

@Component({
  selector: 'app-unit-selection',
  standalone: true,
  imports: [],
  templateUrl: './unit-selection.component.html',
  styleUrl: './unit-selection.component.scss',
})
export class UnitSelectionComponent {
  readonly units = input.required<Unit[]>();
  readonly unitsSelected = output<Unit[]>();

  protected readonly selectedUnitIds = signal<Set<number>>(new Set());

  protected readonly hasSelection = computed(
    () => this.selectedUnitIds().size > 0
  );

  protected readonly allSelected = computed(
    () => this.selectedUnitIds().size === this.units().length
  );

  protected readonly totalSelectedTerms = computed(() => {
    const selectedIds = this.selectedUnitIds();
    return this.units()
      .filter((unit) => selectedIds.has(unit.id))
      .reduce((sum, unit) => sum + unit.terms.length, 0);
  });

  protected isSelected(unitId: number): boolean {
    return this.selectedUnitIds().has(unitId);
  }

  protected toggleUnit(unitId: number): void {
    const current = new Set(this.selectedUnitIds());
    if (current.has(unitId)) {
      current.delete(unitId);
    } else {
      current.add(unitId);
    }
    this.selectedUnitIds.set(current);
  }

  protected selectAll(): void {
    const allIds = new Set(this.units().map((u) => u.id));
    this.selectedUnitIds.set(allIds);
  }

  protected deselectAll(): void {
    this.selectedUnitIds.set(new Set());
  }

  protected onContinue(): void {
    const selectedIds = this.selectedUnitIds();
    const selectedUnits = this.units().filter((u) => selectedIds.has(u.id));
    this.unitsSelected.emit(selectedUnits);
  }
}

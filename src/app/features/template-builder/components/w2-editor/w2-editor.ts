import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { W2, W2Box12, emptyBox12, sampleW2 } from '../../models/w2.model';
import { randomW2 } from '../../utils/random-w2.util';
import { FirstItemMutator } from '../../utils/first-item-mutator.util';
import { parseNonNegative, parseYear } from '../../utils/input-parsers.util';
import { EditorShell } from '../editor-shell/editor-shell';

function emptyW2(): W2 {
  return {
    taxYear: new Date().getFullYear() - 1,
    employeeSSN: '',
    employerEIN: '',
    employer: { name: '', addressLine1: '', addressLine2: '' },
    controlNumber: '',
    employee: { firstName: '', lastName: '', addressLine1: '', addressLine2: '' },
    wages: 0, fedTaxWithheld: 0,
    ssWages: 0, ssTaxWithheld: 0,
    medicareWages: 0, medicareTaxWithheld: 0,
    ssTips: 0, allocatedTips: 0, dependentCareBenefits: 0, nonqualifiedPlans: 0,
    box12: [],
    statutoryEmployee: false, retirementPlan: false, thirdPartySickPay: false,
    box14: '',
    stateAbbr: '', employerStateIdNumber: '',
    stateWages: 0, stateTaxWithheld: 0,
  };
}

@Component({
  selector: 'app-w2-editor',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, EditorShell],
  templateUrl: './w2-editor.html',
  styleUrl: './w2-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class W2Editor {
  protected readonly w2s = signal<W2[]>([sampleW2()]);
  protected readonly current = computed(() => this.w2s()[0] ?? sampleW2());

  protected readonly randomFnRef = (): W2 => randomW2();
  protected readonly clearFnRef = (): W2 => emptyW2();

  private readonly mutator = new FirstItemMutator(this.w2s, sampleW2);
  private mutateFirst(fn: (w: W2) => W2): void {
    this.mutator.mutate(fn);
  }

  protected readonly parseNumber = parseNonNegative;
  protected parseInt(value: string): number {
    // Clamp to a plausible tax-year range so a mid-edit partial value doesn't
    // render as year "202" or "20".
    return parseYear(value, new Date().getFullYear() - 1, 1980, new Date().getFullYear());
  }

  protected updateField<K extends keyof W2>(key: K, value: W2[K]): void {
    this.mutateFirst((w) => ({ ...w, [key]: value }));
  }
  protected updateEmployer<K extends keyof W2['employer']>(key: K, value: string): void {
    this.mutateFirst((w) => ({ ...w, employer: { ...w.employer, [key]: value } }));
  }
  protected updateEmployee<K extends keyof W2['employee']>(key: K, value: string): void {
    this.mutateFirst((w) => ({ ...w, employee: { ...w.employee, [key]: value } }));
  }
  protected updateBox12(index: number, patch: Partial<W2Box12>): void {
    this.mutateFirst((w) => ({
      ...w,
      box12: w.box12.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    }));
  }
  protected addBox12(): void {
    if (this.current().box12.length >= 4) return;
    this.mutateFirst((w) => ({ ...w, box12: [...w.box12, emptyBox12()] }));
  }
  protected removeBox12(index: number): void {
    this.mutateFirst((w) => ({ ...w, box12: w.box12.filter((_, i) => i !== index) }));
  }

}

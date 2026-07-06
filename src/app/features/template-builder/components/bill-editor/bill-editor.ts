import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Bill, BillLineItem, emptyBillLineItem, sampleBill } from '../../models/bill.model';
import { randomBill } from '../../utils/random-bill.util';
import { FirstItemMutator } from '../../utils/first-item-mutator.util';
import { parseNumber } from '../../utils/input-parsers.util';
import { EditorShell } from '../editor-shell/editor-shell';

function emptyBill(): Bill {
  return {
    biller: { name: '', addressLine1: '', addressLine2: '', phone: '' },
    customer: { name: '', addressLine1: '', addressLine2: '', accountNumber: '' },
    statementDate: '',
    dueDate: '',
    servicePeriodStart: '',
    servicePeriodEnd: '',
    previousBalance: 0,
    paymentsReceived: 0,
    lineItems: [emptyBillLineItem()],
  };
}

@Component({
  selector: 'app-bill-editor',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, EditorShell],
  templateUrl: './bill-editor.html',
  styleUrl: './bill-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillEditor {
  readonly variant = input<1 | 2>(1);

  protected readonly bills = signal<Bill[]>([sampleBill()]);
  protected readonly current = computed(() => this.bills()[0] ?? sampleBill());

  protected readonly randomFnRef = (): Bill => randomBill();
  protected readonly clearFnRef = (): Bill => emptyBill();

  protected newChargesOf(b: Bill): number {
    return b.lineItems.reduce((s, l) => s + (l.amount || 0), 0);
  }
  protected balanceDueOf(b: Bill): number {
    return b.previousBalance - b.paymentsReceived + this.newChargesOf(b);
  }

  private readonly mutator = new FirstItemMutator(this.bills, sampleBill);
  private mutateFirst(fn: (b: Bill) => Bill): void {
    this.mutator.mutate(fn);
  }

  protected readonly parseNumber = parseNumber;

  protected updateBiller<K extends keyof Bill['biller']>(key: K, value: string): void {
    this.mutateFirst((b) => ({ ...b, biller: { ...b.biller, [key]: value } }));
  }
  protected updateCustomer<K extends keyof Bill['customer']>(key: K, value: string): void {
    this.mutateFirst((b) => ({ ...b, customer: { ...b.customer, [key]: value } }));
  }
  protected updateField<K extends keyof Bill>(key: K, value: Bill[K]): void {
    this.mutateFirst((b) => ({ ...b, [key]: value }));
  }
  protected updateLineItem(index: number, patch: Partial<BillLineItem>): void {
    this.mutateFirst((b) => ({
      ...b,
      lineItems: b.lineItems.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    }));
  }
  protected addLineItem(): void {
    this.mutateFirst((b) => ({ ...b, lineItems: [...b.lineItems, emptyBillLineItem()] }));
  }
  protected removeLineItem(index: number): void {
    this.mutateFirst((b) => ({ ...b, lineItems: b.lineItems.filter((_, i) => i !== index) }));
  }

}

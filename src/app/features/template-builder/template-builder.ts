import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { PaystubEditor } from './components/paystub-editor/paystub-editor';
import { BillEditor } from './components/bill-editor/bill-editor';
import { CheckbookEditor } from './components/checkbook-editor/checkbook-editor';
import { AccountStatementEditor } from './components/account-statement-editor/account-statement-editor';
import { W2Editor } from './components/w2-editor/w2-editor';
import { CreditReportEditor } from './components/credit-report-editor/credit-report-editor';
import { TEMPLATE_CATALOG, TemplateKey } from './models/template-types';

@Component({
  selector: 'app-template-builder',
  standalone: true,
  imports: [
    TopHeader,
    PaystubEditor,
    BillEditor,
    CheckbookEditor,
    AccountStatementEditor,
    W2Editor,
    CreditReportEditor,
  ],
  templateUrl: './template-builder.html',
  styleUrl: './template-builder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateBuilder {
  protected readonly title = 'Template Builder';
  protected readonly catalog = TEMPLATE_CATALOG;

  protected readonly selected = signal<TemplateKey | null>(null);

  protected readonly groupedCatalog = computed(() => {
    const groups = new Map<string, typeof TEMPLATE_CATALOG>();
    for (const t of this.catalog) {
      const list = groups.get(t.category) ?? [];
      list.push(t);
      groups.set(t.category, list);
    }
    return Array.from(groups.entries()).map(([category, items]) => ({ category, items }));
  });

  protected select(key: TemplateKey): void {
    const tpl = this.catalog.find((t) => t.key === key);
    if (!tpl?.available) return;
    this.selected.set(key);
  }

  protected back(): void {
    this.selected.set(null);
  }
}

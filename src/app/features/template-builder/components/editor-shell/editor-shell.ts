import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { FitToHeightDirective } from '../../utils/fit-to-height.directive';

/**
 * Shared shell for every template-builder editor.
 *
 * Owns: two-column sticky layout, action bar (Generate random / Load sample /
 * Clear all / Print), batch generator (1-N unique random docs), copies-per-page
 * toggle, cut-line between same-page docs, page-break between pages, the
 * FitToHeight directive that scales each doc to fill its half-page slot in
 * 2-up mode, and all the print @media rules.
 *
 * Each editor only provides:
 *  - title, singularLabel (e.g. "paystub")
 *  - a signal of docs (two-way bound via [(docs)])
 *  - random / sample / clear factory functions
 *  - the per-doc preview template (a <ng-template let-doc>) passed via [previewTpl]
 *  - its form fields, projected as content into <app-editor-shell>
 *
 * The shell's chrome lives here once; the editors stay focused on data shape
 * and template-specific markup.
 */
@Component({
  selector: 'app-editor-shell',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, FitToHeightDirective],
  templateUrl: './editor-shell.html',
  styleUrl: './editor-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorShell {
  readonly title = input.required<string>();
  readonly singularLabel = input<string>('document');
  readonly docs = model.required<unknown[]>();
  readonly previewTpl = input.required<TemplateRef<{ $implicit: unknown }>>();
  readonly randomFn = input.required<() => unknown>();
  readonly clearFn = input.required<() => unknown>();
  readonly previewFitHeight = input<number>(470);
  readonly maxBatch = input<number>(30);

  protected readonly copiesPerPage = signal<1 | 2>(1);
  protected readonly batchCount = signal<number>(1);
  protected readonly batchAnnouncement = signal<string>('');

  protected readonly renderedDocs = computed(() => {
    const docs = this.docs();
    const copies = this.copiesPerPage();
    if (copies !== 2) return docs;
    if (docs.length === 1) {
      // 1 doc, 2-up → duplicate to fill the sheet.
      return [docs[0], docs[0]];
    }
    if (docs.length % 2 === 1) {
      // Odd count in 2-up mode → duplicate the last doc so the final sheet
      // is a matched pair instead of half-blank.
      return [...docs, docs[docs.length - 1]];
    }
    return docs;
  });

  protected readonly pageCount = computed(() =>
    Math.ceil(this.renderedDocs().length / this.copiesPerPage()),
  );

  protected showCutLine(i: number): boolean {
    const docs = this.renderedDocs();
    if (i >= docs.length - 1) return false;
    return (i + 1) % this.copiesPerPage() !== 0;
  }

  protected showPageBreak(i: number): boolean {
    const docs = this.renderedDocs();
    if (i >= docs.length - 1) return false;
    return (i + 1) % this.copiesPerPage() === 0;
  }

  protected setCopiesPerPage(n: 1 | 2): void {
    this.copiesPerPage.set(n);
  }

  protected setBatchCount(value: string | number): void {
    const n = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(n)) return;
    this.batchCount.set(Math.max(1, Math.min(this.maxBatch(), Math.round(n))));
  }

  protected clearAll(): void {
    this.docs.set([this.clearFn()()]);
    this.batchCount.set(1);
    this.batchAnnouncement.set('All cleared. One blank document ready.');
  }

  protected generateBatch(): void {
    const count = this.batchCount();
    const random = this.randomFn();
    const docs = Array.from({ length: count }, () => random());
    this.docs.set(docs);
    const label = this.singularLabel();
    this.batchAnnouncement.set(
      `Generated ${count} random ${label}${count === 1 ? '' : 's'}.`,
    );
  }

  protected print(): void {
    window.print();
  }
}

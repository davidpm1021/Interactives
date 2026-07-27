import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StockPick, StockReport } from '../../models/stock-tracker.models';
import { STOCK_COLORS } from '../../services/format.utils';

/** Keys of StockReport that this form can render as textareas. */
export type ReflectionKey =
  | 'bestPerformerAnalysis'
  | 'mostValuableAnalysis'
  | 'biggestSurprise'
  | 'lessonsLearned';

interface FieldDef {
  key: ReflectionKey;
  label: string;
  prompt: string;
  /**
   * When set, render a "pick one of the 5 stocks" chip row above the
   * textarea. The selected ticker is stored on `pickField` in the report so
   * the student's choice persists alongside their prose.
   */
  pickField?: 'mostValuablePick' | 'biggestSurprisePick';
}

const FIELDS: FieldDef[] = [
  {
    key: 'bestPerformerAnalysis',
    label: 'Best Performer Analysis',
    prompt: "What's your best guess for why your top performer did so well over the years?",
  },
  {
    key: 'mostValuableAnalysis',
    label: 'Most Valuable Stock',
    prompt:
      'Which stock is worth the most today? Is this the same as the best ROI? Why or why not?',
    pickField: 'mostValuablePick',
  },
  {
    key: 'biggestSurprise',
    label: 'Biggest Surprise',
    prompt: "Which stock's performance surprised you the most? Explain.",
    pickField: 'biggestSurprisePick',
  },
  {
    key: 'lessonsLearned',
    label: 'Lessons Learned',
    prompt: 'What did this activity teach you about investing?',
  },
];

@Component({
  selector: 'app-reflection-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reflection-form.component.html',
  styleUrl: './reflection-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReflectionFormComponent {
  readonly report = input.required<StockReport>();
  /** Which questions to render. Undefined = all four (report-step behavior). */
  readonly fields = input<ReflectionKey[] | undefined>(undefined);
  /** Student's picks. Required when any visible field has pickField set. */
  readonly picks = input<StockPick[]>([]);
  readonly reportChange = output<Partial<StockReport>>();

  protected readonly STOCK_COLORS = STOCK_COLORS;

  protected readonly visibleFields = computed<FieldDef[]>(() => {
    const filter = this.fields();
    if (!filter) return FIELDS;
    const allowed = new Set(filter);
    return FIELDS.filter((f) => allowed.has(f.key));
  });

  protected onFieldChange(field: ReflectionKey, value: string): void {
    this.reportChange.emit({ [field]: value });
  }

  protected onPickChange(pickField: NonNullable<FieldDef['pickField']>, ticker: string): void {
    this.reportChange.emit({ [pickField]: ticker });
  }
}

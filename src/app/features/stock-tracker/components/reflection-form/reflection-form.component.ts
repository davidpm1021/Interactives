import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StockReport } from '../../models/stock-tracker.models';

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
}

const FIELDS: FieldDef[] = [
  {
    key: 'bestPerformerAnalysis',
    label: 'Best Performer Analysis',
    prompt:
      "Why do you think your top performer did so well over the years? A guess or hunch is fine — you don't need to know the industry inside and out.",
  },
  {
    key: 'mostValuableAnalysis',
    label: 'Most Valuable Stock',
    prompt:
      'Which stock is worth the most today? Is this the same as the best ROI? Why or why not?',
  },
  {
    key: 'biggestSurprise',
    label: 'Biggest Surprise',
    prompt: "Which stock's performance surprised you the most? Explain.",
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
  readonly reportChange = output<Partial<StockReport>>();

  protected readonly visibleFields = computed<FieldDef[]>(() => {
    const filter = this.fields();
    if (!filter) return FIELDS;
    const allowed = new Set(filter);
    return FIELDS.filter((f) => allowed.has(f.key));
  });

  protected onFieldChange(field: ReflectionKey, value: string): void {
    this.reportChange.emit({ [field]: value });
  }
}

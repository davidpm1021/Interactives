import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StockReport } from '../../models/stock-tracker.models';

@Component({
  selector: 'app-reflection-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reflection-form.component.html',
  styleUrl: './reflection-form.component.scss',
})
export class ReflectionFormComponent {
  readonly report = input.required<StockReport>();
  readonly reportChange = output<Partial<StockReport>>();

  protected onFieldChange(field: keyof StockReport, value: string): void {
    this.reportChange.emit({ [field]: value });
  }
}

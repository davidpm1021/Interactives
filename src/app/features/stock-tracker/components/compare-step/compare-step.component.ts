import { Component, inject } from '@angular/core';
import { MultiLineChartComponent } from '../multi-line-chart/multi-line-chart.component';
import { RoiBarChartComponent } from '../roi-bar-chart/roi-bar-chart.component';
import { RoiSummaryTableComponent } from '../roi-summary-table/roi-summary-table.component';
import { StockTrackerStateService } from '../../services/stock-tracker-state.service';

@Component({
  selector: 'app-compare-step',
  standalone: true,
  imports: [
    MultiLineChartComponent,
    RoiBarChartComponent,
    RoiSummaryTableComponent,
  ],
  templateUrl: './compare-step.component.html',
  styleUrl: './compare-step.component.scss',
})
export class CompareStepComponent {
  protected readonly state = inject(StockTrackerStateService);

  protected onAdvance(): void {
    this.state.advanceStep();
  }
}

import { Component, inject, computed } from '@angular/core';
import { MultiLineChartComponent } from '../multi-line-chart/multi-line-chart.component';
import { RoiBarChartComponent } from '../roi-bar-chart/roi-bar-chart.component';
import { RoiSummaryTableComponent } from '../roi-summary-table/roi-summary-table.component';
import { CalloutCardsComponent } from '../callout-cards/callout-cards.component';
import { StockTrackerStateService } from '../../services/stock-tracker-state.service';
import { CalculationService } from '../../services/calculation.service';

@Component({
  selector: 'app-compare-step',
  standalone: true,
  imports: [
    MultiLineChartComponent,
    RoiBarChartComponent,
    RoiSummaryTableComponent,
    CalloutCardsComponent,
  ],
  templateUrl: './compare-step.component.html',
  styleUrl: './compare-step.component.scss',
})
export class CompareStepComponent {
  protected readonly state = inject(StockTrackerStateService);
  private readonly calcService = inject(CalculationService);

  protected readonly bestRoi = computed(() => this.calcService.findBestROI(this.state.picks()));
  protected readonly highestValue = computed(() => this.calcService.findHighestValue(this.state.picks()));
  protected readonly mostVolatile = computed(() => this.calcService.findMostVolatile(this.state.picks()));

  protected onAdvance(): void {
    this.state.advanceStep();
  }
}

import { Component } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { StepIndicatorComponent } from './components/step-indicator/step-indicator.component';
import { SetupStepComponent } from './components/setup-step/setup-step.component';
import { TrackStepComponent } from './components/track-step/track-step.component';
import { CompareStepComponent } from './components/compare-step/compare-step.component';
import { ReportStepComponent } from './components/report-step/report-step.component';
import { StockTrackerStateService } from './services/stock-tracker-state.service';
import { StockDataService } from './services/stock-data.service';
import { CalculationService } from './services/calculation.service';
import { ExportService } from './services/export.service';

@Component({
  selector: 'app-stock-tracker',
  standalone: true,
  imports: [
    TopHeader,
    StepIndicatorComponent,
    SetupStepComponent,
    TrackStepComponent,
    CompareStepComponent,
    ReportStepComponent,
  ],
  providers: [
    StockTrackerStateService,
    StockDataService,
    CalculationService,
    ExportService,
  ],
  templateUrl: './stock-tracker.html',
  styleUrl: './stock-tracker.scss',
})
export class StockTracker {
  protected readonly title = '5 Stocks on Your Birthday';

  constructor(protected readonly state: StockTrackerStateService) {}

  protected onStepClick(stepId: string): void {
    this.state.goToStep(stepId as 'setup' | 'track' | 'compare' | 'report');
  }
}

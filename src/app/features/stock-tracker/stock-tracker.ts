import { Component, ElementRef, Injector, afterNextRender, effect, inject } from '@angular/core';
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
import { ScrollCueComponent } from '../../shared/scroll-cue/scroll-cue.component';

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
    ScrollCueComponent,
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

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);
  private stepObserved = false;

  constructor(protected readonly state: StockTrackerStateService) {
    effect(() => {
      // subscribe to step change
      this.state.currentStep();
      if (!this.stepObserved) {
        this.stepObserved = true;
        return;
      }
      afterNextRender(() => {
        const heading = this.host.nativeElement.querySelector<HTMLElement>(
          '.stock-tracker__content h2',
        );
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus();
        }
      }, { injector: this.injector });
    });
  }

  protected onStepClick(stepId: string): void {
    this.state.goToStep(stepId as 'setup' | 'track' | 'compare' | 'report');
  }
}

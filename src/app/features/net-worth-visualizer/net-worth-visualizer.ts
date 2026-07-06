import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, effect, inject, signal } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { NetWorthStateService } from './services/state.service';
import { PROFILE_A, PROFILE_B } from './data/profiles';
import { PredictView } from './components/predict-view/predict-view';
import { ComparisonView } from './components/comparison-view/comparison-view';
import { Summary } from './components/summary/summary';
import { PredictionChoice } from './models/net-worth.models';

@Component({
  selector: 'app-net-worth-visualizer',
  standalone: true,
  imports: [TopHeader, PredictView, ComparisonView, Summary],
  providers: [NetWorthStateService],
  templateUrl: './net-worth-visualizer.html',
  styleUrl: './net-worth-visualizer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetWorthVisualizer {
  protected readonly state = inject(NetWorthStateService);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly profileA = PROFILE_A;
  protected readonly profileB = PROFILE_B;

  protected readonly phaseAnnouncement = signal('');

  private phaseObserved = false;
  private readonly phaseEffect = effect(() => {
    const phase = this.state.phase();
    if (!this.phaseObserved) {
      this.phaseObserved = true;
      return;
    }
    const announcements: Record<typeof phase, string> = {
      predict: 'Prediction view',
      reveal: 'Reveal view. The full financial picture is being revealed.',
      summary: 'Summary view',
    };
    this.phaseAnnouncement.set(announcements[phase]);
    afterNextRender(() => {
      const heading = this.host.nativeElement.querySelector<HTMLElement>(
        'app-predict-view h2, app-comparison-view h2, app-summary h2',
      );
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
    }, { injector: this.injector });
  });

  protected onPredict(choice: PredictionChoice): void {
    this.state.submitPrediction(choice);
  }

  protected onFinishReveal(): void {
    this.state.goToSummary();
  }

  protected onRestart(): void {
    this.state.reset();
  }
}

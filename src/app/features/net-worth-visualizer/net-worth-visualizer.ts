import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

  protected readonly profileA = PROFILE_A;
  protected readonly profileB = PROFILE_B;

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

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { PROFILE_A, PROFILE_B } from './data/profiles';
import { WaterScene } from './components/water-scene/water-scene';

@Component({
  selector: 'app-net-worth-visualizer',
  standalone: true,
  imports: [TopHeader, WaterScene],
  templateUrl: './net-worth-visualizer.html',
  styleUrl: './net-worth-visualizer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetWorthVisualizer {
  protected readonly profileA = PROFILE_A;
  protected readonly profileB = PROFILE_B;
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { PROFILE_A, PROFILE_B } from './data/profiles';
import { WealthScene } from './components/wealth-scene/wealth-scene';

@Component({
  selector: 'app-net-worth-visualizer',
  standalone: true,
  imports: [TopHeader, WealthScene],
  templateUrl: './net-worth-visualizer.html',
  styleUrl: './net-worth-visualizer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetWorthVisualizer {
  protected readonly profileA = PROFILE_A;
  protected readonly profileB = PROFILE_B;
}

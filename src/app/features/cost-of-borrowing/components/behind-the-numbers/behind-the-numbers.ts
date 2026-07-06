import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RateSeries } from '../../models/rates.models';

@Component({
  selector: 'app-behind-the-numbers',
  standalone: true,
  imports: [],
  templateUrl: './behind-the-numbers.html',
  styleUrl: './behind-the-numbers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BehindTheNumbers {
  readonly series = input.required<RateSeries[]>();
  readonly refreshedAt = input.required<string>();
}

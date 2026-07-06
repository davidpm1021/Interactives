import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RateSeries } from '../../models/rates.models';

@Component({
  selector: 'app-rate-table',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './rate-table.html',
  styleUrl: './rate-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RateTable {
  readonly series = input.required<RateSeries[]>();
}

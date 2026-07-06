import { Component, input } from '@angular/core';
import { CheckData } from '../../models/check.models';

@Component({
  selector: 'app-check-display',
  standalone: true,
  templateUrl: './check-display.component.html',
  styleUrl: './check-display.component.scss',
})
export class CheckDisplayComponent {
  readonly checkData = input.required<CheckData>();
  readonly mode = input<'blank' | 'filled' | 'graded'>('blank');
  readonly fieldErrors = input<Map<string, string>>(new Map());
  readonly fieldCorrect = input<Set<string>>(new Set());
  readonly label = input<string>('');
  readonly highlightFields = input<Set<string>>(new Set());
}

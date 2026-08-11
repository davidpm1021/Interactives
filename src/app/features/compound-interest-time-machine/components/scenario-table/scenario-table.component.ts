import { Component, input } from '@angular/core';

export interface ScenarioRow {
  cells: string[];
  /**
   * Marks the student's row. Its final cell renders projected content (the
   * prediction input) instead of text, so the guess is the missing entry in a
   * pattern rather than a box below a paragraph.
   */
  isYours?: boolean;
}

/**
 * Side-by-side scenario comparison used to set up a prediction.
 *
 * Replaces a dense setup paragraph: review found the prose version "very text
 * heavy + easy for students to just skip over and input any number without
 * deeply engaging". Laying the same figures out in columns gives each one a
 * meaning, and showing the already-completed baseline row turns the guess into
 * completing a pattern.
 */
@Component({
  selector: 'app-scenario-table',
  standalone: true,
  imports: [],
  templateUrl: './scenario-table.component.html',
  styleUrl: './scenario-table.component.scss',
})
export class ScenarioTableComponent {
  readonly headers = input<string[]>([]);
  readonly rows = input<ScenarioRow[]>([]);
  /** Optional leading column of row names, e.g. "Part 1" / "Now". */
  readonly rowLabels = input<string[]>([]);
}

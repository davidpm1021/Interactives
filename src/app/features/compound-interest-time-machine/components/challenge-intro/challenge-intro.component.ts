import { Component, input } from '@angular/core';
import { ChallengeContent } from '../../data/challenge-content';

@Component({
  selector: 'app-challenge-intro',
  standalone: true,
  imports: [],
  templateUrl: './challenge-intro.component.html',
  styleUrl: './challenge-intro.component.scss',
})
export class ChallengeIntroComponent {
  readonly content = input.required<ChallengeContent>();
}

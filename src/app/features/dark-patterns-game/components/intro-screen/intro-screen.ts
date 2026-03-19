import { Component, output } from '@angular/core';

@Component({
  selector: 'app-intro-screen',
  standalone: true,
  templateUrl: './intro-screen.html',
  styleUrl: './intro-screen.scss',
})
export class IntroScreen {
  readonly start = output<void>();
}

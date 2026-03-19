import { Component, output } from '@angular/core';

@Component({
  selector: 'app-instructions-screen',
  standalone: true,
  templateUrl: './instructions-screen.html',
  styleUrl: './instructions-screen.scss',
})
export class InstructionsScreen {
  readonly ready = output<void>();
}

import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-start-screen',
  standalone: true,
  imports: [],
  templateUrl: './start-screen.html',
  styleUrl: './start-screen.scss',
})
export class StartScreen {
  readonly startGame = output<string | null>();

  protected readonly showSeedInput = signal(false);
  protected readonly seedValue = signal('');

  protected onStart(): void {
    const seed = this.seedValue().trim().toUpperCase();
    this.startGame.emit(seed && /^[A-Z0-9]{4}$/.test(seed) ? seed : null);
  }

  protected toggleSeedInput(): void {
    this.showSeedInput.update((v) => !v);
    if (!this.showSeedInput()) {
      this.seedValue.set('');
    }
  }

  protected onSeedInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.seedValue.set(input.value.toUpperCase().slice(0, 4));
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onStart();
    }
  }
}

import { AfterViewInit, Component, ElementRef, input, OnDestroy, output, viewChild } from '@angular/core';

export type TransitionType = 'round1-to-round2' | 'round2-to-round3';

@Component({
  selector: 'app-round-transition',
  standalone: true,
  templateUrl: './round-transition.html',
  styleUrl: './round-transition.scss',
})
export class RoundTransition implements AfterViewInit, OnDestroy {
  readonly type = input.required<TransitionType>();
  readonly seed = input('');
  readonly summary = input('');
  readonly proceed = output<void>();

  private readonly proceedBtn = viewChild<ElementRef<HTMLButtonElement>>('proceedBtn');
  private previouslyFocused: HTMLElement | null = null;

  ngAfterViewInit(): void {
    this.previouslyFocused = document.activeElement as HTMLElement;
    // Focus the proceed button after render
    setTimeout(() => this.proceedBtn()?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    // Return focus to previously focused element
    this.previouslyFocused?.focus();
  }

  protected onProceed(): void {
    this.proceed.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onProceed();
      return;
    }
    // Focus trap: keep Tab within the dialog
    if (event.key === 'Tab') {
      const btn = this.proceedBtn()?.nativeElement;
      if (btn) {
        event.preventDefault();
        btn.focus();
      }
    }
  }
}

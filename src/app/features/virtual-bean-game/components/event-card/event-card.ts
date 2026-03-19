import { Component, computed, ElementRef, input, output, signal, viewChild } from '@angular/core';
import {
  type Allocations,
  type EventResult,
  type GameEvent,
} from '../../models/game.models';
import { EventResolution } from '../event-resolution/event-resolution';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [EventResolution],
  templateUrl: './event-card.html',
  styleUrl: './event-card.scss',
})
export class EventCard {
  private readonly backCard = viewChild<ElementRef<HTMLElement>>('backCard');
  readonly event = input.required<GameEvent>();
  readonly eventIndex = input.required<number>();
  readonly totalEvents = input.required<number>();
  readonly result = input<EventResult | null>(null);
  readonly allocations = input.required<Allocations>();

  readonly reveal = output<void>();
  readonly next = output<void>();

  protected readonly isRevealed = signal(false);

  protected readonly typeLabel = computed(() => {
    switch (this.event().type) {
      case 'setback': return 'Setback';
      case 'forced-choice': return 'Forced Choice';
      case 'advantage': return 'Advantage';
    }
  });

  protected readonly typeIcon = computed(() => {
    switch (this.event().type) {
      case 'setback': return '⚡';
      case 'forced-choice': return '⚖';
      case 'advantage': return '★';
    }
  });

  protected readonly needsPlayerAction = computed(() => {
    const r = this.result();
    if (!r) return false;
    return r.playerChoice;
  });

  protected readonly playerActionDone = signal(false);

  protected readonly canProceed = computed(() => {
    const r = this.result();
    if (!r) return false;
    if (r.playerChoice) return this.playerActionDone();
    return true;
  });

  protected readonly progressText = computed(
    () => `Event ${this.eventIndex() + 1} of ${this.totalEvents()}`,
  );

  protected readonly eventDots = computed(() =>
    Array.from({ length: this.totalEvents() }, (_, i) => i),
  );

  protected onReveal(): void {
    this.isRevealed.set(true);
    this.reveal.emit();
    // Focus the revealed card for screen readers
    setTimeout(() => this.backCard()?.nativeElement.focus());
  }

  protected onNext(): void {
    this.isRevealed.set(false);
    this.playerActionDone.set(false);
    this.next.emit();
  }

  protected onPlayerResolved(): void {
    this.playerActionDone.set(true);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.isRevealed()) {
        this.onReveal();
      }
    }
  }
}

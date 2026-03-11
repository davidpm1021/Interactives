import { Component, computed, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ChallengeOutcome } from '../../../models/challenge.model';

@Component({
  selector: 'app-hidden-costs',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './hidden-costs.html',
  styleUrl: './hidden-costs.scss',
})
export class HiddenCosts {
  readonly completed = output<ChallengeOutcome>();

  protected readonly protectionPlan = signal(true);
  protected readonly priorityProcessing = signal(true);

  private readonly basePrice = 49.99;
  private readonly shippingPrice = 5.99;
  private readonly protectionPrice = 7.99;
  private readonly priorityPrice = 3.99;

  protected readonly subtotal = this.basePrice;
  protected readonly shipping = this.shippingPrice;

  protected readonly protectionCost = computed(() =>
    this.protectionPlan() ? this.protectionPrice : 0,
  );

  protected readonly priorityCost = computed(() =>
    this.priorityProcessing() ? this.priorityPrice : 0,
  );

  protected readonly total = computed(
    () =>
      this.basePrice +
      this.shippingPrice +
      this.protectionCost() +
      this.priorityCost(),
  );

  protected onPlaceOrder(): void {
    const protOn = this.protectionPlan();
    const prioOn = this.priorityProcessing();

    if (!protOn && !prioOn) {
      this.completed.emit('pass');
    } else if (!protOn || !prioOn) {
      this.completed.emit('partial-fail');
    } else {
      this.completed.emit('full-fail');
    }
  }
}

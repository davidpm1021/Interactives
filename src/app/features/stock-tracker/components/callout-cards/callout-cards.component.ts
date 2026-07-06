import { Component, input } from '@angular/core';
import { StockPick } from '../../models/stock-tracker.models';
import { formatCurrency, formatPercent } from '../../services/format.utils';

interface CalloutData {
  label: string;
  icon: string;
  company: string;
  ticker: string;
  detail: string;
}

@Component({
  selector: 'app-callout-cards',
  standalone: true,
  template: `
    <div class="callout-cards">
      @for (card of cards(); track card.label) {
        <div class="callout-cards__card">
          <span class="callout-cards__icon">{{ card.icon }}</span>
          <div class="callout-cards__info">
            <span class="callout-cards__label">{{ card.label }}</span>
            <span class="callout-cards__company">{{ card.company }} ({{ card.ticker }})</span>
            <span class="callout-cards__detail">{{ card.detail }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .callout-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--ngpf-spacing-md);

      &__card {
        display: flex;
        align-items: flex-start;
        gap: var(--ngpf-spacing-sm);
        background: white;
        border-radius: var(--ngpf-radius-md);
        box-shadow: var(--ngpf-shadow-sm);
        padding: var(--ngpf-spacing-md);
        border-left: 4px solid var(--ngpf-bright-blue);
      }

      &__icon {
        font-size: 1.5rem;
        line-height: 1;
        flex-shrink: 0;
      }

      &__info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      &__label {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ngpf-text-muted);
      }

      &__company {
        font-family: var(--ngpf-font-heading);
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--ngpf-text-primary);
      }

      &__detail {
        font-size: 0.8rem;
        color: var(--ngpf-text-secondary);
      }
    }
  `],
})
export class CalloutCardsComponent {
  readonly bestRoi = input<StockPick | null>(null);
  readonly highestValue = input<StockPick | null>(null);
  readonly mostVolatile = input<StockPick | null>(null);

  protected cards(): CalloutData[] {
    const items: CalloutData[] = [];
    const best = this.bestRoi();
    const highest = this.highestValue();
    const volatile = this.mostVolatile();

    if (best) {
      items.push({
        label: 'Best Overall ROI',
        icon: '\u{1F3C6}',
        company: best.companyName,
        ticker: best.ticker,
        detail: `ROI: ${formatPercent(best.roi)}`,
      });
    }
    if (highest) {
      items.push({
        label: 'Highest Current Value',
        icon: '\u{1F4B0}',
        company: highest.companyName,
        ticker: highest.ticker,
        detail: `100 shares worth ${formatCurrency(highest.currentValue)}`,
      });
    }
    if (volatile) {
      items.push({
        label: 'Most Volatile',
        icon: '\u{1F3A2}',
        company: volatile.companyName,
        ticker: volatile.ticker,
        detail: 'Largest peak-to-trough swing',
      });
    }

    return items;
  }
}

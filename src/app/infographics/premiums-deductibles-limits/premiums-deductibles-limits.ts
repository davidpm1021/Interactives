import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Term {
  key: string;
  name: string;
  gloss: string;
  body: string;
  /** Which badge tone: primary blue, bright blue, or sky. */
  badge: 'primary' | 'bright' | 'sky';
  /** Which inline SVG icon to render. */
  icon: 'invoice' | 'wallet' | 'shield';
}

interface Scenario {
  scenario: string;
  aDir: 'up' | 'down';
  aAmt: string;
  bDir: 'up' | 'down';
  bAmt: string;
  takeaway: string;
}

@Component({
  selector: 'app-premiums-deductibles-limits',
  standalone: true,
  imports: [],
  templateUrl: './premiums-deductibles-limits.html',
  styleUrl: './premiums-deductibles-limits.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PremiumsDeductiblesLimits {
  protected readonly terms: Term[] = [
    {
      key: 'premium',
      name: 'Premium',
      gloss: 'What you pay to have insurance',
      body: 'A premium is the amount you pay for your insurance policy, usually every month, every six months, or once a year. Paying your premium on time keeps your policy active.',
      badge: 'primary',
      icon: 'invoice',
    },
    {
      key: 'deductible',
      name: 'Deductible',
      gloss: 'What you pay before coverage kicks in',
      body: "If you file a claim for a covered loss, the deductible is the amount you pay out of pocket first. Your insurance starts paying only after you've met it.",
      badge: 'bright',
      icon: 'wallet',
    },
    {
      key: 'limit',
      name: 'Coverage Limit',
      gloss: 'The most your policy will pay',
      body: 'A coverage limit is the maximum amount your policy will pay for a covered loss. Many policies bundle several types of coverage, each with its own limit.',
      badge: 'sky',
      icon: 'shield',
    },
  ];

  protected readonly tradeoffLede =
    'Your deductible and your premium work like a see-saw: when one goes up, the other usually comes down.';
  protected readonly tradeoff: Scenario[] = [
    {
      scenario: 'Choose a HIGHER deductible',
      aDir: 'up',
      aAmt: '$$$',
      bDir: 'down',
      bAmt: '$',
      takeaway: 'Pay less each month, but more out of pocket if you file a claim.',
    },
    {
      scenario: 'Choose a LOWER deductible',
      aDir: 'down',
      aAmt: '$',
      bDir: 'up',
      bAmt: '$$$',
      takeaway: 'Pay more each month, but less out of pocket if you file a claim.',
    },
  ];

  protected readonly limitLede =
    'Your coverage limit and your premium climb together: the more your policy could pay out, the more it costs to insure.';
  protected readonly limit: Scenario[] = [
    {
      scenario: 'Choose a HIGHER limit',
      aDir: 'up',
      aAmt: '$$$',
      bDir: 'up',
      bAmt: '$$$',
      takeaway: 'More protection if you file a claim for a higher cost each month.',
    },
    {
      scenario: 'Choose a LOWER limit',
      aDir: 'down',
      aAmt: '$',
      bDir: 'down',
      bAmt: '$',
      takeaway: 'A lower cost each month, but less protection if you file a claim.',
    },
  ];

  protected arrowClass(dir: 'up' | 'down', kind: 'ded' | 'lim' | 'prem'): string {
    return `arrow arrow-${dir} arrow-${kind}`;
  }
}

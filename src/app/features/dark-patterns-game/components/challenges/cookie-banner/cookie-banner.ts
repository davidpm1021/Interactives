import { Component, output, signal } from '@angular/core';
import { ChallengeOutcome } from '../../../models/challenge.model';

interface CookieToggle {
  id: string;
  label: string;
  description: string;
  required: boolean;
  enabled: boolean;
}

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.scss',
})
export class CookieBanner {
  readonly completed = output<ChallengeOutcome>();

  protected readonly showManagePanel = signal(false);

  protected readonly toggles = signal<CookieToggle[]>([
    {
      id: 'essential',
      label: 'Strictly Necessary',
      description: 'Required for the website to function. Cannot be disabled.',
      required: true,
      enabled: true,
    },
    {
      id: 'performance',
      label: 'Performance & Analytics',
      description: 'Helps us understand how visitors interact with our website to improve your experience.',
      required: false,
      enabled: true,
    },
    {
      id: 'functional',
      label: 'Functional',
      description: 'Enables enhanced functionality and personalization based on your browsing patterns.',
      required: false,
      enabled: true,
    },
    {
      id: 'targeting',
      label: 'Targeting & Advertising',
      description: 'Used by our partners to build a profile of your interests and show relevant ads across the web.',
      required: false,
      enabled: true,
    },
    {
      id: 'social',
      label: 'Social Media',
      description: 'Allows you to share content and lets us provide a more tailored social experience.',
      required: false,
      enabled: true,
    },
    {
      id: 'personalization',
      label: 'Personalization',
      description: 'Remembers your preferences to deliver content and recommendations you\'ll love.',
      required: false,
      enabled: true,
    },
  ]);

  protected onAcceptAll(): void {
    this.completed.emit('full-fail');
  }

  protected onManagePreferences(): void {
    this.showManagePanel.set(true);
  }

  protected onToggle(index: number): void {
    const current = this.toggles();
    if (current[index].required) return;

    const updated = current.map((t, i) =>
      i === index ? { ...t, enabled: !t.enabled } : t,
    );
    this.toggles.set(updated);
  }

  protected onConfirmChoices(): void {
    const nonEssentialOn = this.toggles().filter(
      (t) => !t.required && t.enabled,
    );

    if (nonEssentialOn.length === 0) {
      this.completed.emit('pass');
    } else {
      this.completed.emit('partial-fail');
    }
  }
}

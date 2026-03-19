import { Component, output, signal } from '@angular/core';
import { ChallengeOutcome } from '../../../models/challenge.model';

interface PrivacyToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-privacy-settings',
  standalone: true,
  templateUrl: './privacy-settings.html',
  styleUrl: './privacy-settings.scss',
})
export class PrivacySettings {
  readonly completed = output<ChallengeOutcome>();

  // All start ON (enabled = true means data sharing is active).
  // The trick: toggle visuals are REVERSED (left=ON, green=OFF).
  // Students must set all to enabled=false (actual OFF) to pass.
  protected readonly toggles = signal<PrivacyToggle[]>([
    {
      id: 'transaction-data',
      label: 'Share my transaction data to receive personalized financial insights',
      description: 'We analyze your spending to provide tailored recommendations.',
      enabled: true,
    },
    {
      id: 'partner-contact',
      label: 'Allow trusted partners to contact me with relevant offers',
      description: 'Our verified partners may reach out with exclusive deals for you.',
      enabled: true,
    },
    {
      id: 'product-research',
      label: 'Participate in product improvement research',
      description: 'Help us build better products by sharing your usage patterns.',
      enabled: true,
    },
  ]);

  protected onToggle(index: number): void {
    const current = this.toggles();
    const updated = current.map((t, i) =>
      i === index ? { ...t, enabled: !t.enabled } : t,
    );
    this.toggles.set(updated);
  }

  protected onSavePreferences(): void {
    const enabledCount = this.toggles().filter((t) => t.enabled).length;

    if (enabledCount === 0) {
      this.completed.emit('pass');
    } else if (enabledCount < 3) {
      this.completed.emit('partial-fail');
    } else {
      this.completed.emit('full-fail');
    }
  }
}

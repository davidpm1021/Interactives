import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { Location } from '@angular/common';
import { PreferenceCategory, PreferenceProfile } from '../../models/car-preferences.models';
import { nearestAnchor } from '../../utils/nearest-anchor.util';
import { encodeProfile } from '../../utils/profile-codec.util';
import { PreferenceRadarComponent } from '../preference-radar/preference-radar.component';

interface SummaryRow {
  label: string;
  value: number;
  tag: string;
}

@Component({
  selector: 'app-profile-summary',
  standalone: true,
  imports: [PreferenceRadarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-summary.component.html',
  styleUrl: './profile-summary.component.scss',
})
export class ProfileSummaryComponent {
  readonly profile = input.required<PreferenceProfile>();
  readonly categories = input.required<PreferenceCategory[]>();
  readonly edit = output<void>();

  private readonly location = inject(Location);
  protected readonly copyStatus = signal('');

  protected readonly rows = computed<SummaryRow[]>(() =>
    this.categories().map((c) => {
      const value = this.profile().values[c.id] ?? 0;
      return {
        label: c.label,
        value,
        tag: nearestAnchor(value, c.anchors).tag,
      };
    }),
  );

  protected copyLink(): void {
    const param = encodeProfile(this.profile().values, this.categories());
    const path = this.location.path().split('?')[0] || '/car-preferences';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}${path}?profile=${param}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => this.copyStatus.set('Link copied to clipboard.'),
        () => this.copyStatus.set('Could not copy. URL: ' + url),
      );
    } else {
      this.copyStatus.set('Copy not supported. URL: ' + url);
    }
  }

  protected onEdit(): void {
    this.edit.emit();
  }
}

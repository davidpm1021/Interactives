import { DestroyRef, inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

declare let gtag: (
  command: 'event',
  action: string,
  params?: Record<string, string | number | boolean>
) => void;

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  trackPageViews(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => {
        this.trackEvent('page_view', {
          page_path: e.urlAfterRedirects,
        });
      });
  }

  trackEvent(name: string, params: Record<string, string | number | boolean> = {}): void {
    try {
      if (typeof gtag === 'function') {
        gtag('event', name, params);
      }
    } catch {
      // gtag not loaded (ad blocker, dev, etc.) — silently ignore
    }
  }
}

import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AnalyticsService } from './shared/services/analytics.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ngpf-interactives');

  constructor() {
    inject(AnalyticsService).trackPageViews();
  }
}

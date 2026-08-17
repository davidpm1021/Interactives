import { HttpClientModule } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { BottomHeader } from '../../shared/bottom-header/bottom-header';
import { PreferenceRadarComponent } from './components/preference-radar/preference-radar.component';
import { PreferenceSliderComponent } from './components/preference-slider/preference-slider.component';
import { SurveyConfigService } from './services/survey-config.service';
import { ScrollCueComponent } from '../../shared/scroll-cue/scroll-cue.component';

@Component({
  selector: 'app-car-preferences',
  standalone: true,
  imports: [
    HttpClientModule,
    TopHeader,
    BottomHeader,
    PreferenceSliderComponent,
    PreferenceRadarComponent,
    ScrollCueComponent,
  ],
  providers: [SurveyConfigService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './car-preferences.html',
  styleUrl: './car-preferences.scss',
})
export class CarPreferences implements OnInit {
  private readonly configService = inject(SurveyConfigService);

  protected readonly loaded = this.configService.loaded;
  protected readonly config = this.configService.config;
  protected readonly categories = this.configService.categories;

  protected readonly values = signal<Record<string, number>>({});

  protected readonly pointsUsed = computed(() => {
    const v = this.values();
    let sum = 0;
    for (const id of Object.keys(v)) sum += v[id];
    return sum;
  });

  protected readonly pointBudget = computed(() => this.config()?.pointBudget ?? null);

  protected readonly overBudget = computed(() => {
    const budget = this.pointBudget();
    return budget !== null && this.pointsUsed() > budget;
  });

  async ngOnInit(): Promise<void> {
    await this.configService.load();
    const cfg = this.config();
    if (!cfg) return;

    const values: Record<string, number> = {};
    for (const c of cfg.categories) {
      values[c.id] = c.defaultValue ?? 5;
    }
    this.values.set(values);
  }

  protected onValueChange(categoryId: string, value: number): void {
    this.values.update((v) => ({ ...v, [categoryId]: value }));
  }
}

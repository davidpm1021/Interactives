import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, isDevMode, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PreferenceCategory, SurveyConfig } from '../models/car-preferences.models';

const CONFIG_URL = 'features/car-preferences/data/car-preferences.config.json';

@Injectable()
export class SurveyConfigService {
  private readonly http = inject(HttpClient);

  private readonly _config = signal<SurveyConfig | null>(null);
  private readonly _errors = signal<string[]>([]);
  private readonly _loaded = signal(false);

  readonly config = this._config.asReadonly();
  readonly validationErrors = this._errors.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly categories = computed(() => this._config()?.categories ?? []);

  async load(): Promise<void> {
    const raw = await firstValueFrom(this.http.get<SurveyConfig>(CONFIG_URL));
    const { config, errors } = validateConfig(raw);
    this._errors.set(errors);
    if (errors.length > 0) {
      if (isDevMode()) {
        console.error('[SurveyConfigService] config validation failed:', errors);
        throw new Error(`Invalid car-preferences config: ${errors.join('; ')}`);
      }
      console.warn('[SurveyConfigService] config validation issues, rendering with valid subset:', errors);
    }
    this._config.set(config);
    this._loaded.set(true);
  }
}

interface ValidationResult {
  config: SurveyConfig;
  errors: string[];
}

export function validateConfig(raw: SurveyConfig): ValidationResult {
  const errors: string[] = [];
  const validCategories: PreferenceCategory[] = [];
  const seenIds = new Set<string>();

  for (const cat of raw.categories ?? []) {
    if (!cat.id || typeof cat.id !== 'string') {
      errors.push(`category missing id: ${JSON.stringify(cat)}`);
      continue;
    }
    if (seenIds.has(cat.id)) {
      errors.push(`duplicate category id: ${cat.id}`);
      continue;
    }
    if (!Array.isArray(cat.anchors) || cat.anchors.length < 2) {
      errors.push(`category ${cat.id} needs at least 2 anchors`);
      continue;
    }
    const anchorsAscending = cat.anchors.every(
      (a, i) => i === 0 || a.value > cat.anchors[i - 1].value,
    );
    if (!anchorsAscending) {
      errors.push(`category ${cat.id} anchors must be strictly ascending by value`);
      continue;
    }
    if (cat.anchors[0].value !== 0) {
      errors.push(`category ${cat.id} first anchor must be value 0`);
      continue;
    }
    if (cat.anchors[cat.anchors.length - 1].value !== 10) {
      errors.push(`category ${cat.id} last anchor must be value 10`);
      continue;
    }
    if (cat.anchors.some((a) => a.value < 0 || a.value > 10)) {
      errors.push(`category ${cat.id} anchor values must be in 0-10`);
      continue;
    }
    if (
      cat.defaultValue !== undefined &&
      (cat.defaultValue < 0 || cat.defaultValue > 10)
    ) {
      errors.push(`category ${cat.id} defaultValue must be in 0-10`);
      continue;
    }
    seenIds.add(cat.id);
    validCategories.push(cat);
  }

  let pointBudget = raw.pointBudget ?? null;
  if (pointBudget !== null) {
    const max = validCategories.length * 10;
    if (pointBudget < 0 || pointBudget > max) {
      errors.push(`pointBudget ${pointBudget} out of range 0-${max}; ignoring budget`);
      pointBudget = null;
    }
  }

  return {
    config: {
      title: raw.title ?? '',
      categories: validCategories,
      pointBudget,
    },
    errors,
  };
}

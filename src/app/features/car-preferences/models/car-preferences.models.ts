export interface PreferenceAnchor {
  value: number;
  tag: string;
  description: string;
}

export interface PreferenceCategory {
  id: string;
  label: string;
  anchors: PreferenceAnchor[];
  defaultValue?: number;
}

export interface SurveyConfig {
  title: string;
  categories: PreferenceCategory[];
  pointBudget?: number | null;
}

export interface PreferenceProfile {
  version: 1;
  values: Record<string, number>;
  savedAt: string;
}

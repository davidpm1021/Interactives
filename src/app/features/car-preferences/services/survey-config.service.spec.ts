import { describe, expect, it } from 'vitest';
import { SurveyConfig } from '../models/car-preferences.models';
import { validateConfig } from './survey-config.service';

function baseConfig(): SurveyConfig {
  return {
    title: 'test',
    pointBudget: null,
    categories: [
      {
        id: 'a',
        label: 'A',
        anchors: [
          { value: 0, tag: 'Low', description: 'low' },
          { value: 5, tag: 'Mid', description: 'mid' },
          { value: 10, tag: 'High', description: 'high' },
        ],
      },
      {
        id: 'b',
        label: 'B',
        anchors: [
          { value: 0, tag: 'Low', description: 'low' },
          { value: 10, tag: 'High', description: 'high' },
        ],
      },
    ],
  };
}

describe('validateConfig', () => {
  it('accepts a valid config with no errors', () => {
    const { errors, config } = validateConfig(baseConfig());
    expect(errors).toEqual([]);
    expect(config.categories).toHaveLength(2);
  });

  it('rejects duplicate ids and keeps the first', () => {
    const c = baseConfig();
    c.categories.push({ ...c.categories[0] });
    const { errors, config } = validateConfig(c);
    expect(errors.some((e) => e.includes('duplicate'))).toBe(true);
    expect(config.categories).toHaveLength(2);
  });

  it('rejects non-ascending anchors', () => {
    const c = baseConfig();
    c.categories[0].anchors = [
      { value: 0, tag: 'A', description: 'a' },
      { value: 3, tag: 'B', description: 'b' },
      { value: 2, tag: 'C', description: 'c' },
      { value: 10, tag: 'D', description: 'd' },
    ];
    const { errors, config } = validateConfig(c);
    expect(errors.some((e) => e.includes('ascending'))).toBe(true);
    expect(config.categories.find((cat) => cat.id === 'a')).toBeUndefined();
  });

  it('rejects missing value-0 anchor', () => {
    const c = baseConfig();
    c.categories[0].anchors = [
      { value: 2, tag: 'A', description: 'a' },
      { value: 10, tag: 'B', description: 'b' },
    ];
    const { errors } = validateConfig(c);
    expect(errors.some((e) => e.includes('first anchor must be value 0'))).toBe(true);
  });

  it('rejects missing value-10 anchor', () => {
    const c = baseConfig();
    c.categories[0].anchors = [
      { value: 0, tag: 'A', description: 'a' },
      { value: 8, tag: 'B', description: 'b' },
    ];
    const { errors } = validateConfig(c);
    expect(errors.some((e) => e.includes('last anchor must be value 10'))).toBe(true);
  });

  it('rejects out-of-range pointBudget and falls back to null', () => {
    const c = baseConfig();
    c.pointBudget = 999;
    const { errors, config } = validateConfig(c);
    expect(errors.some((e) => e.includes('pointBudget'))).toBe(true);
    expect(config.pointBudget).toBeNull();
  });

  it('accepts a valid pointBudget at the upper bound', () => {
    const c = baseConfig();
    c.pointBudget = 20;
    const { errors, config } = validateConfig(c);
    expect(errors).toEqual([]);
    expect(config.pointBudget).toBe(20);
  });
});

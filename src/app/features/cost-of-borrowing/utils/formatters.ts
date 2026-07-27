/**
 * Format as currency. Cents are dropped when the value is a whole dollar.
 *  - `$1,234.56`, `$1,234`
 *  - compact: `$1K`, `$50K`, `$1.2M` (whole numbers below 100K still show grouped digits)
 */
export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) {
      const m = value / 1_000_000;
      return '$' + (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + 'M';
    }
    if (abs >= 10_000) {
      const k = value / 1_000;
      return '$' + (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'K';
    }
    // Below 10K, still grouped, no decimals
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  const hasCents = Math.round(value * 100) % 100 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(value);
}

/**
 * Format as percentage. Trailing zeros are dropped.
 */
export function formatPercent(value: number): string {
  const pct = value * 100;
  const rounded = pct.toFixed(2);
  return rounded.replace(/\.?0+$/, '') + '%';
}

/**
 * Format year label: "Year 5"
 */
export function formatYear(year: number): string {
  return `Year ${year}`;
}

/**
 * Human-facing rendering of a student's submitted answer:
 *  - multiple-choice: resolves the option text from the stored index.
 *  - numeric: prefixes "$" or suffixes the unit.
 *  - short-text: passed through.
 *
 * Kept string-in / string-out so it's reusable from the review recap, the
 * print worksheet, and the .txt export without dragging Angular in.
 */
import type {
  MultipleChoiceQuestion,
  NumericQuestion,
  Question,
} from '../models/question.models';

export function formatAnswerValue(q: Question, value: string | number): string {
  if (q.answerType === 'multiple-choice') {
    const idx = Number(value);
    const options = (q as MultipleChoiceQuestion).options;
    return options[idx] ?? `Option ${idx}`;
  }
  if (q.answerType === 'numeric') {
    const unit = (q as NumericQuestion).unit;
    if (unit === '$') return `$${value}`;
    if (unit) return `${value} ${unit}`;
    return String(value);
  }
  return String(value);
}

/**
 * Pluralize: "1 year" vs "2 years"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const pluralForm = plural ?? singular + 's';
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

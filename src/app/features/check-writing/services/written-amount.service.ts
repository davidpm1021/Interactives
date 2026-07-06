import { Injectable } from '@angular/core';
import { AmountValidation } from '../models/check.models';

const UNITS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

@Injectable()
export class WrittenAmountService {
  parseWrittenDollars(input: string): number | null {
    const normalized = this.normalizeDollarInput(input);
    if (!normalized) return 0;

    if (/\d/.test(normalized)) return null;

    const words = normalized.split(/\s+/);
    return this.parseWordSequence(words);
  }

  parseCentsFraction(input: string): number | null {
    const trimmed = input.trim().toLowerCase();
    const match = trimmed.match(/^(\d{1,2}|no)\/100$/);
    if (!match) return null;
    if (match[1] === 'no') return 0;
    const val = parseInt(match[1], 10);
    return val >= 0 && val <= 99 ? val : null;
  }

  validate(input: string, expectedAmount: number): AmountValidation {
    const errors: string[] = [];
    const trimmed = input.trim();

    if (!trimmed) {
      return { isValid: false, normalized: '', errors: ['Written amount is required'] };
    }

    // Check for digits in the written portion (before "and")
    const parts = trimmed.toLowerCase().split(/\band\b/);
    const dollarPart = parts[0].trim();
    const centsPart = parts.length > 1 ? parts.slice(1).join('and').trim() : '';

    if (/\d/.test(dollarPart)) {
      errors.push('The written amount should use words, not numbers');
      return { isValid: false, normalized: trimmed.toLowerCase(), errors };
    }

    // Parse dollars
    const dollars = this.parseWrittenDollars(dollarPart);
    if (dollars === null) {
      errors.push('Could not understand the written dollar amount');
      return { isValid: false, normalized: trimmed.toLowerCase(), errors };
    }

    // Parse cents
    const expectedDollars = Math.floor(expectedAmount);
    const expectedCents = Math.round((expectedAmount - expectedDollars) * 100);

    if (!centsPart) {
      errors.push("Don't forget to include cents as a fraction, like 'and 00/100'");
      // Still check if dollar amount is correct
      if (dollars !== expectedDollars) {
        errors.push("The written amount doesn't match the numeric amount");
      }
      return { isValid: false, normalized: trimmed.toLowerCase(), errors };
    }

    // Clean cents part: strip trailing "dollars", "only", dashes/lines
    const cleanedCents = centsPart
      .replace(/[-—–_]+\s*$/, '')
      .replace(/\bdollars\b/gi, '')
      .replace(/\bonly\b/gi, '')
      .trim();

    const cents = this.parseCentsFraction(cleanedCents);
    if (cents === null) {
      errors.push("Cents should be written as a fraction like '50/100' or '00/100'");
      return { isValid: false, normalized: trimmed.toLowerCase(), errors };
    }

    const totalParsed = dollars + cents / 100;
    const totalExpected = expectedAmount;

    if (Math.abs(totalParsed - totalExpected) > 0.001) {
      errors.push("The written amount doesn't match the numeric amount");
      return { isValid: false, normalized: trimmed.toLowerCase(), errors };
    }

    return {
      isValid: true,
      normalized: this.toWrittenForm(expectedAmount),
      errors: [],
    };
  }

  toWrittenForm(amount: number): string {
    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);
    const dollarWords = this.numberToWords(dollars);
    const centsStr = cents.toString().padStart(2, '0');
    return `${this.capitalize(dollarWords)} and ${centsStr}/100`;
  }

  private normalizeDollarInput(input: string): string {
    return input
      .toLowerCase()
      .replace(/[-—–]/g, ' ')
      .replace(/,/g, '')
      .replace(/\bdollars?\b/g, '')
      .replace(/\bonly\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseWordSequence(words: string[]): number | null {
    if (words.length === 0) return 0;

    let total = 0;
    let current = 0;
    let hasValidWord = false;

    for (const word of words) {
      if (UNITS[word] !== undefined) {
        current += UNITS[word];
        hasValidWord = true;
      } else if (TENS[word] !== undefined) {
        current += TENS[word];
        hasValidWord = true;
      } else if (word === 'hundred') {
        if (current === 0) current = 1;
        current *= 100;
        hasValidWord = true;
      } else if (word === 'thousand') {
        if (current === 0) current = 1;
        total += current * 1000;
        current = 0;
        hasValidWord = true;
      } else {
        return null;
      }
    }

    total += current;

    if (!hasValidWord) return null;
    if (total > 99999) return null;

    return total;
  }

  private numberToWords(n: number): string {
    if (n === 0) return 'zero';

    const parts: string[] = [];

    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      parts.push(this.numberToWordsUnder1000(thousands) + ' thousand');
      n %= 1000;
    }

    if (n > 0) {
      parts.push(this.numberToWordsUnder1000(n));
    }

    return parts.join(' ');
  }

  private numberToWordsUnder1000(n: number): string {
    const parts: string[] = [];

    if (n >= 100) {
      const hundreds = Math.floor(n / 100);
      parts.push(this.unitToWord(hundreds) + ' hundred');
      n %= 100;
    }

    if (n > 0) {
      parts.push(this.numberToWordsUnder100(n));
    }

    return parts.join(' ');
  }

  private numberToWordsUnder100(n: number): string {
    if (n < 20) return this.unitToWord(n);
    const ten = Math.floor(n / 10) * 10;
    const unit = n % 10;
    const tenWord = Object.entries(TENS).find(([, v]) => v === ten)?.[0] ?? '';
    return unit > 0 ? `${tenWord}-${this.unitToWord(unit)}` : tenWord;
  }

  private unitToWord(n: number): string {
    return Object.entries(UNITS).find(([, v]) => v === n)?.[0] ?? '';
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

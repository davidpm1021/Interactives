import { formatCurrency, formatPercent, formatYear, pluralize } from './formatters';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('should format amounts with cents when not a whole dollar', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(99.9)).toBe('$99.90');
    });

    it('should drop cents for whole-dollar amounts', () => {
      expect(formatCurrency(0)).toBe('$0');
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(150000)).toBe('$150,000');
    });

    it('should format compact notation as whole units when round', () => {
      expect(formatCurrency(150000, true)).toBe('$150K');
      expect(formatCurrency(50000, true)).toBe('$50K');
      expect(formatCurrency(1000000, true)).toBe('$1M');
    });

    it('should keep one decimal in compact notation when not round', () => {
      expect(formatCurrency(1234567, true)).toBe('$1.2M');
      expect(formatCurrency(125_000, true)).toBe('$125K');
      expect(formatCurrency(123_500, true)).toBe('$123.5K');
    });

    it('should not use K-suffix below $10K in compact mode', () => {
      expect(formatCurrency(5000, true)).toBe('$5,000');
      expect(formatCurrency(0, true)).toBe('$0');
    });
  });

  describe('formatPercent', () => {
    it('should drop trailing zeros', () => {
      expect(formatPercent(0.07)).toBe('7%');
      expect(formatPercent(0.1)).toBe('10%');
      expect(formatPercent(0)).toBe('0%');
    });

    it('should keep meaningful decimals', () => {
      expect(formatPercent(0.0725)).toBe('7.25%');
      expect(formatPercent(0.0732)).toBe('7.32%');
    });
  });

  describe('formatYear', () => {
    it('should format year label', () => {
      expect(formatYear(5)).toBe('Year 5');
      expect(formatYear(0)).toBe('Year 0');
    });
  });

  describe('pluralize', () => {
    it('should handle singular and plural', () => {
      expect(pluralize(1, 'year')).toBe('1 year');
      expect(pluralize(5, 'year')).toBe('5 years');
      expect(pluralize(0, 'year')).toBe('0 years');
    });

    it('should handle custom plural form', () => {
      expect(pluralize(1, 'person', 'people')).toBe('1 person');
      expect(pluralize(3, 'person', 'people')).toBe('3 people');
    });
  });
});

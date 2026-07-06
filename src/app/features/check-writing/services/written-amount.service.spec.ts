import { TestBed } from '@angular/core/testing';
import { WrittenAmountService } from './written-amount.service';

describe('WrittenAmountService', () => {
  let service: WrittenAmountService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WrittenAmountService],
    });
    service = TestBed.inject(WrittenAmountService);
  });

  describe('parseWrittenDollars', () => {
    it('should parse single-digit amounts', () => {
      expect(service.parseWrittenDollars('five')).toBe(5);
      expect(service.parseWrittenDollars('nine')).toBe(9);
    });

    it('should parse teens', () => {
      expect(service.parseWrittenDollars('eleven')).toBe(11);
      expect(service.parseWrittenDollars('thirteen')).toBe(13);
      expect(service.parseWrittenDollars('nineteen')).toBe(19);
    });

    it('should parse tens', () => {
      expect(service.parseWrittenDollars('twenty')).toBe(20);
      expect(service.parseWrittenDollars('fifty')).toBe(50);
      expect(service.parseWrittenDollars('ninety')).toBe(90);
    });

    it('should parse compound tens', () => {
      expect(service.parseWrittenDollars('forty-five')).toBe(45);
      expect(service.parseWrittenDollars('twenty-one')).toBe(21);
      expect(service.parseWrittenDollars('thirty-three')).toBe(33);
    });

    it('should parse hyphenated and non-hyphenated the same', () => {
      expect(service.parseWrittenDollars('forty-five')).toBe(45);
      expect(service.parseWrittenDollars('forty five')).toBe(45);
    });

    it('should parse hundreds', () => {
      expect(service.parseWrittenDollars('one hundred')).toBe(100);
      expect(service.parseWrittenDollars('two hundred')).toBe(200);
      expect(service.parseWrittenDollars('five hundred')).toBe(500);
    });

    it('should parse hundreds with remainder', () => {
      expect(service.parseWrittenDollars('one hundred eighty-seven')).toBe(187);
      expect(service.parseWrittenDollars('three hundred fifty')).toBe(350);
      expect(service.parseWrittenDollars('two hundred fifty')).toBe(250);
    });

    it('should parse thousands', () => {
      expect(service.parseWrittenDollars('one thousand')).toBe(1000);
      expect(service.parseWrittenDollars('two thousand five hundred')).toBe(2500);
    });

    it('should parse full complex amounts', () => {
      expect(service.parseWrittenDollars('one thousand two hundred forty-seven')).toBe(1247);
      expect(service.parseWrittenDollars('one thousand two hundred forty seven')).toBe(1247);
    });

    it('should parse compound hundreds (twelve hundred)', () => {
      expect(service.parseWrittenDollars('twelve hundred')).toBe(1200);
      expect(service.parseWrittenDollars('fifteen hundred')).toBe(1500);
      expect(service.parseWrittenDollars('twelve hundred forty-seven')).toBe(1247);
    });

    it('should strip "dollars" suffix', () => {
      expect(service.parseWrittenDollars('forty-five dollars')).toBe(45);
      expect(service.parseWrittenDollars('one hundred dollars')).toBe(100);
    });

    it('should strip "only" suffix', () => {
      expect(service.parseWrittenDollars('forty-five only')).toBe(45);
    });

    it('should handle commas in input', () => {
      expect(service.parseWrittenDollars('one thousand, two hundred')).toBe(1200);
    });

    it('should be case-insensitive', () => {
      expect(service.parseWrittenDollars('Forty-Five')).toBe(45);
      expect(service.parseWrittenDollars('ONE HUNDRED')).toBe(100);
    });

    it('should reject digits in input', () => {
      expect(service.parseWrittenDollars('1247')).toBeNull();
      expect(service.parseWrittenDollars('1,247')).toBeNull();
      expect(service.parseWrittenDollars('forty5')).toBeNull();
    });

    it('should reject unparseable words', () => {
      expect(service.parseWrittenDollars('blah blah')).toBeNull();
      expect(service.parseWrittenDollars('fortyfive')).toBeNull();
    });

    it('should reject amounts over 99999', () => {
      expect(service.parseWrittenDollars('one hundred thousand')).toBeNull();
    });

    it('should return 0 for empty input', () => {
      expect(service.parseWrittenDollars('')).toBe(0);
      expect(service.parseWrittenDollars('   ')).toBe(0);
    });

    it('should parse zero', () => {
      expect(service.parseWrittenDollars('zero')).toBe(0);
    });
  });

  describe('parseCentsFraction', () => {
    it('should parse standard cent fractions', () => {
      expect(service.parseCentsFraction('50/100')).toBe(50);
      expect(service.parseCentsFraction('00/100')).toBe(0);
      expect(service.parseCentsFraction('99/100')).toBe(99);
      expect(service.parseCentsFraction('33/100')).toBe(33);
    });

    it('should parse "no/100"', () => {
      expect(service.parseCentsFraction('no/100')).toBe(0);
    });

    it('should handle whitespace', () => {
      expect(service.parseCentsFraction('  50/100  ')).toBe(50);
    });

    it('should be case-insensitive', () => {
      expect(service.parseCentsFraction('NO/100')).toBe(0);
    });

    it('should reject invalid formats', () => {
      expect(service.parseCentsFraction('50')).toBeNull();
      expect(service.parseCentsFraction('50/200')).toBeNull();
      expect(service.parseCentsFraction('abc')).toBeNull();
      expect(service.parseCentsFraction('')).toBeNull();
    });

    it('should reject cents over 99', () => {
      expect(service.parseCentsFraction('100/100')).toBeNull();
    });
  });

  describe('validate', () => {
    it('should validate a correct simple amount', () => {
      const result = service.validate('Forty-five and 00/100', 45.0);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a correct complex amount', () => {
      const result = service.validate(
        'One thousand two hundred forty-seven and 50/100',
        1247.5
      );
      expect(result.isValid).toBe(true);
    });

    it('should accept compound hundreds', () => {
      const result = service.validate('Twelve hundred forty-seven and 50/100', 1247.5);
      expect(result.isValid).toBe(true);
    });

    it('should accept "no/100" for zero cents', () => {
      const result = service.validate('Forty-five and no/100', 45.0);
      expect(result.isValid).toBe(true);
    });

    it('should accept case-insensitive input', () => {
      const result = service.validate('forty-five and 00/100', 45.0);
      expect(result.isValid).toBe(true);
    });

    it('should reject missing cents fraction', () => {
      const result = service.validate('Forty-five', 45.0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Don't forget to include cents as a fraction, like 'and 00/100'"
      );
    });

    it('should reject digit usage in written amount', () => {
      const result = service.validate('1,247 and 50/100', 1247.5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'The written amount should use words, not numbers'
      );
    });

    it('should reject wrong value', () => {
      const result = service.validate('Fifty and 00/100', 45.0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "The written amount doesn't match the numeric amount"
      );
    });

    it('should reject empty input', () => {
      const result = service.validate('', 45.0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Written amount is required');
    });

    it('should reject unparseable input', () => {
      const result = service.validate('gibberish and 00/100', 45.0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Could not understand the written dollar amount'
      );
    });

    it('should strip trailing dashes/lines before cents', () => {
      const result = service.validate('Forty-five and 00/100 ———', 45.0);
      expect(result.isValid).toBe(true);
    });

    it('should strip trailing "dollars" after cents', () => {
      const result = service.validate('Forty-five and 00/100 dollars', 45.0);
      expect(result.isValid).toBe(true);
    });

    it('should validate two thousand five hundred', () => {
      const result = service.validate('Two thousand five hundred and 00/100', 2500.0);
      expect(result.isValid).toBe(true);
    });

    it('should validate amounts with non-zero cents', () => {
      const result = service.validate('One hundred eighty-seven and 33/100', 187.33);
      expect(result.isValid).toBe(true);
    });

    it('should validate ninety-four dollars even', () => {
      const result = service.validate('Ninety-four and 00/100', 94.0);
      expect(result.isValid).toBe(true);
    });
  });

  describe('toWrittenForm', () => {
    it('should convert simple amounts', () => {
      expect(service.toWrittenForm(45.0)).toBe('Forty-five and 00/100');
    });

    it('should convert complex amounts', () => {
      expect(service.toWrittenForm(1247.5)).toBe(
        'One thousand two hundred forty-seven and 50/100'
      );
    });

    it('should convert round amounts', () => {
      expect(service.toWrittenForm(100.0)).toBe('One hundred and 00/100');
    });

    it('should convert zero', () => {
      expect(service.toWrittenForm(0.0)).toBe('Zero and 00/100');
    });

    it('should convert amounts with cents', () => {
      expect(service.toWrittenForm(187.33)).toBe(
        'One hundred eighty-seven and 33/100'
      );
    });

    it('should convert thousands', () => {
      expect(service.toWrittenForm(2500.0)).toBe(
        'Two thousand five hundred and 00/100'
      );
    });

    it('should convert thirty-five', () => {
      expect(service.toWrittenForm(35.0)).toBe('Thirty-five and 00/100');
    });

    it('should convert one hundred fifty', () => {
      expect(service.toWrittenForm(150.0)).toBe('One hundred fifty and 00/100');
    });

    it('should round-trip through validate', () => {
      const amounts = [45.0, 1247.5, 187.33, 2500.0, 94.0, 35.0, 150.0];
      for (const amount of amounts) {
        const written = service.toWrittenForm(amount);
        const validation = service.validate(written, amount);
        expect(validation.isValid).toBe(true);
      }
    });
  });
});

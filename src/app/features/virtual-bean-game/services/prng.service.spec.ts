import { TestBed } from '@angular/core/testing';
import { PrngService } from './prng.service';

describe('PrngService', () => {
  let service: PrngService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrngService);
  });

  describe('create()', () => {
    it('should produce deterministic sequences for the same seed', () => {
      const rng1 = service.create('XKQM');
      const rng2 = service.create('XKQM');

      const seq1 = Array.from({ length: 20 }, () => rng1());
      const seq2 = Array.from({ length: 20 }, () => rng2());

      expect(seq1).toEqual(seq2);
    });

    it('should produce different sequences for different seeds', () => {
      const rng1 = service.create('XKQM');
      const rng2 = service.create('ABCD');

      const seq1 = Array.from({ length: 10 }, () => rng1());
      const seq2 = Array.from({ length: 10 }, () => rng2());

      expect(seq1).not.toEqual(seq2);
    });

    it('should produce values in [0, 1) range', () => {
      const rng = service.create('TEST');
      const values = Array.from({ length: 1000 }, () => rng());

      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });

    it('should have reasonable distribution across the range', () => {
      const rng = service.create('DIST');
      const buckets = [0, 0, 0, 0, 0]; // 5 buckets: [0,0.2), [0.2,0.4), etc.
      const count = 5000;

      for (let i = 0; i < count; i++) {
        const v = rng();
        const bucket = Math.min(Math.floor(v * 5), 4);
        buckets[bucket]++;
      }

      const expected = count / 5;
      for (const b of buckets) {
        // Each bucket should be within 10% of expected
        expect(b).toBeGreaterThan(expected * 0.8);
        expect(b).toBeLessThan(expected * 1.2);
      }
    });
  });

  describe('generateSeed()', () => {
    it('should return a 4-character string', () => {
      const seed = service.generateSeed();
      expect(seed).toHaveLength(4);
    });

    it('should only contain uppercase letters and digits (no ambiguous chars)', () => {
      // Generate multiple to increase coverage
      for (let i = 0; i < 50; i++) {
        const seed = service.generateSeed();
        expect(seed).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
      }
    });

    it('should produce varying seeds (not always the same)', () => {
      const seeds = new Set<string>();
      for (let i = 0; i < 20; i++) {
        seeds.add(service.generateSeed());
      }
      // With 30^4 = 810,000 possibilities, 20 tries should almost always be unique
      expect(seeds.size).toBeGreaterThan(10);
    });
  });
});

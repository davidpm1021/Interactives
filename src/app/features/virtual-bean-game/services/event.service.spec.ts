import { TestBed } from '@angular/core/testing';
import { EventService } from './event.service';
import { PrngService } from './prng.service';
import { AllocationService } from './allocation.service';
import { CATEGORIES } from '../data/categories';
import { EVENTS } from '../data/events';
import { type Allocations, type GameConfig } from '../models/game.models';

describe('EventService', () => {
  let service: EventService;
  let prng: PrngService;

  const defaultConfig: GameConfig = {
    round3Enabled: true,
    eventCount: 'random',
    difficulty: 'balanced',
    seed: null,
    allowReplay: true,
  };

  function fullAllocation(): Allocations {
    return {
      'housing': 'housing-3',
      'food': 'food-1',
      'insurance-auto': 'ins-auto-1',
      'insurance-health': 'ins-health-1',
      'insurance-property': 'ins-property-1',
      'clothing-clothes': 'clothes-1',
      'clothing-laundry': 'laundry-1',
      'transportation': 'transport-4',
      'furnishings': 'furnish-1',
      'communication-phone': 'comm-phone-1',
      'communication-wifi': 'comm-wifi-0',
      'personal-care': 'pcare-1',
      'savings': 'savings-1',
    };
  }

  function minAllocation(): Allocations {
    return {
      'housing': 'housing-1',
      'food': 'food-1',
      'insurance-auto': 'ins-auto-0',
      'insurance-health': 'ins-health-0',
      'insurance-property': 'ins-property-0',
      'clothing-clothes': 'clothes-0',
      'clothing-laundry': 'laundry-0',
      'transportation': 'transport-1',
      'furnishings': 'furnish-0',
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventService);
    prng = TestBed.inject(PrngService);
  });

  // ─── Event Draw ────────────────────────────────────

  describe('generateLifePath', () => {
    it('should produce deterministic results for the same seed', () => {
      const alloc = fullAllocation();
      const rng1 = prng.create('TEST');
      const rng2 = prng.create('TEST');
      const path1 = service.generateLifePath(rng1, defaultConfig, alloc, CATEGORIES);
      const path2 = service.generateLifePath(rng2, defaultConfig, alloc, CATEGORIES);

      expect(path1.map((e) => e.id)).toEqual(path2.map((e) => e.id));
    });

    it('should produce different results for different seeds', () => {
      const alloc = fullAllocation();
      const path1 = service.generateLifePath(
        prng.create('AAAA'), defaultConfig, alloc, CATEGORIES,
      );
      const path2 = service.generateLifePath(
        prng.create('ZZZZ'), defaultConfig, alloc, CATEGORIES,
      );

      // Very unlikely to be identical
      const ids1 = path1.map((e) => e.id).join(',');
      const ids2 = path2.map((e) => e.id).join(',');
      expect(ids1).not.toBe(ids2);
    });

    it('should draw 3-5 events with random config', () => {
      // Test multiple seeds to cover distribution
      for (let i = 0; i < 20; i++) {
        const rng = prng.create(`SEED${i}`);
        const path = service.generateLifePath(rng, defaultConfig, fullAllocation(), CATEGORIES);
        expect(path.length).toBeGreaterThanOrEqual(3);
        expect(path.length).toBeLessThanOrEqual(5);
      }
    });

    it('should draw exact count when config specifies fixed number', () => {
      const config: GameConfig = { ...defaultConfig, eventCount: 4 };
      const path = service.generateLifePath(
        prng.create('FIXED'), config, fullAllocation(), CATEGORIES,
      );
      expect(path.length).toBe(4);
    });

    it('should include at least 1 setback', () => {
      for (let i = 0; i < 20; i++) {
        const rng = prng.create(`SET${i}`);
        const path = service.generateLifePath(rng, defaultConfig, fullAllocation(), CATEGORIES);
        const hasSetback = path.some((e) => e.type === 'setback');
        expect(hasSetback).toBe(true);
      }
    });

    it('should include at least 1 forced-choice or advantage', () => {
      for (let i = 0; i < 20; i++) {
        const rng = prng.create(`MIX${i}`);
        const path = service.generateLifePath(rng, defaultConfig, fullAllocation(), CATEGORIES);
        const hasNonSetback = path.some(
          (e) => e.type === 'forced-choice' || e.type === 'advantage',
        );
        expect(hasNonSetback).toBe(true);
      }
    });

    it('should not draw two events with the same target category', () => {
      for (let i = 0; i < 30; i++) {
        const rng = prng.create(`DUP${i}`);
        const path = service.generateLifePath(rng, defaultConfig, fullAllocation(), CATEGORIES);
        const targets = path
          .filter((e) => e.targetCategory !== null)
          .map((e) => e.targetCategory);
        const unique = new Set(targets);
        expect(unique.size).toBe(targets.length);
      }
    });

    it('should replace A6 with re-draw when student has no insurance', () => {
      const noInsurance = minAllocation(); // no insurance at all
      for (let i = 0; i < 30; i++) {
        const rng = prng.create(`A6T${i}`);
        const path = service.generateLifePath(rng, defaultConfig, noInsurance, CATEGORIES);
        const hasA6 = path.some((e) => e.id === 'A6');
        expect(hasA6).toBe(false);
      }
    });

    it('should allow A6 when student has insurance', () => {
      const withInsurance = fullAllocation(); // has health + auto + renters
      // Run many times — A6 should appear at least once
      let foundA6 = false;
      for (let i = 0; i < 100; i++) {
        const rng = prng.create(`INS${i}`);
        const path = service.generateLifePath(rng, defaultConfig, withInsurance, CATEGORIES);
        if (path.some((e) => e.id === 'A6')) {
          foundA6 = true;
          break;
        }
      }
      expect(foundA6).toBe(true);
    });
  });

  describe('drawEventCount', () => {
    it('should return fixed count from config', () => {
      const config: GameConfig = { ...defaultConfig, eventCount: 5 };
      expect(service.drawEventCount(() => 0.5, config)).toBe(5);
    });

    it('should return 3 for roll < 0.30', () => {
      expect(service.drawEventCount(() => 0.1, defaultConfig)).toBe(3);
    });

    it('should return 4 for roll 0.30-0.74', () => {
      expect(service.drawEventCount(() => 0.5, defaultConfig)).toBe(4);
    });

    it('should return 5 for roll >= 0.75', () => {
      expect(service.drawEventCount(() => 0.9, defaultConfig)).toBe(5);
    });
  });

  // ─── Event Resolution ──────────────────────────────

  describe('resolveEvent', () => {
    const minRequired = 4;

    it('should resolve S1 (Broken Leg) with no effect when insured', () => {
      const alloc = fullAllocation(); // has ins-health-1
      const event = EVENTS.find((e) => e.id === 'S1')!;
      const result = service.resolveEvent(event, alloc, 13, minRequired, CATEGORIES);

      expect(result.conditionMet).toBe(true);
      expect(result.beansChanged).toBe(0);
      expect(result.resolutionText).toContain('covered');
    });

    it('should resolve S1 (Broken Leg) with -3 beans when uninsured', () => {
      const alloc = { ...fullAllocation(), 'insurance-health': 'ins-health-0' };
      const event = EVENTS.find((e) => e.id === 'S1')!;
      const result = service.resolveEvent(event, alloc, 13, minRequired, CATEGORIES);

      expect(result.conditionMet).toBe(false);
      expect(result.beansChanged).toBe(-3);
    });

    it('should resolve S7 (Car Trouble) with no effect when no car', () => {
      const alloc = { ...minAllocation(), 'transportation': 'transport-1' }; // walk
      const event = EVENTS.find((e) => e.id === 'S7')!;
      const result = service.resolveEvent(event, alloc, 13, minRequired, CATEGORIES);

      expect(result.conditionMet).toBe(false);
      expect(result.beansChanged).toBe(0);
      expect(result.resolutionText).toContain("don't have a car");
    });

    it('should resolve S7 (Car Trouble) with -2 beans when has car', () => {
      const alloc = { ...fullAllocation(), 'transportation': 'transport-4' }; // used car
      const event = EVENTS.find((e) => e.id === 'S7')!;
      const result = service.resolveEvent(event, alloc, 13, minRequired, CATEGORIES);

      expect(result.conditionMet).toBe(true);
      expect(result.beansChanged).toBe(-2);
    });

    it('should resolve unconditional setback S3 (Winter Coat)', () => {
      const event = EVENTS.find((e) => e.id === 'S3')!;
      const result = service.resolveEvent(event, fullAllocation(), 13, minRequired, CATEGORIES);

      expect(result.conditionMet).toBeNull();
      expect(result.beansChanged).toBe(-1);
    });

    it('should resolve advantage A1 (Small Raise) with +2 beans', () => {
      const event = EVENTS.find((e) => e.id === 'A1')!;
      const result = service.resolveEvent(event, fullAllocation(), 13, minRequired, CATEGORIES);

      expect(result.conditionMet).toBeNull();
      expect(result.beansChanged).toBe(2);
    });

    it('should apply hard floor to large penalty', () => {
      const alloc = { ...minAllocation(), 'insurance-health': 'ins-health-0' };
      const event = EVENTS.find((e) => e.id === 'S1')!; // -3 beans uninsured
      // currentBeans = 5, min = 4, so can only lose 1
      const result = service.resolveEvent(event, alloc, 5, minRequired, CATEGORIES);

      expect(result.beansChanged).toBe(-1);
      expect(result.hardFloorApplied).toBe(true);
      expect(result.resolutionText).toContain('can only afford to lose');
    });

    it('should not apply hard floor to advantages', () => {
      const event = EVENTS.find((e) => e.id === 'A4')!; // +3 beans
      const result = service.resolveEvent(event, fullAllocation(), 4, minRequired, CATEGORIES);

      expect(result.beansChanged).toBe(3);
      expect(result.hardFloorApplied).toBe(false);
    });

    it('should return 0 bean change when already at hard floor', () => {
      const alloc = { ...minAllocation(), 'insurance-health': 'ins-health-0' };
      const event = EVENTS.find((e) => e.id === 'S1')!;
      const result = service.resolveEvent(event, alloc, 4, minRequired, CATEGORIES);

      expect(result.beansChanged).toBe(0);
      expect(result.hardFloorApplied).toBe(true);
    });
  });

  // ─── Condition Checking ────────────────────────────

  describe('checkCondition', () => {
    it('should return null for unconditional events', () => {
      const event = EVENTS.find((e) => e.id === 'S3')!; // Winter Coat
      expect(service.checkCondition(event, fullAllocation(), CATEGORIES)).toBeNull();
    });

    it('should return true when has-option condition met', () => {
      const event = EVENTS.find((e) => e.id === 'S1')!; // checks ins-health-1
      expect(service.checkCondition(event, fullAllocation(), CATEGORIES)).toBe(true);
    });

    it('should return false when has-option condition not met', () => {
      const event = EVENTS.find((e) => e.id === 'S1')!;
      const alloc = { ...fullAllocation(), 'insurance-health': 'ins-health-0' };
      expect(service.checkCondition(event, alloc, CATEGORIES)).toBe(false);
    });

    it('should check has-car correctly for bus rider', () => {
      const event = EVENTS.find((e) => e.id === 'S7')!;
      const alloc = { ...minAllocation(), 'transportation': 'transport-2' }; // bus
      expect(service.checkCondition(event, alloc, CATEGORIES)).toBe(false);
    });

    it('should check has-car correctly for used car owner', () => {
      const event = EVENTS.find((e) => e.id === 'S7')!;
      const alloc = { ...minAllocation(), 'transportation': 'transport-4' }; // used car
      expect(service.checkCondition(event, alloc, CATEGORIES)).toBe(true);
    });

    it('should check has-phone correctly', () => {
      const event = EVENTS.find((e) => e.id === 'S10')!;
      expect(service.checkCondition(event, fullAllocation(), CATEGORIES)).toBe(true);

      const noPhone = { ...fullAllocation(), 'communication-phone': 'comm-phone-0' };
      expect(service.checkCondition(event, noPhone, CATEGORIES)).toBe(false);
    });

    it('should check has-savings correctly', () => {
      const event = EVENTS.find((e) => e.id === 'S13')!;
      expect(service.checkCondition(event, fullAllocation(), CATEGORIES)).toBe(true);

      const noSavings = { ...fullAllocation(), 'savings': 'savings-0' };
      expect(service.checkCondition(event, noSavings, CATEGORIES)).toBe(false);
    });

    it('should check housing-type correctly', () => {
      const event = EVENTS.find((e) => e.id === 'S9')!; // checks housing-3
      expect(service.checkCondition(event, fullAllocation(), CATEGORIES)).toBe(true);

      const roommates = { ...fullAllocation(), 'housing': 'housing-2' };
      expect(service.checkCondition(event, roommates, CATEGORIES)).toBe(false);
    });

    it('should check clothing-level correctly', () => {
      const event = EVENTS.find((e) => e.id === 'F5')!; // checks clothes-0
      const bareWardrobe = { ...minAllocation(), 'clothing-clothes': 'clothes-0' };
      expect(service.checkCondition(event, bareWardrobe, CATEGORIES)).toBe(true);

      expect(service.checkCondition(event, fullAllocation(), CATEGORIES)).toBe(false);
    });
  });

  // ─── Sequential State Checking ─────────────────────

  describe('sequential event resolution', () => {
    it('should resolve based on current state at time of each event', () => {
      // Simulate: student has car, event 1 removes car, event 2 is car trouble
      const alloc: Allocations = {
        ...fullAllocation(),
        'transportation': 'transport-4', // has used car
      };

      // Event 1: something forces downgrade to walk
      // (We simulate by changing allocations between events)
      const carTrouble = EVENTS.find((e) => e.id === 'S7')!;

      // With car: should cost beans
      const result1 = service.resolveEvent(carTrouble, alloc, 13, 4, CATEGORIES);
      expect(result1.beansChanged).toBe(-2);

      // After losing car: same event should have no effect
      const allocNoCar = { ...alloc, 'transportation': 'transport-1' };
      const result2 = service.resolveEvent(carTrouble, allocNoCar, 11, 4, CATEGORIES);
      expect(result2.beansChanged).toBe(0);
      expect(result2.conditionMet).toBe(false);
    });
  });
});

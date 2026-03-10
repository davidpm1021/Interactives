import { TestBed } from '@angular/core/testing';
import { AllocationService } from './allocation.service';
import { CATEGORIES } from '../data/categories';
import { type Allocations } from '../models/game.models';

describe('AllocationService', () => {
  let service: AllocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AllocationService);
  });

  /** Helper: minimal required allocation (all cheapest required options) */
  function minAllocation(): Allocations {
    return {
      'housing': 'housing-1',          // 2 beans
      'food': 'food-1',                // 2 beans
      'insurance-auto': 'ins-auto-0',  // 0 beans
      'insurance-health': 'ins-health-0', // 0 beans
      'insurance-property': 'ins-property-0', // 0 beans
      'clothing-clothes': 'clothes-0', // 0 beans
      'clothing-laundry': 'laundry-0', // 0 beans
      'transportation': 'transport-1', // 0 beans
      'furnishings': 'furnish-0',      // 0 beans
    };
  }

  /** Helper: full 20-bean allocation */
  function fullAllocation(): Allocations {
    return {
      'housing': 'housing-3',              // 4
      'food': 'food-1',                    // 2
      'insurance-auto': 'ins-auto-1',      // 2
      'insurance-health': 'ins-health-1',  // 2
      'insurance-property': 'ins-property-1', // 1
      'clothing-clothes': 'clothes-1',     // 1
      'clothing-laundry': 'laundry-1',     // 1
      'transportation': 'transport-4',     // 3 (used car)
      'furnishings': 'furnish-1',          // 1
      'communication-phone': 'comm-phone-1', // 1
      'communication-wifi': 'comm-wifi-0', // 0
      'personal-care': 'pcare-1',          // 1
      'savings': 'savings-1',             // 1
    };
  }

  // ─── Bean Counting ─────────────────────────────────

  describe('calculateTotalBeans', () => {
    it('should count beans for a simple single-select allocation', () => {
      const alloc: Allocations = { 'housing': 'housing-3' }; // 4 beans
      expect(service.calculateTotalBeans(alloc, CATEGORIES)).toBe(4);
    });

    it('should count beans across sub-categories', () => {
      const alloc: Allocations = {
        'insurance-auto': 'ins-auto-1',    // 2
        'insurance-health': 'ins-health-1', // 2
        'insurance-property': 'ins-property-1', // 1
      };
      expect(service.calculateTotalBeans(alloc, CATEGORIES)).toBe(5);
    });

    it('should count beans for multi-select category sub-categories', () => {
      const alloc: Allocations = {
        'communication-phone': 'comm-phone-2', // 2
        'communication-wifi': 'comm-wifi-1',   // 1
      };
      expect(service.calculateTotalBeans(alloc, CATEGORIES)).toBe(3);
    });

    it('should return 0 for empty allocations', () => {
      expect(service.calculateTotalBeans({}, CATEGORIES)).toBe(0);
    });

    it('should count 4 beans for the minimum required allocation', () => {
      expect(service.calculateTotalBeans(minAllocation(), CATEGORIES)).toBe(4);
    });

    it('should count 20 beans for a full allocation', () => {
      expect(service.calculateTotalBeans(fullAllocation(), CATEGORIES)).toBe(20);
    });
  });

  describe('getBeansRemaining', () => {
    it('should return budget minus total for Round 1', () => {
      expect(service.getBeansRemaining(fullAllocation(), 20, CATEGORIES)).toBe(0);
    });

    it('should return negative when over budget', () => {
      expect(service.getBeansRemaining(fullAllocation(), 13, CATEGORIES)).toBe(-7);
    });

    it('should return full budget for empty allocations', () => {
      expect(service.getBeansRemaining({}, 20, CATEGORIES)).toBe(20);
    });
  });

  // ─── Validation ────────────────────────────────────

  describe('validateAllocation', () => {
    it('should be valid for a complete 20-bean allocation', () => {
      const result = service.validateAllocation(fullAllocation(), 20, CATEGORIES);
      expect(result.valid).toBe(true);
      expect(result.totalBeans).toBe(20);
      expect(result.budgetRemaining).toBe(0);
      expect(result.overBudget).toBe(false);
      expect(result.missingRequired).toEqual([]);
    });

    it('should be invalid when over budget', () => {
      const result = service.validateAllocation(fullAllocation(), 13, CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.overBudget).toBe(true);
      expect(result.budgetRemaining).toBe(-7);
    });

    it('should report missing required categories', () => {
      const alloc: Allocations = { 'housing': 'housing-1' }; // only housing selected
      const result = service.validateAllocation(alloc, 20, CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.missingRequired).toContain('food');
      expect(result.missingRequired).toContain('insurance-auto');
      expect(result.missingRequired).toContain('insurance-health');
      expect(result.missingRequired).toContain('insurance-property');
      expect(result.missingRequired).toContain('clothing-clothes');
      expect(result.missingRequired).toContain('clothing-laundry');
      expect(result.missingRequired).toContain('transportation');
      expect(result.missingRequired).toContain('furnishings');
    });

    it('should not require optional categories', () => {
      const result = service.validateAllocation(minAllocation(), 20, CATEGORIES);
      expect(result.missingRequired).toEqual([]);
      expect(result.overBudget).toBe(false);
    });

    it('should be valid with under-budget allocation if all required are filled', () => {
      const result = service.validateAllocation(minAllocation(), 20, CATEGORIES);
      expect(result.valid).toBe(true);
      expect(result.budgetRemaining).toBe(16);
    });
  });

  // ─── Dependencies ──────────────────────────────────

  describe('getDependencyConflicts', () => {
    it('should detect auto insurance selected without a car', () => {
      const alloc: Allocations = {
        ...minAllocation(),
        'insurance-auto': 'ins-auto-1', // has auto insurance
        'transportation': 'transport-1', // walk/bike (no car)
      };
      const conflicts = service.getDependencyConflicts(alloc, CATEGORIES);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0]).toContain('No car');
    });

    it('should allow auto insurance with a car', () => {
      const alloc: Allocations = {
        ...minAllocation(),
        'insurance-auto': 'ins-auto-1',
        'transportation': 'transport-4', // used car
      };
      const conflicts = service.getDependencyConflicts(alloc, CATEGORIES);
      expect(conflicts.length).toBe(0);
    });

    it('should detect renters insurance with family housing', () => {
      const alloc: Allocations = {
        ...minAllocation(),
        'housing': 'housing-1', // living with family
        'insurance-property': 'ins-property-1', // renters insurance
      };
      const conflicts = service.getDependencyConflicts(alloc, CATEGORIES);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0]).toContain('Renters insurance');
    });

    it('should allow renters insurance with roommates or own place', () => {
      const alloc: Allocations = {
        ...minAllocation(),
        'housing': 'housing-2', // roommates
        'insurance-property': 'ins-property-1',
      };
      const conflicts = service.getDependencyConflicts(alloc, CATEGORIES);
      expect(conflicts.length).toBe(0);
    });

    it('should have no conflicts for the minimum allocation', () => {
      const conflicts = service.getDependencyConflicts(minAllocation(), CATEGORIES);
      expect(conflicts.length).toBe(0);
    });
  });

  describe('applyDependencyCascade', () => {
    it('should reset auto insurance when transport switches to walk/bike', () => {
      const alloc: Allocations = {
        ...minAllocation(),
        'insurance-auto': 'ins-auto-1', // had auto insurance
        'transportation': 'transport-1', // now walking
      };
      const result = service.applyDependencyCascade(alloc, CATEGORIES);
      expect(result['insurance-auto']).toBe('ins-auto-0');
    });

    it('should reset renters insurance when housing switches to family', () => {
      const alloc: Allocations = {
        ...minAllocation(),
        'housing': 'housing-1', // family
        'insurance-property': 'ins-property-1', // renters
      };
      const result = service.applyDependencyCascade(alloc, CATEGORIES);
      expect(result['insurance-property']).toBe('ins-property-0');
    });

    it('should not modify allocations without conflicts', () => {
      const alloc = fullAllocation();
      const result = service.applyDependencyCascade(alloc, CATEGORIES);
      expect(result['insurance-auto']).toBe('ins-auto-1');
      expect(result['insurance-property']).toBe('ins-property-1');
    });

    it('should leave auto insurance alone when car is present', () => {
      const alloc: Allocations = {
        ...minAllocation(),
        'insurance-auto': 'ins-auto-2',
        'transportation': 'transport-5', // new car
      };
      const result = service.applyDependencyCascade(alloc, CATEGORIES);
      expect(result['insurance-auto']).toBe('ins-auto-2');
    });
  });

  // ─── Hard Floor ────────────────────────────────────

  describe('calculateMinRequiredBeans', () => {
    it('should return 4 (Housing 2 + Food 2 + all others at 0)', () => {
      expect(service.calculateMinRequiredBeans(CATEGORIES)).toBe(4);
    });
  });

  describe('applyHardFloor', () => {
    const minRequired = 4;

    it('should allow full penalty when student can afford it', () => {
      // 13 beans, min 4, losing 3 → 10 remaining, fine
      expect(service.applyHardFloor(-3, 13, minRequired)).toBe(-3);
    });

    it('should reduce penalty to not go below minimum', () => {
      // 6 beans, min 4, trying to lose 3 → can only lose 2
      expect(service.applyHardFloor(-3, 6, minRequired)).toBe(-2);
    });

    it('should return 0 when already at minimum', () => {
      expect(service.applyHardFloor(-2, 4, minRequired)).toBe(0);
    });

    it('should return 0 when below minimum', () => {
      expect(service.applyHardFloor(-1, 3, minRequired)).toBe(0);
    });

    it('should not affect advantages (positive beans)', () => {
      expect(service.applyHardFloor(2, 4, minRequired)).toBe(2);
    });

    it('should allow losing exactly down to minimum', () => {
      // 7 beans, min 4, losing 3 → exactly 4 remaining
      expect(service.applyHardFloor(-3, 7, minRequired)).toBe(-3);
    });
  });

  // ─── Diff Generation ──────────────────────────────

  describe('getAllocationDiff', () => {
    it('should detect unchanged allocations', () => {
      const alloc = fullAllocation();
      const diffs = service.getAllocationDiff(alloc, alloc, CATEGORIES);
      for (const d of diffs) {
        expect(d.changeType).toBe('unchanged');
        expect(d.beanDelta).toBe(0);
      }
    });

    it('should detect downgraded categories', () => {
      const r1 = fullAllocation();
      const r2: Allocations = { ...r1, 'housing': 'housing-2' }; // 4 → 3
      const diffs = service.getAllocationDiff(r1, r2, CATEGORIES);
      const housing = diffs.find((d) => d.categoryId === 'housing' && !d.subCategoryId);
      expect(housing?.changeType).toBe('downgraded');
      expect(housing?.beanDelta).toBe(-1);
    });

    it('should detect dropped categories', () => {
      const r1 = fullAllocation();
      const r2: Allocations = { ...r1, 'savings': 'savings-0' }; // 1 → 0
      const diffs = service.getAllocationDiff(r1, r2, CATEGORIES);
      const savings = diffs.find((d) => d.categoryId === 'savings');
      expect(savings?.changeType).toBe('dropped');
      expect(savings?.beanDelta).toBe(-1);
    });

    it('should detect upgraded categories', () => {
      const r1 = minAllocation();
      const r2: Allocations = { ...r1, 'housing': 'housing-3' }; // 2 → 4
      const diffs = service.getAllocationDiff(r1, r2, CATEGORIES);
      const housing = diffs.find((d) => d.categoryId === 'housing' && !d.subCategoryId);
      expect(housing?.changeType).toBe('upgraded');
      expect(housing?.beanDelta).toBe(2);
    });

    it('should include sub-category info in diffs', () => {
      const r1 = fullAllocation();
      const r2: Allocations = { ...r1, 'insurance-health': 'ins-health-0' }; // dropped
      const diffs = service.getAllocationDiff(r1, r2, CATEGORIES);
      const health = diffs.find((d) => d.subCategoryId === 'insurance-health');
      expect(health).toBeDefined();
      expect(health?.categoryId).toBe('insurance');
      expect(health?.subCategoryName).toBe('Health & Disability');
      expect(health?.changeType).toBe('dropped');
    });
  });

  // ─── Option Lookup ─────────────────────────────────

  describe('getOptionById', () => {
    it('should find a top-level option', () => {
      const result = service.getOptionById('housing-2', CATEGORIES);
      expect(result).not.toBeNull();
      expect(result?.option.label).toContain('roommates');
      expect(result?.category.id).toBe('housing');
      expect(result?.subCategory).toBeNull();
    });

    it('should find a sub-category option', () => {
      const result = service.getOptionById('ins-auto-1', CATEGORIES);
      expect(result).not.toBeNull();
      expect(result?.option.label).toContain('State minimum');
      expect(result?.category.id).toBe('insurance');
      expect(result?.subCategory?.id).toBe('insurance-auto');
    });

    it('should return null for unknown option', () => {
      expect(service.getOptionById('nonexistent', CATEGORIES)).toBeNull();
    });
  });

  describe('getCategoryForOption', () => {
    it('should return category and null subCategory for top-level options', () => {
      const result = service.getCategoryForOption('food-2', CATEGORIES);
      expect(result?.category.id).toBe('food');
      expect(result?.subCategory).toBeNull();
    });

    it('should return category and subCategory for nested options', () => {
      const result = service.getCategoryForOption('comm-phone-1', CATEGORIES);
      expect(result?.category.id).toBe('communication');
      expect(result?.subCategory?.id).toBe('communication-phone');
    });
  });
});

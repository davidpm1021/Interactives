import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ReportService } from './report.service';
import { type Allocations, type EventResult } from '../models/game.models';
import { CATEGORIES } from '../data/categories';

describe('ReportService', () => {
  let service: ReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportService);
  });

  // Helper: minimal valid allocation for Round 1 (20 beans)
  function round1Alloc(): Allocations {
    return {
      'housing': 'housing-3',         // 4
      'food': 'food-2',               // 3
      'insurance-auto': 'ins-auto-1', // 2
      'insurance-health': 'ins-health-1', // 2
      'insurance-property': 'ins-property-1', // 1
      'clothing-clothes': 'clothes-1', // 1
      'clothing-laundry': 'laundry-1', // 1
      'transportation': 'transport-4', // 3
      'furnishings': 'furnish-1',      // 1
      'recreation': 'rec-0',           // 0
      'communication-phone': 'comm-phone-1', // 1
      'communication-wifi': 'comm-wifi-1',   // 1
      'personal-care': 'pcare-0',      // 0
      'gifts-giving': 'gifts-0',      // 0
      'gifts-charity': 'charity-0',   // 0
      'savings': 'savings-0',         // 0
    };
  }

  // Helper: Round 2 allocation (13 beans)
  function round2Alloc(): Allocations {
    return {
      'housing': 'housing-2',         // 3
      'food': 'food-1',               // 2
      'insurance-auto': 'ins-auto-1', // 2
      'insurance-health': 'ins-health-0', // 0
      'insurance-property': 'ins-property-0', // 0
      'clothing-clothes': 'clothes-1', // 1
      'clothing-laundry': 'laundry-0', // 0
      'transportation': 'transport-4', // 3
      'furnishings': 'furnish-0',      // 0
      'recreation': 'rec-0',           // 0
      'communication-phone': 'comm-phone-1', // 1
      'communication-wifi': 'comm-wifi-1',   // 1
      'personal-care': 'pcare-0',      // 0
      'gifts-giving': 'gifts-0',      // 0
      'gifts-charity': 'charity-0',   // 0
      'savings': 'savings-0',         // 0
    };
  }

  function sampleEvents(): EventResult[] {
    return [
      {
        eventId: 'S1',
        conditionMet: false,
        beansChanged: -3,
        hardFloorApplied: false,
        playerChoice: false,
        protectedCategories: [],
        resolutionText: "You don't have health insurance. Remove 3 beans.",
      },
      {
        eventId: 'A2',
        conditionMet: null,
        beansChanged: 1,
        hardFloorApplied: false,
        playerChoice: false,
        protectedCategories: [],
        resolutionText: 'Add 1 bean to allocate anywhere.',
      },
    ];
  }

  describe('encodeResult / decodeResult round-trip', () => {
    it('should encode and decode to matching data', () => {
      const r1 = round1Alloc();
      const r2 = round2Alloc();
      const events = sampleEvents();
      const encoded = service.encodeResult('XKQM', r1, r2, events);

      expect(encoded).toMatch(/^BGv1:XKQM:/);

      const decoded = service.decodeResult(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.seed).toBe('XKQM');

      // Verify round 1 allocations round-trip
      expect(decoded!.round1Allocations['housing']).toBe('housing-3');
      expect(decoded!.round1Allocations['food']).toBe('food-2');
      expect(decoded!.round1Allocations['transportation']).toBe('transport-4');

      // Verify round 2 allocations round-trip
      expect(decoded!.round2Allocations['housing']).toBe('housing-2');
      expect(decoded!.round2Allocations['food']).toBe('food-1');

      // Verify events round-trip
      expect(decoded!.eventOutcomes).toHaveLength(2);
      expect(decoded!.eventOutcomes[0].eventId).toBe('S1');
      expect(decoded!.eventOutcomes[0].conditionCode).toBe('n');
      expect(decoded!.eventOutcomes[0].beansChanged).toBe(-3);
      expect(decoded!.eventOutcomes[1].eventId).toBe('A2');
      expect(decoded!.eventOutcomes[1].conditionCode).toBe('x');
      expect(decoded!.eventOutcomes[1].beansChanged).toBe(1);
    });

    it('should encode to reasonable length', () => {
      const encoded = service.encodeResult('XKQM', round1Alloc(), round2Alloc(), sampleEvents());
      expect(encoded.length).toBeLessThan(120);
      expect(encoded.length).toBeGreaterThan(20);
    });

    it('should return null for invalid encoded string', () => {
      expect(service.decodeResult('')).toBeNull();
      expect(service.decodeResult('invalid')).toBeNull();
      expect(service.decodeResult('BGv2:XKQM:x:x:x')).toBeNull();
    });

    it('should handle empty events', () => {
      const encoded = service.encodeResult('TEST', round1Alloc(), round2Alloc(), []);
      const decoded = service.decodeResult(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.eventOutcomes).toHaveLength(0);
    });

    it('should handle condition met events', () => {
      const events: EventResult[] = [
        {
          eventId: 'S7',
          conditionMet: true,
          beansChanged: -2,
          hardFloorApplied: false,
          playerChoice: false,
          protectedCategories: [],
          resolutionText: 'Car repair needed.',
        },
      ];
      const encoded = service.encodeResult('ABCD', round1Alloc(), round2Alloc(), events);
      const decoded = service.decodeResult(encoded);
      expect(decoded!.eventOutcomes[0].conditionCode).toBe('y');
      expect(decoded!.eventOutcomes[0].beansChanged).toBe(-2);
    });
  });

  describe('generateInsights', () => {
    it('should return at most 3 insights', () => {
      const insights = service.generateInsights(
        round1Alloc(),
        round2Alloc(),
        sampleEvents(),
        11,
        CATEGORIES,
      );
      expect(insights.length).toBeLessThanOrEqual(3);
    });

    it('should generate no-insurance insight when health event hits uninsured student', () => {
      const r2 = { ...round2Alloc(), 'insurance-health': 'ins-health-0' };
      const events: EventResult[] = [
        {
          eventId: 'S1',
          conditionMet: false,
          beansChanged: -3,
          hardFloorApplied: false,
          playerChoice: false,
          protectedCategories: [],
          resolutionText: 'No health insurance.',
        },
      ];
      const insights = service.generateInsights(round1Alloc(), r2, events, 10, CATEGORIES);
      expect(insights.some((i) => i.includes('health insurance') || i.includes('medical'))).toBe(true);
    });

    it('should generate savings-cut insight when savings was reduced', () => {
      const r1 = { ...round1Alloc(), 'savings': 'savings-2' };
      const r2 = { ...round2Alloc(), 'savings': 'savings-0' };
      const insights = service.generateInsights(r1, r2, [], 13, CATEGORIES);
      expect(insights.some((i) => i.toLowerCase().includes('savings'))).toBe(true);
    });

    it('should generate housing-dominance insight when housing exceeds 30%', () => {
      // housing-3 = 4 beans; reduce transport so total ~12 -> 4/12 = 33%
      const r2 = { ...round2Alloc(), 'housing': 'housing-3', 'transportation': 'transport-2' };
      const insights = service.generateInsights(round1Alloc(), r2, [], 13, CATEGORIES);
      expect(insights.some((i) => i.includes('Housing') || i.includes('housing'))).toBe(true);
    });

    it('should generate income-shock insight when categories are downgraded', () => {
      const insights = service.generateInsights(round1Alloc(), round2Alloc(), [], 13, CATEGORIES);
      expect(insights.some((i) => i.includes('income dropped') || i.includes('cut'))).toBe(true);
    });
  });

  describe('formatReportText', () => {
    it('should produce a text report with all sections', () => {
      const encoded = service.encodeResult('XKQM', round1Alloc(), round2Alloc(), sampleEvents());
      const text = service.formatReportText(
        'XKQM',
        round1Alloc(),
        round2Alloc(),
        sampleEvents(),
        11,
        CATEGORIES,
        encoded,
      );

      expect(text).toContain('MY BEAN GAME REPORT');
      expect(text).toContain('XKQM');
      expect(text).toContain('ROUND 1');
      expect(text).toContain('ROUND 2');
      expect(text).toContain('LIFE HAPPENS');
      expect(text).toContain('Encoded:');
    });
  });
});

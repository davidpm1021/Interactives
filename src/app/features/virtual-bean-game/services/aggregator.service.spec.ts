import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AggregatorService } from './aggregator.service';
import { ReportService } from './report.service';
import { type Allocations, type EventResult } from '../models/game.models';

describe('AggregatorService', () => {
  let service: AggregatorService;
  let reportService: ReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AggregatorService);
    reportService = TestBed.inject(ReportService);
  });

  function makeR1(): Allocations {
    return {
      'housing': 'housing-3',
      'food': 'food-2',
      'insurance-auto': 'ins-auto-1',
      'insurance-health': 'ins-health-1',
      'insurance-property': 'ins-property-1',
      'clothing-clothes': 'clothes-1',
      'clothing-laundry': 'laundry-1',
      'transportation': 'transport-4',
      'furnishings': 'furnish-1',
      'recreation': 'rec-0',
      'communication-phone': 'comm-phone-1',
      'communication-wifi': 'comm-wifi-0',
      'personal-care': 'pcare-0',
      'gifts-giving': 'gifts-0',
      'gifts-charity': 'charity-0',
      'savings': 'savings-0',
    };
  }

  function makeR2(): Allocations {
    return {
      'housing': 'housing-2',
      'food': 'food-1',
      'insurance-auto': 'ins-auto-1',
      'insurance-health': 'ins-health-0',
      'insurance-property': 'ins-property-0',
      'clothing-clothes': 'clothes-1',
      'clothing-laundry': 'laundry-0',
      'transportation': 'transport-4',
      'furnishings': 'furnish-0',
      'recreation': 'rec-0',
      'communication-phone': 'comm-phone-1',
      'communication-wifi': 'comm-wifi-0',
      'personal-care': 'pcare-0',
      'gifts-giving': 'gifts-0',
      'gifts-charity': 'charity-0',
      'savings': 'savings-0',
    };
  }

  function makeEvents(): EventResult[] {
    return [
      { eventId: 'S1', conditionMet: false, beansChanged: -3, hardFloorApplied: false, playerChoice: false, protectedCategories: [], resolutionText: 'No insurance' },
      { eventId: 'A2', conditionMet: null, beansChanged: 1, hardFloorApplied: false, playerChoice: false, protectedCategories: [], resolutionText: 'Tax refund' },
    ];
  }

  function encodeStudent(seed: string, r1: Allocations, r2: Allocations, events: EventResult[]): string {
    return reportService.encodeResult(seed, r1, r2, events);
  }

  describe('parseResultStrings', () => {
    it('should parse valid encoded strings', () => {
      const s1 = encodeStudent('AAAA', makeR1(), makeR2(), makeEvents());
      const s2 = encodeStudent('BBBB', makeR1(), makeR2(), makeEvents());
      const result = service.parseResultStrings(`${s1}\n${s2}`);
      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should report errors for invalid strings', () => {
      const valid = encodeStudent('AAAA', makeR1(), makeR2(), makeEvents());
      const result = service.parseResultStrings(`${valid}\ngarbage\nalso-bad`);
      expect(result.valid).toHaveLength(1);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].line).toBe(2);
      expect(result.errors[1].line).toBe(3);
    });

    it('should skip empty lines', () => {
      const valid = encodeStudent('AAAA', makeR1(), makeR2(), makeEvents());
      const result = service.parseResultStrings(`\n${valid}\n\n`);
      expect(result.valid).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle completely empty input', () => {
      const result = service.parseResultStrings('');
      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('buildClassSummary', () => {
    it('should build summary from decoded results', () => {
      const s1 = encodeStudent('AAAA', makeR1(), makeR2(), makeEvents());
      const parsed = service.parseResultStrings(s1);
      const summary = service.buildClassSummary(parsed.valid);

      expect(summary.studentCount).toBe(1);
      expect(summary.round1Distribution.length).toBeGreaterThan(0);
      expect(summary.round2Distribution.length).toBeGreaterThan(0);
    });

    it('should calculate income cut ranking', () => {
      const s1 = encodeStudent('AAAA', makeR1(), makeR2(), makeEvents());
      const s2 = encodeStudent('BBBB', makeR1(), makeR2(), makeEvents());
      const parsed = service.parseResultStrings(`${s1}\n${s2}`);
      const summary = service.buildClassSummary(parsed.valid);

      // Both students cut health insurance and housing
      expect(summary.incomeCutResponse.length).toBeGreaterThan(0);
      const healthCut = summary.incomeCutResponse.find((r) => r.categoryId === 'insurance-health');
      expect(healthCut).toBeDefined();
      expect(healthCut!.cutCount).toBe(2);
      expect(healthCut!.cutPercentage).toBe(100);
    });

    it('should calculate event impact', () => {
      const s1 = encodeStudent('AAAA', makeR1(), makeR2(), makeEvents());
      const parsed = service.parseResultStrings(s1);
      const summary = service.buildClassSummary(parsed.valid);

      const s1Impact = summary.eventImpact.find((e) => e.eventId === 'S1');
      expect(s1Impact).toBeDefined();
      expect(s1Impact!.occurrences).toBe(1);
      expect(s1Impact!.avgBeanImpact).toBe(-3);
    });

    it('should calculate life path stats', () => {
      const s1 = encodeStudent('AAAA', makeR1(), makeR2(), makeEvents());
      const s2 = encodeStudent('BBBB', makeR1(), makeR2(), makeEvents());
      const parsed = service.parseResultStrings(`${s1}\n${s2}`);
      const summary = service.buildClassSummary(parsed.valid);

      expect(summary.lifePathStats.uniqueSeeds).toBe(2);
      expect(summary.lifePathStats.eventCountDistribution[2]).toBe(2);
      expect(summary.lifePathStats.avgNetBeanChange).toBe(-2); // -3 + 1 = -2 per student
    });

    it('should generate class insights', () => {
      const s1 = encodeStudent('AAAA', makeR1(), makeR2(), makeEvents());
      const parsed = service.parseResultStrings(s1);
      const summary = service.buildClassSummary(parsed.valid);

      expect(summary.insights.length).toBeGreaterThan(0);
    });

    it('should handle single student', () => {
      const s1 = encodeStudent('AAAA', makeR1(), makeR2(), []);
      const parsed = service.parseResultStrings(s1);
      const summary = service.buildClassSummary(parsed.valid);

      expect(summary.studentCount).toBe(1);
      expect(summary.eventImpact).toHaveLength(0);
    });

    it('should calculate option distribution percentages', () => {
      const r1Alt = { ...makeR1(), 'housing': 'housing-2' };
      const r2Alt = { ...makeR2(), 'housing': 'housing-1' };
      const s1 = encodeStudent('AAAA', makeR1(), makeR2(), []);
      const s2 = encodeStudent('BBBB', r1Alt, r2Alt, []);
      const parsed = service.parseResultStrings(`${s1}\n${s2}`);
      const summary = service.buildClassSummary(parsed.valid);

      const housing = summary.round1Distribution.find((d) => d.categoryId === 'housing');
      expect(housing).toBeDefined();
      // One chose housing-3, one chose housing-2
      const tier3 = housing!.optionBreakdown.find((o) => o.optionId === 'housing-3');
      const tier2 = housing!.optionBreakdown.find((o) => o.optionId === 'housing-2');
      expect(tier3!.count).toBe(1);
      expect(tier3!.percentage).toBe(50);
      expect(tier2!.count).toBe(1);
      expect(tier2!.percentage).toBe(50);
    });
  });

  describe('formatClassSummaryText', () => {
    it('should produce formatted text summary', () => {
      const s1 = encodeStudent('AAAA', makeR1(), makeR2(), makeEvents());
      const parsed = service.parseResultStrings(s1);
      const summary = service.buildClassSummary(parsed.valid);
      const text = service.formatClassSummaryText(summary);

      expect(text).toContain('CLASS BEAN GAME SUMMARY');
      expect(text).toContain('1 students');
      expect(text).toContain('MOST CUT CATEGORIES');
    });
  });
});

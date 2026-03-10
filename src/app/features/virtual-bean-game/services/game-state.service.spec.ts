import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';
import { AllocationService } from './allocation.service';
import { EventService } from './event.service';
import { PrngService } from './prng.service';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameStateService, AllocationService, EventService, PrngService],
    });
    service = TestBed.inject(GameStateService);
  });

  /** Fill all required categories at cheapest + some optional to hit target budget */
  function allocateMinRequired(): void {
    service.updateAllocation('housing', 'housing-1');        // 2
    service.updateAllocation('food', 'food-1');              // 2
    service.updateAllocation('insurance-auto', 'ins-auto-0'); // 0
    service.updateAllocation('insurance-health', 'ins-health-0'); // 0
    service.updateAllocation('insurance-property', 'ins-property-0'); // 0
    service.updateAllocation('clothing-clothes', 'clothes-0'); // 0
    service.updateAllocation('clothing-laundry', 'laundry-0'); // 0
    service.updateAllocation('transportation', 'transport-1'); // 0
    service.updateAllocation('furnishings', 'furnish-0');     // 0
  }

  /** Allocate exactly 20 beans (all required filled) */
  function allocate20(): void {
    service.updateAllocation('housing', 'housing-3');              // 4
    service.updateAllocation('food', 'food-1');                    // 2
    service.updateAllocation('insurance-auto', 'ins-auto-1');      // 2
    service.updateAllocation('insurance-health', 'ins-health-1');  // 2
    service.updateAllocation('insurance-property', 'ins-property-1'); // 1
    service.updateAllocation('clothing-clothes', 'clothes-1');     // 1
    service.updateAllocation('clothing-laundry', 'laundry-1');     // 1
    service.updateAllocation('transportation', 'transport-4');     // 3
    service.updateAllocation('furnishings', 'furnish-1');          // 1
    service.updateAllocation('communication-phone', 'comm-phone-1'); // 1
    service.updateAllocation('communication-wifi', 'comm-wifi-0'); // 0
    service.updateAllocation('personal-care', 'pcare-1');          // 1
    service.updateAllocation('savings', 'savings-1');              // 1
  }

  /** Allocate exactly 13 beans (all required filled) */
  function allocate13(): void {
    service.updateAllocation('housing', 'housing-2');              // 3
    service.updateAllocation('food', 'food-1');                    // 2
    service.updateAllocation('insurance-auto', 'ins-auto-0');      // 0
    service.updateAllocation('insurance-health', 'ins-health-1');  // 2
    service.updateAllocation('insurance-property', 'ins-property-0'); // 0
    service.updateAllocation('clothing-clothes', 'clothes-1');     // 1
    service.updateAllocation('clothing-laundry', 'laundry-0');     // 0
    service.updateAllocation('transportation', 'transport-2');     // 1
    service.updateAllocation('furnishings', 'furnish-1');          // 1
    service.updateAllocation('communication-phone', 'comm-phone-1'); // 1
    service.updateAllocation('communication-wifi', 'comm-wifi-0'); // 0
    service.updateAllocation('personal-care', 'pcare-1');          // 1
    service.updateAllocation('savings', 'savings-1');              // 1
  }

  // ─── Initialization ────────────────────────────────

  describe('initGame', () => {
    it('should initialize with start phase', () => {
      service.initGame();
      expect(service.phase()).toBe('start');
      expect(service.totalBeans()).toBe(20);
    });

    it('should accept custom config', () => {
      service.initGame({ seed: 'XKQM', eventCount: 5 });
      expect(service.seed()).toBe('XKQM');
      expect(service.config().eventCount).toBe(5);
    });
  });

  // ─── Full Transition Flow ──────────────────────────

  describe('full game flow', () => {
    it('should transition start -> round1 -> round2 -> round3 -> report', () => {
      service.initGame({ seed: 'TEST' });
      expect(service.phase()).toBe('start');

      // Start round 1
      service.startRound1();
      expect(service.phase()).toBe('round1');
      expect(service.totalBeans()).toBe(20);

      // Allocate and submit round 1
      allocate20();
      expect(service.beansRemaining()).toBe(0);
      expect(service.validationResult().valid).toBe(true);
      const r1ok = service.submitRound1();
      expect(r1ok).toBe(true);
      expect(service.phase()).toBe('round2');
      expect(service.totalBeans()).toBe(13);
      expect(service.round1Snapshot()).not.toBeNull();

      // Reallocate for round 2
      allocate13();
      expect(service.beansRemaining()).toBe(0);
      const r2ok = service.submitRound2();
      expect(r2ok).toBe(true);
      expect(service.phase()).toBe('round3');
      expect(service.round2Snapshot()).not.toBeNull();
      expect(service.events().length).toBeGreaterThanOrEqual(3);
      expect(service.seed()).toBe('TEST');

      // Resolve all events
      const eventCount = service.events().length;
      for (let i = 0; i < eventCount; i++) {
        expect(service.currentEvent()).not.toBeNull();
        const result = service.resolveCurrentEvent();
        expect(result).not.toBeNull();
        service.advanceToNextEvent();
      }

      expect(service.phase()).toBe('report');
      expect(service.eventResults().length).toBe(eventCount);
    });
  });

  // ─── Validation Guards ─────────────────────────────

  describe('validation guards', () => {
    it('should block round 1 submission when over budget', () => {
      service.initGame();
      service.startRound1();

      allocate20();
      // Push over budget
      service.updateAllocation('savings', 'savings-2'); // +1 bean
      expect(service.beansRemaining()).toBeLessThan(0);
      expect(service.submitRound1()).toBe(false);
      expect(service.phase()).toBe('round1');
    });

    it('should block round 1 submission with missing required', () => {
      service.initGame();
      service.startRound1();

      // Only fill some required categories
      service.updateAllocation('housing', 'housing-1');
      service.updateAllocation('food', 'food-1');
      // Missing transportation, clothing, etc.

      expect(service.submitRound1()).toBe(false);
      expect(service.phase()).toBe('round1');
    });

    it('should ignore startRound1 when not in start phase', () => {
      service.initGame();
      service.startRound1();
      allocate20();
      service.submitRound1();

      // Try starting round 1 again while in round 2
      service.startRound1();
      expect(service.phase()).toBe('round2');
    });

    it('should ignore allocation updates in start phase', () => {
      service.initGame();
      service.updateAllocation('housing', 'housing-3');
      expect(service.allocations()['housing']).toBeUndefined();
    });
  });

  // ─── Budget Changes ────────────────────────────────

  describe('budget changes', () => {
    it('should reduce budget to 13 after round 1 submission', () => {
      service.initGame();
      service.startRound1();
      allocate20();
      service.submitRound1();
      expect(service.totalBeans()).toBe(13);
    });

    it('should track bean changes during round 3 events', () => {
      service.initGame({ seed: 'BEAN', eventCount: 3 });
      service.startRound1();
      allocate20();
      service.submitRound1();
      allocate13();
      service.submitRound2();

      const initialBeans = service.totalBeans();
      let totalDelta = 0;

      for (let i = 0; i < service.events().length; i++) {
        const result = service.resolveCurrentEvent()!;
        totalDelta += result.beansChanged;
        service.advanceToNextEvent();
      }

      expect(service.totalBeans()).toBe(initialBeans + totalDelta);
    });
  });

  // ─── Dependency Cascade ────────────────────────────

  describe('dependency cascade during allocation', () => {
    it('should auto-reset auto insurance when switching to walk/bike', () => {
      service.initGame();
      service.startRound1();

      service.updateAllocation('transportation', 'transport-4');
      service.updateAllocation('insurance-auto', 'ins-auto-1');
      expect(service.allocations()['insurance-auto']).toBe('ins-auto-1');

      // Switch to walking
      service.updateAllocation('transportation', 'transport-1');
      expect(service.allocations()['insurance-auto']).toBe('ins-auto-0');
    });
  });

  // ─── Replay ────────────────────────────────────────

  describe('replay', () => {
    function playFullGame(seed: string): string[] {
      service.initGame({ seed, eventCount: 4 });
      service.startRound1();
      allocate20();
      service.submitRound1();
      allocate13();
      service.submitRound2();

      const eventIds: string[] = [];
      for (let i = 0; i < service.events().length; i++) {
        eventIds.push(service.currentEvent()!.id);
        service.resolveCurrentEvent();
        service.advanceToNextEvent();
      }
      return eventIds;
    }

    it('should produce same events on replay with same seed', () => {
      const eventIds1 = playFullGame('REPL');

      // Replay with same seed
      service.startReplay(true);
      expect(service.isReplay()).toBe(true);
      expect(service.previousRunFinal()).not.toBeNull();

      service.startRound1();
      allocate20();
      service.submitRound1();
      allocate13();
      service.submitRound2();

      const eventIds2 = service.events().map((e) => e.id);
      expect(eventIds2).toEqual(eventIds1);
    });

    it('should produce different events on replay with new seed', () => {
      const eventIds1 = playFullGame('ORIG');

      service.startReplay(false);
      expect(service.isReplay()).toBe(true);
      expect(service.seed()).not.toBe('ORIG');
    });
  });

  // ─── Round 3 disabled ──────────────────────────────

  describe('round 3 disabled', () => {
    it('should skip to report when round3 is disabled', () => {
      service.initGame({ round3Enabled: false });
      service.startRound1();
      allocate20();
      service.submitRound1();
      allocate13();
      service.submitRound2();

      expect(service.phase()).toBe('report');
      expect(service.events().length).toBe(0);
    });
  });
});

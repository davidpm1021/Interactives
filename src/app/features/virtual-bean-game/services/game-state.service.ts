import { computed, Injectable, signal } from '@angular/core';
import {
  type Allocations,
  type AllocationDiff,
  type EventResult,
  type GameConfig,
  type GameEvent,
  type GamePhase,
  type ValidationResult,
} from '../models/game.models';
import { CATEGORIES } from '../data/categories';
import { AllocationService } from './allocation.service';
import { EventService } from './event.service';
import { PrngService } from './prng.service';

const ROUND1_BEANS = 20;
const ROUND2_BEANS = 13;

const DEFAULT_CONFIG: GameConfig = {
  round3Enabled: true,
  eventCount: 'random',
  difficulty: 'balanced',
  seed: null,
  allowReplay: true,
};

@Injectable()
export class GameStateService {
  private readonly _phase = signal<GamePhase>('start');
  private readonly _totalBeans = signal(ROUND1_BEANS);
  private readonly _allocations = signal<Allocations>({});
  private readonly _round1Snapshot = signal<Allocations | null>(null);
  private readonly _round2Snapshot = signal<Allocations | null>(null);
  private readonly _seed = signal('');
  private readonly _events = signal<readonly GameEvent[]>([]);
  private readonly _eventResults = signal<readonly EventResult[]>([]);
  private readonly _eventIndex = signal(0);
  private readonly _isReplay = signal(false);
  private readonly _previousRunFinal = signal<Allocations | null>(null);
  private readonly _config = signal<GameConfig>(DEFAULT_CONFIG);

  // ─── Public readonly signals ───────────────────────

  readonly phase = this._phase.asReadonly();
  readonly totalBeans = this._totalBeans.asReadonly();
  readonly allocations = this._allocations.asReadonly();
  readonly round1Snapshot = this._round1Snapshot.asReadonly();
  readonly round2Snapshot = this._round2Snapshot.asReadonly();
  readonly seed = this._seed.asReadonly();
  readonly events = this._events.asReadonly();
  readonly eventResults = this._eventResults.asReadonly();
  readonly eventIndex = this._eventIndex.asReadonly();
  readonly isReplay = this._isReplay.asReadonly();
  readonly previousRunFinal = this._previousRunFinal.asReadonly();
  readonly config = this._config.asReadonly();

  // ─── Computed signals ──────────────────────────────

  readonly beansRemaining = computed(() =>
    this.allocationService.getBeansRemaining(
      this._allocations(),
      this._totalBeans(),
      CATEGORIES,
    ),
  );

  readonly validationResult = computed<ValidationResult>(() =>
    this.allocationService.validateAllocation(
      this._allocations(),
      this._totalBeans(),
      CATEGORIES,
    ),
  );

  readonly currentEvent = computed<GameEvent | null>(() => {
    const events = this._events();
    const idx = this._eventIndex();
    return idx < events.length ? events[idx] : null;
  });

  readonly allocationDiff = computed<readonly AllocationDiff[]>(() => {
    const r1 = this._round1Snapshot();
    const r2 = this._round2Snapshot();
    if (!r1) return [];
    const current = r2 ?? this._allocations();
    return this.allocationService.getAllocationDiff(r1, current, CATEGORIES);
  });

  readonly minRequiredBeans = computed(() =>
    this.allocationService.calculateMinRequiredBeans(CATEGORIES),
  );

  constructor(
    private readonly allocationService: AllocationService,
    private readonly eventService: EventService,
    private readonly prngService: PrngService,
  ) {}

  // ─── State transitions ─────────────────────────────

  /** Initialize game with optional config from URL params */
  initGame(config?: Partial<GameConfig>): void {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    this._config.set(mergedConfig);
    this._phase.set('start');
    this._totalBeans.set(ROUND1_BEANS);
    this._allocations.set({});
    this._round1Snapshot.set(null);
    this._round2Snapshot.set(null);
    this._events.set([]);
    this._eventResults.set([]);
    this._eventIndex.set(0);
    this._seed.set(mergedConfig.seed ?? '');
  }

  /** Transition from start to round 1 */
  startRound1(): void {
    if (this._phase() !== 'start') return;
    this._totalBeans.set(ROUND1_BEANS);
    this._allocations.set({});
    this._phase.set('round1');
  }

  /** Update a single allocation slot */
  updateAllocation(slotId: string, optionId: string): void {
    const phase = this._phase();
    if (phase !== 'round1' && phase !== 'round2' && phase !== 'round3') return;

    this._allocations.update((alloc) => {
      const updated = { ...alloc, [slotId]: optionId };
      return this.allocationService.applyDependencyCascade(updated, CATEGORIES);
    });
  }

  /** Submit round 1 allocation */
  submitRound1(): boolean {
    if (this._phase() !== 'round1') return false;
    const validation = this.validationResult();
    if (!validation.valid) return false;

    this._round1Snapshot.set({ ...this._allocations() });
    this._totalBeans.set(ROUND2_BEANS);
    this._phase.set('round2');
    return true;
  }

  /** Submit round 2 allocation */
  submitRound2(): boolean {
    if (this._phase() !== 'round2') return false;
    const validation = this.validationResult();
    if (!validation.valid) return false;

    this._round2Snapshot.set({ ...this._allocations() });

    if (!this._config().round3Enabled) {
      this._phase.set('report');
      return true;
    }

    // Generate seed and life path
    const seed = this._seed() || this.prngService.generateSeed();
    this._seed.set(seed);
    const rng = this.prngService.create(seed);
    const events = this.eventService.generateLifePath(
      rng,
      this._config(),
      this._allocations(),
      CATEGORIES,
    );
    this._events.set(events);
    this._eventIndex.set(0);
    this._eventResults.set([]);
    this._phase.set('round3');
    return true;
  }

  /** Resolve the current event in round 3 */
  resolveCurrentEvent(): EventResult | null {
    if (this._phase() !== 'round3') return null;
    const event = this.currentEvent();
    if (!event) return null;

    const result = this.eventService.resolveEvent(
      event,
      this._allocations(),
      this._totalBeans(),
      this.minRequiredBeans(),
      CATEGORIES,
    );

    // Apply bean change
    this._totalBeans.update((beans) => beans + result.beansChanged);
    this._eventResults.update((results) => [...results, result]);

    return result;
  }

  /** Advance to the next event or to report phase */
  advanceToNextEvent(): void {
    if (this._phase() !== 'round3') return;
    const nextIdx = this._eventIndex() + 1;
    if (nextIdx >= this._events().length) {
      this._phase.set('report');
    } else {
      this._eventIndex.set(nextIdx);
    }
  }

  /** Start a replay with the same seed (same life path, fresh allocations) */
  startReplay(sameSeed: boolean): void {
    const currentFinal = { ...this._allocations() };
    const previousSeed = this._seed();

    this._previousRunFinal.set(currentFinal);
    this._isReplay.set(true);

    const config = this._config();
    if (sameSeed) {
      this.initGame({ ...config, seed: previousSeed });
    } else {
      this.initGame({ ...config, seed: null });
    }
    this._isReplay.set(true);
    this._previousRunFinal.set(currentFinal);
  }
}

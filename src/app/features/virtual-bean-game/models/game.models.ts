/** Phases the game progresses through */
export type GamePhase =
  | 'start'
  | 'round1'
  | 'round1-review'
  | 'round2'
  | 'round2-review'
  | 'round3'
  | 'report';

/** Configuration for a single selectable option within a category or sub-category */
export interface CategoryOption {
  readonly id: string;
  readonly label: string;
  readonly beans: number;
}

/** Rule linking one option's availability to another category's selection */
export interface DependencyRule {
  /** The category whose selection triggers this rule */
  readonly dependsOnCategory: string;
  /** If the dependent category's selected option has this ID, apply the rule */
  readonly dependsOnOptionId: string;
  /** What happens: 'require' forces this option, 'prohibit' disables it */
  readonly effect: 'require' | 'prohibit';
  /** Message shown to the user when this rule fires */
  readonly message: string;
}

/** A sub-category within a parent category (e.g., Auto Insurance under Insurance) */
export interface SubCategoryConfig {
  readonly id: string;
  readonly name: string;
  readonly options: readonly CategoryOption[];
  readonly dependencies?: readonly DependencyRule[];
}

/** Top-level category configuration */
export interface CategoryConfig {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly required: boolean;
  readonly multiSelect: boolean;
  readonly options: readonly CategoryOption[] | null;
  readonly subCategories: readonly SubCategoryConfig[] | null;
  readonly dependencies?: readonly DependencyRule[];
}

/** Map of option IDs to selected state. For single-select: one option ID per category/sub-category. For multi-select: multiple option IDs can be true. */
export type Allocations = Record<string, string | string[]>;

/** Event types in the Life Happens pool */
export type EventType = 'setback' | 'forced-choice' | 'advantage';

/** Condition checking whether a student has or lacks a particular option */
export interface EventCondition {
  /** Type of condition check */
  readonly type: 'has-option' | 'has-car' | 'has-phone' | 'has-savings' | 'housing-type' | 'clothing-level';
  /** Option or category ID to check */
  readonly check: string;
  /** Result when condition is met */
  readonly met: EventConditionResult;
  /** Result when condition is not met */
  readonly notMet: EventConditionResult;
}

/** What happens when an event condition is met or not met */
export interface EventConditionResult {
  readonly text: string;
  readonly beans: number;
  /** If set, player must choose which categories to remove beans from */
  readonly playerChoice?: boolean;
  /** Categories that cannot be chosen for bean removal */
  readonly protectedCategories?: readonly string[];
  /** If set, force a specific option in a category */
  readonly forceOption?: { readonly categoryId: string; readonly optionId: string };
}

/** A single event in the Life Happens pool */
export interface GameEvent {
  readonly id: string;
  readonly type: EventType;
  readonly title: string;
  readonly narrative: string;
  /** Category this event primarily targets (for no-duplicate-category draw rule) */
  readonly targetCategory: string | null;
  readonly condition: EventCondition | null;
  /** Consequence when there is no condition (unconditional events) */
  readonly consequence: EventConditionResult | null;
}

/** Result of resolving a single event against the student's allocation */
export interface EventResult {
  readonly eventId: string;
  readonly conditionMet: boolean | null;
  readonly beansChanged: number;
  readonly hardFloorApplied: boolean;
  readonly resolutionText: string;
  /** Whether this event requires the player to choose where beans are added/removed */
  readonly playerChoice: boolean;
  /** Categories protected from player choice (cannot remove beans from) */
  readonly protectedCategories: readonly string[];
  /** For player-choice events, which categories beans were removed from */
  readonly removedFrom?: readonly string[];
}

/** Teacher-configurable game options, read from URL params */
export interface GameConfig {
  readonly round3Enabled: boolean;
  readonly eventCount: number | 'random';
  readonly difficulty: 'easy' | 'balanced' | 'tough';
  readonly seed: string | null;
  readonly allowReplay: boolean;
}

/** Result of validating the current allocation */
export interface ValidationResult {
  readonly valid: boolean;
  readonly totalBeans: number;
  readonly budgetRemaining: number;
  readonly overBudget: boolean;
  readonly missingRequired: readonly string[];
  readonly dependencyConflicts: readonly string[];
}

/** Diff between two allocation snapshots */
export interface AllocationDiff {
  readonly categoryId: string;
  readonly categoryName: string;
  readonly subCategoryId?: string;
  readonly subCategoryName?: string;
  readonly previousOptionId: string | null;
  readonly previousLabel: string;
  readonly previousBeans: number;
  readonly currentOptionId: string | null;
  readonly currentLabel: string;
  readonly currentBeans: number;
  readonly beanDelta: number;
  readonly changeType: 'upgraded' | 'downgraded' | 'dropped' | 'added' | 'unchanged';
}

/** Full game state managed by GameStateService */
export interface GameState {
  readonly phase: GamePhase;
  readonly totalBeans: number;
  readonly allocations: Allocations;
  readonly round1Snapshot: Allocations | null;
  readonly round2Snapshot: Allocations | null;
  readonly lifePathSeed: string;
  readonly events: readonly GameEvent[];
  readonly eventResults: readonly EventResult[];
  readonly eventIndex: number;
  readonly isReplay: boolean;
  readonly previousRunFinal: Allocations | null;
  readonly config: GameConfig;
}

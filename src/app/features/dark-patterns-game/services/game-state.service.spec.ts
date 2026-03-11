import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';
import { CHALLENGES, ACTS, getChallengesByAct } from '../data/challenges';
import { GLOSSARY } from '../data/glossary';
import { SCORE_TIERS } from '../models/game-state.model';
import { ChallengeOutcome, DarkPatternKey } from '../models/challenge.model';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameStateService],
    });
    service = TestBed.inject(GameStateService);
  });

  // --- Initial State ---

  it('should start in intro phase', () => {
    expect(service.phase()).toBe('intro');
  });

  it('should start with no results', () => {
    expect(service.results()).toEqual([]);
    expect(service.totalFinancialDamage()).toBe(0);
    expect(service.passCount()).toBe(0);
  });

  it('should start with no discovered patterns', () => {
    expect(service.discoveredPatterns().size).toBe(0);
  });

  it('should start with no completed challenges', () => {
    expect(service.completedChallengeIds().size).toBe(0);
  });

  it('should start with no active challenge', () => {
    expect(service.activeChallengeId()).toBeNull();
    expect(service.currentChallenge()).toBeUndefined();
  });

  // --- Game Start ---

  it('should transition to hub when game starts', () => {
    service.startGame();
    expect(service.phase()).toBe('hub');
  });

  it('should reset state on startGame', () => {
    service.startGame();
    service.startChallenge('1-1');
    service.submitResult('full-fail');

    service.startGame();
    expect(service.phase()).toBe('hub');
    expect(service.completedChallengeIds().size).toBe(0);
    expect(service.activeChallengeId()).toBeNull();
    expect(service.results()).toEqual([]);
    expect(service.discoveredPatterns().size).toBe(0);
  });

  // --- Non-linear Challenge Selection ---

  it('should transition hub → challenge on startChallenge', () => {
    service.startGame();
    service.startChallenge('1-1');
    expect(service.phase()).toBe('challenge');
    expect(service.activeChallengeId()).toBe('1-1');
    expect(service.currentChallenge()!.id).toBe('1-1');
  });

  it('should allow selecting any challenge in any order', () => {
    service.startGame();

    service.startChallenge('3-2');
    expect(service.activeChallengeId()).toBe('3-2');
    expect(service.currentChallenge()!.id).toBe('3-2');
  });

  it('should reject starting a completed challenge', () => {
    service.startGame();
    service.startChallenge('1-1');
    service.submitResult('pass');

    expect(service.phase()).toBe('hub');
    service.startChallenge('1-1');
    // Should remain on hub, not start the challenge
    expect(service.phase()).toBe('hub');
    expect(service.activeChallengeId()).toBeNull();
  });

  it('should reject starting an invalid challenge ID', () => {
    service.startGame();
    service.startChallenge('invalid-id');
    expect(service.phase()).toBe('hub');
    expect(service.activeChallengeId()).toBeNull();
  });

  // --- Submit Result ---

  it('should transition challenge → hub on submitResult when not all complete', () => {
    service.startGame();
    service.startChallenge('1-1');
    service.submitResult('pass');
    expect(service.phase()).toBe('hub');
    expect(service.activeChallengeId()).toBeNull();
  });

  it('should transition challenge → summary when all challenges complete', () => {
    service.startGame();

    for (const challenge of CHALLENGES) {
      service.startChallenge(challenge.id);
      service.submitResult('pass');
    }

    expect(service.phase()).toBe('summary');
  });

  it('should mark challenge as completed after submitResult', () => {
    service.startGame();
    service.startChallenge('2-1');
    service.submitResult('pass');
    expect(service.completedChallengeIds().has('2-1')).toBe(true);
  });

  it('should not submit result when not in challenge phase', () => {
    service.startGame(); // hub phase
    const prevCount = service.results().length;
    service.submitResult('pass');
    expect(service.results().length).toBe(prevCount);
  });

  // --- All 10 Challenges Completable in Any Order ---

  it('should allow completing all 10 challenges in reverse order', () => {
    service.startGame();

    const reversed = [...CHALLENGES].reverse();
    for (const challenge of reversed) {
      service.startChallenge(challenge.id);
      service.submitResult('pass');
    }

    expect(service.phase()).toBe('summary');
    expect(service.results()).toHaveLength(10);
    expect(service.completedChallengeIds().size).toBe(10);
  });

  it('should allow completing challenges in a shuffled order', () => {
    service.startGame();

    const shuffled = ['4-2', '1-3', '2-1', '3-1', '1-1', '2-3', '4-1', '3-2', '1-2', '2-2'];
    for (const id of shuffled) {
      service.startChallenge(id);
      service.submitResult('pass');
    }

    expect(service.phase()).toBe('summary');
    expect(service.results()).toHaveLength(10);
  });

  // --- Results Tracking ---

  it('should record a pass result with zero financial damage', () => {
    service.startGame();
    service.startChallenge('1-1');
    service.submitResult('pass');

    const results = service.results();
    expect(results).toHaveLength(1);
    expect(results[0].outcome).toBe('pass');
    expect(results[0].financialDamage).toBe(0);
    expect(results[0].challengeId).toBe('1-1');
  });

  it('should record a full-fail result with financial impact', () => {
    service.startGame();
    service.startChallenge('1-1');
    service.submitResult('full-fail');

    const results = service.results();
    expect(results[0].outcome).toBe('full-fail');
    expect(results[0].financialDamage).toBe(100); // Challenge 1-1 impact
  });

  it('should record a partial-fail result with financial impact', () => {
    service.startGame();
    service.startChallenge('1-2');
    service.submitResult('partial-fail');

    const results = service.results();
    expect(results[0].outcome).toBe('partial-fail');
    expect(results[0].financialDamage).toBe(0); // Challenge 1-2 has $0 impact
  });

  it('should accumulate financial damage across challenges', () => {
    service.startGame();

    // Fail challenge 1-1 ($100)
    service.startChallenge('1-1');
    service.submitResult('full-fail');

    // Pass challenge 1-2 ($0)
    service.startChallenge('1-2');
    service.submitResult('pass');

    // Fail challenge 2-2 ($11.98)
    service.startChallenge('2-2');
    service.submitResult('full-fail');

    expect(service.totalFinancialDamage()).toBeCloseTo(111.98, 2);
  });

  // --- Pass Count ---

  it('should count passes correctly', () => {
    service.startGame();

    service.startChallenge('1-1');
    service.submitResult('pass');

    service.startChallenge('1-2');
    service.submitResult('full-fail');

    service.startChallenge('1-3');
    service.submitResult('pass');

    expect(service.passCount()).toBe(2);
  });

  it('should not count partial-fail as pass', () => {
    service.startGame();
    service.startChallenge('1-1');
    service.submitResult('partial-fail');
    expect(service.passCount()).toBe(0);
  });

  // --- Pattern Discovery ---

  it('should discover patterns from submitted challenges', () => {
    service.startGame();
    service.startChallenge('1-1');
    service.submitResult('pass');

    expect(service.isPatternDiscovered('confirmshaming')).toBe(true);
    expect(service.discoveredPatterns().size).toBe(1);
  });

  it('should discover multiple patterns from a single challenge', () => {
    service.startGame();
    service.startChallenge('1-2');
    service.submitResult('pass');

    expect(service.isPatternDiscovered('misdirection')).toBe(true);
    expect(service.isPatternDiscovered('preselection')).toBe(true);
  });

  it('should not duplicate patterns already discovered', () => {
    service.startGame();

    // Challenge 1-2 discovers 'preselection'
    service.startChallenge('1-2');
    service.submitResult('pass');

    // Challenge 1-3 also has 'preselection'
    service.startChallenge('1-3');
    service.submitResult('pass');

    // Should have: misdirection, preselection (no duplication)
    expect(service.discoveredPatterns().size).toBe(2);
  });

  it('should discover patterns even on fail', () => {
    service.startGame();
    service.startChallenge('1-1');
    service.submitResult('full-fail');

    expect(service.isPatternDiscovered('confirmshaming')).toBe(true);
  });

  it('should discover all 10 patterns after completing all challenges', () => {
    service.startGame();

    for (const challenge of CHALLENGES) {
      service.startChallenge(challenge.id);
      service.submitResult('pass');
    }

    expect(service.discoveredPatterns().size).toBe(10);
  });

  // --- Score Tiers ---

  it('should return "Dark Pattern Detective" for 10 passes', () => {
    service.startGame();
    for (const challenge of CHALLENGES) {
      service.startChallenge(challenge.id);
      service.submitResult('pass');
    }

    expect(service.scoreTier().title).toBe('Dark Pattern Detective');
  });

  it('should return "Easy Target" for 0 passes', () => {
    service.startGame();
    for (const challenge of CHALLENGES) {
      service.startChallenge(challenge.id);
      service.submitResult('full-fail');
    }

    expect(service.scoreTier().title).toBe('Easy Target');
  });

  it('should return "Privacy Pro" for 7 passes', () => {
    service.startGame();

    let count = 0;
    for (const challenge of CHALLENGES) {
      service.startChallenge(challenge.id);
      service.submitResult(count < 7 ? 'pass' : 'full-fail');
      count++;
    }

    expect(service.passCount()).toBe(7);
    expect(service.scoreTier().title).toBe('Privacy Pro');
  });

  it('should return "Getting Wiser" for 5 passes', () => {
    service.startGame();

    let count = 0;
    for (const challenge of CHALLENGES) {
      service.startChallenge(challenge.id);
      service.submitResult(count < 5 ? 'pass' : 'full-fail');
      count++;
    }

    expect(service.passCount()).toBe(5);
    expect(service.scoreTier().title).toBe('Getting Wiser');
  });

  // --- Result Lookup ---

  it('should find result for a specific challenge', () => {
    service.startGame();
    service.startChallenge('1-1');
    service.submitResult('pass');

    expect(service.getResultForChallenge('1-1')).toBeDefined();
    expect(service.getResultForChallenge('1-1')!.outcome).toBe('pass');
  });

  it('should return undefined for challenge not yet played', () => {
    service.startGame();
    expect(service.getResultForChallenge('2-1')).toBeUndefined();
  });

  // --- Reset ---

  it('should fully reset state', () => {
    service.startGame();
    service.startChallenge('1-1');
    service.submitResult('full-fail');

    service.reset();

    expect(service.phase()).toBe('intro');
    expect(service.completedChallengeIds().size).toBe(0);
    expect(service.activeChallengeId()).toBeNull();
    expect(service.results()).toEqual([]);
    expect(service.discoveredPatterns().size).toBe(0);
    expect(service.totalFinancialDamage()).toBe(0);
    expect(service.passCount()).toBe(0);
  });

  // --- Edge Cases ---

  it('should not create a result if not in challenge phase', () => {
    service.startGame();
    for (const challenge of CHALLENGES) {
      service.startChallenge(challenge.id);
      service.submitResult('pass');
    }

    expect(service.phase()).toBe('summary');
    const prevCount = service.results().length;
    service.submitResult('pass');
    expect(service.results().length).toBe(prevCount);
  });

  it('should track patterns encountered in result', () => {
    service.startGame();
    service.startChallenge('1-1');
    service.submitResult('pass');

    const result = service.results()[0];
    expect(result.patternsEncountered).toContain('confirmshaming');
  });

  // --- Financial Damage: Full Fail Scenario ---

  it('should calculate max financial damage when failing everything', () => {
    service.startGame();

    for (const challenge of CHALLENGES) {
      service.startChallenge(challenge.id);
      service.submitResult('full-fail');
    }

    const expectedTotal = CHALLENGES.reduce((sum, c) => sum + c.financialImpact, 0);
    expect(service.totalFinancialDamage()).toBeCloseTo(expectedTotal, 2);
  });

  // --- allChallengesComplete ---

  it('should report allChallengesComplete as false when not all done', () => {
    service.startGame();
    service.startChallenge('1-1');
    service.submitResult('pass');
    expect(service.allChallengesComplete()).toBe(false);
  });

  it('should report allChallengesComplete as true when all done', () => {
    service.startGame();
    for (const challenge of CHALLENGES) {
      service.startChallenge(challenge.id);
      service.submitResult('pass');
    }
    expect(service.allChallengesComplete()).toBe(true);
  });
});

// --- Data Integrity Tests ---

describe('Challenge Data Integrity', () => {
  it('should have exactly 10 challenges', () => {
    expect(CHALLENGES).toHaveLength(10);
  });

  it('should have exactly 4 acts', () => {
    expect(ACTS).toHaveLength(4);
  });

  it('should have correct challenge distribution per act', () => {
    expect(getChallengesByAct(1)).toHaveLength(3); // Morning
    expect(getChallengesByAct(2)).toHaveLength(3); // Midday
    expect(getChallengesByAct(3)).toHaveLength(2); // Afternoon
    expect(getChallengesByAct(4)).toHaveLength(2); // Evening
  });

  it('should have unique challenge IDs', () => {
    const ids = CHALLENGES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have unique act IDs', () => {
    const ids = ACTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should reference valid act IDs in all challenges', () => {
    const actIds = new Set(ACTS.map((a) => a.id));
    for (const challenge of CHALLENGES) {
      expect(actIds.has(challenge.actId)).toBe(true);
    }
  });

  it('should have at least one dark pattern per challenge', () => {
    for (const challenge of CHALLENGES) {
      expect(challenge.darkPatterns.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have non-negative financial impacts', () => {
    for (const challenge of CHALLENGES) {
      expect(challenge.financialImpact).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have hasPartialFail=true only when partialFailConsequence is defined', () => {
    for (const challenge of CHALLENGES) {
      if (challenge.hasPartialFail) {
        expect(challenge.partialFailConsequence).toBeDefined();
      }
    }
  });

  it('should cover all 10 dark patterns across challenges', () => {
    const allPatterns = new Set<DarkPatternKey>();
    for (const challenge of CHALLENGES) {
      for (const p of challenge.darkPatterns) {
        allPatterns.add(p);
      }
    }
    expect(allPatterns.size).toBe(10);
  });

  it('should have a taskLabel for every challenge', () => {
    for (const challenge of CHALLENGES) {
      expect(challenge.taskLabel.length).toBeGreaterThan(0);
    }
  });
});

describe('Glossary Data Integrity', () => {
  it('should have exactly 10 glossary entries', () => {
    expect(GLOSSARY.size).toBe(10);
  });

  it('should have entries for all dark pattern keys used in challenges', () => {
    const allPatterns = new Set<DarkPatternKey>();
    for (const challenge of CHALLENGES) {
      for (const p of challenge.darkPatterns) {
        allPatterns.add(p);
      }
    }

    for (const key of allPatterns) {
      expect(GLOSSARY.has(key)).toBe(true);
    }
  });

  it('should have non-empty name, definition, and financialConnection for each entry', () => {
    for (const [, entry] of GLOSSARY) {
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.definition.length).toBeGreaterThan(0);
      expect(entry.financialConnection.length).toBeGreaterThan(0);
    }
  });
});

describe('Score Tiers', () => {
  it('should cover full 0-10 range without gaps', () => {
    for (let score = 0; score <= 10; score++) {
      const tier = SCORE_TIERS.find((t) => score >= t.minScore && score <= t.maxScore);
      expect(tier).toBeDefined();
    }
  });

  it('should have no overlapping ranges', () => {
    for (let i = 0; i < SCORE_TIERS.length; i++) {
      for (let j = i + 1; j < SCORE_TIERS.length; j++) {
        const a = SCORE_TIERS[i];
        const b = SCORE_TIERS[j];
        const overlaps = a.minScore <= b.maxScore && b.minScore <= a.maxScore;
        expect(overlaps).toBe(false);
      }
    }
  });
});

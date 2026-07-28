import { TestBed } from '@angular/core/testing';
import { ChallengeStateService } from './challenge-state.service';

describe('ChallengeStateService', () => {
  let service: ChallengeStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChallengeStateService],
    });
    service = TestBed.inject(ChallengeStateService);
  });

  it('should start at challenge 1, intro phase', () => {
    expect(service.currentChallenge()).toBe(1);
    expect(service.currentPhase()).toBe('intro');
    expect(service.showingIntro()).toBe(true);
    expect(service.completedChallenges().size).toBe(0);
  });

  it('should transition intro → concept on startConcept', () => {
    service.startConcept();
    expect(service.currentPhase()).toBe('concept');
    expect(service.showingIntro()).toBe(false);
    expect(service.showingConcept()).toBe(true);
  });

  it('should transition concept → predict on advanceFromConcept', () => {
    service.startConcept();
    service.advanceFromConcept();
    expect(service.currentPhase()).toBe('predict');
    expect(service.showingConcept()).toBe(false);
  });

  it('should ignore advanceFromConcept when not in concept phase', () => {
    service.advanceFromConcept();
    expect(service.currentPhase()).toBe('intro');
  });

  it('should save reflections keyed by promptId', () => {
    service.saveReflection('challenge1', 'The curve surprised me.');
    service.saveReflection('summary-1', 'Start early.');
    expect(service.reflections()['challenge1']).toBe('The curve surprised me.');
    expect(service.reflections()['summary-1']).toBe('Start early.');
  });

  it('should preserve reflections when navigating back', () => {
    service.startConcept();
    service.saveReflection('challenge1', 'thoughts');
    service.advanceFromConcept();
    service.goBack();
    // Back returns us to concept but reflections captured after startConcept
    // should still be present since they aren't pushed to history.
    expect(service.reflections()['challenge1']).toBe('thoughts');
  });

  it('should ignore submitPrediction while in intro phase', () => {
    service.submitPrediction({ challenge1Year10: 2000 });
    expect(service.currentPhase()).toBe('intro');
    expect(service.predictions().challenge1Year10).toBeUndefined();
  });

  it('should transition predict → reveal on submitPrediction', () => {
    service.startConcept();
    service.advanceFromConcept();
    service.submitPrediction({ challenge1Year10: 2000 });
    expect(service.currentPhase()).toBe('reveal');
    expect(service.predictions().challenge1Year10).toBe(2000);
  });

  it('should transition reveal → reflect on advanceToReflect', () => {
    service.startConcept();
    service.advanceFromConcept();
    service.submitPrediction({});
    service.advanceToReflect();
    expect(service.currentPhase()).toBe('reflect');
  });

  it('should advance from challenge 1 to 2', () => {
    service.startConcept();
    service.advanceFromConcept();
    service.submitPrediction({});
    service.advanceToReflect();
    service.advanceToNextChallenge();
    expect(service.currentChallenge()).toBe(2);
    expect(service.currentPhase()).toBe('predict');
    expect(service.completedChallenges().has(1)).toBe(true);
  });

  it('should advance correctly 1 → 2 → 3 → 4 → 5', () => {
    service.startConcept();
    service.advanceFromConcept();
    for (let i = 1; i <= 4; i++) {
      expect(service.currentChallenge()).toBe(i);
      service.submitPrediction({});
      service.advanceToReflect();
      service.advanceToNextChallenge();
    }
    expect(service.currentChallenge()).toBe(5);
    expect(service.completedChallenges().size).toBe(4);
  });

  it('should enter sandbox phase for challenge 5', () => {
    service.startConcept();
    service.advanceFromConcept();
    for (let i = 1; i <= 4; i++) {
      service.submitPrediction({});
      service.advanceToReflect();
      service.advanceToNextChallenge();
    }
    expect(service.currentPhase()).toBe('sandbox');
  });

  it('should not skip phases (predict must come before reveal)', () => {
    service.startConcept();
    service.advanceFromConcept();
    service.advanceToReflect(); // should be no-op in predict
    expect(service.currentPhase()).toBe('predict');
  });

  it('should not advance to next challenge from predict phase', () => {
    service.startConcept();
    service.advanceFromConcept();
    service.advanceToNextChallenge(); // should be no-op
    expect(service.currentChallenge()).toBe(1);
  });

  it('should transition sandbox → summary on finishSandbox', () => {
    service.startConcept();
    service.advanceFromConcept();
    for (let i = 1; i <= 4; i++) {
      service.submitPrediction({});
      service.advanceToReflect();
      service.advanceToNextChallenge();
    }
    service.finishSandbox();
    expect(service.showingSummary()).toBe(true);
    expect(service.completedChallenges().has(5)).toBe(true);
  });

  it('should not finishSandbox when not on challenge 5', () => {
    service.finishSandbox();
    expect(service.showingSummary()).toBe(false);
  });

  it('should merge predictions across challenges', () => {
    service.startConcept();
    service.advanceFromConcept();
    service.submitPrediction({ challenge1Year10: 1500, challenge1Year40: 5000 });
    service.advanceToReflect();
    service.advanceToNextChallenge();
    service.submitPrediction({ challenge2RateGuess: 'B' });

    const p = service.predictions();
    expect(p.challenge1Year10).toBe(1500);
    expect(p.challenge1Year40).toBe(5000);
    expect(p.challenge2RateGuess).toBe('B');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryScreen } from './summary-screen/summary-screen';
import { ChallengeResult, DarkPatternKey } from '../models/challenge.model';
import { SCORE_TIERS } from '../models/game-state.model';
import { GLOSSARY } from '../data/glossary';

function makeResult(
  challengeId: string,
  outcome: 'pass' | 'partial-fail' | 'full-fail',
  damage: number,
  patterns: DarkPatternKey[],
): ChallengeResult {
  return { challengeId, outcome, financialDamage: damage, patternsEncountered: patterns };
}

describe('SummaryScreen', () => {
  let fixture: ComponentFixture<SummaryScreen>;

  function createWithInputs(overrides: {
    results?: ChallengeResult[];
    passCount?: number;
    totalDamage?: number;
  } = {}): void {
    fixture = TestBed.createComponent(SummaryScreen);

    const results = overrides.results ?? [
      makeResult('1-1', 'pass', 0, ['confirmshaming']),
      makeResult('1-2', 'full-fail', 0, ['misdirection', 'preselection']),
      makeResult('2-2', 'full-fail', 11.98, ['hidden-costs', 'preselection']),
      makeResult('2-3', 'full-fail', 155.88, ['hidden-subscription', 'forced-continuity']),
    ];

    fixture.componentRef.setInput('results', results);
    fixture.componentRef.setInput('passCount', overrides.passCount ?? 1);
    fixture.componentRef.setInput('totalChallenges', 10);
    fixture.componentRef.setInput('totalDamage', overrides.totalDamage ?? 167.86);
    fixture.componentRef.setInput('scoreTier', SCORE_TIERS[3]); // Easy Target
    fixture.componentRef.setInput('discoveredPatterns', new Set<DarkPatternKey>([
      'confirmshaming', 'misdirection', 'preselection', 'hidden-costs',
      'hidden-subscription', 'forced-continuity',
    ]));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryScreen],
    }).compileComponents();
  });

  it('should create', () => {
    createWithInputs();
    expect(fixture.componentInstance).toBeTruthy();
  });

  // --- Multi-step reveal flow ---

  it('should start on "done" step', () => {
    createWithInputs();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('All Done');
  });

  it('should advance to "wait" step on continue', () => {
    createWithInputs();
    const btn = fixture.nativeElement.querySelector('.summary__continue-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Wait...');
    expect(el.textContent).toContain('closer look');
  });

  it('should advance to "receipt" step', () => {
    createWithInputs();

    // done → wait
    clickContinue();
    // wait → receipt
    clickContinue();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Your Receipt');
  });

  it('should display financial damage on receipt step', () => {
    createWithInputs();
    clickContinue(); // → wait
    clickContinue(); // → receipt

    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.summary__damage-item');
    expect(items.length).toBe(2); // Only items with damage > 0
    expect(el.textContent).toContain('$167.86');
  });

  it('should show "no damage" on receipt step when all passed', () => {
    createWithInputs({
      results: [makeResult('1-1', 'pass', 0, ['confirmshaming'])],
      passCount: 1,
      totalDamage: 0,
    });
    clickContinue(); // → wait
    clickContinue(); // → receipt

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.summary__no-damage')).toBeTruthy();
  });

  it('should advance to "reveal" step with dark patterns explanation', () => {
    createWithInputs();
    clickContinue(); // → wait
    clickContinue(); // → receipt
    clickContinue(); // → reveal

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('What Just Happened');
    expect(el.textContent).toContain('dark pattern');
  });

  it('should display score on reveal step', () => {
    createWithInputs();
    clickContinue(); // → wait
    clickContinue(); // → receipt
    clickContinue(); // → reveal

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.summary__score-number')?.textContent?.trim()).toBe('1');
    expect(el.textContent).toContain('of 10');
    expect(el.textContent).toContain('Easy Target');
  });

  it('should display all glossary entries on reveal step', () => {
    createWithInputs();
    clickContinue(); // → wait
    clickContinue(); // → receipt
    clickContinue(); // → reveal

    const cards = fixture.nativeElement.querySelectorAll('.summary__glossary-card');
    expect(cards.length).toBe(GLOSSARY.size);
  });

  it('should mark tripped patterns with badge on reveal step', () => {
    createWithInputs();
    clickContinue(); // → wait
    clickContinue(); // → receipt
    clickContinue(); // → reveal

    const trippedBadges = fixture.nativeElement.querySelectorAll('.summary__glossary-badge--tripped');
    expect(trippedBadges.length).toBeGreaterThan(0);
  });

  it('should mark spotted patterns with badge on reveal step', () => {
    createWithInputs();
    clickContinue(); // → wait
    clickContinue(); // → receipt
    clickContinue(); // → reveal

    const spottedBadges = fixture.nativeElement.querySelectorAll('.summary__glossary-badge--spotted');
    expect(spottedBadges.length).toBeGreaterThan(0);
  });

  it('should advance to "tips" step with tips and play again', () => {
    createWithInputs();
    clickContinue(); // → wait
    clickContinue(); // → receipt
    clickContinue(); // → reveal
    clickContinue(); // → tips

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Protect Yourself');
    const tips = el.querySelectorAll('.summary__tips-list li');
    expect(tips.length).toBe(6);
  });

  it('should have a Play Again button on tips step', () => {
    createWithInputs();
    clickContinue(); // → wait
    clickContinue(); // → receipt
    clickContinue(); // → reveal
    clickContinue(); // → tips

    const btn = fixture.nativeElement.querySelector('.summary__play-again-btn');
    expect(btn).toBeTruthy();
  });

  it('should emit playAgain on button click', () => {
    createWithInputs();
    clickContinue(); // → wait
    clickContinue(); // → receipt
    clickContinue(); // → reveal
    clickContinue(); // → tips

    let emitted = false;
    fixture.componentInstance.playAgain.subscribe(() => (emitted = true));

    const btn = fixture.nativeElement.querySelector('.summary__play-again-btn') as HTMLButtonElement;
    btn.click();
    expect(emitted).toBe(true);
  });

  it('should show progress bar at correct percentage on reveal step', () => {
    createWithInputs({ passCount: 7 });
    fixture.componentRef.setInput('scoreTier', SCORE_TIERS[1]);
    fixture.detectChanges();

    clickContinue(); // → wait
    clickContinue(); // → receipt
    clickContinue(); // → reveal

    const fill = fixture.nativeElement.querySelector('.summary__progress-fill') as HTMLElement;
    expect(fill.style.width).toBe('70%');
  });

  function clickContinue(): void {
    const btn = fixture.nativeElement.querySelector('.summary__continue-btn, .summary__play-again-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
  }
});

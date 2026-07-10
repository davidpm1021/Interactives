import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompoundInterestTimeMachine } from './compound-interest-time-machine';
import { ChallengeStateService } from './services/challenge-state.service';

describe('CompoundInterestTimeMachine', () => {
  let component: CompoundInterestTimeMachine;
  let fixture: ComponentFixture<CompoundInterestTimeMachine>;
  let stateService: ChallengeStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompoundInterestTimeMachine],
    }).compileComponents();

    fixture = TestBed.createComponent(CompoundInterestTimeMachine);
    component = fixture.componentInstance;
    fixture.detectChanges();
    stateService = fixture.debugElement.injector.get(ChallengeStateService);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show the intro on initial load and hide the progress bar', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-intro')).toBeTruthy();
    expect(el.querySelector('.challenge-progress')).toBeFalsy();
  });

  it('should leave the intro and reveal challenge 1 after startChallenges', () => {
    stateService.startChallenges();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-intro')).toBeFalsy();
    expect(el.querySelector('.challenge-progress')).toBeTruthy();
    const title = el.querySelector('.challenge-title');
    expect(title?.textContent).toContain('The Guess');
  });

  it('should have aria-live announcement region', () => {
    const el: HTMLElement = fixture.nativeElement;
    const live = el.querySelector('[aria-live="polite"]');
    expect(live).toBeTruthy();
  });

  it('should show disabled show-me button before predictions are locked', () => {
    stateService.startChallenges();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('.show-me-btn') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
  });

  it('should advance to reveal when state service transitions', () => {
    stateService.startChallenges();
    stateService.submitPrediction({ challenge1Year10: 2000, challenge1Year40: 5000 });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-reveal-chart')).toBeTruthy();
    expect(el.querySelector('app-reveal-stats')).toBeTruthy();
  });

  it('should advance through to reflect phase', () => {
    stateService.startChallenges();
    stateService.submitPrediction({ challenge1Year10: 2000, challenge1Year40: 5000 });
    fixture.detectChanges();
    stateService.advanceToReflect();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-reflect-card')).toBeTruthy();
  });
});

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

  it('should leave the intro and enter concept demo after startConcept', () => {
    stateService.startConcept();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-intro')).toBeFalsy();
    expect(el.querySelector('app-concept-demo')).toBeTruthy();
  });

  it('should advance from concept to challenge 1 predict', () => {
    stateService.startConcept();
    stateService.advanceFromConcept();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-concept-demo')).toBeFalsy();
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
    stateService.startConcept();
    stateService.advanceFromConcept();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('.predict-action .ngpf-btn-primary') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
  });

  it('should advance to reveal when state service transitions', () => {
    stateService.startConcept();
    stateService.advanceFromConcept();
    stateService.submitPrediction({ challenge1Year10: 2000, challenge1Year40: 5000 });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-reveal-chart')).toBeTruthy();
    expect(el.querySelector('app-reveal-stats')).toBeTruthy();
  });

  it('should advance through to reflect phase', () => {
    stateService.startConcept();
    stateService.advanceFromConcept();
    stateService.submitPrediction({ challenge1Year10: 2000, challenge1Year40: 5000 });
    fixture.detectChanges();
    stateService.advanceToReflect();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-reflect-card')).toBeTruthy();
  });
});

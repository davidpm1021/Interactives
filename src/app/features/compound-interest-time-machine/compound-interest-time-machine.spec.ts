import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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

  it('should hide the show-me button until challenge 1 predictions are locked', () => {
    stateService.startConcept();
    stateService.advanceFromConcept();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    // Show me should not appear at all until both dots are locked. Prior
    // behavior showed a disabled button, which floated below the chart's Lock
    // button as a second orphaned row.
    const btn = el.querySelector('.predict-action .ngpf-btn-primary') as HTMLButtonElement | null;
    expect(btn).toBeNull();
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

  it('should always leave a reachable control after Back from a reflect card', () => {
    stateService.startConcept();
    stateService.advanceFromConcept();
    stateService.submitPrediction({ challenge1Year10: 2000, challenge1Year40: 5000 });
    stateService.advanceToReflect();
    fixture.detectChanges();

    const backBtn = fixture.nativeElement.querySelector(
      'app-reflect-card .ngpf-btn-secondary',
    ) as HTMLButtonElement;
    expect(backBtn).toBeTruthy();
    backBtn.click();
    fixture.detectChanges();

    // We should be back on the predict screen, not stranded on the
    // control-less reveal screen.
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-prediction-chart')).toBeTruthy();
    expect(el.querySelector('.predict-action')).toBeTruthy();
  });

  it('should clear the armed show-me button when Back re-enters a predict screen', () => {
    stateService.startConcept();
    stateService.advanceFromConcept();
    fixture.detectChanges();

    // Simulate the student locking both dots, which arms challenge1Ready.
    const el: HTMLElement = fixture.nativeElement;
    const chart = fixture.debugElement.query(By.css('app-prediction-chart'));
    expect(chart).toBeTruthy();
    chart.triggerEventHandler('predictionChange', [
      { year: 10, value: 2000, locked: true },
      { year: 40, value: 5000, locked: true },
    ]);
    chart.triggerEventHandler('allLocked', undefined);
    fixture.detectChanges();
    expect(el.querySelector('.predict-action .ngpf-btn-primary')).toBeTruthy();

    // Submit, reach reflect, then Back into the predict screen again.
    stateService.submitPrediction({ challenge1Year10: 2000, challenge1Year40: 5000 });
    stateService.advanceToReflect();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        'app-reflect-card .ngpf-btn-secondary',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    // The re-created chart has both dots unlocked, so the Show me button must
    // not still be armed with the stale guess.
    expect(el.querySelector('.predict-action .ngpf-btn-primary')).toBeNull();
  });
});

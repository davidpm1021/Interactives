import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FreeTrialSignup } from './free-trial-signup/free-trial-signup';
import { CancellationFlow } from './cancellation-flow/cancellation-flow';
import { ChallengeOutcome } from '../../models/challenge.model';

describe('FreeTrialSignup', () => {
  let fixture: ComponentFixture<FreeTrialSignup>;
  let component: FreeTrialSignup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeTrialSignup],
    }).compileComponents();
    fixture = TestBed.createComponent(FreeTrialSignup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show payment fields and fine print about auto-renewal', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('$14.99/month');
    expect(el.querySelector('.free-trial__fine-print')).toBeTruthy();
  });

  it('should show the double-negative email question', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('not');
    expect(el.textContent).toContain('promotional emails');
  });

  it('should emit full-fail when neither term nor email handled correctly', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Don't check terms notice, don't select email question (or select "no" = wrong)
    const noRadio = fixture.nativeElement.querySelectorAll('input[type="radio"]')[1] as HTMLInputElement;
    noRadio.click();
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.free-trial__submit-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('full-fail');
  });

  it('should emit partial-fail when only terms noticed', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Check the terms notice
    const checkbox = fixture.nativeElement.querySelector('.free-trial__terms-checkbox input') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();

    // Select "no" for email (wrong answer)
    const noRadio = fixture.nativeElement.querySelectorAll('input[type="radio"]')[1] as HTMLInputElement;
    noRadio.click();
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.free-trial__submit-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('partial-fail');
  });

  it('should emit partial-fail when only email answered correctly', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Don't check terms notice
    // Select "yes" for email (correct — opt OUT)
    const yesRadio = fixture.nativeElement.querySelectorAll('input[type="radio"]')[0] as HTMLInputElement;
    yesRadio.click();
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.free-trial__submit-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('partial-fail');
  });

  it('should emit pass when both terms noticed and email answered correctly', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Check the terms notice
    const checkbox = fixture.nativeElement.querySelector('.free-trial__terms-checkbox input') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();

    // Select "yes" for email (correct — opt OUT)
    const yesRadio = fixture.nativeElement.querySelectorAll('input[type="radio"]')[0] as HTMLInputElement;
    yesRadio.click();
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.free-trial__submit-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('pass');
  });

  it('should emit full-fail when submitting with no interactions', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const btn = fixture.nativeElement.querySelector('.free-trial__submit-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('full-fail');
  });
});

describe('CancellationFlow', () => {
  let fixture: ComponentFixture<CancellationFlow>;
  let component: CancellationFlow;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CancellationFlow],
    }).compileComponents();
    fixture = TestBed.createComponent(CancellationFlow);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start on step 1 with show recommendations', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('sorry to see you go');
    expect(el.querySelector('.cancel-flow__show-list')).toBeTruthy();
  });

  it('should show step indicator with 4 dots', () => {
    const dots = fixture.nativeElement.querySelectorAll('.cancel-flow__step-dot');
    expect(dots.length).toBe(4);
  });

  it('should emit full-fail when Keep Subscription is clicked on step 1', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const keepBtn = fixture.nativeElement.querySelector('.cancel-flow__keep-btn') as HTMLButtonElement;
    keepBtn.click();
    expect(result).toBe('full-fail');
  });

  it('should advance to step 2 (discount offer) on Continue to Cancel', () => {
    const cancelBtn = fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('50% off');
    expect(el.textContent).toContain('Accept Offer');
  });

  it('should emit partial-fail when discount is accepted on step 2', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Go to step 2
    const cancelBtn = fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();

    // Accept discount
    const acceptBtn = fixture.nativeElement.querySelector('.cancel-flow__keep-btn') as HTMLButtonElement;
    acceptBtn.click();
    expect(result).toBe('partial-fail');
  });

  it('should advance to step 3 (reason dropdown) when declining discount', () => {
    // Step 1 → 2
    (fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    // Step 2 → 3
    (fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Are you sure');
    expect(el.querySelector('.cancel-flow__reason-select')).toBeTruthy();
  });

  it('should disable Yes Cancel button until a reason is selected on step 3', () => {
    // Navigate to step 3
    (fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    const yesCancel = fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement;
    expect(yesCancel.disabled).toBe(true);

    // Select a reason
    const select = fixture.nativeElement.querySelector('.cancel-flow__reason-select') as HTMLSelectElement;
    select.value = 'expensive';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(yesCancel.disabled).toBe(false);
  });

  it('should advance to step 4 (final confirmation) after selecting reason', () => {
    // Navigate to step 3
    (fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    // Select reason
    const select = fixture.nativeElement.querySelector('.cancel-flow__reason-select') as HTMLSelectElement;
    select.value = 'expensive';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // Continue
    (fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Final Confirmation');
    expect(el.querySelector('.cancel-flow__confirm-cancel-btn')).toBeTruthy();
  });

  it('should emit pass when all 4 steps are navigated without accepting offers', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Step 1 → Continue
    (fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    // Step 2 → Continue (decline discount)
    (fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    // Step 3 → Select reason and continue
    const select = fixture.nativeElement.querySelector('.cancel-flow__reason-select') as HTMLSelectElement;
    select.value = 'expensive';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    // Step 4 → Confirm cancellation
    (fixture.nativeElement.querySelector('.cancel-flow__confirm-cancel-btn') as HTMLButtonElement).click();
    expect(result).toBe('pass');
  });

  it('should emit full-fail when Keep Subscription clicked on step 3', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Navigate to step 3
    (fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.cancel-flow__cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    // Click Keep on step 3
    (fixture.nativeElement.querySelector('.cancel-flow__keep-btn') as HTMLButtonElement).click();
    expect(result).toBe('full-fail');
  });
});

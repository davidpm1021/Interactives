import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BankSignup } from './bank-signup/bank-signup';
import { PrivacySettings } from './privacy-settings/privacy-settings';
import { ChallengeOutcome } from '../../models/challenge.model';

describe('BankSignup', () => {
  let fixture: ComponentFixture<BankSignup>;
  let component: BankSignup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankSignup],
    }).compileComponents();
    fixture = TestBed.createComponent(BankSignup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the IdentityShield toggle pre-enabled', () => {
    const toggle = fixture.nativeElement.querySelector('.bank-signup__shield-toggle--on');
    expect(toggle).toBeTruthy();
  });

  it('should show the price for IdentityShield', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('$9.99/mo');
  });

  it('should display the credit card ad disguised as part of the form', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.bank-signup__credit-card-ad')).toBeTruthy();
    expect(el.textContent).toContain('Recommended for you');
    expect(el.textContent).toContain('24.99% variable APR');
  });

  it('should emit full-fail when submitting with shield on and ad clicked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Click the credit card ad
    const adBtn = fixture.nativeElement.querySelector('.bank-signup__ad-apply-btn') as HTMLButtonElement;
    adBtn.click();
    fixture.detectChanges();

    // Submit
    const submitBtn = fixture.nativeElement.querySelector('.bank-signup__submit-btn') as HTMLButtonElement;
    submitBtn.click();
    expect(result).toBe('full-fail');
  });

  it('should emit partial-fail when shield off but ad clicked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Turn off shield
    const shieldToggle = fixture.nativeElement.querySelector('.bank-signup__shield-toggle') as HTMLButtonElement;
    shieldToggle.click();
    fixture.detectChanges();

    // Click the credit card ad
    const adBtn = fixture.nativeElement.querySelector('.bank-signup__ad-apply-btn') as HTMLButtonElement;
    adBtn.click();
    fixture.detectChanges();

    const submitBtn = fixture.nativeElement.querySelector('.bank-signup__submit-btn') as HTMLButtonElement;
    submitBtn.click();
    expect(result).toBe('partial-fail');
  });

  it('should emit partial-fail when shield on but ad not clicked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Don't touch shield (stays on), don't click ad
    const submitBtn = fixture.nativeElement.querySelector('.bank-signup__submit-btn') as HTMLButtonElement;
    submitBtn.click();
    expect(result).toBe('partial-fail');
  });

  it('should emit pass when shield off and ad not clicked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Turn off shield
    const shieldToggle = fixture.nativeElement.querySelector('.bank-signup__shield-toggle') as HTMLButtonElement;
    shieldToggle.click();
    fixture.detectChanges();

    // Don't click credit card ad
    const submitBtn = fixture.nativeElement.querySelector('.bank-signup__submit-btn') as HTMLButtonElement;
    submitBtn.click();
    expect(result).toBe('pass');
  });

  it('should change ad button text after clicking Apply Now', () => {
    const adBtn = fixture.nativeElement.querySelector('.bank-signup__ad-apply-btn') as HTMLButtonElement;
    expect(adBtn.textContent?.trim()).toContain('Apply Now');

    adBtn.click();
    fixture.detectChanges();

    expect(adBtn.textContent?.trim()).toContain('Applied');
  });
});

describe('PrivacySettings', () => {
  let fixture: ComponentFixture<PrivacySettings>;
  let component: PrivacySettings;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacySettings],
    }).compileComponents();
    fixture = TestBed.createComponent(PrivacySettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display 3 privacy toggles', () => {
    const rows = fixture.nativeElement.querySelectorAll('.privacy-settings__toggle-row');
    expect(rows.length).toBe(3);
  });

  it('should have all toggles active (data sharing on) by default', () => {
    const activeBtns = fixture.nativeElement.querySelectorAll('.privacy-settings__toggle-btn--active');
    expect(activeBtns.length).toBe(3);
  });

  it('should show notice about reversed toggle convention', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.privacy-settings__notice')).toBeTruthy();
    expect(el.textContent).toContain('Left = Active');
  });

  it('should emit full-fail when saving with all toggles still active', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const saveBtn = fixture.nativeElement.querySelector('.privacy-settings__save-btn') as HTMLButtonElement;
    saveBtn.click();
    expect(result).toBe('full-fail');
  });

  it('should emit partial-fail when some toggles are turned off', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Turn off first toggle
    const toggleBtns = fixture.nativeElement.querySelectorAll('.privacy-settings__toggle-btn') as NodeListOf<HTMLButtonElement>;
    toggleBtns[0].click();
    fixture.detectChanges();

    const saveBtn = fixture.nativeElement.querySelector('.privacy-settings__save-btn') as HTMLButtonElement;
    saveBtn.click();
    expect(result).toBe('partial-fail');
  });

  it('should emit pass when all toggles are turned off', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const toggleBtns = fixture.nativeElement.querySelectorAll('.privacy-settings__toggle-btn') as NodeListOf<HTMLButtonElement>;
    toggleBtns[0].click();
    toggleBtns[1].click();
    toggleBtns[2].click();
    fixture.detectChanges();

    const saveBtn = fixture.nativeElement.querySelector('.privacy-settings__save-btn') as HTMLButtonElement;
    saveBtn.click();
    expect(result).toBe('pass');
  });

  it('should toggle individual privacy settings on click', () => {
    const toggleBtns = fixture.nativeElement.querySelectorAll('.privacy-settings__toggle-btn') as NodeListOf<HTMLButtonElement>;

    // Turn off first
    toggleBtns[0].click();
    fixture.detectChanges();

    expect(toggleBtns[0].classList.contains('privacy-settings__toggle-btn--active')).toBe(false);
    expect(toggleBtns[1].classList.contains('privacy-settings__toggle-btn--active')).toBe(true);
    expect(toggleBtns[2].classList.contains('privacy-settings__toggle-btn--active')).toBe(true);
  });

  it('should show state labels for each toggle', () => {
    const states = fixture.nativeElement.querySelectorAll('.privacy-settings__toggle-state');
    expect(states.length).toBe(3);

    // All should show "Active" initially
    for (const state of states) {
      expect(state.textContent.trim()).toBe('Active');
    }

    // Toggle first off
    const toggleBtns = fixture.nativeElement.querySelectorAll('.privacy-settings__toggle-btn') as NodeListOf<HTMLButtonElement>;
    toggleBtns[0].click();
    fixture.detectChanges();

    const updatedStates = fixture.nativeElement.querySelectorAll('.privacy-settings__toggle-state');
    expect(updatedStates[0].textContent.trim()).toBe('Inactive');
  });
});

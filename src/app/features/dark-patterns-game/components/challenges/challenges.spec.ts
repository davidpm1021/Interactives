import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationPopup } from './notification-popup/notification-popup';
import { CookieBanner } from './cookie-banner/cookie-banner';
import { AccountSignup } from './account-signup/account-signup';
import { ChallengeOutcome } from '../../models/challenge.model';

describe('NotificationPopup', () => {
  let fixture: ComponentFixture<NotificationPopup>;
  let component: NotificationPopup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationPopup],
    }).compileComponents();
    fixture = TestBed.createComponent(NotificationPopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a dialog with accept and decline buttons', () => {
    const el = fixture.nativeElement as HTMLElement;
    const acceptBtn = el.querySelector('.notification-popup__accept-btn');
    const declineBtn = el.querySelector('.notification-popup__decline-btn');
    expect(acceptBtn).toBeTruthy();
    expect(declineBtn).toBeTruthy();
  });

  it('should emit full-fail when accept is clicked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const btn = fixture.nativeElement.querySelector('.notification-popup__accept-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('full-fail');
  });

  it('should emit pass when decline is clicked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const btn = fixture.nativeElement.querySelector('.notification-popup__decline-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('pass');
  });

  it('should have guilt-tripping language on decline button', () => {
    const btn = fixture.nativeElement.querySelector('.notification-popup__decline-btn') as HTMLElement;
    expect(btn.textContent?.toLowerCase()).toContain('miss out');
  });

  it('should have inviting language on accept button', () => {
    const btn = fixture.nativeElement.querySelector('.notification-popup__accept-btn') as HTMLElement;
    expect(btn.textContent?.toLowerCase()).toContain('keep me in the loop');
  });
});

describe('CookieBanner', () => {
  let fixture: ComponentFixture<CookieBanner>;
  let component: CookieBanner;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CookieBanner],
    }).compileComponents();
    fixture = TestBed.createComponent(CookieBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show cookie banner initially, not manage panel', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.cookie-banner-challenge__banner')).toBeTruthy();
    expect(el.querySelector('.cookie-banner-challenge__manage-panel')).toBeNull();
  });

  it('should emit full-fail when Accept All is clicked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const btn = fixture.nativeElement.querySelector('.cookie-banner-challenge__accept-all-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('full-fail');
  });

  it('should show manage panel when Manage Preferences is clicked', () => {
    const btn = fixture.nativeElement.querySelector('.cookie-banner-challenge__manage-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.cookie-banner-challenge__manage-panel')).toBeTruthy();
    expect(el.querySelector('.cookie-banner-challenge__banner')).toBeNull();
  });

  it('should show 6 toggle rows in manage panel', () => {
    const manageBtn = fixture.nativeElement.querySelector('.cookie-banner-challenge__manage-btn') as HTMLButtonElement;
    manageBtn.click();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.cookie-banner-challenge__toggle-row');
    expect(rows.length).toBe(6);
  });

  it('should have all non-essential toggles ON by default', () => {
    const manageBtn = fixture.nativeElement.querySelector('.cookie-banner-challenge__manage-btn') as HTMLButtonElement;
    manageBtn.click();
    fixture.detectChanges();

    const switches = fixture.nativeElement.querySelectorAll('.cookie-banner-challenge__toggle-switch--on');
    expect(switches.length).toBe(6); // All 6 are ON
  });

  it('should emit partial-fail if some toggles left on', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Open manage panel
    const manageBtn = fixture.nativeElement.querySelector('.cookie-banner-challenge__manage-btn') as HTMLButtonElement;
    manageBtn.click();
    fixture.detectChanges();

    // Toggle off just one non-essential (index 1)
    const toggleBtns = fixture.nativeElement.querySelectorAll('.cookie-banner-challenge__toggle-switch') as NodeListOf<HTMLButtonElement>;
    toggleBtns[1].click(); // Toggle off Performance
    fixture.detectChanges();

    // Confirm
    const confirmBtn = fixture.nativeElement.querySelector('.cookie-banner-challenge__confirm-btn') as HTMLButtonElement;
    confirmBtn.click();

    expect(result).toBe('partial-fail');
  });

  it('should emit pass if all non-essential toggles are turned off', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Open manage panel
    const manageBtn = fixture.nativeElement.querySelector('.cookie-banner-challenge__manage-btn') as HTMLButtonElement;
    manageBtn.click();
    fixture.detectChanges();

    // Toggle off all non-essential (indices 1-5; index 0 is required)
    const toggleBtns = fixture.nativeElement.querySelectorAll('.cookie-banner-challenge__toggle-switch') as NodeListOf<HTMLButtonElement>;
    for (let i = 1; i <= 5; i++) {
      toggleBtns[i].click();
    }
    fixture.detectChanges();

    // Confirm
    const confirmBtn = fixture.nativeElement.querySelector('.cookie-banner-challenge__confirm-btn') as HTMLButtonElement;
    confirmBtn.click();

    expect(result).toBe('pass');
  });

  it('should not allow toggling the required "Strictly Necessary" cookie', () => {
    const manageBtn = fixture.nativeElement.querySelector('.cookie-banner-challenge__manage-btn') as HTMLButtonElement;
    manageBtn.click();
    fixture.detectChanges();

    const firstToggle = fixture.nativeElement.querySelector('.cookie-banner-challenge__toggle-switch') as HTMLButtonElement;
    expect(firstToggle.disabled).toBe(true);
  });
});

describe('AccountSignup', () => {
  let fixture: ComponentFixture<AccountSignup>;
  let component: AccountSignup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountSignup],
    }).compileComponents();
    fixture = TestBed.createComponent(AccountSignup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render 3 checkboxes, all pre-checked', () => {
    const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    expect(checkboxes.length).toBe(3);
    for (const cb of checkboxes) {
      expect(cb.checked).toBe(true);
    }
  });

  it('should emit full-fail when submitting with all boxes checked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const btn = fixture.nativeElement.querySelector('.account-signup__submit-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('full-fail');
  });

  it('should emit partial-fail when only one optional box is unchecked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Uncheck only marketing (second checkbox)
    const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    checkboxes[1].click();
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.account-signup__submit-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('partial-fail');
  });

  it('should emit pass when both optional boxes are unchecked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Uncheck marketing and sharing (2nd and 3rd checkboxes)
    const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    checkboxes[1].click();
    checkboxes[2].click();
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.account-signup__submit-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('pass');
  });

  it('should emit pass even if terms checkbox is also unchecked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    // Uncheck all three
    const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    checkboxes[0].click();
    checkboxes[1].click();
    checkboxes[2].click();
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.account-signup__submit-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('pass');
  });
});

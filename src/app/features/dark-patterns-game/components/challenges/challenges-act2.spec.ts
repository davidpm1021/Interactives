import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FalseUrgency } from './false-urgency/false-urgency';
import { HiddenCosts } from './hidden-costs/hidden-costs';
import { PostPurchaseUpsell } from './post-purchase-upsell/post-purchase-upsell';
import { ChallengeOutcome } from '../../models/challenge.model';

describe('FalseUrgency', () => {
  let fixture: ComponentFixture<FalseUrgency>;
  let component: FalseUrgency;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FalseUrgency],
    }).compileComponents();
    fixture = TestBed.createComponent(FalseUrgency);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display urgency signals', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.false-urgency__timer')).toBeTruthy();
    expect(el.querySelector('.false-urgency__stock-warning')).toBeTruthy();
    expect(el.querySelector('.false-urgency__viewers')).toBeTruthy();
    expect(el.querySelector('.false-urgency__shipping-warning')).toBeTruthy();
  });

  it('should show both Add to Cart and Save for Later buttons', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.false-urgency__add-to-cart')).toBeTruthy();
    expect(el.querySelector('.false-urgency__save-for-later')).toBeTruthy();
  });

  it('should emit pass when Add to Cart is clicked (teaching moment)', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const btn = fixture.nativeElement.querySelector('.false-urgency__add-to-cart') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('pass');
  });

  it('should emit pass when Save for Later is clicked (teaching moment)', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const btn = fixture.nativeElement.querySelector('.false-urgency__save-for-later') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('pass');
  });

  it('should display the product price', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('$49.99');
  });

  it('should display a countdown timer value', () => {
    const el = fixture.nativeElement as HTMLElement;
    const timerValue = el.querySelector('.false-urgency__timer-value');
    expect(timerValue?.textContent?.trim()).toMatch(/\d+:\d{2}:\d{2}/);
  });
});

describe('HiddenCosts', () => {
  let fixture: ComponentFixture<HiddenCosts>;
  let component: HiddenCosts;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HiddenCosts],
    }).compileComponents();
    fixture = TestBed.createComponent(HiddenCosts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show both add-on checkboxes pre-checked', () => {
    const checkboxes = fixture.nativeElement.querySelectorAll('.hidden-costs__addon input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    expect(checkboxes.length).toBe(2);
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(true);
  });

  it('should show total of $67.96 with both add-ons', () => {
    const el = fixture.nativeElement as HTMLElement;
    const total = el.querySelector('.hidden-costs__total-amount');
    expect(total?.textContent).toContain('$67.96');
  });

  it('should update total when add-ons are unchecked', () => {
    const checkboxes = fixture.nativeElement.querySelectorAll('.hidden-costs__addon input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    checkboxes[0].click(); // Uncheck protection plan
    fixture.detectChanges();

    const total = fixture.nativeElement.querySelector('.hidden-costs__total-amount');
    expect(total?.textContent).toContain('$59.97'); // 49.99 + 5.99 + 3.99
  });

  it('should emit full-fail when both add-ons are left checked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const btn = fixture.nativeElement.querySelector('.hidden-costs__place-order-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('full-fail');
  });

  it('should emit partial-fail when one add-on is unchecked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const checkboxes = fixture.nativeElement.querySelectorAll('.hidden-costs__addon input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    checkboxes[0].click();
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.hidden-costs__place-order-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('partial-fail');
  });

  it('should emit pass when both add-ons are unchecked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const checkboxes = fixture.nativeElement.querySelectorAll('.hidden-costs__addon input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    checkboxes[0].click();
    checkboxes[1].click();
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.hidden-costs__place-order-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('pass');
  });

  it('should show $55.98 total when both add-ons are unchecked', () => {
    const checkboxes = fixture.nativeElement.querySelectorAll('.hidden-costs__addon input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    checkboxes[0].click();
    checkboxes[1].click();
    fixture.detectChanges();

    const total = fixture.nativeElement.querySelector('.hidden-costs__total-amount');
    expect(total?.textContent).toContain('$55.98');
  });
});

describe('PostPurchaseUpsell', () => {
  let fixture: ComponentFixture<PostPurchaseUpsell>;
  let component: PostPurchaseUpsell;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostPurchaseUpsell],
    }).compileComponents();
    fixture = TestBed.createComponent(PostPurchaseUpsell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the order confirmation', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Order Confirmed');
  });

  it('should display the upsell offer with prominent trial button', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.post-purchase__trial-btn')).toBeTruthy();
    expect(el.textContent).toContain('Start My Free Trial');
  });

  it('should show fine print about auto-renewal', () => {
    const el = fixture.nativeElement as HTMLElement;
    const finePrint = el.querySelector('.post-purchase__fine-print');
    expect(finePrint?.textContent).toContain('$12.99/month');
    expect(finePrint?.textContent).toContain('automatically renews');
  });

  it('should have a small, de-emphasized decline button', () => {
    const el = fixture.nativeElement as HTMLElement;
    const declineBtn = el.querySelector('.post-purchase__decline-btn') as HTMLElement;
    expect(declineBtn).toBeTruthy();
    expect(declineBtn.textContent?.toLowerCase()).toContain('no thanks');
  });

  it('should emit full-fail when trial button is clicked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const btn = fixture.nativeElement.querySelector('.post-purchase__trial-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('full-fail');
  });

  it('should emit pass when decline is clicked', () => {
    let result: ChallengeOutcome | undefined;
    component.completed.subscribe((v: ChallengeOutcome) => (result = v));

    const btn = fixture.nativeElement.querySelector('.post-purchase__decline-btn') as HTMLButtonElement;
    btn.click();
    expect(result).toBe('pass');
  });
});

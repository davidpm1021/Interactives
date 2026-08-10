import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TakeawaysFillComponent } from './takeaways-fill.component';

/** Correct answers in blank order, per TAKEAWAY_SENTENCES. */
const ANSWERS = ['accelerates', 'later', 'rate', 'outcome', 'Time', 'early'];

describe('TakeawaysFillComponent', () => {
  let fixture: ComponentFixture<TakeawaysFillComponent>;
  let component: TakeawaysFillComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TakeawaysFillComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TakeawaysFillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const chipEl = (text: string): HTMLButtonElement | null => {
    const nodeList: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('.chip');
    for (const el of Array.from(nodeList)) {
      if (el.textContent?.trim() === text) return el;
    }
    return null;
  };
  const blankEls = (): HTMLButtonElement[] => {
    const nodeList: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('.blank');
    return Array.from(nodeList);
  };

  it('renders sentences and word bank', () => {
    expect(blankEls().length).toBe(6);
    expect(chipEl('accelerates')).toBeTruthy();
    expect(chipEl('rate')).toBeTruthy();
    expect(chipEl('Time')).toBeTruthy();
    expect(chipEl('simple')).toBeTruthy(); // distractor
  });

  it('locks a correct placement into the first blank', () => {
    const chip = chipEl('accelerates')!;
    chip.click();
    fixture.detectChanges();
    const firstBlank = blankEls()[0];
    firstBlank.click();
    fixture.detectChanges();
    const updated = blankEls()[0];
    expect(updated.classList.contains('blank--correct')).toBe(true);
  });

  it('shakes then unplaces on a wrong placement', () => {
    const chip = chipEl('simple')!; // distractor, wrong for any blank
    chip.click();
    fixture.detectChanges();
    const firstBlank = blankEls()[0];
    firstBlank.click();
    fixture.detectChanges();
    const updated = blankEls()[0];
    expect(updated.classList.contains('blank--shake')).toBe(true);
    expect(updated.classList.contains('blank--correct')).toBe(false);
  });

  it('emits completedChange once every blank is correctly filled', () => {
    let completed = false;
    component.completedChange.subscribe((v) => (completed = v));

    // Place each answer in order; blankEls() and ANSWERS share an index.
    ANSWERS.forEach((text, i) => {
      chipEl(text)!.click();
      fixture.detectChanges();
      blankEls()[i].click();
      fixture.detectChanges();
    });

    expect(completed).toBe(true);
    for (const b of blankEls()) {
      expect(b.classList.contains('blank--correct')).toBe(true);
    }
  });

  it('does not offer a Show answers escape hatch', () => {
    expect(fixture.nativeElement.querySelector('.takeaways-fill__actions')).toBeNull();
  });

  it('does not let a stale shake timer clear an answer corrected in the meantime', async () => {
    // Wrong placement into the first blank arms a 500ms unplace timer.
    chipEl('simple')!.click();
    fixture.detectChanges();
    blankEls()[0].click();
    fixture.detectChanges();
    expect(blankEls()[0].classList.contains('blank--shake')).toBe(true);

    // Clear it and land the correct chip before that timer fires.
    blankEls()[0].click();
    fixture.detectChanges();
    chipEl(ANSWERS[0])!.click();
    fixture.detectChanges();
    blankEls()[0].click();
    fixture.detectChanges();
    expect(blankEls()[0].classList.contains('blank--correct')).toBe(true);

    // Let the original timer's deadline pass.
    await new Promise((r) => setTimeout(r, 600));
    fixture.detectChanges();

    const first = blankEls()[0];
    expect(first.classList.contains('blank--correct')).toBe(true);
    expect(first.textContent).toContain(ANSWERS[0]);
  });

  it('supports keyboard: Enter on chip selects, Enter on blank places', () => {
    const chip = chipEl('accelerates')!;
    chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    const firstBlank = blankEls()[0];
    firstBlank.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    const updated = blankEls()[0];
    expect(updated.classList.contains('blank--correct')).toBe(true);
  });
});

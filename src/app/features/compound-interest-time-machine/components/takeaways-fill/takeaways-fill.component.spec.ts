import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TakeawaysFillComponent } from './takeaways-fill.component';

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

  it('emits completedChange when all blanks are filled via Show answers', () => {
    let completed = false;
    component.completedChange.subscribe((v) => (completed = v));
    const showBtn = fixture.nativeElement.querySelector(
      '.takeaways-fill__actions .ngpf-btn',
    ) as HTMLButtonElement;
    showBtn.click();
    fixture.detectChanges();
    expect(completed).toBe(true);
    // All blanks should be locked/revealed
    for (const b of blankEls()) {
      expect(
        b.classList.contains('blank--correct') || b.classList.contains('blank--revealed'),
      ).toBe(true);
    }
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

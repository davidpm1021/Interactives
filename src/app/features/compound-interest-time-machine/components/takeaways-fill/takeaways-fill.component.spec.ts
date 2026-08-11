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

  /** Minimal DataTransfer stand-in; jsdom doesn't implement one. */
  const makeDragEvent = (type: string, store: Map<string, string>): DragEvent => {
    const ev = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
    Object.defineProperty(ev, 'dataTransfer', {
      value: {
        effectAllowed: 'none',
        dropEffect: 'none',
        setData: (k: string, v: string) => store.set(k, v),
        getData: (k: string) => store.get(k) ?? '',
      },
    });
    return ev;
  };

  const dragChipToBlank = (chipText: string, blankIndex: number): void => {
    const store = new Map<string, string>();
    chipEl(chipText)!.dispatchEvent(makeDragEvent('dragstart', store));
    fixture.detectChanges();
    const blank = blankEls()[blankIndex];
    blank.dispatchEvent(makeDragEvent('dragover', store));
    fixture.detectChanges();
    blank.dispatchEvent(makeDragEvent('drop', store));
    fixture.detectChanges();
  };

  it('places a chip dragged onto a blank', () => {
    dragChipToBlank(ANSWERS[0], 0);
    const first = blankEls()[0];
    expect(first.classList.contains('blank--correct')).toBe(true);
    expect(first.textContent).toContain(ANSWERS[0]);
  });

  it('grades a wrong drop the same way as a wrong tap', () => {
    dragChipToBlank('simple', 0);
    const first = blankEls()[0];
    expect(first.classList.contains('blank--shake')).toBe(true);
    expect(first.classList.contains('blank--correct')).toBe(false);
  });

  it('highlights a blank on dragover and clears it on dragleave', () => {
    const store = new Map<string, string>();
    chipEl(ANSWERS[0])!.dispatchEvent(makeDragEvent('dragstart', store));
    fixture.detectChanges();

    blankEls()[0].dispatchEvent(makeDragEvent('dragover', store));
    fixture.detectChanges();
    expect(blankEls()[0].classList.contains('blank--drag-over')).toBe(true);

    blankEls()[0].dispatchEvent(new Event('dragleave', { bubbles: true }));
    fixture.detectChanges();
    expect(blankEls()[0].classList.contains('blank--drag-over')).toBe(false);
  });

  it('refuses a drop onto an already-locked blank', () => {
    dragChipToBlank(ANSWERS[0], 0);
    expect(blankEls()[0].classList.contains('blank--correct')).toBe(true);

    // A locked blank must not accept dragover, so the drop can't land.
    const store = new Map<string, string>();
    chipEl('simple')!.dispatchEvent(makeDragEvent('dragstart', store));
    fixture.detectChanges();
    const overEvent = makeDragEvent('dragover', store);
    blankEls()[0].dispatchEvent(overEvent);
    fixture.detectChanges();

    expect(overEvent.defaultPrevented).toBe(false);
    expect(blankEls()[0].textContent).toContain(ANSWERS[0]);
  });

  it('keeps locked chips undraggable', () => {
    dragChipToBlank(ANSWERS[0], 0);
    expect(chipEl(ANSWERS[0])!.getAttribute('draggable')).toBe('false');
    expect(chipEl('simple')!.getAttribute('draggable')).toBe('true');
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

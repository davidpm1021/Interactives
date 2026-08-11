import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PredictionChartComponent } from './prediction-chart.component';

/**
 * jsdom has no ResizeObserver, which the chart wires up on first render.
 * Without this the component logs an error and never initializes, so the
 * scale assertions below would be testing an unmounted component.
 */
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('PredictionChartComponent', () => {
  let fixture: ComponentFixture<PredictionChartComponent>;
  let component: PredictionChartComponent;

  /** The Year-40 balance the activity is actually asking students to guess. */
  const TRUTH_YEAR_40 = 1000 * Math.pow(1.07, 40); // ≈ $14,974
  const TRUTH_YEAR_10 = 1000 * Math.pow(1.07, 10); // ≈ $1,967

  beforeEach(async () => {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
      ResizeObserverStub;

    await TestBed.configureTestingModule({
      imports: [PredictionChartComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PredictionChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Private access is deliberate: the scale rules are the unit under test and
  // there is no public surface that exposes them.
  const yMax = (): number => (component as never as { dynamicYMax: () => number }).dynamicYMax();
  const dot = (id: 'dot10' | 'dot40') =>
    (component as never as Record<string, () => { value: number }>)[id]();
  const setDot = (id: 'dot10' | 'dot40', value: number): void =>
    (component as never as { updateDot: (i: string, v: number) => void }).updateDot(id, value);
  const pinToCeiling = (id: 'dot10' | 'dot40'): void => {
    const ceiling = yMax();
    setDot(id, ceiling);
    (
      component as never as { expandCeilingIfPinned: (i: string, c: number) => void }
    ).expandCeilingIfPinned(id, ceiling);
  };

  it('opens the Year-10 dot on the principal rather than near the answer', () => {
    // $2,000 used to be the default, which is $33 from the correct $1,967.
    expect(dot('dot10').value).toBe(1000);
    expect(dot('dot10').value).toBe(component.principal());
  });

  it('starts with a scale that reaches the Year-10 answer but hides the Year-40 one', () => {
    expect(yMax()).toBeGreaterThanOrEqual(TRUTH_YEAR_10);
    expect(yMax()).toBeLessThan(TRUTH_YEAR_40);
  });

  it('reaches the Year-40 answer after a single pinned drag', () => {
    (component as never as { lockDot: (i: string) => void }).lockDot('dot10');
    fixture.detectChanges();
    expect(yMax()).toBeLessThan(TRUTH_YEAR_40);

    pinToCeiling('dot40');
    fixture.detectChanges();
    expect(yMax()).toBeGreaterThanOrEqual(TRUTH_YEAR_40);
  });

  it('leaves the scale alone for an ordinary mid-range drag', () => {
    const before = yMax();
    const ceiling = before;
    setDot('dot10', Math.round(ceiling * 0.5));
    (
      component as never as { expandCeilingIfPinned: (i: string, c: number) => void }
    ).expandCeilingIfPinned('dot10', ceiling);
    fixture.detectChanges();
    expect(yMax()).toBe(before);
  });

  it('never expands past the prediction cap', () => {
    for (let i = 0; i < 20; i++) pinToCeiling('dot10');
    fixture.detectChanges();
    expect(yMax()).toBeLessThanOrEqual(100_000);
  });

  it('ratchets the pushed ceiling upward only', () => {
    (component as never as { lockDot: (i: string) => void }).lockDot('dot10');
    fixture.detectChanges();
    pinToCeiling('dot40');
    fixture.detectChanges();
    const expanded = yMax();

    // Dragging back down must not shrink the room the student just opened up.
    setDot('dot40', 1000);
    fixture.detectChanges();
    expect(yMax()).toBe(expanded);
  });
});

import {
  Component,
  computed,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  Injector,
} from '@angular/core';
import * as d3 from 'd3';
import { PredictionPoint } from '../../models/compound-interest.models';
import { formatCurrency } from '../../utils/formatters';
import { computeChartDimensions, createScales, ChartDimensions, ChartScales, DEFAULT_MARGIN, widthAwareTickCount } from '../../utils/chart-helpers';

@Component({
  selector: 'app-prediction-chart',
  standalone: true,
  imports: [],
  templateUrl: './prediction-chart.component.html',
  styleUrl: './prediction-chart.component.scss',
})
export class PredictionChartComponent {
  readonly principal = input(1000);
  readonly maxYear = input(40);
  /**
   * Previously-submitted guesses to restore. Set when the student navigates
   * Back into this screen so both dots reappear at the values they chose and
   * can be nudged, rather than forcing them to start the guess over.
   * Restored unlocked so they remain adjustable.
   */
  readonly initialYear10 = input<number | null>(null);
  readonly initialYear40 = input<number | null>(null);

  readonly predictionChange = output<PredictionPoint[]>();
  readonly allLocked = output<void>();

  private readonly injector = inject(Injector);
  private readonly chartContainer = viewChild<ElementRef<HTMLDivElement>>('chartContainer');

  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private dims!: ChartDimensions;
  private scales!: ChartScales;
  private initialized = false;

  // Year 10 opens on the principal itself, not a number we invented. At 7% the
  // true Year-10 answer is $1,967, so the old $2,000 default sat $33 from
  // correct and effectively pre-filled the first prediction. Starting at the
  // principal reads as "what if it doesn't grow at all?", which is a
  // meaningful wrong intuition for the reveal to correct. Review: "otherwise
  // we're anchoring students to a starting answer (that may be a little
  // arbitrary/they don't have context for)."
  private readonly dot10 = signal<PredictionPoint>({ year: 10, value: 1000, locked: false });
  // Placeholder only. The real starting value is the student's locked Year-10
  // answer, mirrored across in lockDot, or a restored guess.
  private readonly dot40 = signal<PredictionPoint>({ year: 40, value: 1000, locked: false });
  private readonly show40 = signal(false);
  private draggingDot: 'dot10' | 'dot40' | null = null;
  /** Guards the restore effect so it seeds the dots only on first arrival. */
  private restoredInitialGuess = false;

  private readonly SNAP = 100;
  private readonly DOT_RADIUS = 20;
  private readonly TOUCH_RADIUS = 28;
  private readonly MAX_PREDICTION_VALUE = 100_000;
  private dragMoved = false;
  /** Frozen scale used during a drag to prevent feedback loops. */
  private dragScaleY: d3.ScaleLinear<number, number> | null = null;

  /**
   * Ceiling granted because a dot was dragged to the very top of the chart.
   * Ratchets upward only, and feeds `dynamicYMax` as an extra floor.
   */
  private readonly pushedYMax = signal(0);

  /** How far the axis opens up when a student pins a dot against the ceiling. */
  private readonly CEILING_GROWTH = 2.5;

  /**
   * Y-axis max grows dynamically with the highest dot (40% headroom), floored
   * at 5x principal so the chart isn't cramped and capped at MAX_PREDICTION_VALUE
   * so it doesn't balloon into hundreds-of-thousands when a student over-drags.
   *
   * `pushedYMax` is the escape valve for a student whose instinct is right:
   * see `expandCeilingIfPinned`. The axis deliberately never opens far enough
   * to *display* the true answer up front, only far enough to let a student
   * reach it. Those are separable, and the reveal depends on the first.
   */
  private readonly dynamicYMax = computed(() => {
    const highestDot = Math.max(this.dot10().value, this.show40() ? this.dot40().value : 0);
    const minScale = this.principal() * 5;
    const headroom = Math.max(minScale, highestDot * 1.4, this.pushedYMax());
    const capped = Math.min(this.MAX_PREDICTION_VALUE, headroom);
    const magnitude = Math.pow(10, Math.floor(Math.log10(capped)));
    return Math.ceil(capped / magnitude) * magnitude;
  });

  // ── Template-bound state ──

  protected readonly totalSteps = 2;

  /**
   * 1 = predict Year 10, 2 = predict Year 40, 3 = both locked (done state).
   * The template renders each step in a separate `@switch` case so switching
   * remounts the card and its slide-in animation re-fires.
   */
  protected readonly currentStep = computed(() => {
    if (!this.dot10().locked) return 1;
    if (!this.dot40().locked) return 2;
    return 3;
  });

  protected readonly instruction = computed(() => {
    const step = this.currentStep();
    if (step === 1) {
      return 'Drag the dot up or down to predict the balance at Year 10, then lock your guess.';
    }
    if (step === 2) {
      return 'Now predict Year 40. Drag the dot, then lock your guess.';
    }
    return 'Both predictions locked! Click "Show me reality" below.';
  });

  protected readonly showLockButton = computed(() => {
    const d10 = this.dot10();
    const d40 = this.dot40();
    if (!d10.locked) return true;
    if (this.show40() && !d40.locked) return true;
    return false;
  });

  protected readonly activeDotYear = computed(() => {
    return this.dot10().locked ? 40 : 10;
  });

  constructor() {
    // Restore a previous guess, once, before the chart first renders. Both
    // dots are shown so the student sees exactly what they submitted, and both
    // stay unlocked so either can be nudged before re-submitting.
    effect(() => {
      const y10 = this.initialYear10();
      const y40 = this.initialYear40();
      if (y10 === null && y40 === null) return;
      if (this.restoredInitialGuess) return;
      this.restoredInitialGuess = true;

      if (y10 !== null) this.dot10.set({ year: 10, value: y10, locked: false });
      if (y40 !== null) {
        this.dot40.set({ year: 40, value: y40, locked: false });
        this.show40.set(true);
      }
      this.emitPredictions();
    });

    afterNextRender(() => {
      this.initChart();
      this.initialized = true;
    }, { injector: this.injector });

    effect(() => {
      const d10 = this.dot10();
      const d40 = this.dot40();
      const s40 = this.show40();
      if (this.initialized) {
        if (this.draggingDot) {
          // Mid-drag: only update line + dots using existing scales (no axis rescale)
          this.renderLine();
          this.renderDots();
        } else {
          // Full re-render with dynamic scale
          this.render();
        }
      }
    });
  }

  private initChart(): void {
    const container = this.chartContainer()?.nativeElement;
    if (!container) return;

    this.svg = d3.select(container).append('svg').attr('class', 'prediction-svg');
    this.chartGroup = this.svg.append('g')
      .attr('transform', `translate(${DEFAULT_MARGIN.left},${DEFAULT_MARGIN.top})`);

    this.chartGroup.append('g').attr('class', 'x-axis axis');
    this.chartGroup.append('g').attr('class', 'y-axis axis');
    this.chartGroup.append('g').attr('class', 'line-layer');
    this.chartGroup.append('g').attr('class', 'dot-layer');

    const ro = new ResizeObserver(() => {
      if (this.initialized) this.render();
    });
    ro.observe(container);

    this.render();
  }

  private render(): void {
    const container = this.chartContainer()?.nativeElement;
    if (!container || !this.svg) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return;

    this.dims = computeChartDimensions(rect.width, DEFAULT_MARGIN, 0.55, 300, 460);
    this.svg.attr('viewBox', `0 0 ${this.dims.width} ${this.dims.height}`);

    this.scales = createScales(
      this.dims.innerWidth,
      this.dims.innerHeight,
      [0, this.maxYear()],
      [0, this.dynamicYMax()],
    );

    // Axes — tick count scales with chart width so labels don't collide on
    // narrow (mobile) viewports.
    const xAxis = d3.axisBottom(this.scales.x)
      .ticks(widthAwareTickCount(this.dims.innerWidth, Math.min(this.maxYear(), 10)))
      .tickFormat((d) => `Yr ${d}`);
    const yAxis = d3.axisLeft(this.scales.y)
      .ticks(6)
      .tickFormat((d) => formatCurrency(d as number, true));

    this.chartGroup.select<SVGGElement>('.x-axis')
      .attr('transform', `translate(0,${this.dims.innerHeight})`)
      .call(xAxis);
    this.chartGroup.select<SVGGElement>('.y-axis').call(yAxis);

    this.renderLine();
    this.renderDots();
  }

  private renderLine(): void {
    const lineLayer = this.chartGroup.select('.line-layer');
    lineLayer.selectAll('*').remove();

    const points: [number, number][] = [
      [this.scales.x(0), this.scales.y(this.principal())],
      [this.scales.x(this.dot10().year), this.scales.y(this.dot10().value)],
    ];

    if (this.show40()) {
      points.push([this.scales.x(this.dot40().year), this.scales.y(this.dot40().value)]);
    }

    const lineGen = d3.line<[number, number]>().x((d) => d[0]).y((d) => d[1]);

    lineLayer.append('path')
      .attr('d', lineGen(points))
      .attr('fill', 'none')
      .attr('stroke', 'var(--ngpf-royal-blue)')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '8,5')
      .attr('opacity', 0.7);

    // Fixed start dot
    lineLayer.append('circle')
      .attr('cx', this.scales.x(0))
      .attr('cy', this.scales.y(this.principal()))
      .attr('r', 6)
      .attr('fill', 'var(--ngpf-navy-blue)');

    // Start label
    lineLayer.append('text')
      .attr('class', 'value-label')
      .attr('x', this.scales.x(0) + 10)
      .attr('y', this.scales.y(this.principal()) - 10)
      .text(formatCurrency(this.principal()));
  }

  private renderDots(): void {
    const dotLayer = this.chartGroup.select<SVGGElement>('.dot-layer');
    dotLayer.selectAll('*').remove();

    this.renderDraggableDot(dotLayer, this.dot10(), 'dot10');

    if (this.show40()) {
      this.renderDraggableDot(dotLayer, this.dot40(), 'dot40');
    }
  }

  private renderDraggableDot(
    layer: d3.Selection<SVGGElement, unknown, null, undefined>,
    point: PredictionPoint,
    id: 'dot10' | 'dot40',
  ): void {
    const cx = this.scales.x(point.year);
    const cy = this.scales.y(point.value);

    const group = layer.append('g')
      .attr('class', `prediction-dot ${point.locked ? 'locked-dot' : ''}`)
      .attr('transform', `translate(${cx},${cy})`)
      .attr('tabindex', point.locked ? '-1' : '0')
      .attr('role', 'slider')
      .attr('aria-label', `Year ${point.year} prediction: ${formatCurrency(point.value)}`)
      .attr('aria-valuemin', '0')
      .attr('aria-valuemax', String(this.MAX_PREDICTION_VALUE))
      .attr('aria-valuenow', String(point.value))
      .attr('aria-valuetext', formatCurrency(point.value));

    // Glow ring
    group.append('circle')
      .attr('class', 'dot-glow')
      .attr('r', 24)
      .attr('fill', 'var(--ngpf-royal-blue)')
      .attr('opacity', 0.25);

    // Touch target (invisible)
    group.append('circle')
      .attr('r', this.TOUCH_RADIUS)
      .attr('fill', 'transparent');

    // Visible dot
    group.append('circle')
      .attr('class', 'dot-ring')
      .attr('r', this.DOT_RADIUS)
      .attr('fill', point.locked ? 'var(--ngpf-navy-blue)' : 'var(--ngpf-royal-blue)')
      .attr('stroke', 'white')
      .attr('stroke-width', 3);

    // Inner icon
    if (point.locked) {
      // Checkmark
      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', 'white')
        .attr('font-size', '14px')
        .attr('pointer-events', 'none')
        .text('\u2713');
    } else {
      // Up/down arrows
      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', 'white')
        .attr('font-size', '16px')
        .attr('pointer-events', 'none')
        .text('\u2195');
    }

    // Value label above
    const valueLabel = group.append('text')
      .attr('class', 'value-label')
      .attr('text-anchor', 'middle')
      .attr('y', -(this.DOT_RADIUS + 12))
      .text(formatCurrency(point.value));
    this.clampLabelToChart(valueLabel, cx);

    // Lock hint below
    if (!point.locked) {
      const lockHint = group.append('text')
        .attr('class', 'lock-hint')
        .attr('text-anchor', 'middle')
        .attr('y', this.DOT_RADIUS + 18)
        .text('Press Enter to lock');
      this.clampLabelToChart(lockHint, cx);
    }

    if (!point.locked) {
      // Drag behavior - track movement to distinguish click from drag
      const drag = d3.drag<SVGGElement, unknown>()
        .on('start', () => {
          this.draggingDot = id;
          this.dragMoved = false;
          // Freeze the Y scale so it doesn't shift mid-drag
          this.dragScaleY = this.scales.y.copy();
        })
        .on('drag', (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
          this.dragMoved = true;
          this.onDrag(id, event.y);
        })
        .on('end', () => {
          const ceiling = this.dragScaleY?.domain()[1] ?? null;
          this.dragScaleY = null;
          this.draggingDot = null;
          // Click without drag movement = lock
          if (!this.dragMoved) {
            this.lockDot(id);
          } else {
            if (ceiling !== null) this.expandCeilingIfPinned(id, ceiling);
            // Full re-render so the scale adjusts to the new value.
            this.render();
            // Focus the newly-rendered dot so Enter/Arrows work without Tab.
            this.focusUnlockedDot();
          }
        });

      group.call(drag);

      // Keyboard
      group.on('keydown', (event: KeyboardEvent) => {
        this.onKeydown(id, event);
      });
    }
  }

  /**
   * Nudge a dot's centered label back inside the SVG when it would overhang.
   *
   * The Year-40 dot sits flush against the right edge of the plot area, and
   * the margin there is only 30px, so a centered "Press Enter to lock" was
   * rendering clipped to "Press Enter to". Measured rather than estimated:
   * label width depends on the font and on the formatted value.
   *
   * `cx` is the dot's x within the chart group; the label is positioned in the
   * dot group's local space, so the usable range runs from -(margin.left + cx)
   * to (innerWidth - cx) + margin.right.
   */
  private clampLabelToChart(
    label: d3.Selection<SVGTextElement, unknown, null, undefined>,
    cx: number,
  ): void {
    const node = label.node();
    if (!node || typeof node.getBBox !== 'function') return;

    let box: DOMRect;
    try {
      box = node.getBBox();
    } catch {
      return; // getBBox throws on detached/hidden nodes in some environments
    }
    if (box.width === 0) return;

    const leftLimit = -(DEFAULT_MARGIN.left + cx);
    const rightLimit = this.dims.innerWidth - cx + DEFAULT_MARGIN.right;

    let shift = 0;
    if (box.x + box.width > rightLimit) {
      shift = rightLimit - (box.x + box.width);
    } else if (box.x < leftLimit) {
      shift = leftLimit - box.x;
    }
    if (shift !== 0) label.attr('x', shift);
  }

  /**
   * A dot dragged hard against the top of the chart means "I think it's more
   * than this scale can show". Open the axis generously so the next drag can
   * express it, instead of creeping up 40% at a time and making the student
   * repeat the gesture.
   *
   * Review: "if you were to guess 'correctly', you would have to nudge the
   * y-axis scale quite a few times. We probably WANT students to
   * underestimate, but this discourages them from even getting close to the
   * right answer." Only the pinned-to-ceiling case gets the bigger jump;
   * ordinary drags keep the gentler 40% growth, so the dot doesn't visibly
   * plummet every time it's nudged.
   */
  private expandCeilingIfPinned(id: 'dot10' | 'dot40', ceiling: number): void {
    const value = (id === 'dot10' ? this.dot10() : this.dot40()).value;
    // Tolerance covers the SNAP rounding at the very top of the range.
    if (value < ceiling * 0.98) return;
    const grown = Math.min(this.MAX_PREDICTION_VALUE, ceiling * this.CEILING_GROWTH);
    this.pushedYMax.update((cur) => Math.max(cur, grown));
  }

  private onDrag(id: 'dot10' | 'dot40', svgY: number): void {
    // Use the frozen scale from drag start to prevent feedback loops
    const scale = this.dragScaleY ?? this.scales.y;
    // Clamp to chart boundaries so the dot can't leave the visible area
    const clampedY = Math.max(0, Math.min(this.dims.innerHeight, svgY));
    const rawValue = scale.invert(clampedY);
    const snapped = Math.round(rawValue / this.SNAP) * this.SNAP;
    const clamped = Math.max(0, Math.min(this.MAX_PREDICTION_VALUE, snapped));
    this.updateDot(id, clamped);
  }

  private onKeydown(id: 'dot10' | 'dot40', event: KeyboardEvent): void {
    const step = event.shiftKey ? 1000 : this.SNAP;
    const sig = id === 'dot10' ? this.dot10 : this.dot40;
    let val = sig().value;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        val = Math.min(this.MAX_PREDICTION_VALUE, val + step);
        this.updateDot(id, val);
        break;
      case 'ArrowDown':
        event.preventDefault();
        val = Math.max(0, val - step);
        this.updateDot(id, val);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.lockDot(id);
        break;
    }
  }

  private updateDot(id: 'dot10' | 'dot40', value: number): void {
    const sig = id === 'dot10' ? this.dot10 : this.dot40;
    sig.set({ ...sig(), value });
    this.emitPredictions();
  }

  private lockDot(id: 'dot10' | 'dot40'): void {
    const sig = id === 'dot10' ? this.dot10 : this.dot40;
    if (sig().locked) return;
    sig.set({ ...sig(), locked: true });

    if (id === 'dot10' && !this.show40()) {
      // Year 40 opens level with the student's own Year-10 answer rather than
      // a number we picked. A flat line from Year 10 to Year 40 reads as "it
      // stops growing here", so the student has to actively decide how much
      // more happens, and the anchor is their own reasoning instead of ours.
      //
      // Guarded by !show40() so it only fires the first time the dot appears:
      // a restored guess (see the initialYear40 effect) already set show40 and
      // must not be overwritten.
      this.dot40.set({ ...this.dot40(), value: this.dot10().value });
      this.show40.set(true);
      // Focus the Year 40 dot after render
      setTimeout(() => {
        const dot40El = this.chartGroup?.select('.dot-layer .prediction-dot:not(.locked-dot)')?.node();
        if (dot40El instanceof HTMLElement || dot40El instanceof SVGElement) {
          (dot40El as HTMLElement).focus();
        }
      }, 50);
    }

    if (id === 'dot40') {
      this.allLocked.emit();
    }

    this.emitPredictions();
  }

  private focusUnlockedDot(): void {
    const el = this.chartGroup?.select('.dot-layer .prediction-dot:not(.locked-dot)')?.node();
    if (el instanceof HTMLElement || el instanceof SVGElement) {
      (el as HTMLElement).focus();
    }
  }

  protected onLockClick(): void {
    if (!this.dot10().locked) {
      this.lockDot('dot10');
    } else if (this.show40() && !this.dot40().locked) {
      this.lockDot('dot40');
    }
  }

  private emitPredictions(): void {
    const points = [this.dot10()];
    if (this.show40()) {
      points.push(this.dot40());
    }
    this.predictionChange.emit(points);
  }
}

import {
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
  Injector,
  OnChanges,
  effect,
} from '@angular/core';
import * as d3 from 'd3';
import { SimulationResult, YearlyDataPoint, PredictionPoint } from '../../models/compound-interest.models';
import { formatCurrency } from '../../utils/formatters';
import {
  computeChartDimensions,
  createScales,
  ChartDimensions,
  ChartScales,
  ChartMargin,
  DEFAULT_MARGIN,
  widthAwareTickCount,
  yearFromPointer,
} from '../../utils/chart-helpers';

/** Wider right margin to fit the gap bracket + label */
const REVEAL_MARGIN: ChartMargin = { top: 20, right: 120, bottom: 40, left: 80 };

export type RevealMode = 'single' | 'dual' | 'stacked';

@Component({
  selector: 'app-reveal-chart',
  standalone: true,
  imports: [],
  templateUrl: './reveal-chart.component.html',
  styleUrl: './reveal-chart.component.scss',
})
export class RevealChartComponent {
  readonly result = input.required<SimulationResult>();
  readonly resultB = input<SimulationResult | null>(null);
  /**
   * X-axis offset for resultB. Used on Challenge 4 (Alex vs Jordan) so
   * Jordan's curve starts at year 10 instead of collapsing to year 0.
   */
  readonly resultBStartYear = input(0);
  readonly predictionPoints = input<PredictionPoint[]>([]);
  readonly mode = input<RevealMode>('single');
  readonly principal = input(1000);
  /**
   * Label each line's final value at its endpoint instead of repeating the
   * figures in separate stat cards below the chart. Also suppresses the gap
   * bracket, which restates the same comparison a third time.
   */
  readonly showEndpointLabels = input(false);
  /** Short series names used by the endpoint labels, e.g. "5%" / "10%". */
  readonly seriesALabel = input('');
  readonly seriesBLabel = input('');
  /**
   * Name the two shaded bands in place. Without this the stacked areas are
   * unexplained — reviewers reported not knowing what the shading meant.
   */
  readonly areaLabels = input(false);
  /**
   * Suppress the shaded contribution/interest bands.
   *
   * The bands are computed from `result` alone, so on a two-series chart they
   * sit beneath both curves and imply the second series contributed the same
   * amount. On Challenge 4 that is false by $24,000 — and understating
   * Jordan's shortfall contradicts the very point the chart is making.
   */
  readonly hideAreas = input(false);
  readonly animationComplete = output<void>();

  private readonly injector = inject(Injector);
  private readonly chartContainer = viewChild<ElementRef<HTMLDivElement>>('chartContainer');
  private readonly readout = viewChild<ElementRef<HTMLDivElement>>('readout');

  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private initialized = false;
  private hasAnimated = false;

  /**
   * Geometry from the last render, so pointer handling can resolve a year
   * without re-deriving scales on every move.
   */
  private hoverCtx: { dims: ChartDimensions; scales: ChartScales } | null = null;

  private readonly reducedMotion = signal(false);

  constructor() {
    afterNextRender(() => {
      this.checkReducedMotion();
      this.initChart();
      this.initialized = true;
      this.animateReveal();
    }, { injector: this.injector });

    effect(() => {
      // Re-render on input changes (for resize)
      const r = this.result();
      const rB = this.resultB();
      const pp = this.predictionPoints();
      if (this.initialized && this.hasAnimated) {
        this.renderStatic();
      }
    });
  }

  private checkReducedMotion(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    this.reducedMotion.set(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  private initChart(): void {
    const container = this.chartContainer()?.nativeElement;
    if (!container) return;

    this.svg = d3.select(container).append('svg').attr('class', 'reveal-svg');
    this.chartGroup = this.svg.append('g')
      .attr('transform', `translate(${REVEAL_MARGIN.left},${REVEAL_MARGIN.top})`);

    this.chartGroup.append('g').attr('class', 'x-axis axis');
    this.chartGroup.append('g').attr('class', 'y-axis axis');
    this.chartGroup.append('g').attr('class', 'ghost-layer');
    this.chartGroup.append('g').attr('class', 'area-layer');
    this.chartGroup.append('g').attr('class', 'line-layer');
    this.chartGroup.append('g').attr('class', 'bracket-layer');
    // Last, so the marker draws over the curves, and created once here rather
    // than in renderStatic, which wipes the layers above on every resize.
    // pointer-events none is load-bearing: this layer is raised above the
    // hit rect so the marker draws on top of the curves, which also made it
    // the topmost hit target. Crossing the marker fired pointerleave on the
    // overlay and cleared the readout, so it strobed under the cursor.
    this.chartGroup.append('g')
      .attr('class', 'hover-layer')
      .attr('pointer-events', 'none');
    this.chartGroup.append('rect')
      .attr('class', 'hover-overlay')
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');
    this.attachHoverHandlers();

    const ro = new ResizeObserver(() => {
      if (this.initialized && this.hasAnimated) this.renderStatic();
    });
    ro.observe(container);
  }

  // ── Hover / tap readout ──
  //
  // Review: "Add functionality to click line graph to see values at different
  // points (would help students support their reasoning in answering the
  // comprehension Q)." Pointer events rather than separate mouse and touch
  // paths, so a tap on a tablet reads out the same way a hover does.
  //
  // Gated on hasAnimated: probing a half-drawn curve would report figures that
  // aren't on screen yet, and would also pre-empt the reveal.

  private attachHoverHandlers(): void {
    // No touchmove handler. Scroll-vs-scrub arbitration is left entirely to
    // `touch-action: pan-y` on the svg, so the browser keeps ownership of
    // vertical panning and a student can always scroll away from the chart.
    // Calling preventDefault() here instead meant that if the CSS ever failed
    // to apply, every touch-drag over a 340px chart froze the page.
    this.chartGroup.select<SVGRectElement>('.hover-overlay')
      .on('pointermove', (event: PointerEvent) => this.onHover(event))
      .on('pointerdown', (event: PointerEvent) => this.onHover(event))
      .on('pointerleave', () => this.clearHover());
  }

  /** Size the invisible hit area to the plot. Called from every render path. */
  private sizeHoverOverlay(dims: ChartDimensions): void {
    this.chartGroup.select('.hover-overlay')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', dims.innerWidth)
      .attr('height', dims.innerHeight)
      .raise();
    this.chartGroup.select('.hover-layer').raise();
  }

  private onHover(event: PointerEvent): void {
    if (!this.hasAnimated || !this.hoverCtx) return;
    const { dims, scales } = this.hoverCtx;
    const data = this.result().dataPoints;
    const maxYear = data[data.length - 1].year;
    const year = yearFromPointer(
      event,
      scales,
      maxYear,
      this.chartGroup.node() as d3.ContainerElement,
    );
    const dp = data.find((d) => d.year === year);
    if (!dp) return;
    this.drawHoverMarker(dims, scales, dp);
    this.showReadout(dims, scales, dp);
  }

  private clearHover(): void {
    this.chartGroup.select('.hover-layer').selectAll('*').remove();
    const el = this.readout()?.nativeElement;
    if (el) el.classList.remove('is-visible');
  }

  /** The series values at a given year, in the order the readout lists them. */
  private seriesAt(
    dp: YearlyDataPoint,
  ): { label: string; value: number; color: string; plotted: boolean }[] {
    // `plotted` marks rows that correspond to an actual curve. The
    // contributions row is a band edge, so it belongs in the readout but must
    // not get a marker dot implying a line that isn't drawn.
    const rows: { label: string; value: number; color: string; plotted: boolean }[] = [];
    const a = this.seriesALabel();
    rows.push({
      label: a || 'Balance',
      value: dp.compoundBalance,
      color: 'var(--ngpf-sky-blue)',
      plotted: true,
    });

    const b = this.resultB();
    if (b) {
      // Challenge 4 offsets the second series, so its year N is the primary
      // series' year N + offset. Before that it hasn't started.
      const offset = this.resultBStartYear();
      const bYear = dp.year - offset;
      const bdp = bYear >= 0 ? b.dataPoints.find((d) => d.year === bYear) : null;
      if (bdp) {
        rows.push({
          label: this.seriesBLabel() || 'Comparison',
          value: bdp.compoundBalance,
          color: 'var(--ngpf-gold)',
          plotted: true,
        });
      }
    }

    // Only meaningful when the bands are actually drawn from this series.
    if (!this.hideAreas() && dp.totalContributions > 0) {
      rows.push({
        label: 'Money you invested',
        value: dp.totalContributions,
        color: 'var(--ngpf-royal-blue)',
        plotted: false,
      });
    }
    return rows;
  }

  private drawHoverMarker(
    dims: ChartDimensions,
    scales: ChartScales,
    dp: YearlyDataPoint,
  ): void {
    const layer = this.chartGroup.select<SVGGElement>('.hover-layer');
    layer.selectAll('*').remove();

    const cx = scales.x(dp.year);
    layer.append('line')
      .attr('x1', cx).attr('x2', cx)
      .attr('y1', 0).attr('y2', dims.innerHeight)
      .attr('stroke', 'var(--ngpf-navy-blue)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.45);

    for (const row of this.seriesAt(dp)) {
      if (!row.plotted) continue;
      layer.append('circle')
        .attr('cx', cx)
        .attr('cy', scales.y(row.value))
        .attr('r', 5)
        .attr('fill', row.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    }
  }

  private showReadout(
    dims: ChartDimensions,
    scales: ChartScales,
    dp: YearlyDataPoint,
  ): void {
    const el = this.readout()?.nativeElement;
    const container = this.chartContainer()?.nativeElement;
    if (!el || !container) return;

    const rows = this.seriesAt(dp)
      .map(
        (r) =>
          `<span class="chart-readout__row"><span class="chart-readout__swatch" style="background:${r.color}"></span>` +
          `${r.label}: <strong>${formatCurrency(Math.round(r.value))}</strong></span>`,
      )
      .join('');
    el.innerHTML = `<span class="chart-readout__year">Year ${dp.year}</span>${rows}`;
    el.classList.add('is-visible');

    // Position beside the guide line, flipping to its left when the box would
    // overhang the container. Measured after the content is set so the width
    // reflects the actual figures.
    const cx = scales.x(dp.year) + REVEAL_MARGIN.left;
    const boxW = el.offsetWidth;
    const gap = 12;
    const left =
      cx + gap + boxW > container.clientWidth ? cx - gap - boxW : cx + gap;
    el.style.left = `${Math.max(0, left)}px`;
    el.style.top = `${REVEAL_MARGIN.top + dims.innerHeight * 0.08}px`;
  }

  private getDimsAndScales(): { dims: ChartDimensions; scales: ChartScales } | null {
    const container = this.chartContainer()?.nativeElement;
    if (!container || !this.svg) return null;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return null;

    const dims = computeChartDimensions(rect.width, REVEAL_MARGIN, 0.55, 300, 460);
    this.svg.attr('viewBox', `0 0 ${dims.width} ${dims.height}`);

    const data = this.result().dataPoints;
    const dataB = this.resultB()?.dataPoints ?? [];
    const offset = this.resultBStartYear();
    const shiftedB = dataB.map((d) => ({ ...d, year: d.year + offset }));
    const allData = [...data, ...shiftedB];

    const maxYear = Math.max(...allData.map((d) => d.year));
    // Include prediction points in Y domain
    const predYMax = Math.max(0, ...this.predictionPoints().map((p) => p.value));
    const maxBalance = Math.max(predYMax, ...allData.map((d) => d.compoundBalance));

    const scales = createScales(dims.innerWidth, dims.innerHeight, [0, maxYear], [0, maxBalance * 1.1]);

    // Axes — tick count scales with chart width so labels don't collide on
    // narrow (mobile) viewports.
    const xAxis = d3.axisBottom(scales.x)
      .ticks(widthAwareTickCount(dims.innerWidth, Math.min(maxYear, 10)))
      .tickFormat((d) => `Yr ${d}`);
    const yAxis = d3.axisLeft(scales.y)
      .ticks(6)
      .tickFormat((d) => formatCurrency(d as number, true));

    this.chartGroup.select<SVGGElement>('.x-axis')
      .attr('transform', `translate(0,${dims.innerHeight})`)
      .call(xAxis);
    this.chartGroup.select<SVGGElement>('.y-axis').call(yAxis);

    // Every render path funnels through here, so this is the one place the
    // hit area and cached geometry need refreshing. A resize rebuilds the
    // layers underneath; the overlay and hover layer are re-raised above them.
    this.hoverCtx = { dims, scales };
    this.sizeHoverOverlay(dims);
    this.clearHover();

    return { dims, scales };
  }

  private animateReveal(): void {
    const ctx = this.getDimsAndScales();
    if (!ctx) return;
    const { dims, scales } = ctx;

    // Draw ghost prediction line first
    this.renderGhost(scales);

    // Draw areas (contributions + interest)
    this.renderAreas(dims, scales);

    // Animate the main curve
    const data = this.result().dataPoints;
    const lineGen = d3.line<YearlyDataPoint>()
      .x((d) => scales.x(d.year))
      .y((d) => scales.y(d.compoundBalance))
      .curve(d3.curveMonotoneX);

    const lineLayer = this.chartGroup.select('.line-layer');
    const path = lineLayer.append('path')
      .attr('d', lineGen(data))
      .attr('fill', 'none')
      .attr('stroke', 'var(--ngpf-sky-blue)')
      .attr('stroke-width', 3);

    const dur = this.reducedMotion() ? 0 : 2000;

    const isDual = this.mode() === 'dual';

    // In dual mode, render resultB simultaneously with main curve
    if (isDual) {
      this.renderResultBLine(scales);
    }

    if (dur > 0) {
      const pathNode = path.node()!;
      const totalLength = pathNode.getTotalLength();
      path
        .attr('stroke-dasharray', `${totalLength}`)
        .attr('stroke-dashoffset', `${totalLength}`)
        .transition()
        .duration(dur)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', '0')
        .on('end', () => {
          path.attr('stroke-dasharray', null).attr('stroke-dashoffset', null);
          this.renderGapBracket(dims, scales);
          if (!isDual) this.renderResultBLine(scales);
          this.hasAnimated = true;
          this.animationComplete.emit();
        });
    } else {
      this.renderGapBracket(dims, scales);
      if (!isDual) this.renderResultBLine(scales);
      this.hasAnimated = true;
      this.animationComplete.emit();
    }

    // ARIA
    this.svg.attr('role', 'img')
      .attr('aria-label', `Growth chart showing ${formatCurrency(this.result().summary.finalBalance)} after ${data[data.length - 1].year} years`);
  }

  private renderGhost(scales: ChartScales): void {
    const ghostLayer = this.chartGroup.select('.ghost-layer');
    ghostLayer.selectAll('*').remove();

    const pp = this.predictionPoints();
    if (pp.length === 0) return;

    const points: [number, number][] = [
      [scales.x(0), scales.y(this.principal())],
      ...pp.map((p): [number, number] => [scales.x(p.year), scales.y(p.value)]),
    ];

    const lineGen = d3.line<[number, number]>().x((d) => d[0]).y((d) => d[1]);

    ghostLayer.append('path')
      .attr('d', lineGen(points))
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,4')
      .attr('opacity', 0.3);

    // Ghost dots
    for (const p of pp) {
      ghostLayer.append('circle')
        .attr('cx', scales.x(p.year))
        .attr('cy', scales.y(p.value))
        .attr('r', 5)
        .attr('fill', '#999')
        .attr('opacity', 0.3);
    }

    // Ghost label at last prediction point
    const last = pp[pp.length - 1];
    ghostLayer.append('text')
      .attr('x', scales.x(last.year) + 8)
      .attr('y', scales.y(last.value))
      .attr('font-family', 'var(--ngpf-font-body)')
      .attr('font-size', '0.75rem')
      .attr('fill', '#999')
      .attr('dominant-baseline', 'middle')
      .text(`Your guess: ${formatCurrency(Math.round(last.value))}`);
  }

  private renderAreas(dims: ChartDimensions, scales: ChartScales): void {
    const areaLayer = this.chartGroup.select('.area-layer');
    areaLayer.selectAll('*').remove();

    if (this.hideAreas()) return;

    const data = this.result().dataPoints;

    // Contributions area
    const contribArea = d3.area<YearlyDataPoint>()
      .x((d) => scales.x(d.year))
      .y0(dims.innerHeight)
      .y1((d) => scales.y(d.totalContributions))
      .curve(d3.curveMonotoneX);

    areaLayer.append('path')
      .attr('d', contribArea(data))
      .attr('fill', 'var(--ngpf-royal-blue)')
      .attr('opacity', 0.15);

    // Interest area
    const interestArea = d3.area<YearlyDataPoint>()
      .x((d) => scales.x(d.year))
      .y0((d) => scales.y(d.totalContributions))
      .y1((d) => scales.y(d.compoundBalance))
      .curve(d3.curveMonotoneX);

    areaLayer.append('path')
      .attr('d', interestArea(data))
      .attr('fill', 'var(--ngpf-sky-blue)')
      .attr('opacity', 0.2);

    if (!this.areaLabels()) return;

    // Name each band inside itself, near the right where the bands are
    // thickest. Placed at the vertical midpoint of each band at ~78% across.
    const anchor = data[Math.floor(data.length * 0.78)];
    if (!anchor) return;

    const bandLabel = (yMid: number, color: string, text: string) => {
      areaLayer
        .append('text')
        .attr('class', 'area-label')
        .attr('x', scales.x(anchor.year))
        .attr('y', yMid)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-family', 'var(--ngpf-font-body)')
        .attr('font-size', '0.72rem')
        .attr('font-weight', '600')
        .attr('fill', color)
        .text(text);
    };

    const contribMid =
      (scales.y(anchor.totalContributions) + dims.innerHeight) / 2;
    const interestMid =
      (scales.y(anchor.compoundBalance) + scales.y(anchor.totalContributions)) / 2;

    // States the final total, not the value at the anchor column: the point of
    // the label is "you invested $13,000 altogether".
    //
    // Not "What you put in": on Challenge 3 the student has just typed a guess
    // into the table beside this chart, and that phrasing reads as the number
    // they entered rather than the money in the scenario.
    const totalContributed = data[data.length - 1].totalContributions;
    bandLabel(
      contribMid,
      'var(--ngpf-royal-blue)',
      `Money you invested: ${formatCurrency(Math.round(totalContributed))}`,
    );
    bandLabel(interestMid, 'var(--ngpf-sky-blue)', 'Interest earned');
  }

  /**
   * Write each series' final value at the end of its line, in the line's own
   * colour, so the numbers live where the shapes are instead of in a separate
   * row of cards the student has to scroll to and mentally re-pair.
   */
  private renderEndpointLabels(dims: ChartDimensions, scales: ChartScales): void {
    if (!this.showEndpointLabels()) return;

    const layer = this.chartGroup.select('.bracket-layer');
    const offset = this.resultBStartYear();

    const label = (
      point: YearlyDataPoint,
      xYear: number,
      color: string,
      seriesName: string,
    ) => {
      const x = scales.x(xYear) + 10;
      const text = layer
        .append('text')
        .attr('class', 'endpoint-label')
        .attr('x', x)
        .attr('y', scales.y(point.compoundBalance))
        .attr('dominant-baseline', 'middle')
        .attr('font-family', 'var(--ngpf-font-heading)')
        .attr('font-size', '0.85rem')
        .attr('font-weight', '700')
        .attr('fill', color);
      if (seriesName) {
        text.append('tspan').attr('font-weight', '500').text(`${seriesName} `);
      }
      text.append('tspan').text(formatCurrency(Math.round(point.compoundBalance)));

      // Pull the label back inside if it would run past the SVG edge. Series
      // names and figures both vary, so clamp by measurement rather than
      // trusting the right margin to be wide enough for whatever is passed in.
      const node = text.node();
      if (node) {
        const width = node.getBBox().width;
        const maxX = dims.width - REVEAL_MARGIN.left - width - 2;
        if (x > maxX) text.attr('x', Math.max(0, maxX));
      }
      return text;
    };

    const dataA = this.result().dataPoints;
    const lastA = dataA[dataA.length - 1];
    label(lastA, lastA.year, 'var(--ngpf-sky-blue)', this.seriesALabel());

    const dataB = this.resultB()?.dataPoints;
    if (dataB) {
      const lastB = dataB[dataB.length - 1];
      label(lastB, lastB.year + offset, 'var(--ngpf-gold)', this.seriesBLabel());
    }

    const dur = this.reducedMotion() ? 0 : 300;
    if (dur > 0) {
      layer.selectAll('.endpoint-label').attr('opacity', 0)
        .transition().duration(dur).attr('opacity', 1);
    }
  }

  private renderGapBracket(dims: ChartDimensions, scales: ChartScales): void {
    const bracketLayer = this.chartGroup.select('.bracket-layer');
    bracketLayer.selectAll('*').remove();

    // Endpoint labels already state both totals; the bracket would be a third
    // rendering of the same comparison.
    if (this.showEndpointLabels()) {
      this.renderEndpointLabels(dims, scales);
      return;
    }

    const m = this.mode();

    if (m === 'single') {
      // Gap between prediction and actual
      this.renderPredictionGapBracket(scales);
    } else if (m === 'dual') {
      // Gap between result A and result B
      this.renderDualGapBracket(scales);
    }
    // No bracket for stacked mode
  }

  private renderPredictionGapBracket(scales: ChartScales): void {
    const pp = this.predictionPoints();
    if (pp.length === 0) return;

    const lastPred = pp[pp.length - 1];
    const lastData = this.result().dataPoints;
    const actualLast = lastData[lastData.length - 1];
    const gap = actualLast.compoundBalance - lastPred.value;
    if (Math.abs(gap) < 100) return;

    this.drawBracket(
      scales,
      scales.x(actualLast.year),
      scales.y(lastPred.value),
      scales.y(actualLast.compoundBalance),
      gap,
    );
  }

  private renderDualGapBracket(scales: ChartScales): void {
    const dataB = this.resultB()?.dataPoints;
    if (!dataB) return;

    const dataA = this.result().dataPoints;
    const lastA = dataA[dataA.length - 1];
    const lastB = dataB[dataB.length - 1];
    const offset = this.resultBStartYear();
    const gap = lastB.compoundBalance - lastA.compoundBalance;
    if (Math.abs(gap) < 100) return;

    this.drawBracket(
      scales,
      scales.x(Math.max(lastA.year, lastB.year + offset)),
      scales.y(lastA.compoundBalance),
      scales.y(lastB.compoundBalance),
      gap,
    );
  }

  private drawBracket(
    scales: ChartScales,
    x: number,
    y1: number,
    y2: number,
    gap: number,
  ): void {
    const bracketLayer = this.chartGroup.select('.bracket-layer');
    const bracketG = bracketLayer.append('g');

    bracketG.append('line')
      .attr('x1', x + 12).attr('x2', x + 12)
      .attr('y1', y1).attr('y2', y2)
      .attr('stroke', 'var(--ngpf-gold)').attr('stroke-width', 2);

    bracketG.append('line')
      .attr('x1', x + 8).attr('x2', x + 16)
      .attr('y1', Math.min(y1, y2)).attr('y2', Math.min(y1, y2))
      .attr('stroke', 'var(--ngpf-gold)').attr('stroke-width', 2);

    bracketG.append('line')
      .attr('x1', x + 8).attr('x2', x + 16)
      .attr('y1', Math.max(y1, y2)).attr('y2', Math.max(y1, y2))
      .attr('stroke', 'var(--ngpf-gold)').attr('stroke-width', 2);

    bracketG.append('text')
      .attr('class', 'gap-bracket')
      .attr('x', x + 20)
      .attr('y', (y1 + y2) / 2)
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--ngpf-navy-blue)')
      .text(`${gap > 0 ? '+' : ''}${formatCurrency(Math.round(Math.abs(gap)))}`);

    const dur = this.reducedMotion() ? 0 : 400;
    if (dur > 0) {
      bracketG.attr('opacity', 0)
        .transition().duration(dur).attr('opacity', 1);
    }
  }

  private renderResultBLine(scales: ChartScales): void {
    const dataB = this.resultB()?.dataPoints;
    if (!dataB) return;

    const lineLayer = this.chartGroup.select('.line-layer');
    const m = this.mode();
    const offset = this.resultBStartYear();

    const lineGen = d3.line<YearlyDataPoint>()
      .x((d) => scales.x(d.year + offset))
      .y((d) => scales.y(d.compoundBalance))
      .curve(d3.curveMonotoneX);

    const isReference = m === 'stacked';
    const stroke = isReference ? '#999' : 'var(--ngpf-gold)';
    const strokeWidth = isReference ? 2 : 2.5;

    const path = lineLayer.append('path')
      .attr('d', lineGen(dataB))
      .attr('fill', 'none')
      .attr('stroke', stroke)
      .attr('stroke-width', strokeWidth);

    if (isReference) {
      path.attr('stroke-dasharray', '6,4').attr('opacity', 0.5);

      // Endpoint labels already name and value this line; drawing the
      // reference caption too would print the same figure twice.
      if (this.showEndpointLabels()) return;

      // Add reference label
      const lastPoint = dataB[dataB.length - 1];
      lineLayer.append('text')
        .attr('x', scales.x(lastPoint.year + offset) - 8)
        .attr('y', scales.y(lastPoint.compoundBalance) - 10)
        .attr('text-anchor', 'end')
        .attr('font-family', 'var(--ngpf-font-body)')
        .attr('font-size', '0.7rem')
        .attr('fill', '#999')
        .text(`Lump sum only: ${formatCurrency(Math.round(lastPoint.compoundBalance))}`);
    }

    const dur = this.reducedMotion() ? 0 : 1500;
    if (dur > 0 && !isReference) {
      const node = path.node()!;
      const len = node.getTotalLength();
      path
        .attr('stroke-dasharray', `${len}`)
        .attr('stroke-dashoffset', `${len}`)
        .transition().duration(dur).ease(d3.easeLinear)
        .attr('stroke-dashoffset', '0')
        .on('end', () => path.attr('stroke-dasharray', null).attr('stroke-dashoffset', null));
    }
  }

  /** Full static render (no animation) for resizes after initial animation. */
  private renderStatic(): void {
    const ctx = this.getDimsAndScales();
    if (!ctx) return;
    const { dims, scales } = ctx;

    this.chartGroup.select('.ghost-layer').selectAll('*').remove();
    this.chartGroup.select('.area-layer').selectAll('*').remove();
    this.chartGroup.select('.line-layer').selectAll('*').remove();
    this.chartGroup.select('.bracket-layer').selectAll('*').remove();

    this.renderGhost(scales);
    this.renderAreas(dims, scales);

    // Main curve
    const data = this.result().dataPoints;
    const lineGen = d3.line<YearlyDataPoint>()
      .x((d) => scales.x(d.year))
      .y((d) => scales.y(d.compoundBalance))
      .curve(d3.curveMonotoneX);

    this.chartGroup.select('.line-layer').append('path')
      .attr('d', lineGen(data))
      .attr('fill', 'none')
      .attr('stroke', 'var(--ngpf-sky-blue)')
      .attr('stroke-width', 3);

    this.renderResultBLine(scales);
    this.renderGapBracket(dims, scales);
  }
}

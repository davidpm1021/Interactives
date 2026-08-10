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
  readonly animationComplete = output<void>();

  private readonly injector = inject(Injector);
  private readonly chartContainer = viewChild<ElementRef<HTMLDivElement>>('chartContainer');

  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private initialized = false;
  private hasAnimated = false;

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

    const ro = new ResizeObserver(() => {
      if (this.initialized && this.hasAnimated) this.renderStatic();
    });
    ro.observe(container);
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
          this.renderGapBracket(scales);
          if (!isDual) this.renderResultBLine(scales);
          this.hasAnimated = true;
          this.animationComplete.emit();
        });
    } else {
      this.renderGapBracket(scales);
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
  }

  /**
   * Write each series' final value at the end of its line, in the line's own
   * colour, so the numbers live where the shapes are instead of in a separate
   * row of cards the student has to scroll to and mentally re-pair.
   */
  private renderEndpointLabels(scales: ChartScales): void {
    if (!this.showEndpointLabels()) return;

    const layer = this.chartGroup.select('.bracket-layer');
    const offset = this.resultBStartYear();

    const label = (
      point: YearlyDataPoint,
      xYear: number,
      color: string,
      seriesName: string,
    ) => {
      const text = layer
        .append('text')
        .attr('class', 'endpoint-label')
        .attr('x', scales.x(xYear) + 10)
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

  private renderGapBracket(scales: ChartScales): void {
    const bracketLayer = this.chartGroup.select('.bracket-layer');
    bracketLayer.selectAll('*').remove();

    // Endpoint labels already state both totals; the bracket would be a third
    // rendering of the same comparison.
    if (this.showEndpointLabels()) {
      this.renderEndpointLabels(scales);
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
    this.renderGapBracket(scales);
  }
}

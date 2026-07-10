import {
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  effect,
  signal,
  viewChild,
  Injector,
  inject,
} from '@angular/core';
import * as d3 from 'd3';
import { SimulationResult, YearlyDataPoint } from '../../models/compound-interest.models';
import { formatCurrency } from '../../utils/formatters';
import {
  ChartMargin,
  DEFAULT_MARGIN,
  computeChartDimensions,
  createChartSvg,
  createScales,
  renderAxes,
  bindArea,
  bindLine,
} from '../../utils/chart-helpers';

@Component({
  selector: 'app-growth-chart',
  standalone: true,
  imports: [],
  templateUrl: './growth-chart.component.html',
  styleUrl: './growth-chart.component.scss',
})
export class GrowthChartComponent {
  readonly result = input.required<SimulationResult>();
  readonly comparisonResult = input<SimulationResult | null>(null);
  readonly selectedYear = input<number | null>(null);
  readonly showSimpleInterest = input(false);
  readonly isAutoPlaying = input(false);
  readonly yearHover = output<number | null>();

  private readonly injector = inject(Injector);
  private readonly chartContainer = viewChild<ElementRef<HTMLDivElement>>('chartContainer');

  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private tooltip!: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private initialized = false;
  private readonly reducedMotion = signal(false);

  private readonly margin: ChartMargin = DEFAULT_MARGIN;

  constructor() {
    afterNextRender(
      () => {
        this.checkReducedMotion();
        this.initChart();
        this.initialized = true;
      },
      { injector: this.injector },
    );

    effect(() => {
      const data = this.result();
      const comparison = this.comparisonResult();
      const simple = this.showSimpleInterest();
      const year = this.selectedYear();
      const autoPlay = this.isAutoPlaying();
      if (this.initialized) {
        this.updateChart(data, comparison, simple, year, autoPlay);
      }
    });
  }

  private checkReducedMotion(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion.set(mq.matches);
    mq.addEventListener('change', (e) => this.reducedMotion.set(e.matches));
  }

  private getTransitionDuration(isAutoPlaying: boolean): number {
    if (this.reducedMotion()) return 0;
    return isAutoPlaying ? 0 : 400;
  }

  private initChart(): void {
    const container = this.chartContainer()?.nativeElement;
    if (!container) return;

    const result = createChartSvg(container, this.margin);
    this.svg = result.svg;
    this.chartGroup = result.chartGroup;
    this.tooltip = result.tooltip;

    const ro = new ResizeObserver(() => {
      if (this.initialized) {
        this.updateChart(
          this.result(),
          this.comparisonResult(),
          this.showSimpleInterest(),
          this.selectedYear(),
          this.isAutoPlaying(),
        );
      }
    });
    ro.observe(container);

    this.updateChart(
      this.result(),
      this.comparisonResult(),
      this.showSimpleInterest(),
      this.selectedYear(),
      this.isAutoPlaying(),
    );
  }

  private updateChart(
    result: SimulationResult,
    comparison: SimulationResult | null,
    showSimple: boolean,
    selectedYear: number | null,
    isAutoPlaying: boolean,
  ): void {
    const container = this.chartContainer()?.nativeElement;
    if (!container || !this.svg) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return;

    const dims = computeChartDimensions(rect.width, this.margin);
    this.svg.attr('viewBox', `0 0 ${dims.width} ${dims.height}`);

    this.chartGroup
      .select('.overlay')
      .attr('width', dims.innerWidth)
      .attr('height', dims.innerHeight);

    const allData = result.dataPoints;
    const allDataForScale = comparison ? [...allData, ...comparison.dataPoints] : allData;

    const maxYear = Math.max(...allDataForScale.map((d) => d.year));
    const maxBalance = Math.max(
      ...allDataForScale.map((d) => Math.max(d.compoundBalance, d.simpleBalance)),
    );

    const scales = createScales(
      dims.innerWidth,
      dims.innerHeight,
      [0, maxYear],
      [0, maxBalance * 1.1],
    );

    const displayYear = selectedYear ?? maxYear;
    const data = allData.filter((d) => d.year <= displayYear);
    const dur = this.getTransitionDuration(isAutoPlaying);

    renderAxes(this.chartGroup, scales, dims.innerHeight, maxYear, dur, (d) =>
      formatCurrency(d, true),
    );

    // Area generators
    const contributionArea = d3
      .area<YearlyDataPoint>()
      .x((d) => scales.x(d.year))
      .y0(dims.innerHeight)
      .y1((d) => scales.y(d.totalContributions))
      .curve(d3.curveMonotoneX);

    const balanceArea = d3
      .area<YearlyDataPoint>()
      .x((d) => scales.x(d.year))
      .y0((d) => scales.y(d.totalContributions))
      .y1((d) => scales.y(d.compoundBalance))
      .curve(d3.curveMonotoneX);

    const areaLayer = this.chartGroup.select('.area-layer');
    const lineLayer = this.chartGroup.select('.line-layer');
    const markerLayer = this.chartGroup.select('.marker-layer');

    // Contributions area
    bindArea(areaLayer, 'contributions-area', data, contributionArea, 'var(--ngpf-royal-blue)', 0.25, dur);
    bindArea(areaLayer, 'contributions-pattern', data, contributionArea, 'url(#pattern-contributions)', 1, dur);

    // Interest earned area
    bindArea(areaLayer, 'interest-area', data, balanceArea, 'var(--ngpf-sky-blue)', 0.35, dur);
    bindArea(areaLayer, 'interest-pattern', data, balanceArea, 'url(#pattern-interest)', 1, dur);

    // Balance line
    const balanceLine = d3
      .line<YearlyDataPoint>()
      .x((d) => scales.x(d.year))
      .y((d) => scales.y(d.compoundBalance))
      .curve(d3.curveMonotoneX);

    bindLine(lineLayer, 'balance-line', data, balanceLine, 'var(--ngpf-sky-blue)', '2.5', '', dur);

    // Simple interest line (toggle)
    if (showSimple) {
      const simpleLine = d3
        .line<YearlyDataPoint>()
        .x((d) => scales.x(d.year))
        .y((d) => scales.y(d.simpleBalance))
        .curve(d3.curveMonotoneX);

      bindLine(lineLayer, 'simple-line', data, simpleLine, 'var(--ngpf-gold)', '2', '6,4', dur);
    } else {
      lineLayer.selectAll('.simple-line').remove();
    }

    // Comparison result
    if (comparison) {
      const compData = comparison.dataPoints;

      const compBalanceLine = d3
        .line<YearlyDataPoint>()
        .x((d) => scales.x(d.year))
        .y((d) => scales.y(d.compoundBalance))
        .curve(d3.curveMonotoneX);

      const compArea = d3
        .area<YearlyDataPoint>()
        .x((d) => scales.x(d.year))
        .y0(dims.innerHeight)
        .y1((d) => scales.y(d.compoundBalance))
        .curve(d3.curveMonotoneX);

      bindArea(areaLayer, 'comparison-area', compData, compArea, 'var(--ngpf-gold)', 0.15, dur);
      bindLine(lineLayer, 'comparison-line', compData, compBalanceLine, 'var(--ngpf-gold)', '2.5', '', dur);
    } else {
      areaLayer.selectAll('.comparison-area').remove();
      lineLayer.selectAll('.comparison-line').remove();
    }

    // Selected year marker — reuse elements to avoid flicker
    if (selectedYear !== null) {
      const dp = data.find((d) => d.year === selectedYear);
      if (dp) {
        const cx = scales.x(dp.year);
        const cy = scales.y(dp.compoundBalance);

        let circle = markerLayer.select<SVGCircleElement>('.year-marker-dot');
        if (circle.empty()) {
          circle = markerLayer.append('circle')
            .attr('class', 'year-marker-dot')
            .attr('r', 6)
            .attr('fill', 'var(--ngpf-sky-blue)')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);
        }
        circle.attr('cx', cx).attr('cy', cy);

        let vline = markerLayer.select<SVGLineElement>('.year-marker-line');
        if (vline.empty()) {
          vline = markerLayer.append('line')
            .attr('class', 'year-marker-line')
            .attr('stroke', 'var(--ngpf-navy-blue)')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,4')
            .attr('opacity', 0.4);
        }
        vline.attr('x1', cx).attr('x2', cx).attr('y1', 0).attr('y2', dims.innerHeight);
      }
    } else {
      markerLayer.selectAll('.year-marker-dot, .year-marker-line').remove();
    }

    // Mouse events
    const maxDisplayedYear = displayYear;
    this.chartGroup
      .select('.overlay')
      .on('mousemove', (event: MouseEvent) => {
        const [mx] = d3.pointer(event);
        const yearVal = Math.round(scales.x.invert(mx));
        const clampedYear = Math.max(0, Math.min(maxDisplayedYear, yearVal));
        const dp = data.find((d) => d.year === clampedYear);
        if (dp) {
          this.showTooltip(dp, comparison, event, container);
          this.yearHover.emit(clampedYear);
        }
      })
      .on('mouseleave', () => {
        this.hideTooltip();
        this.yearHover.emit(null);
      });

    // ARIA label
    const ariaLabel = `Growth chart showing ${formatCurrency(result.summary.finalBalance)} after ${maxYear} years`;
    this.svg.attr('aria-label', ariaLabel).attr('role', 'img');
  }

  private showTooltip(
    dp: YearlyDataPoint,
    comparison: SimulationResult | null,
    event: MouseEvent,
    container: HTMLElement,
  ): void {
    const containerRect = container.getBoundingClientRect();
    const x = event.clientX - containerRect.left + 15;
    const y = event.clientY - containerRect.top - 10;

    let html = `
      <strong>Year ${dp.year}</strong><br/>
      Balance: ${formatCurrency(dp.compoundBalance)}<br/>
      Contributed: ${formatCurrency(dp.totalContributions)}<br/>
      Interest: ${formatCurrency(dp.totalInterestEarned)}
    `;

    if (comparison) {
      const compDp = comparison.dataPoints.find((d) => d.year === dp.year);
      if (compDp) {
        html += `<br/><hr style="margin:4px 0;border-color:#ddd"/>
          <strong>Comparison</strong><br/>
          Balance: ${formatCurrency(compDp.compoundBalance)}`;
      }
    }

    this.tooltip
      .html(html)
      .style('left', `${x}px`)
      .style('top', `${y}px`)
      .style('opacity', '1');
  }

  private hideTooltip(): void {
    this.tooltip.style('opacity', '0');
  }
}

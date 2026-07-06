import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import * as d3 from 'd3';
import { ChartPoint, RetirementProjection } from '../../models/retirement.models';
import { formatCurrency } from '../../utils/formatters';
import { computeChartDimensions, createScales, DEFAULT_MARGIN } from '../../utils/chart-helpers';

@Component({
  selector: 'app-growth-chart',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './growth-chart.html',
  styleUrl: './growth-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrowthChart {
  readonly projection = input.required<RetirementProjection>();

  protected readonly view = signal<'graph' | 'table'>('graph');

  private readonly injector = inject(Injector);
  private readonly container = viewChild<ElementRef<HTMLDivElement>>('container');

  private svg?: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup?: d3.Selection<SVGGElement, unknown, null, undefined>;
  private readonly initialized = signal(false);

  constructor() {
    afterNextRender(
      () => {
        this.initChart();
        this.initialized.set(true);
      },
      { injector: this.injector },
    );

    effect(() => {
      const p = this.projection();
      const isGraph = this.view() === 'graph';
      if (this.initialized() && p && isGraph) {
        // If the container just remounted (returning from table view), the
        // svg selection may be stale. Re-init on demand.
        if (!this.container()?.nativeElement?.querySelector('svg')) {
          this.svg = undefined;
          this.chartGroup = undefined;
          this.initChart();
        } else {
          this.render(p);
        }
      }
    });
  }

  private initChart(): void {
    const el = this.container()?.nativeElement;
    if (!el) return;

    this.svg = d3.select(el).append('svg').attr('class', 'growth-chart__svg');

    this.chartGroup = this.svg
      .append('g')
      .attr('transform', `translate(${DEFAULT_MARGIN.left},${DEFAULT_MARGIN.top})`);

    this.chartGroup.append('g').attr('class', 'x-axis');
    this.chartGroup.append('g').attr('class', 'y-axis');
    this.chartGroup.append('g').attr('class', 'actual-area-layer');
    this.chartGroup.append('g').attr('class', 'target-line-layer');
    this.chartGroup.append('g').attr('class', 'actual-line-layer');
    this.chartGroup.append('g').attr('class', 'retirement-marker-layer');

    const ro = new ResizeObserver(() => this.render(this.projection()));
    ro.observe(el);

    this.render(this.projection());
  }

  private render(p: RetirementProjection): void {
    const el = this.container()?.nativeElement;
    if (!el || !this.svg || !this.chartGroup) return;

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;

    const dims = computeChartDimensions(rect.width, DEFAULT_MARGIN, 0.55, 320, 480);
    this.svg.attr('viewBox', `0 0 ${dims.width} ${dims.height}`);

    const data = p.chartData;
    if (data.length === 0) return;

    const minAge = data[0].age;
    const maxAge = data[data.length - 1].age;
    const maxValue =
      Math.max(...data.map((d) => Math.max(d.actual, d.target))) * 1.05;

    const scales = createScales(
      dims.innerWidth,
      dims.innerHeight,
      [minAge, maxAge],
      [0, maxValue],
    );

    const xAxis = d3
      .axisBottom(scales.x)
      .ticks(Math.min(maxAge - minAge, 8))
      .tickFormat((d) => `${d}`);

    const yAxis = d3
      .axisLeft(scales.y)
      .ticks(6)
      .tickFormat((d) => formatCurrency(d as number, true));

    this.chartGroup
      .select<SVGGElement>('.x-axis')
      .attr('transform', `translate(0,${dims.innerHeight})`)
      .transition()
      .duration(300)
      .call(xAxis);

    this.chartGroup
      .select<SVGGElement>('.y-axis')
      .transition()
      .duration(300)
      .call(yAxis);

    // Retirement-age vertical marker.
    const retirementAge = p.yearlyBalances[p.yearlyBalances.length - 1].age;
    const markerLayer = this.chartGroup.select('.retirement-marker-layer');
    markerLayer.selectAll('*').remove();
    if (retirementAge > minAge && retirementAge < maxAge) {
      markerLayer
        .append('line')
        .attr('x1', scales.x(retirementAge))
        .attr('x2', scales.x(retirementAge))
        .attr('y1', 0)
        .attr('y2', dims.innerHeight)
        .attr('stroke', 'var(--ngpf-light-gray-blue, #d2d8e9)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 3');

      markerLayer
        .append('text')
        .attr('x', scales.x(retirementAge))
        .attr('y', -4)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'var(--ngpf-font-body)')
        .attr('font-size', '0.7rem')
        .attr('fill', 'var(--ngpf-text-muted)')
        .text(`Retirement (age ${retirementAge})`);
    }

    // Area under the projected-balance line.
    const areaGen = d3
      .area<ChartPoint>()
      .x((d) => scales.x(d.age))
      .y0(dims.innerHeight)
      .y1((d) => scales.y(d.actual))
      .curve(d3.curveMonotoneX);

    const areaLayer = this.chartGroup.select('.actual-area-layer');
    areaLayer.selectAll('path').remove();
    areaLayer
      .append('path')
      .attr('d', areaGen(data))
      .attr('fill', 'var(--ngpf-royal-blue, #1f3b9b)')
      .attr('opacity', 0.12);

    // Projected balance: solid royal-blue.
    const actualLine = d3
      .line<ChartPoint>()
      .x((d) => scales.x(d.age))
      .y((d) => scales.y(d.actual))
      .curve(d3.curveMonotoneX);

    const actualLayer = this.chartGroup.select('.actual-line-layer');
    actualLayer.selectAll('*').remove();
    actualLayer
      .append('path')
      .attr('d', actualLine(data))
      .attr('fill', 'none')
      .attr('stroke', 'var(--ngpf-royal-blue, #1f3b9b)')
      .attr('stroke-width', 2.5);

    // Target balance: dashed orange.
    const targetLine = d3
      .line<ChartPoint>()
      .x((d) => scales.x(d.age))
      .y((d) => scales.y(d.target))
      .curve(d3.curveMonotoneX);

    const targetLayer = this.chartGroup.select('.target-line-layer');
    targetLayer.selectAll('*').remove();
    targetLayer
      .append('path')
      .attr('d', targetLine(data))
      .attr('fill', 'none')
      .attr('stroke', 'var(--ngpf-orange, #f78219)')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '6 4');

    this.svg
      .attr('role', 'img')
      .attr(
        'aria-label',
        `Two lines from age ${minAge} to age ${maxAge}. Projected balance peaks at ${formatCurrency(p.finalBalance)} at retirement. Target balance peaks at ${formatCurrency(p.targetNestEgg)}.`,
      );
  }
}

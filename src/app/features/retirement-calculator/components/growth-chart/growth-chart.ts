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
import * as d3 from 'd3';
import { RetirementProjection, YearlyBalance } from '../../models/retirement.models';
import { formatCurrency } from '../../utils/formatters';
import { computeChartDimensions, createScales, DEFAULT_MARGIN } from '../../utils/chart-helpers';

@Component({
  selector: 'app-growth-chart',
  standalone: true,
  imports: [],
  templateUrl: './growth-chart.html',
  styleUrl: './growth-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrowthChart {
  readonly projection = input.required<RetirementProjection>();

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
      // Read projection to establish dependency
      const p = this.projection();
      if (this.initialized() && p) {
        this.render(p);
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
    this.chartGroup.append('g').attr('class', 'target-layer');
    this.chartGroup.append('g').attr('class', 'area-layer');
    this.chartGroup.append('g').attr('class', 'line-layer');

    const ro = new ResizeObserver(() => this.render(this.projection()));
    ro.observe(el);

    this.render(this.projection());
  }

  private render(p: RetirementProjection): void {
    const el = this.container()?.nativeElement;
    if (!el || !this.svg || !this.chartGroup) return;

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;

    const dims = computeChartDimensions(rect.width, DEFAULT_MARGIN, 0.55, 280, 440);
    this.svg.attr('viewBox', `0 0 ${dims.width} ${dims.height}`);

    const data = p.yearlyBalances;
    if (data.length === 0) return;

    const minAge = data[0].age;
    const maxAge = data[data.length - 1].age;
    const maxBalance = Math.max(p.targetNestEgg, ...data.map((d) => d.balance)) * 1.05;

    const scales = createScales(dims.innerWidth, dims.innerHeight, [minAge, maxAge], [0, maxBalance]);

    // X-axis: age
    const xAxis = d3
      .axisBottom(scales.x)
      .ticks(Math.min(maxAge - minAge, 10))
      .tickFormat((d) => `${d}`);

    // Y-axis: currency compact
    const yAxis = d3
      .axisLeft(scales.y)
      .ticks(5)
      .tickFormat((d) => formatCurrency(d as number, true));

    this.chartGroup
      .select<SVGGElement>('.x-axis')
      .attr('transform', `translate(0,${dims.innerHeight})`)
      .transition()
      .duration(300)
      .call(xAxis);

    this.chartGroup.select<SVGGElement>('.y-axis').transition().duration(300).call(yAxis);

    // Target line (dashed)
    const targetLayer = this.chartGroup.select('.target-layer');
    targetLayer.selectAll('*').remove();
    if (p.targetNestEgg > 0 && p.targetNestEgg <= maxBalance) {
      targetLayer
        .append('line')
        .attr('x1', 0)
        .attr('x2', dims.innerWidth)
        .attr('y1', scales.y(p.targetNestEgg))
        .attr('y2', scales.y(p.targetNestEgg))
        .attr('stroke', 'var(--ngpf-gold, #d68b0a)')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5 4');

      targetLayer
        .append('text')
        .attr('x', dims.innerWidth - 6)
        .attr('y', scales.y(p.targetNestEgg) - 6)
        .attr('text-anchor', 'end')
        .attr('font-family', 'var(--ngpf-font-body)')
        .attr('font-size', '0.75rem')
        .attr('fill', 'var(--ngpf-gold, #d68b0a)')
        .text(`Target: ${formatCurrency(p.targetNestEgg, true)}`);
    }

    // Area under balance
    const areaGen = d3
      .area<YearlyBalance>()
      .x((d) => scales.x(d.age))
      .y0(dims.innerHeight)
      .y1((d) => scales.y(d.balance))
      .curve(d3.curveMonotoneX);

    const areaLayer = this.chartGroup.select('.area-layer');
    areaLayer.selectAll('path').remove();
    areaLayer
      .append('path')
      .attr('d', areaGen(data))
      .attr('fill', 'var(--ngpf-sky-blue)')
      .attr('opacity', 0.18);

    // Balance line
    const lineGen = d3
      .line<YearlyBalance>()
      .x((d) => scales.x(d.age))
      .y((d) => scales.y(d.balance))
      .curve(d3.curveMonotoneX);

    const lineLayer = this.chartGroup.select('.line-layer');
    lineLayer.selectAll('*').remove();
    lineLayer
      .append('path')
      .attr('d', lineGen(data))
      .attr('fill', 'none')
      .attr('stroke', 'var(--ngpf-bright-blue)')
      .attr('stroke-width', 3);

    // Endpoint dot
    const last = data[data.length - 1];
    lineLayer
      .append('circle')
      .attr('cx', scales.x(last.age))
      .attr('cy', scales.y(last.balance))
      .attr('r', 5)
      .attr('fill', 'var(--ngpf-bright-blue)')
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    this.svg
      .attr('role', 'img')
      .attr(
        'aria-label',
        `Growth chart. Balance at age ${last.age}: ${formatCurrency(last.balance)}. Target: ${formatCurrency(p.targetNestEgg)}.`,
      );
  }
}

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

interface HoverPoint {
  age: number;
  actual: number;
  target: number;
  phase: ChartPoint['phase'];
}

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
  protected readonly hover = signal<HoverPoint | null>(null);
  protected readonly tooltipPos = signal<{ left: number; top: number } | null>(null);
  protected readonly tooltipAnchor = signal<'left' | 'center' | 'right'>('center');
  protected readonly hoverAnnouncement = signal('');

  protected formatCurrencyFull(v: number): string {
    return formatCurrency(v);
  }

  private readonly injector = inject(Injector);
  private readonly container = viewChild<ElementRef<HTMLDivElement>>('container');

  private svg?: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup?: d3.Selection<SVGGElement, unknown, null, undefined>;
  private readonly initialized = signal(false);
  private renderState?: {
    minAge: number;
    maxAge: number;
    setHoverAtAge: (age: number) => void;
    clearHover: () => void;
  };

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
    this.chartGroup.append('g').attr('class', 'hover-layer');
    // Invisible mouse-capture rect covering the plot area.
    this.chartGroup
      .append('rect')
      .attr('class', 'hover-capture')
      .attr('fill', 'transparent');

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

    // ── Hover interaction ────────────────────────────────────────────────
    const capture = this.chartGroup
      .select<SVGRectElement>('.hover-capture')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', dims.innerWidth)
      .attr('height', dims.innerHeight);

    const hoverLayer = this.chartGroup.select('.hover-layer');
    const containerEl = el;

    const setHoverAtAge = (rawAge: number) => {
      const clampedAge = Math.max(minAge, Math.min(maxAge, Math.round(rawAge)));
      const point = data.find((d) => d.age === clampedAge);
      if (!point) return;

      this.hover.set({
        age: clampedAge,
        actual: point.actual,
        target: point.target,
        phase: point.phase,
      });
      this.hoverAnnouncement.set(
        `Age ${clampedAge}: projected ${formatCurrency(point.actual)}, target ${formatCurrency(point.target)}.`,
      );

      hoverLayer.selectAll('*').remove();
      const cx = scales.x(clampedAge);
      hoverLayer
        .append('line')
        .attr('x1', cx)
        .attr('x2', cx)
        .attr('y1', 0)
        .attr('y2', dims.innerHeight)
        .attr('stroke', 'var(--ngpf-text-muted, #888)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 3');

      hoverLayer
        .append('circle')
        .attr('cx', cx)
        .attr('cy', scales.y(point.actual))
        .attr('r', 5)
        .attr('fill', 'var(--ngpf-royal-blue, #1f3b9b)')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      hoverLayer
        .append('circle')
        .attr('cx', cx)
        .attr('cy', scales.y(point.target))
        .attr('r', 5)
        .attr('fill', 'var(--ngpf-orange, #f78219)')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Position tooltip in container-relative px so it survives viewBox scaling.
      const containerRect = containerEl.getBoundingClientRect();
      const scaleX = containerRect.width / dims.width;
      const scaleY = containerRect.height / dims.height;
      const leftPx = (DEFAULT_MARGIN.left + cx) * scaleX;
      const topPx = DEFAULT_MARGIN.top * scaleY;
      this.tooltipPos.set({ left: leftPx, top: topPx });

      // Flip anchor near the edges so the tooltip body stays inside the container.
      const edgeBudget = 130;
      if (leftPx < edgeBudget) this.tooltipAnchor.set('left');
      else if (containerRect.width - leftPx < edgeBudget) this.tooltipAnchor.set('right');
      else this.tooltipAnchor.set('center');
    };

    const clearHover = () => {
      this.hover.set(null);
      this.tooltipPos.set(null);
      this.hoverAnnouncement.set('');
      hoverLayer.selectAll('*').remove();
    };

    const handleMove = (event: MouseEvent) => {
      const [mx] = d3.pointer(event, capture.node()!);
      const age = scales.x.invert(mx);
      setHoverAtAge(age);
    };

    capture.on('mousemove', handleMove).on('mouseleave', clearHover);

    this.renderState = { minAge, maxAge, setHoverAtAge, clearHover };

    this.svg
      .attr('tabindex', 0)
      .on('keydown', (event: KeyboardEvent) => this.onSvgKeydown(event))
      .on('focus', () => {
        const state = this.renderState;
        if (!state) return;
        const current = this.hover()?.age ?? state.minAge;
        state.setHoverAtAge(current);
      })
      .on('blur', () => this.renderState?.clearHover());
  }

  private onSvgKeydown(event: KeyboardEvent): void {
    const state = this.renderState;
    if (!state) return;
    const current = this.hover()?.age ?? state.minAge;
    let next = current;
    const key = event.key;
    if (key === 'ArrowRight' || key === 'ArrowUp') next = Math.min(state.maxAge, current + 1);
    else if (key === 'ArrowLeft' || key === 'ArrowDown') next = Math.max(state.minAge, current - 1);
    else if (key === 'Home') next = state.minAge;
    else if (key === 'End') next = state.maxAge;
    else if (key === 'Escape') { state.clearHover(); event.preventDefault(); return; }
    else return;
    event.preventDefault();
    state.setHoverAtAge(next);
  }
}

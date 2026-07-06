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
import { RateSeries } from '../../models/rates.models';
import { computeChartDimensions, DEFAULT_MARGIN } from '../../utils/chart-helpers';

// Wider right margin than the default so end-of-line "21%"-style labels
// fit inside the chart's viewBox instead of getting clipped.
const CHART_MARGIN = { ...DEFAULT_MARGIN, right: 58 };

const SERIES_COLORS: Record<string, string> = {
  'credit-card': '#c62828',
  'personal-loan': '#e28f10',
  'auto-loan': '#1f78b4',
  'mortgage': '#33a02c',
};

interface HoverPoint {
  year: number;
  values: { id: string; label: string; value: number; color: string }[];
}

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [],
  templateUrl: './trend-chart.html',
  styleUrl: './trend-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendChart {
  readonly series = input.required<RateSeries[]>();

  protected readonly hover = signal<HoverPoint | null>(null);
  protected readonly tooltipPos = signal<{ left: number; top: number } | null>(null);
  protected readonly hoverAnnouncement = signal('');

  private readonly injector = inject(Injector);
  private readonly container = viewChild<ElementRef<HTMLDivElement>>('container');
  private svg?: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup?: d3.Selection<SVGGElement, unknown, null, undefined>;
  private readonly initialized = signal(false);
  private renderState?: {
    minYear: number;
    maxYear: number;
    setHoverAtYear: (year: number) => void;
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
      const s = this.series();
      if (this.initialized() && s.length > 0) {
        this.render(s);
      }
    });
  }

  protected colorFor(id: string): string {
    return SERIES_COLORS[id] ?? '#666';
  }

  private initChart(): void {
    const el = this.container()?.nativeElement;
    if (!el) return;
    this.svg = d3.select(el).append('svg').attr('class', 'trend-chart__svg');
    this.chartGroup = this.svg
      .append('g')
      .attr('transform', `translate(${CHART_MARGIN.left},${CHART_MARGIN.top})`);
    this.chartGroup.append('g').attr('class', 'x-axis');
    this.chartGroup.append('g').attr('class', 'y-axis');
    this.chartGroup.append('g').attr('class', 'line-layer');
    this.chartGroup.append('g').attr('class', 'label-layer');
    this.chartGroup.append('g').attr('class', 'hover-layer');
    // Overlay rect captures mouse events across the whole plot area.
    this.chartGroup
      .append('rect')
      .attr('class', 'hover-capture')
      .attr('fill', 'transparent');

    const ro = new ResizeObserver(() => this.render(this.series()));
    ro.observe(el);

    this.render(this.series());
  }

  private render(seriesList: RateSeries[]): void {
    const el = this.container()?.nativeElement;
    if (!el || !this.svg || !this.chartGroup) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;

    const dims = computeChartDimensions(rect.width, CHART_MARGIN, 0.55, 280, 400);
    this.svg.attr('viewBox', `0 0 ${dims.width} ${dims.height}`);

    let minYear = Infinity, maxYear = -Infinity, maxValue = 0;
    for (const s of seriesList) {
      for (const h of s.history) {
        if (h.year < minYear) minYear = h.year;
        if (h.year > maxYear) maxYear = h.year;
        if (h.value > maxValue) maxValue = h.value;
      }
    }
    if (!Number.isFinite(minYear)) return;

    const yMax = Math.ceil((maxValue + 1) / 5) * 5;

    const x = d3.scaleLinear().domain([minYear, maxYear]).range([0, dims.innerWidth]);
    const y = d3.scaleLinear().domain([0, yMax]).range([dims.innerHeight, 0]);

    const xAxis = d3.axisBottom(x).ticks(6).tickFormat((d) => `${d}`);
    const yAxis = d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}%`);

    this.chartGroup
      .select<SVGGElement>('.x-axis')
      .attr('transform', `translate(0,${dims.innerHeight})`)
      .transition()
      .duration(300)
      .call(xAxis);

    this.chartGroup.select<SVGGElement>('.y-axis').transition().duration(300).call(yAxis);

    const lineGen = d3
      .line<{ year: number; value: number }>()
      .x((d) => x(d.year))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    const lineLayer = this.chartGroup.select('.line-layer');
    lineLayer.selectAll('*').remove();

    for (const s of seriesList) {
      lineLayer
        .append('path')
        .attr('d', lineGen(s.history))
        .attr('fill', 'none')
        .attr('stroke', this.colorFor(s.id))
        .attr('stroke-width', 2.5)
        .attr('opacity', 0.9);
    }

    // End-of-line labels. Show each series' current value and a dot at the
    // right edge so students can read Q1, Q2, Q4, and Q5 straight off the
    // chart without cross-referencing the sidebar table. Labels stack
    // vertically when adjacent series overlap (personal loan / auto loan
    // often within 4 points).
    const labelLayer = this.chartGroup.select('.label-layer');
    labelLayer.selectAll('*').remove();

    const endPoints = seriesList
      .map((s) => {
        const last = s.history[s.history.length - 1];
        return { id: s.id, label: s.label, value: last.value, year: last.year };
      })
      .sort((a, b) => b.value - a.value);

    // Prevent overlapping labels by nudging each label above the y-coord of
    // its natural position when it would collide with the label above it.
    const minGap = 14;
    const labelYs: number[] = [];
    for (let i = 0; i < endPoints.length; i++) {
      let yPx = y(endPoints[i].value);
      if (i > 0) {
        const prev = labelYs[i - 1];
        if (yPx - prev < minGap) yPx = prev + minGap;
      }
      labelYs.push(yPx);
    }

    endPoints.forEach((p, i) => {
      const cx = x(p.year);
      const cy = y(p.value);
      const labelY = labelYs[i];

      // Dot marker exactly at the data point.
      labelLayer
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 3.5)
        .attr('fill', this.colorFor(p.id))
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5);

      // Value label to the right of the dot.
      labelLayer
        .append('text')
        .attr('x', cx + 8)
        .attr('y', labelY + 4)
        .attr('font-family', 'var(--ngpf-font-heading)')
        .attr('font-size', '11')
        .attr('font-weight', '700')
        .attr('fill', this.colorFor(p.id))
        .text(`${p.value}%`);
    });

    // Hover behaviour: an invisible rect captures mouse and updates hover().
    const capture = this.chartGroup
      .select<SVGRectElement>('.hover-capture')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', dims.innerWidth)
      .attr('height', dims.innerHeight);

    const hoverLayer = this.chartGroup.select('.hover-layer');
    const containerEl = el;

    const setHoverAtYear = (clampedYear: number) => {
      const values: HoverPoint['values'] = [];
      for (const s of seriesList) {
        const point = s.history.find((h) => h.year === clampedYear);
        if (point) {
          values.push({
            id: s.id,
            label: s.label,
            value: point.value,
            color: this.colorFor(s.id),
          });
        }
      }

      if (values.length === 0) return;

      this.hover.set({ year: clampedYear, values });
      this.hoverAnnouncement.set(
        `${clampedYear}: ` + values.map((v) => `${v.label} ${v.value} percent`).join(', '),
      );

      // Draw crosshair line + dots.
      hoverLayer.selectAll('*').remove();
      const cx = x(clampedYear);
      hoverLayer
        .append('line')
        .attr('x1', cx)
        .attr('x2', cx)
        .attr('y1', 0)
        .attr('y2', dims.innerHeight)
        .attr('stroke', 'var(--ngpf-text-muted, #888)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 3');

      for (const v of values) {
        hoverLayer
          .append('circle')
          .attr('cx', cx)
          .attr('cy', y(v.value))
          .attr('r', 5)
          .attr('fill', v.color)
          .attr('stroke', 'white')
          .attr('stroke-width', 2);
      }

      // Position tooltip in container-relative pixels so it survives viewBox scaling.
      const containerRect = containerEl.getBoundingClientRect();
      const scaleX = containerRect.width / dims.width;
      const scaleY = containerRect.height / dims.height;
      const leftPx = (CHART_MARGIN.left + cx) * scaleX;
      const topPx = CHART_MARGIN.top * scaleY;
      this.tooltipPos.set({ left: leftPx, top: topPx });
    };

    const clearHover = () => {
      this.hover.set(null);
      this.tooltipPos.set(null);
      this.hoverAnnouncement.set('');
      hoverLayer.selectAll('*').remove();
    };

    const handleMove = (event: MouseEvent) => {
      const [mx] = d3.pointer(event, capture.node()!);
      const year = Math.round(x.invert(mx));
      const clampedYear = Math.max(minYear, Math.min(maxYear, year));
      setHoverAtYear(clampedYear);
    };

    capture.on('mousemove', handleMove).on('mouseleave', clearHover);

    this.renderState = { minYear, maxYear, setHoverAtYear, clearHover };

    this.svg
      .attr('role', 'img')
      .attr(
        'aria-label',
        'Twenty-year trend of consumer credit interest rates. Use arrow keys to explore values year by year.',
      )
      .attr('tabindex', 0)
      .on('keydown', (event: KeyboardEvent) => this.onSvgKeydown(event))
      .on('focus', () => {
        // On first focus, place the crosshair at the most recent year.
        const state = this.renderState;
        if (!state) return;
        const current = this.hover()?.year ?? state.maxYear;
        state.setHoverAtYear(current);
      })
      .on('blur', () => this.renderState?.clearHover());
  }

  private onSvgKeydown(event: KeyboardEvent): void {
    const state = this.renderState;
    if (!state) return;
    const current = this.hover()?.year ?? state.maxYear;
    let next = current;
    const key = event.key;
    if (key === 'ArrowRight' || key === 'ArrowUp') next = Math.min(state.maxYear, current + 1);
    else if (key === 'ArrowLeft' || key === 'ArrowDown') next = Math.max(state.minYear, current - 1);
    else if (key === 'Home') next = state.minYear;
    else if (key === 'End') next = state.maxYear;
    else if (key === 'Escape') { state.clearHover(); event.preventDefault(); return; }
    else return;
    event.preventDefault();
    state.setHoverAtYear(next);
  }
}

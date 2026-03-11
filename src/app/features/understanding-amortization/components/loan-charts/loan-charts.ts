import {
  Component,
  ElementRef,
  afterNextRender,
  input,
  effect,
  viewChild,
  Injector,
  inject,
} from '@angular/core';
import * as d3 from 'd3';
import { Payment } from '../../models/amortization.models';
import { formatCurrency } from '../../utils/formatters';

@Component({
  selector: 'app-loan-charts',
  standalone: true,
  templateUrl: './loan-charts.html',
  styleUrl: './loan-charts.scss',
})
export class LoanCharts {
  readonly schedule = input.required<Payment[]>();
  readonly loanAmount = input.required<number>();
  readonly totalInterest = input.required<number>();

  private readonly injector = inject(Injector);
  private readonly donutContainer = viewChild<ElementRef<HTMLDivElement>>('donutContainer');
  private readonly lineContainer = viewChild<ElementRef<HTMLDivElement>>('lineContainer');
  private initialized = false;

  constructor() {
    afterNextRender(
      () => {
        this.initialized = true;
        this.renderDonut();
        this.renderLine();
      },
      { injector: this.injector },
    );

    effect(() => {
      // Track inputs
      this.loanAmount();
      this.totalInterest();
      this.schedule();

      if (this.initialized) {
        this.renderDonut();
        this.renderLine();
      }
    });
  }

  private renderDonut(): void {
    const el = this.donutContainer()?.nativeElement;
    if (!el) return;

    const principal = this.loanAmount();
    const interest = this.totalInterest();
    if (principal <= 0) return;

    d3.select(el).selectAll('*').remove();

    const containerWidth = el.clientWidth;
    const size = Math.min(containerWidth, 300);
    const radius = size / 2;
    const innerRadius = radius * 0.55;

    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', size)
      .attr('height', size)
      .attr('aria-label', `Payment breakdown: ${formatCurrency(principal)} principal, ${formatCurrency(interest)} interest`)
      .attr('role', 'img')
      .append('g')
      .attr('transform', `translate(${radius},${radius})`);

    const data = [
      { label: 'Principal', value: principal, color: 'var(--ngpf-bright-blue)' },
      { label: 'Interest', value: interest, color: '#e74c3c' },
    ];

    const pie = d3
      .pie<(typeof data)[0]>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<(typeof data)[0]>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 4);

    svg
      .selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    // Center label
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.3em')
      .attr('font-size', '13px')
      .attr('font-weight', '700')
      .attr('fill', 'var(--ngpf-text-secondary)')
      .text('TOTAL');

    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.1em')
      .attr('font-size', '16px')
      .attr('font-weight', '700')
      .attr('fill', 'var(--ngpf-royal-blue)')
      .text(formatCurrency(principal + interest));

    // Legend below
    const legend = d3
      .select(el)
      .append('div')
      .attr('class', 'loan-charts__legend');

    data.forEach((d) => {
      const item = legend.append('div').attr('class', 'loan-charts__legend-item');
      item
        .append('span')
        .attr('class', 'loan-charts__legend-swatch')
        .style('background', d.color);
      item.append('span').text(`${d.label}: ${formatCurrency(d.value)}`);
    });
  }

  private renderLine(): void {
    const el = this.lineContainer()?.nativeElement;
    if (!el) return;

    const schedule = this.schedule();
    if (schedule.length === 0) return;

    d3.select(el).selectAll('*').remove();

    const containerWidth = el.clientWidth;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', 250)
      .attr('aria-label', `Balance over time chart showing loan payoff over ${schedule.length} months`)
      .attr('role', 'img')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .domain([0, schedule.length])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, this.loanAmount()])
      .nice()
      .range([height, 0]);

    // X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(Math.min(schedule.length, 8))
          .tickFormat((d) => `${d}`),
      )
      .selectAll('text')
      .attr('font-size', '11px');

    // X axis label
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + 35)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'var(--ngpf-text-secondary)')
      .text('Month');

    // Y axis
    svg
      .append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `$${d3.format(',.0f')(d as number)}`),
      )
      .selectAll('text')
      .attr('font-size', '11px');

    // Line
    const lineData = [
      { month: 0, balance: this.loanAmount() },
      ...schedule.map((p) => ({ month: p.paymentNumber, balance: p.remainingBalance })),
    ];

    const line = d3
      .line<(typeof lineData)[0]>()
      .x((d) => xScale(d.month))
      .y((d) => yScale(d.balance))
      .curve(d3.curveMonotoneX);

    // Area fill
    const area = d3
      .area<(typeof lineData)[0]>()
      .x((d) => xScale(d.month))
      .y0(height)
      .y1((d) => yScale(d.balance))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(lineData)
      .attr('fill', 'var(--ngpf-soft-blue-tint)')
      .attr('d', area);

    svg
      .append('path')
      .datum(lineData)
      .attr('fill', 'none')
      .attr('stroke', 'var(--ngpf-bright-blue)')
      .attr('stroke-width', 2.5)
      .attr('d', line);
  }
}

import * as d3 from 'd3';

// ── Interfaces ───────────────────────────────────────

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: ChartMargin;
}

export interface ChartScales {
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
}

// ── Defaults ─────────────────────────────────────────

export const DEFAULT_MARGIN: ChartMargin = { top: 20, right: 30, bottom: 40, left: 70 };

// ── Pure functions ───────────────────────────────────

/** Compute chart dimensions from container rect and margin. */
export function computeChartDimensions(
  containerWidth: number,
  margin: ChartMargin = DEFAULT_MARGIN,
  aspectRatio = 0.55,
  minHeight = 300,
  maxHeight = 500,
): ChartDimensions {
  const width = containerWidth;
  const height = Math.max(minHeight, Math.min(maxHeight, width * aspectRatio));
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);
  return { width, height, innerWidth, innerHeight, margin };
}

/** Create the root SVG and chart group, with defs for patterns. */
export function createChartSvg(
  container: HTMLElement,
  margin: ChartMargin = DEFAULT_MARGIN,
): {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
} {
  const tooltip = d3
    .select(container)
    .append('div')
    .attr('class', 'chart-tooltip')
    .style('opacity', '0');

  const svg = d3
    .select(container)
    .append('svg')
    .attr('class', 'growth-svg');

  const defs = svg.append('defs');

  // Contributions pattern (diagonal lines)
  defs
    .append('pattern')
    .attr('id', 'pattern-contributions')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 6)
    .attr('height', 6)
    .append('path')
    .attr('d', 'M0,6 L6,0')
    .attr('stroke', '#1f3b9b')
    .attr('stroke-width', 1.5)
    .attr('opacity', 0.4);

  // Interest pattern (dots)
  defs
    .append('pattern')
    .attr('id', 'pattern-interest')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 8)
    .attr('height', 8)
    .append('circle')
    .attr('cx', 4)
    .attr('cy', 4)
    .attr('r', 1.5)
    .attr('fill', '#1db8e8')
    .attr('opacity', 0.4);

  const chartGroup = svg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Layer groups for ordering
  chartGroup.append('g').attr('class', 'area-layer');
  chartGroup.append('g').attr('class', 'line-layer');
  chartGroup.append('g').attr('class', 'marker-layer');
  chartGroup.append('g').attr('class', 'x-axis');
  chartGroup.append('g').attr('class', 'y-axis');

  // Overlay for mouse events
  chartGroup
    .append('rect')
    .attr('class', 'overlay')
    .attr('fill', 'none')
    .attr('pointer-events', 'all');

  return { svg, chartGroup, tooltip };
}

/** Create x and y linear scales. */
export function createScales(
  innerWidth: number,
  innerHeight: number,
  xDomain: [number, number],
  yDomain: [number, number],
): ChartScales {
  const x = d3.scaleLinear().domain(xDomain).range([0, innerWidth]);
  const y = d3.scaleLinear().domain(yDomain).range([innerHeight, 0]);
  return { x, y };
}

/** Render x and y axes with transitions. */
export function renderAxes(
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  scales: ChartScales,
  innerHeight: number,
  maxYear: number,
  duration: number,
  formatYTick: (d: number) => string,
): void {
  const xAxis = d3
    .axisBottom(scales.x)
    .ticks(Math.min(maxYear, 10))
    .tickFormat((d) => `Yr ${d}`);

  const yAxis = d3
    .axisLeft(scales.y)
    .ticks(6)
    .tickFormat((d) => formatYTick(d as number));

  chartGroup
    .select<SVGGElement>('.x-axis')
    .attr('transform', `translate(0,${innerHeight})`)
    .transition()
    .duration(duration)
    .call(xAxis);

  chartGroup
    .select<SVGGElement>('.y-axis')
    .transition()
    .duration(duration)
    .call(yAxis);
}

/** Bind a d3 area path to data with enter/update/exit. */
export function bindArea<T>(
  layer: d3.Selection<d3.BaseType, unknown, null, undefined>,
  className: string,
  data: T[],
  areaGen: d3.Area<T>,
  fill: string,
  opacity: number,
  duration: number,
): void {
  const sel = layer.selectAll<SVGPathElement, T[]>(`.${className}`).data([data]);
  sel
    .enter()
    .append('path')
    .attr('class', className)
    .attr('fill', fill)
    .attr('opacity', opacity)
    .attr('d', areaGen)
    .merge(sel)
    .transition()
    .duration(duration)
    .ease(d3.easeCubicOut)
    .attr('d', areaGen);
  sel.exit().remove();
}

/** Bind a d3 line path to data with enter/update/exit. */
export function bindLine<T>(
  layer: d3.Selection<d3.BaseType, unknown, null, undefined>,
  className: string,
  data: T[],
  lineGen: d3.Line<T>,
  stroke: string,
  strokeWidth: string,
  dasharray: string,
  duration: number,
): void {
  const sel = layer.selectAll<SVGPathElement, T[]>(`.${className}`).data([data]);
  sel
    .enter()
    .append('path')
    .attr('class', className)
    .attr('fill', 'none')
    .attr('stroke', stroke)
    .attr('stroke-width', strokeWidth)
    .attr('stroke-dasharray', dasharray)
    .attr('d', lineGen)
    .merge(sel)
    .transition()
    .duration(duration)
    .ease(d3.easeCubicOut)
    .attr('d', lineGen);
  sel.exit().remove();
}

/** Animate a path drawing in left-to-right using stroke-dashoffset. */
export function animatePathDrawIn(
  path: SVGPathElement,
  duration: number,
  onComplete?: () => void,
): void {
  const length = path.getTotalLength();
  d3.select(path)
    .attr('stroke-dasharray', `${length}`)
    .attr('stroke-dashoffset', `${length}`)
    .transition()
    .duration(duration)
    .ease(d3.easeCubicOut)
    .attr('stroke-dashoffset', '0')
    .on('end', () => onComplete?.());
}

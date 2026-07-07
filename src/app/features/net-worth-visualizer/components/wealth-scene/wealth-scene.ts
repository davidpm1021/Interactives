import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FinancialProfile } from '../../models/net-worth.models';
import { computeBreakdown } from '../../services/net-worth.calc';

// Shared vertical scale in pixels — same across every scene so students
// can visually compare Marcus and Priya on identical axes.
const CHART_TOP = 20;
const CHART_BOTTOM = 380;
const ZERO_Y = 200;                     // pixel row that represents $0 net worth
const UPWARD_RANGE_PX = ZERO_Y - CHART_TOP;    // pixels available above the ground line
const DOWNWARD_RANGE_PX = CHART_BOTTOM - ZERO_Y; // pixels available below

interface Segment {
  label: string;
  value: number;
  /** Top-of-segment Y in SVG coords. */
  y: number;
  height: number;
  color: string;
}

@Component({
  selector: 'app-wealth-scene',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './wealth-scene.html',
  styleUrl: './wealth-scene.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WealthScene {
  readonly profile = input.required<FinancialProfile>();
  /** Max $ value the scale accommodates (both upward and downward). */
  readonly scaleMax = input<number>(180_000);

  protected readonly breakdown = computed(() => computeBreakdown(this.profile()));

  protected readonly zeroY = ZERO_Y;

  protected readonly assetSegments = computed<Segment[]>(() => {
    // Stack assets upward from the $0 line. Alternate a couple of green
    // shades so multi-asset stacks read as distinct blocks.
    const greens = ['#43a047', '#2e7d32'];
    let bottom = ZERO_Y;
    return this.profile().assets.map((a, i) => {
      const height = this.px(a.value, 'up');
      const y = bottom - height;
      bottom = y;
      return { label: a.label, value: a.value, y, height, color: greens[i % greens.length] };
    });
  });

  protected readonly debtSegments = computed<Segment[]>(() => {
    const reds = ['#e53935', '#c62828'];
    let top = ZERO_Y;
    return this.profile().debts.map((d, i) => {
      const height = this.px(d.value, 'down');
      const y = top;
      top += height;
      return { label: d.label, value: d.value, y, height, color: reds[i % reds.length] };
    });
  });

  /** Y coordinate of the person marker (i.e. the net-worth level). */
  protected readonly netWorthY = computed(() => {
    const nw = this.breakdown().netWorth;
    return ZERO_Y - this.px(nw, nw >= 0 ? 'up' : 'down') * (nw >= 0 ? 1 : -1);
  });

  /** Absolute dollar amount, for display; sign is drawn separately. */
  protected readonly netWorthAbs = computed(() => Math.abs(this.breakdown().netWorth));
  protected readonly isPositive = computed(() => this.breakdown().netWorth >= 0);

  /** Y coordinates for $50k, $100k, $150k gridlines above and below zero. */
  protected readonly gridlineYs = computed(() => {
    const step = (UPWARD_RANGE_PX / this.scaleMax()) * 50_000;
    return [-3, -2, -1, 1, 2, 3].map((k) => ZERO_Y + k * step);
  });

  protected readonly ariaLabel = computed(() => {
    const p = this.profile();
    const bd = this.breakdown();
    const sign = bd.netWorth >= 0 ? 'positive' : 'negative';
    return (
      `${p.name}, ${p.age}, ${p.occupation}. Salary $${p.salary} per year, ` +
      `$${p.cashOnHand} cash on hand. Total assets $${bd.totalAssets}, ` +
      `total debts $${bd.totalDebts}. Net worth ${sign} $${Math.abs(bd.netWorth)}.`
    );
  });

  private px(dollars: number, direction: 'up' | 'down'): number {
    const range = direction === 'up' ? UPWARD_RANGE_PX : DOWNWARD_RANGE_PX;
    const scale = range / this.scaleMax();
    return Math.max(0, Math.round(Math.abs(dollars) * scale));
  }
}

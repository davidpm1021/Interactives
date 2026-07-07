import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FinancialProfile, LineItem } from '../../models/net-worth.models';
import { computeBreakdown } from '../../services/net-worth.calc';

// Canvas + shared scale.
const W = 1000;
const H = 680;
const WATERLINE_Y = 360;
// We fit ~$60k into 240 vertical px so Marcus's −$37.5k and Priya's +$48k
// sit at visually meaningful offsets from the waterline. Extreme values
// clamp so a character never leaves the frame.
const PIX_PER_DOLLAR = 180 / 60_000;

type Phase = 'setup' | 'ground' | 'water' | 'assets' | 'debts' | 'settle' | 'final';

type IconType = 'home' | 'car' | 'anchor' | 'card' | 'weight' | 'coin';

function classify(item: LineItem, kind: 'asset' | 'debt'): IconType {
  const l = item.label.toLowerCase();
  if (kind === 'asset') {
    if (l.includes('home') || l.includes('house')) return 'home';
    if (l.includes('car') || l.includes('vehicle')) return 'car';
    return 'coin';
  }
  if (l.includes('mortgage') || l.includes('loan')) return 'anchor';
  if (l.includes('card')) return 'card';
  return 'weight';
}

/**
 * One asset or debt attached to a character. Positioned relative to the
 * character's centre so we can just translate the whole `<g>`.
 */
export interface Attachment {
  label: string;
  value: number;
  icon: IconType;
  /** Position offset from character centre in the final composition. */
  x: number;
  y: number;
  size: number;
  /** Reveal delay used for staggered fade-in per beat. */
  staggerMs: number;
}

export interface Character {
  profile: FinancialProfile;
  netWorth: number;
  color: string;
  centerX: number;
  /** Y offset from the waterline once everything is revealed. Negative = above. */
  finalYOffset: number;
  assets: Attachment[];
  debts: Attachment[];
  salaryBarHeight: number;
}

@Component({
  selector: 'app-water-scene',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './water-scene.html',
  styleUrl: './water-scene.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaterScene {
  readonly profileA = input.required<FinancialProfile>();
  readonly profileB = input.required<FinancialProfile>();

  // ── template constants (Angular templates can't read module consts directly) ──
  protected readonly W = W;
  protected readonly H = H;
  protected readonly waterlineY = WATERLINE_Y;

  // ── reveal state machine ──
  protected readonly phase = signal<Phase>('setup');

  private readonly injector = inject(Injector);

  // Both characters get the same neutral navy nameplate. The outcome colour
  // (green above water, red below) lives only on the net-worth badge so we
  // don't accidentally imply Priya is a warning by giving her a red plate.
  protected readonly characters = computed<[Character, Character]>(() => [
    this.buildCharacter(this.profileA(), W * 0.28, '#0a2f4d'),
    this.buildCharacter(this.profileB(), W * 0.72, '#0a2f4d'),
  ]);

  constructor() {
    afterNextRender(
      () => {
        // Beat-by-beat reveal. Timings tuned so students see the salary hint
        // ("Marcus looks richer"), then the ground turns to water, then the
        // debts arrive and pull Marcus under.
        const runPhase = (p: Phase, delayMs: number) =>
          setTimeout(() => this.phase.set(p), delayMs);

        this.phase.set('ground');
        runPhase('water', 1400);
        runPhase('assets', 2500);
        runPhase('debts', 3600);
        runPhase('settle', 4600);
        runPhase('final', 5700);
      },
      { injector: this.injector },
    );
  }

  private buildCharacter(profile: FinancialProfile, centerX: number, color: string): Character {
    const bd = computeBreakdown(profile);
    const netWorth = bd.netWorth;
    const clamped = Math.max(-60_000, Math.min(80_000, netWorth));
    const finalYOffset = -clamped * PIX_PER_DOLLAR;

    // Salary bar visualises income as a rising column: bigger salary = taller.
    // Marcus should look ~2x Priya's, matching the incoming-money illusion.
    // Capped so the tallest bar clears the top of the canvas.
    const salaryBarHeight = Math.min(130, profile.salary / 850);

    // Assets flare UP-AND-OUT from the character; debts flare DOWN-AND-OUT.
    const assets = this.layoutAttachments(profile.assets, 'asset', 0);
    const debts = this.layoutAttachments(profile.debts, 'debt', assets.length * 90);

    return { profile, netWorth, color, centerX, finalYOffset, assets, debts, salaryBarHeight };
  }

  private layoutAttachments(
    items: LineItem[],
    kind: 'asset' | 'debt',
    baseDelay: number,
  ): Attachment[] {
    if (items.length === 0) return [];
    // Spread across a shallow arc. Assets in a wider arc above; debts in a
    // tighter arc below (anchors dangle vertically more than assets which fan
    // out like balloons).
    const isAsset = kind === 'asset';
    const arcRadius = isAsset ? 200 : 210;
    const start = isAsset ? Math.PI * 1.18 : Math.PI * 0.18;
    const end = isAsset ? Math.PI * 1.82 : Math.PI * 0.82;
    const step = items.length === 1 ? 0 : (end - start) / (items.length - 1);

    return items.map((it, i) => {
      const angle = items.length === 1 ? (start + end) / 2 : start + step * i;
      const x = Math.cos(angle) * arcRadius;
      const y = Math.sin(angle) * arcRadius;
      const size = this.iconSizeFor(it.value);
      return {
        label: it.label,
        value: it.value,
        icon: classify(it, kind),
        x,
        y,
        size,
        staggerMs: baseDelay + i * 220,
      };
    });
  }

  private iconSizeFor(value: number): number {
    const scale = Math.sqrt(Math.abs(value) / 30_000);
    return Math.max(30, Math.min(88, 32 + scale * 30));
  }

  // ── template helpers ──

  protected fmt(value: number): string {
    const sign = value >= 0 ? '+' : '−';
    return `${sign}$${Math.abs(value).toLocaleString('en-US')}`;
  }

  protected isSubmerged(c: Character): boolean {
    return c.netWorth < 0;
  }

  /** Y offset for the character group, dependent on reveal phase. */
  protected characterYOffset(c: Character): number {
    const p = this.phase();
    // During ground/water/assets/debts, both characters stand at the
    // waterline. Only after 'settle' do they drift to their true positions.
    if (p === 'setup' || p === 'ground' || p === 'water' || p === 'assets' || p === 'debts') {
      return 0;
    }
    return c.finalYOffset;
  }

  protected phaseHasWater(): boolean {
    const p = this.phase();
    return p !== 'setup' && p !== 'ground';
  }

  protected phaseShowsAssets(): boolean {
    const p = this.phase();
    return p === 'assets' || p === 'debts' || p === 'settle' || p === 'final';
  }

  protected phaseShowsDebts(): boolean {
    const p = this.phase();
    return p === 'debts' || p === 'settle' || p === 'final';
  }

  protected phaseIsFinal(): boolean {
    return this.phase() === 'final';
  }

  protected chainTo(a: Attachment, c: Character): string {
    // Curved connector from character centre to attachment.
    const toX = a.x;
    const toY = a.y;
    const cx = toX / 2 + (a.y > 0 ? 14 : -10);
    const cy = toY / 2;
    return `M 0 0 Q ${cx} ${cy} ${toX} ${toY}`;
  }

  protected badgeYForFinalCaption(): number {
    return H - 40;
  }

  protected iconRef(t: IconType): string { return t; }
}

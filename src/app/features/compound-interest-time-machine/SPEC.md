# Compound Interest Time Machine — Interactive Spec

## Overview

Build an interactive **Compound Interest Time Machine** for the NGPF Interactives Angular 21 monorepo that replaces passive compound interest videos across Units 2 (Banking) and 3 (Investing). Students manipulate financial variables — principal, interest rate, time horizon, and contribution frequency — and watch their money grow (or not) in real-time through animated visualizations. The goal is to make exponential growth _visceral_ rather than theoretical.

This single interactive replaces at least three passive resources:

- **VIDEO: Compound Interest Explained** (Unit 2, Lesson 2.2 — Highest priority, 🔴 Replace)
- **VIDEO: Understanding Compound Interest** (Unit 3, Lesson 3.1 — Highest priority, 🔴 Replace)
- **CALCULATE: Simple vs Compound Interest** worksheet (Unit 2, Lesson 2.2 — High priority, 🟡 Enhance)

---

## 1. Project Context

### Repository Structure

- **Framework:** Angular 21 (standalone components, no NgModules)
- **Features live at:** `src/app/features/<feature-name>/`
- **Scaffold new features with:** `npm run feature <feature-name>`
- **Shared components available:** `TopHeader`, `BottomHeader`, `ExampleComponent`
- **Routing:** Configured in `app.routes.ts` (auto-added by scaffold script)
- **Styling:** SCSS per component

### Scaffold Command

```bash
npm run feature compound-interest
```

This creates `src/app/features/compound-interest/` with `.ts`, `.html`, and `.scss` files, adds the route to `app.routes.ts`, and adds a nav card to the home page.

---

## 2. Learning Objectives

By using this interactive, students should be able to:

1. **Explain** the difference between simple and compound interest by observing both curves side-by-side
2. **Demonstrate** how small changes in interest rate or time horizon create dramatically different outcomes
3. **Identify** the inflection point where compound interest visibly accelerates away from simple interest
4. **Evaluate** the impact of regular contributions vs. lump sum investing
5. **Articulate** why "time in the market" matters more than "timing the market" — through firsthand experimentation, not lecture

---

## 3. Data Model & Interfaces

```typescript
// ── Simulation Input ──────────────────────────────────

export interface SimulationInputs {
  principal: number; // Starting amount ($)
  interestRate: number; // Annual rate as decimal (e.g., 0.07 for 7%)
  timeHorizon: number; // Years (1–50)
  contributionAmount: number; // Per-period contribution ($)
  contributionFrequency: ContributionFrequency;
  compoundingFrequency: CompoundingFrequency;
}

export type ContributionFrequency = 'none' | 'monthly' | 'yearly';
export type CompoundingFrequency = 'annually' | 'monthly' | 'daily';

// ── Simulation Output ─────────────────────────────────

export interface SimulationResult {
  dataPoints: YearlyDataPoint[];
  summary: SimulationSummary;
}

export interface YearlyDataPoint {
  year: number;
  compoundBalance: number; // Total with compound interest
  simpleBalance: number; // Total with simple interest (for comparison)
  totalContributions: number; // Cumulative contributions (principal + additions)
  totalInterestEarned: number; // compoundBalance - totalContributions
}

export interface SimulationSummary {
  finalBalance: number;
  totalContributions: number;
  totalInterestEarned: number;
  interestAsPercentOfFinal: number; // What % of final balance is "free money"
  simpleInterestFinal: number; // What simple interest would have yielded
  compoundAdvantage: number; // Difference: compound - simple
  doublingYear: number | null; // Year where balance first doubles the total contributions
}

// ── Preset Scenarios ──────────────────────────────────

export interface Scenario {
  id: string;
  label: string;
  description: string;
  inputs: SimulationInputs;
}
```

---

## 4. Core Calculation Engine

### CompoundInterestService

A pure calculation service with no UI dependencies. All methods are deterministic and unit-testable.

```typescript
@Injectable({ providedIn: 'root' })
export class CompoundInterestService {
  /**
   * Runs the full simulation and returns yearly data points + summary.
   */
  calculate(inputs: SimulationInputs): SimulationResult;

  /**
   * Compound interest formula with contributions:
   *
   * For each period:
   *   balance = previousBalance * (1 + r/n) + contribution
   *
   * Where:
   *   r = annual interest rate
   *   n = compounding periods per year
   *   contribution = per-period contribution amount
   *
   * Simple interest comparison:
   *   balance = principal + (principal * r * t) + totalContributions
   */
  private computeCompoundBalance(
    principal: number,
    rate: number,
    years: number,
    contributionAmount: number,
    contributionFrequency: ContributionFrequency,
    compoundingFrequency: CompoundingFrequency,
  ): YearlyDataPoint[];

  /**
   * Finds the year where balance first exceeds 2x total contributions.
   * Returns null if it never happens within the time horizon.
   */
  private findDoublingYear(dataPoints: YearlyDataPoint[]): number | null;
}
```

### Calculation Notes

- All calculations happen client-side — no API calls, no external data
- Use `number` type (no need for BigDecimal-level precision for educational purposes)
- Round display values to nearest cent for balances, but keep full precision internally
- Simple interest is always calculated alongside compound for the comparison view
- Contributions are added at the _end_ of each period (ordinary annuity), not the beginning

---

## 5. Preset Scenarios

Rather than starting with a blank form, students can pick from relatable scenarios that set all inputs at once. They can then modify any value.

```typescript
export const SCENARIOS: Scenario[] = [
  {
    id: 'high-school-saver',
    label: 'High School Saver',
    description: 'You save $50/month from a part-time job starting at age 16',
    inputs: {
      principal: 500,
      interestRate: 0.07,
      timeHorizon: 10,
      contributionAmount: 50,
      contributionFrequency: 'monthly',
      compoundingFrequency: 'monthly',
    },
  },
  {
    id: 'early-starter',
    label: 'Start at 22',
    description: 'You invest $200/month right after college for 40 years',
    inputs: {
      principal: 1000,
      interestRate: 0.07,
      timeHorizon: 40,
      contributionAmount: 200,
      contributionFrequency: 'monthly',
      compoundingFrequency: 'monthly',
    },
  },
  {
    id: 'late-starter',
    label: 'Start at 35',
    description: 'Same $200/month, but you waited 13 years to start',
    inputs: {
      principal: 1000,
      interestRate: 0.07,
      timeHorizon: 27,
      contributionAmount: 200,
      contributionFrequency: 'monthly',
      compoundingFrequency: 'monthly',
    },
  },
  {
    id: 'lump-sum',
    label: 'Lump Sum Only',
    description: '$5,000 gift — just let it sit for 30 years, no additional contributions',
    inputs: {
      principal: 5000,
      interestRate: 0.07,
      timeHorizon: 30,
      contributionAmount: 0,
      contributionFrequency: 'none',
      compoundingFrequency: 'monthly',
    },
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Set your own values',
    inputs: {
      principal: 1000,
      interestRate: 0.05,
      timeHorizon: 20,
      contributionAmount: 100,
      contributionFrequency: 'monthly',
      compoundingFrequency: 'monthly',
    },
  },
];
```

### Comparison Mode

A special mode that runs "Start at 22" and "Start at 35" side-by-side so students can directly see the cost of waiting. This is the single most powerful teaching moment in the interactive — the visual gap between the two curves makes the argument for starting early better than any lecture.

---

## 6. Component Architecture

```
compound-interest/
├── compound-interest.component.ts       // Root container, state management
├── compound-interest.component.html
├── compound-interest.component.scss
├── services/
│   └── compound-interest.service.ts     // Pure calculation engine
├── components/
│   ├── scenario-picker/                 // Scenario selection cards
│   │   ├── scenario-picker.component.ts
│   │   ├── scenario-picker.component.html
│   │   └── scenario-picker.component.scss
│   ├── input-panel/                     // Sliders + number inputs
│   │   ├── input-panel.component.ts
│   │   ├── input-panel.component.html
│   │   └── input-panel.component.scss
│   ├── growth-chart/                    // Main visualization (animated line/area chart)
│   │   ├── growth-chart.component.ts
│   │   ├── growth-chart.component.html
│   │   └── growth-chart.component.scss
│   ├── time-scrubber/                   // Year-by-year timeline slider
│   │   ├── time-scrubber.component.ts
│   │   ├── time-scrubber.component.html
│   │   └── time-scrubber.component.scss
│   ├── summary-panel/                   // Key stats + "aha" callouts
│   │   ├── summary-panel.component.ts
│   │   ├── summary-panel.component.html
│   │   └── summary-panel.component.scss
│   └── comparison-view/                 // Side-by-side scenario comparison
│       ├── comparison-view.component.ts
│       ├── comparison-view.component.html
│       └── comparison-view.component.scss
├── models/
│   └── compound-interest.models.ts      // All interfaces and types
├── data/
│   └── scenarios.ts                     // Preset scenario definitions
└── utils/
    └── formatters.ts                    // Currency, percentage, year formatting
```

---

## 7. User Flow

### Primary Flow

```
[Landing]
    │
    ▼
[Scenario Picker] ── Student picks a preset or "Custom"
    │
    ▼
[Main View: Input Panel + Growth Chart + Summary]
    │
    ├── Student adjusts sliders → chart animates in real-time
    ├── Student scrubs timeline → sees balance at any year
    ├── Student toggles simple vs. compound comparison
    │
    ▼
[Optional: Comparison Mode] ── "Start at 22" vs. "Start at 35" side-by-side
```

### Screen States

1. **`scenario-selection`** — Landing state. Student sees scenario cards with relatable descriptions. Picking one populates the inputs and transitions to the main view.
2. **`exploring`** — Main state. Input panel on the left/top, chart on the right/bottom. Everything is live — changing any input immediately recalculates and re-animates the chart.
3. **`comparing`** — Comparison state. Two scenarios rendered on the same chart with a split summary panel showing the delta.

---

## 8. UI/UX Requirements

### 8.1 Scenario Picker

- Display scenarios as selectable cards in a horizontal row (desktop) or vertical stack (mobile)
- Each card shows: label, 1-line description, and a small sparkline preview of the growth curve
- Selecting a card animates a transition to the main view with inputs pre-filled
- "Custom" card has a distinct style (outlined vs. filled) to signal it's different

### 8.2 Input Panel

All inputs update the chart in real-time as the student interacts.

| Input                 | Control Type          | Range                      | Default       |
| --------------------- | --------------------- | -------------------------- | ------------- |
| Starting Amount       | Slider + number input | $0 – $50,000               | From scenario |
| Monthly Contribution  | Slider + number input | $0 – $2,000                | From scenario |
| Interest Rate         | Slider + number input | 0% – 15%                   | From scenario |
| Time Horizon          | Slider + number input | 1 – 50 years               | From scenario |
| Compounding Frequency | Toggle group          | Annually / Monthly / Daily | Monthly       |

**Slider behavior:**

- Dragging the slider updates the number input and vice versa
- Sliders should have labeled tick marks at key values (e.g., 1%, 5%, 7%, 10%, 15% for interest rate)
- Consider non-linear slider scale for Starting Amount (more precision at lower values where students will likely be)

**Input validation:**

- Clamp to min/max on blur
- No negative values
- Interest rate accepts both "7" and "0.07" — normalize internally

### 8.3 Growth Chart

This is the centerpiece of the interactive. It must feel alive and responsive.

**Chart type:** Area chart with the following layers (bottom to top):

1. **Total Contributions** (darkest fill) — the "money you put in" baseline
2. **Compound Interest Earned** (lighter fill on top) — the visual gap that grows exponentially

**Comparison overlay (toggleable):**

- Simple interest line rendered as a dashed line on the same chart
- When toggled on, the area between compound and simple curves should be highlighted to emphasize the difference

**Animation requirements:**

- When inputs change, the chart should smoothly animate to the new shape (300–500ms transition)
- On first load of a scenario, the chart should "draw" from left to right (the time machine effect) over ~1.5 seconds
- The growing gap between contributions and balance should feel dramatic at the right edge

**Interaction:**

- Hover/tap on any point shows a tooltip with: Year, Balance, Total Contributed, Interest Earned
- If in comparison mode, tooltip shows both scenarios

**Technical approach:**

- Use an SVG-based chart (d3 or a lightweight charting library compatible with Angular)
- Alternatively, use `<canvas>` for smoother animations if SVG performance is an issue with 50+ data points
- The chart must be responsive — scales to fill available width on any screen size

### 8.4 Time Scrubber

A horizontal slider below the chart that lets students "scrub" through time year by year.

- Dragging the scrubber highlights the corresponding point on the chart
- The summary panel updates to show stats for the selected year
- A "Play" button auto-advances the scrubber from year 0 to the end at ~2 years/second, so students can watch the money grow in "real-time"
- Play button becomes "Pause" during playback
- Visual: a timeline with year labels at regular intervals

### 8.5 Summary Panel

Displays key statistics that update as the student interacts. Positioned below the chart or in a sidebar on desktop.

**Always-visible stats:**

- **Final Balance** — large, prominent number with currency formatting
- **Total Contributions** — what you actually put in
- **Interest Earned** — the "free money" with emphasis styling
- **Interest as % of Final** — "X% of your balance is money you never had to earn"

**"Aha" Callouts** (contextual, appear based on the data):

- **Doubling callout:** "Your interest earned more than you contributed by Year X!" (appears when `doublingYear` is found)
- **Compound vs. Simple:** "Compound interest earned you $X,XXX more than simple interest would have" (when comparison is toggled on)
- **Late start penalty:** "Waiting 13 years cost you $X,XXX" (in comparison mode)

These callouts should animate in when they become relevant (e.g., when the scrubber passes the doubling year).

### 8.6 Comparison View

Accessed via a "Compare Scenarios" button from the main view.

- Renders two growth curves on the same chart with distinct colors
- Split summary panel showing both scenarios' stats side-by-side with the delta highlighted
- Default comparison: "Start at 22" vs. "Start at 35"
- Students can also compare any two scenarios or the current custom inputs vs. a preset
- The delta number (e.g., "$287,000 difference") should be prominently styled

---

## 9. Responsive Design

### Breakpoints

| Breakpoint          | Layout                                                                   |
| ------------------- | ------------------------------------------------------------------------ |
| Desktop (≥1024px)   | Input panel on the left (30% width), chart + summary on the right (70%)  |
| Tablet (768–1023px) | Input panel as a collapsible top section, chart fills width below        |
| Mobile (<768px)     | Stacked: inputs (collapsed by default) → chart → time scrubber → summary |

### Mobile Considerations

- Sliders must have large touch targets (minimum 44px hit area)
- Chart tooltip on tap, not hover
- Scenario picker scrolls horizontally with snap points
- Summary panel cards scroll horizontally on mobile
- Input panel should be collapsible after initial setup so the chart gets maximum screen real estate
- Time scrubber Play/Pause button should be prominent (centered, 48px+)

---

## 10. Animations

### Chart Animations

- **Initial draw:** Left-to-right reveal of the growth curve over 1.5s (CSS `clip-path` or SVG `stroke-dashoffset` animation)
- **Input change:** Smooth morph from old curve to new curve (300–500ms, ease-out)
- **Comparison enter:** Second curve draws in from left after the first is visible

### UI Animations

- **Scenario card selection:** Scale + shadow transition on click (150ms)
- **Summary stat changes:** Number counter animation (old value → new value over 300ms)
- **"Aha" callout appearance:** Fade-in + slight upward slide (200ms)
- **Time scrubber playback:** Smooth continuous movement, not stepped

### Performance

- Use `requestAnimationFrame` for any JS-driven animation
- Debounce slider input to avoid excessive recalculations (16ms / one frame)
- Keep all animations under 500ms to feel snappy
- Use `will-change: transform` on animated elements

---

## 11. Accessibility

- All inputs must have associated `<label>` elements
- Chart must have an `aria-label` describing the current state (e.g., "Growth chart showing $45,230 after 20 years at 7% interest")
- Time scrubber must be keyboard-navigable (arrow keys to step, Space to play/pause)
- Sliders must support keyboard input (arrow keys for fine adjustment, Page Up/Down for large steps)
- Color is not the only differentiator between chart layers — use distinct patterns/textures in addition to color
- Summary stats should be in a `role="region"` with `aria-live="polite"` so screen readers announce changes
- Respect `prefers-reduced-motion` — disable chart draw animation, use instant transitions

---

## 12. Formatting Utilities

```typescript
// utils/formatters.ts

/**
 * Format as currency: $1,234.56
 * For large numbers (>$100k): $123.4K, $1.2M
 */
export function formatCurrency(value: number, compact?: boolean): string;

/**
 * Format as percentage: 7.00%
 */
export function formatPercent(value: number): string;

/**
 * Format year label: "Year 5" or "Age 21" (if age mode is added later)
 */
export function formatYear(year: number): string;

/**
 * Pluralize: "1 year" vs "2 years"
 */
export function pluralize(count: number, singular: string, plural?: string): string;
```

---

## 13. Testing Expectations

### Unit Tests (Vitest)

**CompoundInterestService:**

- `calculate()` with $1,000 at 10% for 1 year compounded annually = $1,100 (simple case)
- `calculate()` with $1,000 at 10% for 1 year compounded monthly ≈ $1,104.71
- `calculate()` with $0 principal but $100/month contributions for 10 years at 7%
- `calculate()` with $5,000 principal, no contributions, 30 years at 7% — verify final ≈ $38,061
- Simple interest comparison is always linear
- `doublingYear` is correctly identified
- `doublingYear` returns null when interest is 0%
- Edge case: 0% interest rate returns flat line equal to contributions
- Edge case: 0 time horizon returns just the principal
- Summary percentages are mathematically correct
- Daily vs. monthly vs. annual compounding produces expected ordering

**Input validation:**

- Negative values are clamped to 0
- Interest rate > 15% is clamped
- Time horizon clamped to 1–50

**Formatters:**

- Currency formatting with various magnitudes
- Compact notation thresholds

### Manual QA Checklist

- [ ] Each preset scenario loads correct values and chart renders
- [ ] Custom mode allows free input
- [ ] Slider and number input stay in sync bidirectionally
- [ ] Chart animates smoothly on input change
- [ ] Chart draws left-to-right on initial load
- [ ] Simple interest toggle shows/hides comparison line
- [ ] Time scrubber highlights correct chart point
- [ ] Play button auto-advances and can be paused
- [ ] Summary stats update correctly at each year
- [ ] "Aha" callouts appear at correct moments
- [ ] Comparison mode shows two curves with delta
- [ ] Tooltip shows correct values on hover/tap
- [ ] Responsive layout works at all three breakpoints
- [ ] Touch interactions work on mobile (sliders, scrubber, tooltips)
- [ ] Keyboard navigation works for all inputs and scrubber
- [ ] Reduced motion preference is respected
- [ ] No console errors throughout all flows

---

## 14. Implementation Order

Recommended build sequence:

1. **Scaffold & models** — Run `npm run feature compound-interest`, create all interfaces and types in `models/`, add preset scenarios in `data/`
2. **CompoundInterestService** — Implement calculation engine with full unit test coverage. This is the foundation — get the math right before touching UI.
3. **Input Panel** — Build sliders + number inputs with bidirectional binding. Test with console.log output before the chart exists.
4. **Growth Chart** — Implement the area chart with animated rendering. Start with a static chart, then add the draw animation and morph transitions.
5. **Time Scrubber** — Add the timeline slider with play/pause. Wire it to highlight chart points.
6. **Summary Panel** — Display stats and wire up "aha" callouts with conditional logic.
7. **Scenario Picker** — Build the landing card selection UI and wire it to populate inputs.
8. **Comparison Mode** — Add the side-by-side view with dual curves and delta summary.
9. **Root component state machine** — Wire all screen states together (scenario-selection → exploring → comparing)
10. **Responsive polish** — Finalize layout at all breakpoints, mobile touch targets, collapsible inputs.
11. **Accessibility pass** — ARIA labels, keyboard navigation, reduced motion, pattern fills.
12. **Animation polish** — Fine-tune timing, easing, and transitions across all interactions.

---

## 15. Dependencies

No external data sources or APIs required. This interactive is fully self-contained.

**Charting library options (pick one):**

- **d3** — Maximum control over animations and custom chart behavior. More setup but exactly the flexibility needed for the area chart with multiple layers and animated transitions.
- **Chart.js** — Simpler API, good enough for area charts, but less control over the draw animation and morph transitions.
- **Raw SVG** — No dependency. Full control. More code but zero bundle size impact.

**Recommendation:** d3 for the chart rendering, since the draw animation, area fills, tooltip positioning, and comparison overlays all benefit from d3's path generators and transition system. The rest of the UI is standard Angular.

---

## 16. Future Enhancements (Out of Scope for v1)

1. **"What if" mode** — Save current state as Scenario A, modify inputs, auto-compare against saved state
2. **Age mode** — Toggle year labels to show age instead of year count (student enters their current age)
3. **Inflation adjustment** — Toggle to show "real" (inflation-adjusted) vs. nominal growth
4. **Export/share** — Screenshot or link that encodes inputs in URL params for sharing with classmates
5. **Guided walkthrough** — Step-by-step tutorial that highlights each input and explains what it does (for first-time users or teacher-led demos)
6. **Retirement target line** — Student sets a goal amount, chart shows a horizontal target line and highlights when/if they reach it

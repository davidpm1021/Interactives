# Compound Interest Time Machine — Spec Refactor

## What This Document Is

This is a **refactor of the existing spec**, not a rewrite. The calculation engine, data models, formatting utilities, charting approach, dependencies, and accessibility foundations are all sound. What's missing is a pedagogical layer that turns the sandbox into a guided learning experience.

The core problem: the current build is a calculator. Students move sliders, see a chart update, and think "yep, bigger number." There's no cognitive friction, no surprise, no moment where their mental model breaks and reforms. It's passive in a different font.

The fix: wrap the existing sandbox in a **five-challenge guided sequence** built on the **Predict → Reveal → Reflect** learning loop. Students commit to a prediction before seeing the math. The gap between what they guessed and what actually happens is where learning lives.

---

## Sections That Don't Change

The following sections from the original spec carry over as-is:

| Section                     | Status        | Notes                                                                 |
| --------------------------- | ------------- | --------------------------------------------------------------------- |
| §1. Project Context         | ✅ No changes | Scaffold command, repo structure, shared components                   |
| §2. Learning Objectives     | ✅ No changes | Same five objectives                                                  |
| §4. Core Calculation Engine | ✅ No changes | Same `CompoundInterestService`, same formulas, same calculation notes |
| §12. Formatting Utilities   | ✅ No changes | Same `formatCurrency`, `formatPercent`, `formatYear`, `pluralize`     |
| §15. Dependencies           | ✅ No changes | d3 recommended, no external APIs                                      |

---

## Sections That Get Modified

### §3. Data Model — ADD challenge state interfaces

Keep all existing interfaces (`SimulationInputs`, `SimulationResult`, `YearlyDataPoint`, `SimulationSummary`, `Scenario`). Add a `Milestone` type to `SimulationSummary` and add the following new interfaces for challenge state management:

```typescript
// ── ADD to SimulationSummary ──────────────────────────

export interface Milestone {
  year: number;
  type: 'interest-exceeds-contributions' | 'balance-100k' | 'balance-500k' | 'balance-1m';
  label: string;
  value: number;
}

// Add to existing SimulationSummary:
//   milestones: Milestone[];

// ── NEW: Challenge State ──────────────────────────────

export type ChallengeId = 1 | 2 | 3 | 4 | 5;

export interface ChallengeState {
  currentChallenge: ChallengeId;
  phase: 'predict' | 'reveal' | 'reflect';
  completedChallenges: Set<ChallengeId>;
  predictions: ChallengePredictions;
}

export interface ChallengePredictions {
  challenge1Year10?: number;
  challenge1Year40?: number;
  challenge2RateGuess?: 'A' | 'B' | 'C' | 'D';
  challenge3ContributionGuess?: number;
  challenge4WaitGuess?: 'A' | 'B' | 'C' | 'D' | 'E';
}

// ── NEW: Draggable Prediction ─────────────────────────

export interface PredictionPoint {
  year: number;
  value: number;
  locked: boolean;
}
```

---

### §4. Core Calculation Engine — ADD convenience methods

The `CompoundInterestService` is unchanged. Add convenience methods that call `calculate()` with the specific inputs used by each challenge. These are just wrappers — no new math:

```typescript
// ADD to CompoundInterestService:

calculateChallenge1(): SimulationResult;     // $1k, 7%, 40yr, no contributions
calculateChallenge2Low(): SimulationResult;  // $1k, 5%, 40yr, no contributions
calculateChallenge2High(): SimulationResult; // $1k, 9%, 40yr, no contributions
calculateChallenge3(): SimulationResult;     // $1k + $100/mo, 7%, 40yr
calculateChallenge4Early(): SimulationResult;  // $200/mo, 7%, 40yr (age 22–62)
calculateChallenge4Late(): SimulationResult;   // $200/mo, 7%, 30yr (age 32–62)
```

---

### §5. Preset Scenarios — REPLACE with Challenge Sequence

**Remove** the scenario picker as the entry point. The five preset `Scenario` objects (`high-school-saver`, `early-starter`, `late-starter`, `lump-sum`, `custom`) are no longer the landing experience.

**Replace with** a five-challenge guided sequence. Each challenge teaches one lesson from the original scenarios, but through prediction rather than exploration:

| Challenge                | What It Replaces from §5                     | Learning Target                                                  |
| ------------------------ | -------------------------------------------- | ---------------------------------------------------------------- |
| 1: "The Guess"           | `lump-sum` scenario                          | Exponential growth bias — students underestimate compound growth |
| 2: "Rate Matters"        | No direct equivalent (new)                   | Small rate differences → enormous outcome differences            |
| 3: "Adding a Little"     | `high-school-saver` scenario concept         | Regular contributions are transformative with compounding        |
| 4: "The Cost of Waiting" | `early-starter` vs `late-starter` comparison | Time is the most powerful variable                               |
| 5: "Your Time Machine"   | `custom` scenario                            | Open sandbox with guided framing                                 |

The original `Scenario` interface and preset data can be kept in `data/scenarios.ts` for use in Challenge 5's sandbox defaults. They just aren't the front door anymore.

**Full challenge definitions below in §NEW-A.**

---

### §6. Component Architecture — RESTRUCTURE around challenges

**Remove:** `scenario-picker/`, `time-scrubber/` (folded into sandbox only), `comparison-view/` (folded into Challenge 4 reveal)

**Keep:** `growth-chart/` (becomes shared, reused across all challenges), `input-panel/` (moves into sandbox), `summary-panel/` (moves into sandbox)

**Add:** Challenge-specific components and shared prediction UI components.

New structure:

```
compound-interest/
├── compound-interest.component.ts          // Root: challenge state machine
├── compound-interest.component.html
├── compound-interest.component.scss
├── services/
│   └── compound-interest.service.ts        // UNCHANGED - pure calculation engine
├── components/
│   ├── challenge-progress/                 // NEW - top progress bar (1 of 5)
│   ├── challenge-intro/                    // NEW - setup text for each challenge
│   ├── prediction-chart/                   // NEW - chart with draggable prediction dots
│   ├── prediction-choice/                  // NEW - multiple choice prediction UI
│   ├── prediction-input/                   // NEW - free numeric guess input
│   ├── reveal-chart/                       // NEW - animated chart with prediction ghost overlay
│   ├── reveal-stats/                       // NEW - animated "guess vs reality" callouts
│   ├── reflect-card/                       // NEW - insight text + "Next" button
│   ├── sandbox/                            // REFACTORED - Challenge 5 explorer
│   │   ├── sandbox.component.ts
│   │   ├── guided-input/                   // REFACTORED from input-panel (question-framed)
│   │   ├── milestone-callouts/             // NEW - dynamic milestone labels on chart
│   │   └── wait-comparison/                // NEW - "What if I wait 5 years?" overlay
│   └── shared/
│       ├── growth-chart/                   // KEPT from original - reusable chart renderer
│       ├── stat-counter/                   // NEW - animated number counter
│       └── formatters.ts                   // UNCHANGED
├── models/
│   └── compound-interest.models.ts         // EXTENDED (see §3 changes above)
└── data/
    ├── scenarios.ts                        // KEPT - used by sandbox defaults
    └── challenge-content.ts                // NEW - all challenge text strings
```

---

### §7. User Flow — REPLACE state machine

**Remove** the three-state flow (`scenario-selection → exploring → comparing`).

**Replace with** a linear challenge progression where each challenge is a three-phase cycle:

```
[Challenge 1: Predict] → [Challenge 1: Reveal] → [Challenge 1: Reflect]
                                                          │
                                                          ▼
                                            [Challenge 2: Predict] → [Reveal] → [Reflect]
                                                                                     │
                                                                                     ▼
                                                                   [Challenge 3: Predict] → ...
                                                                                                │
                                                                                                ▼
                                                                              [Challenge 4: Predict] → ...
                                                                                                          │
                                                                                                          ▼
                                                                                        [Challenge 5: Sandbox]
                                                                                               │
                                                                                               ▼
                                                                                        [Final Summary]
```

Rules:

- Students cannot skip ahead — each challenge unlocks after the previous one completes
- "Complete" means they've made a prediction AND viewed the reveal AND clicked through the reflection
- Challenge 5 has no predict/reveal/reflect — it's the open sandbox
- A "Finish" button on Challenge 5 shows the final summary

---

### §8. UI/UX Requirements — MAJOR CHANGES

**Remove:** §8.1 Scenario Picker, §8.4 Time Scrubber (keep for sandbox only), §8.6 Comparison View (folded into Challenge 4)

**Modify §8.2 Input Panel:** The input panel only appears in Challenge 5 (sandbox). Reframe bare sliders as guided questions:

| Original Slider       | New Framing                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| Starting Amount       | "How much could you start with?"                                                                              |
| Monthly Contribution  | "How much could you set aside each month?"                                                                    |
| Interest Rate         | "What growth rate do you expect?" + helper: "The stock market has historically averaged about 7–10% per year" |
| Time Horizon          | Split into "When do you want to start?" and "When do you want this money?" (age-based)                        |
| Compounding Frequency | Keep as toggle group, deprioritize visually                                                                   |

**Modify §8.3 Growth Chart:** The chart component itself is reusable, but it now serves different roles per challenge:

| Challenge | Chart Mode                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------- |
| 1         | Draggable prediction dots → animated reveal with ghost overlay                                    |
| 2         | Dual curves (5% vs 9%) animated side-by-side                                                      |
| 3         | Stacked area (contributions on bottom, interest on top) with previous lump-sum curve as reference |
| 4         | Dual racing curves (Alex vs Jordan) with age-based x-axis                                         |
| 5         | Full sandbox chart with milestone callouts and "wait 5 years" overlay                             |

**Modify §8.5 Summary Panel:** Stats only appear in reveal phases and the sandbox. In reveals, show them as animated "guess vs. reality" comparisons rather than a persistent panel.

**Add** the following new UI sections:

#### §8.NEW-1: Overall Layout Change

Switch from the split-panel layout (inputs left, chart right) to a **centered single-column layout** during Challenges 1–4. One thing on screen at a time: either the prediction prompt, OR the reveal chart, OR the reflection. White space is a feature. The split-panel layout only returns in Challenge 5's sandbox.

#### §8.NEW-2: Challenge Screens — Predict Phase

- Context/setup text at top (2–3 sentences max)
- Prediction interaction centered (draggable chart, multiple choice, or numeric input)
- "Lock in my answer" / "Show me" button — **disabled** until student has made a prediction
- The button should feel like a commitment, not a casual click

#### §8.NEW-3: Challenge Screens — Reveal Phase

- Chart dominates the screen
- Student's prediction stays visible as a ghost (dashed line, 30% opacity)
- Real curve animates in left-to-right (~2 seconds)
- Stats animate in below chart AFTER the curve finishes drawing (staggered, 200ms between each)
- "Your guess vs. Reality" is the focal point

#### §8.NEW-4: Challenge Screens — Reflect Phase

- Brief insight text (2–3 sentences — resist over-explaining)
- Chart remains visible in background
- "Next Challenge →" button prominent

#### §8.NEW-5: Challenge 1 — Draggable Prediction Chart

This is the most unique interaction and needs detailed spec:

- SVG chart with x-axis (Year 0–40) and y-axis (auto-scaled)
- Year 0 / $1,000 starting point is fixed
- **First draggable dot** at Year 10 — student drags vertically
  - Large touch target (20px radius minimum, 28px on mobile), pulsing glow to signal interactivity
  - Live tooltip shows dollar amount while dragging
  - Snap to nearest $100
  - Dashed line connects Year 0 to the dot as they drag
- **After locking Year 10**, second draggable dot appears at Year 40
  - Dashed line extends from Year 10 to Year 40
  - The resulting prediction line is piecewise-linear — this visually encodes their linear intuition, which is the whole point
- **"Show me reality" button** only after both dots are placed
- **On reveal:** prediction line stays as gray dashed ghost. Real exponential curve draws in bold with area fill. Vertical bracket at Year 40 highlights the gap.
- If their Year 40 guess is within 20% of reality, show alternate reflect text (congratulatory variant)
- Save their Year 40 guess — it's referenced again in the final summary

#### §8.NEW-6: Challenge 5 Sandbox Additions

The sandbox is the refactored original experience, with these additions:

1. **Smart defaults from their journey** — Pre-fill from challenge values, not blank
2. **"What if I wait 5 years?" button** — Prominent single-click toggle that overlays a second curve starting 5 years later. Gap at right edge is labeled with dollar amount. This is the single most important sandbox feature.
3. **Milestone callouts** — Float near chart at relevant data points:
   - "Interest exceeds contributions at age [X]"
   - "You pass $100K at age [X]"
   - "Waiting 5 years costs you $[X]"
4. **Challenge 1 callback** — Small reference: "In Challenge 1, you guessed $[X]. Now you know the real answer."

#### §8.NEW-7: Final Summary Screen

After Challenge 5, show:

- Prediction vs. reality for each challenge (percentage error, framed positively)
- Three key takeaways: compound growth accelerates, rate matters more than expected, time is the most powerful variable
- Print-friendly summary card

---

### §9. Responsive Design — SIMPLIFY

**Modify** the breakpoint layouts. The split-panel layout is gone for Challenges 1–4, so responsive behavior is simpler:

| Breakpoint          | Challenges 1–4                             | Challenge 5 (Sandbox)                                       |
| ------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| Desktop (≥1024px)   | Centered single column, max-width 720px    | Input panel left (30%), chart right (70%) — original layout |
| Tablet (768–1023px) | Same centered column, reduced chart height | Inputs as collapsible top section                           |
| Mobile (<768px)     | Full-width with padding                    | Stacked: inputs (collapsed) → chart → summary               |

**Add** to mobile considerations:

- Draggable dots in Challenge 1 need 56px+ touch targets
- Multiple choice options render as full-width stacked buttons
- Stat callouts stack vertically in reveal phase

---

### §10. Animations — EXTEND

**Keep** all existing animations (chart draw, input change morph, comparison enter, stat counters, callout appearances, `requestAnimationFrame` usage, debouncing, `will-change`).

**Add** the following animation moments:

| Moment                     | Animation                                                         | Duration                     |
| -------------------------- | ----------------------------------------------------------------- | ---------------------------- |
| Prediction ghost fade      | Student's guess line fades to 30% opacity when real curve appears | 500ms                        |
| Gap bracket                | Vertical bracket draws between prediction and reality at Year 40  | 400ms, after curve completes |
| Challenge transition       | Crossfade between reflect phase and next predict phase            | 400ms                        |
| Dot placement              | Subtle scale bounce when student drops a draggable dot            | 150ms                        |
| Multiple choice selection  | Selected option fills with accent color, others fade              | 200ms                        |
| Milestone pop-in (sandbox) | Callout appears at chart point when milestone is reached          | 200ms                        |

**Modify** the initial draw duration from 1.5s to **2.0s** for reveal phases — the slower draw builds more anticipation when the student is watching their prediction get proven wrong.

---

### §11. Accessibility — EXTEND

**Keep** all existing accessibility requirements (labels, chart aria-labels, keyboard navigation, color+pattern differentiation, `aria-live` regions, `prefers-reduced-motion`).

**Add:**

- Draggable prediction dots must have **keyboard alternatives**: arrow keys to adjust value in $100 increments, Enter to lock placement
- Multiple choice predictions use proper **radio button semantics** (`role="radiogroup"`, `aria-checked`)
- **Focus management**: when transitioning between predict → reveal → reflect, programmatically move focus to the new primary content area
- Animated number counters use `aria-live="polite"` and announce only the final value (not intermediate animation frames)

---

### §13. Testing — EXTEND

**Keep** all existing unit tests (CompoundInterestService math, input validation, formatters).

**Add** challenge state tests:

```
ChallengeState:
- currentChallenge advances correctly 1 → 2 → 3 → 4 → 5
- phase cycles predict → reveal → reflect within each challenge
- Cannot advance to next challenge without completing current
- predictions object stores correctly per challenge
- completedChallenges set updates on each completion

Prediction accuracy:
- Challenge 1: correctly calculates absolute and percentage distance between guess and reality
- Challenge 1: "accurate" threshold (within 20%) triggers alternate reflect text
- Challenge 2: correctly identifies which multiple choice option matches reality (~4.5x)
- Challenge 4: correctly computes early-vs-late delta
```

**Replace** the manual QA checklist with:

- [ ] Challenge 1 dots are draggable and snap to $100 increments
- [ ] Challenge 1 prediction line draws as piecewise-linear through dots
- [ ] "Show me" button is disabled until both dots are placed
- [ ] Reveal curve animates left-to-right over 2 seconds
- [ ] Student's prediction stays visible as ghost overlay
- [ ] Stats animate in after curve finishes drawing
- [ ] Challenge 2 multiple choice highlights selection, disables others
- [ ] Challenge 3 free input accepts reasonable range, disables "Show me" when empty
- [ ] Challenge 4 dual curves animate simultaneously with age-based x-axis
- [ ] Challenge 5 sandbox sliders update chart in real-time
- [ ] "What if I wait 5 years?" toggle overlays second curve with gap label
- [ ] Challenge 5 shows Challenge 1 prediction callback
- [ ] Progress bar updates correctly through all 5 challenges
- [ ] Cannot navigate to later challenges without completing earlier ones
- [ ] Final summary shows all predictions vs. reality
- [ ] Responsive at all three breakpoints
- [ ] Touch interactions work on mobile (draggable dots, sliders, choices)
- [ ] Keyboard navigation works for draggable dots and all inputs
- [ ] Reduced motion preference disables all animations
- [ ] All challenge text matches `challenge-content.ts`

---

### §14. Implementation Order — REPLACE

The original build order assumed a sandbox-first approach. Reverse it: build the guided challenges first, sandbox last.

1. **Models & service extensions** — Add challenge state interfaces, milestone type, convenience methods on the service. Unit test the convenience methods.
2. **Challenge state machine** — Root component managing `ChallengeState`, progress bar, phase transitions. This is the skeleton everything hangs on.
3. **Shared chart component refactor** — Extend the growth chart to support: prediction ghost overlays, dual curves, stacked areas, animated left-to-right draw, and gap brackets. These are modes/options on the existing component.
4. **Challenge 1** — Prediction chart with draggable dots, reveal animation, reflect card. Hardest interaction — build early.
5. **Challenge 2** — Multiple choice prediction, dual-curve reveal. Lighter lift — reuses chart.
6. **Challenge 3** — Numeric input prediction, stacked area reveal.
7. **Challenge 4** — Multiple choice prediction, racing dual curves with age-based x-axis.
8. **Challenge 5 sandbox** — Refactor existing input panel with question framing, add milestone callouts, "What if I wait?" toggle, Challenge 1 callback.
9. **Final summary screen** — Prediction recap, key takeaways.
10. **Animation polish** — Fine-tune timings, stagger sequences, easing curves.
11. **Responsive pass** — Mobile touch targets, column stacking, chart resizing.
12. **Accessibility pass** — Keyboard alternatives for dots, focus management, ARIA updates, reduced motion.

---

### §16. Future Enhancements — MODIFY

**Remove** from future enhancements (now in scope):

- ~~"What if" mode~~ → Built into Challenge 5 as "What if I wait 5 years?"
- ~~Age mode~~ → Built into Challenge 4 and Challenge 5 (age-based x-axis)
- ~~Guided walkthrough~~ → The five challenges ARE the guided walkthrough

**Keep:**

- Inflation adjustment toggle
- Export/share (URL-encoded inputs)
- Retirement target line

**Add:**

- **Classroom mode** — Teacher sees anonymized distribution of student predictions to spark discussion
- **Embedded reflection prompts** — Short-answer text boxes after each challenge for graded use

---

## §NEW-A: Challenge Definitions

### Challenge 1: "The Guess"

**Learning target:** Students dramatically underestimate exponential growth.

**Setup text:** "Your friend receives $1,000 as a graduation gift. They invest it and earn 7% interest every year. They don't add any more money — just let it sit."

**Prediction:** Drag dots on a blank chart at Year 10 and Year 40. (See §8.NEW-5 for full interaction spec.)

**Reveal:** Animate real curve ($1,000 → $14,974 at Year 40). Show ghost of their prediction line. Display "Your guess: $[X] / Reality: $14,974 / You were off by: $[delta]".

**Reflect:** "Almost everyone underestimates this. The growth looks slow at first, then accelerates — that's the 'compound' effect. Your money doesn't just earn interest. It earns interest _on the interest._"

**Alternate reflect (if guess within 20%):** "Impressive — most people guess way lower. But did you expect it to _curve_ like that? The growth isn't steady — it accelerates."

---

### Challenge 2: "Rate Matters More Than You Think"

**Learning target:** Small rate differences create enormous outcome differences.

**Setup text:** "Same $1,000. Same 40 years. But what if the interest rate changes?"

**Prediction:** Multiple choice — "One account earns 5%. Another earns 9%. How much more does the 9% account have after 40 years?"

- A) About 2× as much
- B) About 4× as much
- C) About 6× as much
- D) About 10× as much

**Reveal:** Animate two curves. 5% → $7,040. 9% → $31,409. Answer is ~4.5× (closest to B, but the exact number is the point).

**Reflect:** "The rate only went up by 4 percentage points — but the final amount more than quadrupled. That's why it's worth knowing what different accounts and investments actually earn."

---

### Challenge 3: "The Power of Adding a Little"

**Learning target:** Regular small contributions are transformative with compounding.

**Setup text:** "Let's go back to that $1,000 at 7% for 40 years. But now you add $100 every month — like a small automatic transfer from a paycheck."

**Prediction:** Free numeric input — "You'll put in $49,000 of your own money over 40 years. Combined with compound interest — how much do you think you'll end up with?" Show the Challenge 1 lump-sum curve ($14,974) already plotted as reference.

**Reveal:** Animate new curve on top of old. Stacked area: contributions ($49k) on bottom, interest ($213k) on top. Final: $262,481. Emphasize: "81% of your final balance is money you never earned or saved."

**Reflect:** "$100/month is about $3.30/day. Compound interest turned $49,000 of your money into over $260,000. That's the power of consistent investing over time."

---

### Challenge 4: "The Cost of Waiting"

**Learning target:** Time is the most powerful variable. This is the emotional climax.

**Setup text:** "Meet two people. Both invest $200/month at 7%. Same plan, same discipline. The only difference is when they start. Alex starts at age 22. Jordan starts at age 32 — just 10 years later. Both invest until age 62."

**Prediction:** Multiple choice — "Alex puts in $24,000 more than Jordan. How much more does Alex end up with?"

- A) About $24,000 more (just the extra contributions)
- B) About $50,000 more
- C) About $100,000 more
- D) About $200,000 more
- E) More than $200,000 more

**Reveal:** Animate both curves racing on the same chart (age-based x-axis, 22–62). Alex: $528,313 (contributed $96k). Jordan: $236,499 (contributed $72k). Gap: $291,814. Answer is E. Show: "Alex put in $24,000 more — but ended with $291,814 more."

**Reflect:** "Jordan didn't do anything wrong — they invested consistently for 30 years. But those first 10 years of compound growth are the most valuable years you'll ever have. Every dollar has the longest time to multiply. That's time you can never get back."

---

### Challenge 5: "Your Time Machine"

**Learning target:** Apply the mental models from Challenges 1–4 to your own situation.

No predict/reveal/reflect cycle — this is the open sandbox. But it's framed and scaffolded (see §8.NEW-6 for full details). The key additions over the original sandbox are: question-framed inputs, "What if I wait 5 years?" toggle, milestone callouts, and the Challenge 1 prediction callback.

---

## §NEW-B: Challenge Content File

All student-facing text lives in `data/challenge-content.ts`. This is the single file to edit when refining copy. Full content is defined in the challenge definitions above (§NEW-A). Structure:

```typescript
export const CHALLENGE_CONTENT = {
  challenge1: {
    title: string;
    setup: string;
    predictPrompt10: string;
    predictPrompt40: string;
    revealButton: string;
    reflectInsight: string;
    reflectInsightAccurate: string;   // Alternate for students within 20%
  },
  challenge2: {
    title: string;
    setup: string;
    predictPrompt: string;
    options: { id: string; label: string }[];
    reflectInsight: string;
  },
  challenge3: {
    title: string;
    setup: string;
    predictPrompt: string;
    reflectInsight: string;
  },
  challenge4: {
    title: string;
    setup: string;
    setupDetail: string;
    predictPrompt: string;
    options: { id: string; label: string }[];
    reflectInsight: string;
  },
  challenge5: {
    title: string;
    setup: string;
    inputPrompts: Record<string, string>;
    waitToggle: string;
  },
  summary: {
    title: string;
    takeaway1: string;
    takeaway2: string;
    takeaway3: string;
  },
};
```

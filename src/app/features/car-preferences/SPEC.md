# Driving Preferences Survey - Implementation Spec

**Feature name:** `car-preferences`
**Scope:** Preference profile + live radar chart only. No car matching, no comparison step. The `PreferenceProfile` data contract is designed so a future tool can consume it for recommendations or a stated-vs-actual overlay without rework.

---

## 1. Pedagogical Framework

This is a values-clarification instrument, not a simulation. Its job is to make students articulate tradeoffs they normally hold vaguely ("I want a nice car") as explicit, comparable numbers before they ever look at a vehicle listing.

The radar chart is the payoff: students see their priorities as a shape, and the live anchor text translates each abstract number into a concrete real-world meaning ("7 on Budget means $50k - $75k, is that actually you?"). The friction of reading what a number means is the learning moment.

Design constraints:

- No gamification. No scores, no badges. The chart is a mirror, not a reward.
- Anchor text must be concrete and dollar/spec-grounded wherever possible. "High performance" teaches nothing; "sport-tuned handling, quick merging acceleration" does.
- By default the tool does not force tradeoffs (a student can set all 10s). An optional `pointBudget` config flag adds a constraint if a teacher wants tradeoffs enforced. Off by default. See Section 3.

---

## 2. TypeScript Interfaces

```ts
export interface PreferenceAnchor {
  value: number; // position on the 0-10 scale
  tag: string; // short label, e.g. "Conservative"
  description: string; // full text, e.g. "Vehicles around $15k"
}

export interface PreferenceCategory {
  id: string; // stable key, e.g. "budget" (never changes once shipped)
  label: string; // display name, e.g. "Budget"
  anchors: PreferenceAnchor[]; // ascending by value; must include 0 and 10
  defaultValue?: number; // defaults to 5 if omitted
}

export interface SurveyConfig {
  title: string; // "Your Driving Preferences"
  categories: PreferenceCategory[]; // order here = slider order = chart axis order (clockwise from top)
  pointBudget?: number | null; // optional total-points cap; null/absent = unconstrained
}

export interface PreferenceProfile {
  version: 1;
  values: Record<string, number>; // categoryId -> 0-10
  savedAt: string; // ISO timestamp
}
```

Pure helper (unit tested, no dependencies):

```ts
// Returns the anchor closest to value. Ties round toward the higher anchor.
// e.g. value 4 with anchors at 3 and 5 returns the anchor at 5.
export function nearestAnchor(value: number, anchors: PreferenceAnchor[]): PreferenceAnchor;
```

---

## 3. Config File & Draft Content

Single file: `car-preferences.config.json`. This is the only file a non-technical editor ever touches. All categories, anchor values, tags, descriptions, dollar ranges, and the optional point budget live here. Adding or removing a category requires zero code changes: sliders, chart axes, and the key table all render from this array.

```json
{
  "title": "Your Driving Preferences",
  "pointBudget": null,
  "categories": [
    {
      "id": "performance",
      "label": "Performance",
      "anchors": [
        {
          "value": 0,
          "tag": "Minimal",
          "description": "Just needs to move; acceleration and handling don't matter"
        },
        {
          "value": 3,
          "tag": "Modest",
          "description": "Comfortable merging and keeping up with traffic"
        },
        {
          "value": 5,
          "tag": "Average",
          "description": "Responsive everyday acceleration and handling"
        },
        {
          "value": 7,
          "tag": "Spirited",
          "description": "Quick acceleration, sport-tuned handling"
        },
        {
          "value": 10,
          "tag": "Maximum",
          "description": "Sports car acceleration, track-level handling"
        }
      ]
    },
    {
      "id": "efficiency",
      "label": "Efficiency",
      "anchors": [
        {
          "value": 0,
          "tag": "Minimal",
          "description": "Fuel costs aren't a factor (under 15 MPG is fine)"
        },
        { "value": 3, "tag": "Modest", "description": "Around 20 MPG" },
        { "value": 5, "tag": "Average", "description": "25 - 30 MPG" },
        { "value": 7, "tag": "High", "description": "35 - 45 MPG or hybrid" },
        { "value": 10, "tag": "Maximum", "description": "Plug-in hybrid or full EV" }
      ]
    },
    {
      "id": "budget",
      "label": "Budget",
      "anchors": [
        { "value": 0, "tag": "Low", "description": "Vehicles under $5k" },
        { "value": 3, "tag": "Conservative", "description": "Vehicles around $15k" },
        { "value": 5, "tag": "Average", "description": "Vehicles $20k - $35k" },
        { "value": 7, "tag": "High", "description": "Vehicles $50k - $75k" },
        { "value": 10, "tag": "Maximum", "description": "$100k+" }
      ]
    },
    {
      "id": "style",
      "label": "Style",
      "anchors": [
        { "value": 0, "tag": "Minimal", "description": "Looks don't matter at all" },
        { "value": 3, "tag": "Modest", "description": "Presentable, no strong opinions" },
        { "value": 5, "tag": "Average", "description": "Want something that looks good" },
        { "value": 7, "tag": "High", "description": "Distinctive design is a real factor" },
        { "value": 10, "tag": "Maximum", "description": "Head-turner; design is a top priority" }
      ]
    },
    {
      "id": "safety",
      "label": "Safety",
      "anchors": [
        { "value": 0, "tag": "Minimal", "description": "Meets legal requirements" },
        { "value": 3, "tag": "Modest", "description": "Solid crash-test ratings" },
        {
          "value": 5,
          "tag": "Average",
          "description": "Good ratings plus basics like a backup camera"
        },
        {
          "value": 7,
          "tag": "High",
          "description": "Top ratings plus driver-assist (blind spot, lane keep)"
        },
        {
          "value": 10,
          "tag": "Maximum",
          "description": "Best-in-class ratings, full active safety suite"
        }
      ]
    },
    {
      "id": "reliability",
      "label": "Reliability",
      "anchors": [
        {
          "value": 0,
          "tag": "Minimal",
          "description": "Fine with frequent repairs or a project car"
        },
        { "value": 3, "tag": "Modest", "description": "Occasional repairs are acceptable" },
        { "value": 5, "tag": "Average", "description": "Typical maintenance, few surprises" },
        { "value": 7, "tag": "High", "description": "Strong reliability record, low repair costs" },
        {
          "value": 10,
          "tag": "Maximum",
          "description": "Top reliability brands; expect 200k+ miles"
        }
      ]
    },
    {
      "id": "utility",
      "label": "Utility & Cargo",
      "anchors": [
        { "value": 0, "tag": "Minimal", "description": "Just the driver" },
        { "value": 3, "tag": "Modest", "description": "A passenger and some groceries" },
        { "value": 5, "tag": "Average", "description": "4 - 5 people, trunk for luggage" },
        { "value": 7, "tag": "High", "description": "Big cargo area, gear hauling, light towing" },
        {
          "value": 10,
          "tag": "Maximum",
          "description": "Max passengers and cargo, or serious towing"
        }
      ]
    }
  ]
}
```

All anchor copy except Budget is draft. Edit in the config, not in code.

**Config validation (dev-time, in `SurveyConfigService`):** ids unique, anchors ascending, first anchor value 0, last anchor value 10, anchor values within 0-10, `pointBudget` (if set) between `categories.length * 0` and `categories.length * 10`. Fail loudly in dev, fall back gracefully in prod (log + render with whatever is valid).

---

## 4. Component Architecture

Angular 21, standalone components, signals for state. Scaffold with `npm run feature car-preferences`.

```
DrivingPreferencesComponent          (container; owns state, save logic, persistence)
├── PreferenceSliderComponent  (x N) (label, range input, value bubble, live anchor text)
├── PreferenceRadarComponent         (Chart.js radar wrapper)
├── AnchorKeyComponent               (compact key table)
└── ProfileSummaryComponent          (post-save view: chart + table + share link + Edit)

SurveyConfigService                  (loads + validates config JSON)
nearest-anchor.util.ts               (pure helper + tests)
```

State in the container:

```ts
values = signal<Record<string, number>>(...);   // initialized from defaults / URL / localStorage
touched = signal<Set<string>>(new Set());        // which sliders the student has interacted with
saved = signal<boolean>(false);
chartData = computed(() => ...);                 // derived from values + config order
allTouched = computed(() => touched().size === config.categories.length);
pointsUsed = computed(() => sum of values);      // only relevant if pointBudget set
```

Chart.js notes:

- Radar type. `scales.r: { min: 0, max: 10, ticks: { stepSize: 1 } }`.
- Update on every slider change with `chart.update('none')` (no animation during drag; a 150ms ease is fine on discrete keyboard steps if trivial, otherwise skip).
- Green fill ~0.25 alpha, solid green line, point radius 3, matching the reference look but pulling colors from the monorepo theme tokens.
- `maintainAspectRatio: false`, sized by container, destroyed in `ngOnDestroy`.

---

## 5. User Flow

1. **Load.** Config loads. Initial values resolve in priority order: `profile` URL param → localStorage → config defaults (5). If restored from URL or localStorage, all sliders count as touched and the state note reads "Restored your saved preferences."
2. **Adjust.** Student drags or arrow-keys a slider. On every change: value bubble updates, live anchor line below the slider updates to the nearest anchor (`Tag: description` format, e.g. `Conservative: Vehicles around $15k`), radar redraws instantly. First interaction with a slider marks it touched, even if returned to its default.
3. **Progress.** "Save & Continue" is disabled until every slider has been touched. Helper text under the button: "Set all 7 preferences to continue (4 of 7 set)." Rationale: untouched defaults of 5 are indistinguishable from a deliberate 5; requiring a touch forces the student to at least read each category.
4. **Point budget (only if configured).** A counter shows "Points used: 46 / 42." Sliders are not blocked; exceeding the budget disables Save and turns the counter red with "Lower some priorities to fit your budget." Letting students overshoot and then walk it back is the tradeoff lesson; hard-capping slider movement hides it.
5. **Save.** On Save & Continue: persist `PreferenceProfile` to `localStorage['car-preferences:v1']`, emit a `profileSaved` output event for the host page, switch to summary state.
6. **Summary state.** Static radar chart, a table of `Category | Value | Tag` rows, a "Copy my profile link" button, and an "Edit preferences" button that returns to the slider state with values intact.
7. **Share link.** `?profile=5,6,7,3,5,5,8` with values positional in config category order. On load, malformed or wrong-length params are ignored silently (fall through to localStorage/defaults). Documented caveat: reordering categories in the config breaks old links; appending new categories does not (missing trailing values fall back to defaults).

Between-anchor display rule: the live anchor line always shows the nearest anchor, ties rounding up (value 4 shows the 5 anchor, value 2 shows the 3 anchor). The exact number is always visible in the value bubble, so no "approximately" qualifier is needed.

---

## 6. UI / UX Guidelines

- **Layout, desktop:** two columns. Sliders left (~55%), radar chart right, sticky so it stays visible while scrolling sliders. Key table full width below. Save button below the chart.
- **Layout, mobile:** single column. Chart first, then sliders, then key, then Save. Chart scales down to ~320px wide.
- **Slider row anatomy:** category label (left) + value bubble (right) on one line; range input below with small tick dots rendered at each anchor position (0, 3, 5, 7, 10); live anchor line below that. Reserve a fixed min-height (two lines) for the anchor line so changing values never causes layout shift.
- **Compact key (AnchorKeyComponent):** a table, one row per category, one column per anchor value. Header row: 0, 3, 5, 7, 10. Cells contain the `tag` only ("Low", "Conservative", "Average", "High", "Maximum"). Full descriptions live in the per-slider live text, so the key stays scannable. Caption above the table: "What the numbers mean. Drag any slider to see the full description."
- **Chart axis order:** clockwise from top: Performance, Efficiency, Budget, Style, Safety, Reliability, Utility & Cargo (driven by config order).
- No emoji, no decorative icons. Tone matches existing NGPF tools.

---

## 7. Accessibility Requirements (WCAG 2.1 AA)

- Native `<input type="range">`, programmatically labeled with the category name. Arrow keys step by 1, Home/End jump to 0/10.
- `aria-valuetext` on each slider set to the full live meaning, e.g. `"5, Average: Vehicles $20k - $35k"`, updated on change.
- Radar chart container: `role="img"` with a computed `aria-label` summarizing all values ("Radar chart of your driving preferences. Performance 5, Efficiency 6, ..."). The key table and summary table serve as the accessible data equivalents; never rely on the canvas alone.
- Key table is a semantic `<table>` with `scope` on header cells.
- Disabled Save button has an adjacent visible text reason (the progress helper text), not just the disabled state.
- Visible focus indicators, 4.5:1 text contrast, 44px minimum touch targets on slider thumbs and buttons.
- `prefers-reduced-motion`: chart animations fully off.

---

## 8. Testing Checklist

- [ ] `nearestAnchor`: exact anchor values return themselves; boundaries 1, 2, 4, 6, 8, 9 map correctly; ties round up
- [ ] Config validation: rejects duplicate ids, non-ascending anchors, missing 0 or 10 anchor
- [ ] Removing/adding a category in config updates sliders, chart axes, and key table with no code change
- [ ] Chart redraws on every slider change with no animation jitter during drag
- [ ] Save disabled until all sliders touched; touch counts even when value returns to default
- [ ] `pointBudget` mode: counter math, overshoot disables Save, walk-back re-enables
- [ ] localStorage roundtrip: save, reload, restored state with sliders marked touched
- [ ] URL param: valid string restores; wrong length, non-numeric, or out-of-range values fall through silently
- [ ] Share link copies correct positional values in config order
- [ ] Edit from summary returns with values intact
- [ ] Keyboard-only completion of the entire flow; screen reader announces `aria-valuetext` on change
- [ ] axe scan clean; reduced-motion respected
- [ ] Mobile layout at 320px: no horizontal scroll, chart legible

---

## 9. Implementation Order

1. Scaffold: `npm run feature car-preferences`
2. `car-preferences.config.json` + `SurveyConfigService` with validation
3. `nearestAnchor` util + unit tests
4. `PreferenceSliderComponent` (static, then wired to signals)
5. `PreferenceRadarComponent` with live updates
6. `AnchorKeyComponent`
7. Container state: touched tracking, Save gating, optional point budget
8. `ProfileSummaryComponent` + localStorage + URL param + share link
9. Accessibility pass (aria-valuetext, chart label, keyboard audit)
10. Styling pass against theme tokens, mobile layout
11. Run testing checklist

---

## 10. Maintenance

Evergreen except for one annual touch: an editor reviews `car-preferences.config.json` and updates dollar figures (Budget bands) and efficiency anchors (MPG ranges, EV framing) for the current market. No other maintenance expected. No external APIs, no data feeds.

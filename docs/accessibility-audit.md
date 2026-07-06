# NGPF Interactives — WCAG 2.1 A/AA Accessibility Audit

**Scope:** all 9 features currently on the `live` branch plus shared infrastructure.
**Method:** three parallel code inspections against the full A + AA success-criteria checklist, no automated scan tools used yet.
**Date:** 2026-07-06.

## Verdict

**Not compliant.** Roughly 30 distinct A/AA violations found across the app. Most are pattern-level and repeated across multiple features — fix the pattern once and many findings clear at the same time. A concentrated 2–3 sprint effort should get the site to A/AA. Nothing in the audit is architecturally hard.

---

## The 5 root causes that drive most findings

1. **Design tokens fail contrast.** `--ngpf-text-muted` (#999) is 2.85:1 on white — every hint, caption, chart tick label, and sub-label using it fails 1.4.3. `--ngpf-sky-blue` (#1db8e8) is 2.4:1 — every `:focus-visible` outline in the app fails 1.4.11. `--ngpf-orange` (#f78219) with white text is 2.79:1 — the amortization error banner fails, and it's the primary error surface. `--ngpf-gold` (#f4ad00) on white is 2.0:1 — retirement target line, net-worth "wrong-guess" state.
2. **Skip link and `<main>` landmarks incomplete.** The site-wide skip link (`app.html`) uses `.sr-only` clipping that never un-clips on focus, and its `#main-content` target only exists on the flashcards page. Home and Amortization use plain `<div>` wrappers.
3. **`role="radiogroup"` misused with `<button aria-pressed>` children in three features** (flashcards study-mode, net-worth predict-view, cost-of-borrowing question-item). Radio pattern requires `role="radio"` + `aria-checked` + roving tabindex + arrow-key navigation. As shipped, screen readers announce "toggle button, pressed" instead of "radio 1 of 3".
4. **Animated `aria-live` stat counters spam screen readers.** The `stat-counter` component copies in retirement-calculator and net-worth-visualizer put `aria-live="polite"` on the animating text node; ~60 updates/second are announced during each count-up.
5. **Mouse-only interactive charts and dropdowns.** The stock-tracker autocomplete has no keyboard handlers at all (2.1.1 hard fail). The cost-of-borrowing trend chart and retirement/stock-tracker chart tooltips only respond to `mousemove`.

---

## Site-wide fixes (fix once, benefit everywhere)

| Priority | Fix | File(s) |
|--|--|--|
| P0 | Change `--ngpf-text-muted` from `#999999` to at least `#767676` (4.54:1). | `src/styles.scss:34` |
| P0 | Change `:focus-visible` outline color from `--ngpf-sky-blue` to `--ngpf-royal-blue` (or add a 2px white halo). | `src/styles.scss` + every component's `:focus-visible` block |
| P0 | Retire `--ngpf-orange` for text-on-color error surfaces. Use `--ngpf-error` for error backgrounds with white text, or dark text on the orange. | `src/styles.scss:17`, `.ngpf-label-warning`, loan-form error banner |
| P0 | Add `<main id="main-content">` wrappers on Home and Understanding Amortization. | `home.html:2`, `understanding-amortization.html:2` |
| P0 | Make the skip link visible on focus. Add `:focus-visible { position: fixed; top: 0; left: 0; clip: auto; width: auto; height: auto; padding: 8px 16px; background: var(--ngpf-royal-blue); color: white; z-index: 9999; }` to the `.sr-only` skip link. | `src/styles.scss:419-429`, `app.html:1` |
| P0 | Fix `stat-counter` live-region strategy: keep visible animation, but move `aria-live` to a sibling that only publishes the final formatted value. | both `stat-counter.component.ts` copies |
| P1 | Darken `--ngpf-light-gray-blue` from `#d2d8e9` (1.35:1) so control borders meet 3:1. Or add a subtle shadow. | `src/styles.scss:20` |
| P1 | Adopt one radiogroup pattern and apply everywhere: either drop `role="radiogroup"` in favor of `role="group"` + `<button aria-pressed>` (toggle group semantics — no arrow keys required), or convert to real `<input type="radio">` for single-choice questions. Recommendation: use real `<input type="radio">` for question-item and predict-view (semantically correct + zero JS); use `role="group"` for the flashcards study-mode toggle (three toggle actions, not a single choice). | flashcards, net-worth, cost-of-borrowing |
| P1 | Add `lang="es"` wrappers on Spanish content and Spanish UI labels. | flashcards study-settings toggle, card `aria-label` |
| P1 | Focus management: after any phase/step change, move focus to the new view's `<h2>` (add `tabindex="-1"` and `.focus()`). Currently only compound-interest does this. | net-worth, cost-of-borrowing, stock-tracker, template-builder |
| P2 | Retire `--ngpf-gold` for text-on-white. | `src/styles.scss`, growth-chart target line, net-worth "wrong" state |
| P2 | Verify page titles set for every route (template-example has none). | `app.routes.ts:9` |

---

## Per-feature findings

### Home
- **1.3.1** Missing `<main>` landmark. — `home.html:2`
- **1.3.1 (recommended)** Card grid uses `<a>` children of a `<div>`; wrapping in `<ul>` lets screen readers announce "list, N items". — `home.html:6-39`

### Understanding Amortization (Loan Amortization Calculator)
- **1.3.1** Missing `<main>` landmark. Uses `<h2>` as the page's top heading, skipping `<h1>`. — `understanding-amortization.html`
- **2.1.1** When form is collapsed, inputs remain focusable. `.loan-form__wrapper--hidden` only sets `opacity: 0` + `pointer-events: none` — need `inert` or `visibility: hidden`. — `loan-form.scss:15-19`, `loan-form.html:13-18`
- **1.4.3** Error banner: white text on orange = 2.79:1. Primary error surface. — `loan-form.scss:89-106`, `loan-form.html:109`
- **4.1.2** `role="alert"` + `aria-live="polite"` on same element (role implies assertive). — `loan-form.html:109`
- **1.1.1** Donut chart has good `aria-label`; balance line-chart `aria-label` omits actual values. Add a visually-hidden `<table>` with year/balance rows. — `loan-charts.ts:69-77, 158`
- **3.3.3** Error messages restate requirements without suggesting concrete fixes.

### Vocabulary Flashcards
- **3.1.2** "Estudiar en Español" button and Spanish content lack `lang="es"`. Card `aria-label` interpolates Spanish text into an English sentence without `lang`. — `study-settings.component.html:69`, `flashcard-viewer.component.html:30`
- **4.1.2** Study-mode `role="radiogroup"` with three `<button>` children has no arrow-key navigation and no roving tabindex — invalid ARIA radio pattern. — `study-settings.component.html:11-50`
- **2.4.7 / 4.1.2** Focus is moved to `querySelector('h2')` on view change, but `unit-selection` and `study-settings` have no `<h2>`; focus goes nowhere. — `ngpf-vocabulary-flashcards.ts:66-73`
- **1.4.3** `.flip-hint` and front-card `.card-label` use `--ngpf-text-muted` at 12px on white.
- **2.1.1** Space keydown handler catches all Space presses including inside `<button>` — Exit button will both activate and flip the card. — `flashcard-viewer.component.ts:94-120`

### Driving Preferences (car-preferences)
- **1.3.1** Missing `<main>` landmark. — `car-preferences.html:2`
- **1.4.1** Budget over-limit indicated by color swap alone; text still reads "Points used: N / M". Add "(over budget)" text when over. — `car-preferences.html:28-34`
- **4.1.2** Slider has both `<label for>` and `aria-label` on the input — `aria-label` overrides the associated `<label>`. Drop the `aria-label`. — `preference-slider.component.html:19`
- **1.4.11** Slider tick color uses `--ngpf-text-muted` (marginal), focus outline uses `--ngpf-sky-blue` (fails).
- **Good:** radar chart has proper `role="img"` + computed `aria-label` + visually-hidden data table.

### Retirement Calculator
- **3.3.1 / 3.3.2 / 3.3.3** No error identification, labels, or suggestions when a number input is out of bounds. `updateNumber` accepts any finite number, including negatives and unrealistic ranges. — `inputs-panel.ts:23-27`
- **4.1.3** `<app-stat-counter aria-live="polite">` announces every animation frame; four counters × ~30 frames = ~120 announcements per input change. — `results-panel.html`
- **1.4.3** Result tile labels, input hints, chart tick labels, chart caption all use `--ngpf-text-muted`.
- **1.4.3 / 1.4.11** Chart target line and label use `--ngpf-gold` (~2.0:1). — `growth-chart.ts:126,137`
- **1.3.1** Assumptions section uses `<h3>` where `<h2>` is expected (skips heading level). — `retirement-calculator.html:26`

### Salary vs. Net Worth (net-worth-visualizer)
- **4.1.2** `role="radiogroup"` with `<button aria-pressed>` children — wrong pattern (see site-wide P1). — `predict-view.html:12-40`
- **4.1.3** Phase transitions (predict → reveal → summary) not announced. Reveal-stages live region wraps the entire chip list, so it re-announces the full list every 700ms instead of only the new stage. — `net-worth-visualizer.html:8-27`, `comparison-view.html:4`
- **4.1.3** Same `stat-counter` spam as retirement.
- **2.4.3** Focus lost on phase change.
- **1.4.3** `.profile-card__job`, `__section-header`, `__row-unit`, `__net-worth-label`, `.comparison-view__stage` all use `--ngpf-text-muted`.
- **1.4.11** Choice button unselected border and focus outline fail 3:1.

### 5 Stocks for Your Birthday (stock-tracker)
- **2.1.1 / 4.1.2 (Critical)** Autocomplete dropdown is mouse-only. Input has no `role="combobox"`, no `aria-expanded`, no keydown handler. Options fire only on `(mousedown)`. Keyboard users can search but cannot select. — `stock-picker.component.html:28-56`, `stock-picker.component.ts`
- **1.3.1** All four data tables missing `scope="col"` on `<th>` and missing `<caption>`. The ROI summary table has an empty leading `<th></th>` for a decorative color-dot column. — `stock-table`, `combined-table`, `roi-summary-table`, `setup-step`
- **2.1.1 / 1.4.13** Chart.js tooltips are hover-only (default). Canvas has no `tabindex`, no keyboard equivalent. Data tables partially compensate but tooltip data isn't reachable. — `multi-line-chart.component.ts:129-140`, `roi-bar-chart.component.ts`
- **1.1.1** Chart `aria-label` describes chart type only, not the actual best/worst performer or ROI. — same files
- **4.1.3** Failed-ticker error `<div>` has no `role="alert"` — silent to AT. — `track-step.component.html:20-25`
- **1.1.1** Emoji icons in callout cards are rendered as plain text without `aria-hidden`. — `callout-cards.component.ts:20`
- **3.3.1** Birthday input errors aren't linked via `aria-describedby`, and inputs lack `aria-invalid`. — `birthday-input.component.ts:47-63`
- **Opportunity (not a hard fail):** PNG-only chart/table export. Consider adding a CSV data export for AT users.

### Cost of Borrowing
- **4.1.2** Question multiple-choice uses `role="radiogroup"` + `<button aria-pressed>` — wrong pattern. Recommend real `<input type="radio">`. — `question-item.html:14-29`
- **2.1.1 / 1.4.13** Trend chart tooltip is mouse-only. SVG has no `tabindex`, no keyboard navigation between years. — `trend-chart.ts:221`
- **1.3.1 / 3.3.2** Numeric and short-text inputs have no `<label>` — placeholder-only. — `question-item.html:34-42, 50-58`
- **3.3.1** Wrong-answer input isn't marked `aria-invalid`; not linked to the verdict/explanation via `aria-describedby`.
- **1.4.11** Orange trend line `#e28f10` on white ≈ 2.55:1 (below 3:1). Darken to e.g. `#b46708`. — `trend-chart.ts:17-22`

### Template Builder
- **4.1.1 (Critical)** Duplicate IDs on preview articles when `copiesPerPage === 2` or when batch-generating multiple docs. Six editors × static `id="xxx-preview"` inside `@for` loop. — `paystub-editor.html:182`, `w2-editor.html:171`, `bill-editor.html:109`, `checkbook-editor.html:61`, `credit-report-editor.html:147`, `account-statement-editor.html:114`
- **1.1.1 / 1.3.1** W-2 Box 13 checkboxes: checked state conveyed only by CSS class on a `<span>`. Screen readers hear the label with no state. — `w2-editor.html:275-286`
- **1.3.1** Editor catalog tiles are `<button>`s with title spans, no `<h3>`. Users can't skim templates via heading nav. — `template-builder.html:18-31`
- **1.3.1 (Pattern)** Line-item rows aren't grouped with `<fieldset>` / `role="group"` / a per-row label. Screen readers read a wall of "Description edit, Hours edit, Rate edit, Remove earning row" repeatedly. — every editor
- **4.1.2** "Remove" button labels are generic when multiple rows exist. Prefix with row context (e.g. `aria-label="Remove earning row: {{ description }}"`).
- **4.1.3** Batch-generate and clear-all don't announce completion. Wrap the preview count in `role="status"`.
- **1.4.11** Credit-score bar color needs verification against 3:1 for the bar and 4.5:1 for the number text at each score category.

---

## Suggested sprint plan

### Sprint 1 — Site-wide token + skip-link fixes (highest leverage, ~1 day)
- Update `--ngpf-text-muted`, `--ngpf-sky-blue` focus token, `--ngpf-orange` error usage, `--ngpf-light-gray-blue` in `styles.scss`.
- Fix the skip link (visible on focus, `#main-content` targets exist).
- Add `<main id="main-content">` to Home and Understanding Amortization.
- Fix the two `stat-counter` copies to publish the final value only.

This alone probably clears ~40% of the total findings.

### Sprint 2 — Radiogroup + focus management (~2 days)
- Convert flashcards, net-worth, and cost-of-borrowing radiogroups to consistent pattern.
- Add focus-move-to-new-heading after phase/step transitions in net-worth, cost-of-borrowing, stock-tracker, template-builder.
- Fix flashcards `lang="es"` wrappers.
- Fix loan-form `inert` when collapsed.

### Sprint 3 — Feature-specific hard fails (~3 days)
- Stock-tracker: implement combobox keyboard pattern; add `scope="col"` + `<caption>` to all tables.
- Cost-of-borrowing: add real `<label>` to numeric/short-text; make chart tooltip focusable.
- Template-builder: dynamic IDs; fieldset per line-item row; announce batch-generate.
- Retirement calculator: number input validation + `aria-describedby` errors.

### Sprint 4 — Chart data alternatives + polish (~1–2 days)
- Add data-table alternatives to charts that don't have them (retirement growth, cost-of-borrowing trend, stock-tracker line charts already have combined-table, so no work needed there).
- Add `lang="en"` to `<html>`.
- Batch through remaining "likely fail" items.

### Verification pass
- Run axe DevTools across every route — should show 0 violations after Sprint 3.
- Keyboard-only walkthrough of each feature.
- NVDA + VoiceOver pass on Home, Retirement Calculator, Net Worth Visualizer (most complex non-form interactions).
- Chrome DevTools "Emulate: reduced motion" + "Emulate vision deficiencies" checks.

**Estimated total effort:** ~7 focused engineering days to get from where we are today to full A + AA compliance, with the caveat that this doesn't include browser+AT verification time (add another ~2 days for that).

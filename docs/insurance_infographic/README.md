# Handoff: Insurance Infographic — "Premiums, Deductibles, and Limits" (Ellie Updates version)

## Overview
A single, tall, print/PDF-ready **infographic** that teaches high-school students three core insurance
terms — **Premium, Deductible, Coverage Limit** — and then shows two cost relationships:
1. **Deductible ↔ Premium** move in *opposite* directions.
2. **Coverage Limit ↔ Premium** move in the *same* direction.

It is built in NGPF brand styling (True Blue / Bright Blue palette, PT Sans title, Montserrat body,
NGPF logo + patterned hero). This is the **"Ellie Updates"** direction — the branch that diverged from
the original board and carries the photographic hero, single grouped terms block, bracketed coverage bar,
and simplified footer.

## About the Design Files
The files in this bundle are **design references created in HTML/React-via-Babel** — a prototype showing
the intended look and behavior. **They are not production code to ship directly.** The task is to
**recreate this design in the target codebase's environment** (React, Vue, Svelte, a CMS template, a
static-site generator, etc.), using that codebase's established component patterns, and its own build of
the NGPF design tokens if one already exists. If there is no existing environment, implement it in
whatever framework best fits the project — the markup here is plain and portable.

The prototype uses in-browser Babel + three `<script>` files purely so it can run by double-clicking the
HTML. In production, drop Babel, precompile JSX, and split the components normally.

## Fidelity
**High-fidelity.** Colors, typography, spacing, the coverage-bar geometry, and all copy are final.
Recreate the layout pixel-accurately, then wire it to the codebase's tokens/components. The one thing
that is intentionally *data-driven* (not pixel art) is the three-segment coverage bar and the arrow
scenario cards — they're built from CSS flex + clip-paths, described precisely below.

## Canvas / output
- **Fixed design width: 800px.** Rendered content height ≈ **2500px** (it grows with copy — don't hard-code it).
- Intended output is a **single-column poster / PDF** (classroom handout). No responsive breakpoints were
  designed; if you need mobile, the single-column stack already reflows reasonably, but the coverage bar and
  the 2-up scenario grid should collapse to stacked on narrow widths.

---

## Sections (top → bottom)

### 1. Hero
- **Layout:** full-bleed block, `padding: 42px 56px 46px`. Background is a **photograph**
  (`assets/hero-insurance.jpg`, `background-size: cover; background-position: center`) with **no overlay**.
  The block ALSO carries the NGPF bright-blue pattern class as a fallback color.
- **Logo:** KO (white) horizontal NGPF logo, 150px wide, `margin-bottom: 28px`.
  (`assets/ngpf-horizontal-primary-ko.svg`, rendered white via `filter: brightness(0) invert(1)`.)
- **Title (`.c-hero-title`):** `"Premiums, Deductibles,"` / `"and Limits"` on two lines (explicit `<br>`).
  **PT Sans Bold**, `font-size: 56px`, `line-height: 1.0`, white. This is the ONLY PT Sans in the piece.
- **Intro (`.c-hero-intro`):** Montserrat, 17px, white @95% opacity, `max-width: none` (spans full width),
  `margin-top: 22px`. Copy:
  > Premiums, deductibles, and limits all shape what insurance costs you — and how much coverage you actually get.

### 2. Terms chunk (`.c-terms-chunk`)
All three terms in ONE block, `padding: 40px 56px 44px`. Each term = a 2-column grid row
(`grid-template-columns: 56px 1fr; gap: 24px; padding: 26px 0`), separated by a `1px solid var(--ngpf-pale-navy)` top border between items.
- **Badge (`.c-term-badge`):** 56×56, `border-radius: 12px`, white icon centered. Backgrounds:
  - Premium → `badge--primary` = `var(--ngpf-primary-blue)` `#1f3b9b`
  - Deductible → `badge--bright` = `var(--ngpf-bright-blue)` `#275ce4`
  - Coverage Limit → `badge--sky` = `var(--ngpf-light-blue)` (sky)
- **Icons (Line Awesome, `las` solid, 30px, white):**
  - Premium → `la-file-invoice-dollar`
  - Deductible → `la-wallet`
  - Coverage Limit → `la-shield-alt`
- **Name (`.c-term-name2`):** Montserrat Bold, 28px, `var(--ngpf-primary-blue)`.
- **Gloss (`.c-term-gloss`):** Montserrat Bold, 12px, ALL CAPS, `letter-spacing: 0.06em`, `var(--ngpf-bright-blue)`.
- **Body (`.c-term-body`):** Montserrat, 16px, `var(--fg-2)`.

Copy (exact):
| Term | Gloss | Body |
|---|---|---|
| Premium | What you pay to have insurance | A premium is the amount you pay for your insurance policy — usually every month, every six months, or once a year. Paying your premium on time keeps your policy active. |
| Deductible | What you pay before coverage kicks in | If you file a claim for a covered loss, the deductible is the amount you pay out of pocket first. Your insurance starts paying only after you've met it. |
| Coverage Limit | The most your policy will pay | A coverage limit is the maximum amount your policy will pay for a covered loss. Many policies bundle several types of coverage, each with its own limit. |

### 3. Coverage bar — "How a claim gets paid" (`.c-cov`)
Dark section: NGPF primary-blue pattern background, white text, `padding: 44px 56px 48px`.
- **Heading (`.c-cov-h`):** Montserrat Bold, 22px, ALL CAPS, white — text: `How a claim gets paid`.
- **Intro (`.c-cov-intro`):** Montserrat, 15px, white @90%, forced to ONE line (`white-space: nowrap`):
  > You cover the deductible first. Your insurer pays the rest — up to your coverage limit.
- **The bar (`.cov-row`):** a 62px-tall flex row, `border-radius: 6px; overflow: hidden`, three segments:
  - `.cov-deductible` — `flex: 0 0 26%`, background = `var(--cov-deductible-bg)` (gold `#f4ad00` by default), dark-blue label. Label: `Deductible`.
  - `.cov-coverage` — `flex: 1 1 auto`, background `var(--ngpf-bright-blue)`. Label: `Insurance Coverage`.
  - `.cov-beyond` — `flex: 0 0 22%`, background `beyondColor` (pale blue `#dfe9ff` default), `border-left: 6px solid var(--ngpf-orange)`. Label: `Above limit`.
- **Coverage-limit flag (`.cov-limit-flag`):** absolutely positioned at `left: calc(78% + 3px)` (centered over the orange divider), `top: -24px`. An uppercase orange label `Coverage limit` above a 6×26px orange tick (`border-radius: 3px`).
- **Brackets (`.cov-brackets`):** below the bar, three cells matching the segment widths (26% / auto / 22%),
  each a down-facing bracket (`border` minus top, `border-radius: 0 0 8px 8px`, `rgba(255,255,255,0.45)`) over a 13px centered definition:
  - Deductible: **What you pay first**
  - Coverage: **What your insurer pays, up to your limit**
  - Above limit: **You cover the remaining costs above the limit** (bold "above")

### 4. "What changes your premium?" (`.c-trade`)
`padding: 44px 56px 40px`. Heading Montserrat Bold 22px `var(--ngpf-primary-blue)`: `What changes your premium?`
Lede (16px, `var(--fg-2)`): `Two of your choices pull on your premium, but in opposite ways.`

Two relationship groups, the second separated by `border-top: 2px solid var(--ngpf-pale-navy)`:

**Group A — DEDUCTIBLE** (`.rel-subh-term`, Montserrat Bold 18px ALL CAPS, `var(--ngpf-primary-blue)`)
Lede: `Your deductible and your premium work like a see-saw: when one goes up, the other usually comes down.`

**Group B — COVERAGE LIMIT**
Lede: `Your coverage limit and your premium climb together: the more your policy could pay out, the more it costs to insure.`

Each group renders a 2-up grid (`.trade`, `grid-template-columns: 1fr 1fr; gap: 20px`) of **scenario cards**
(`.trade-card`, pale-blue bg `var(--ngpf-pale-blue)`, `border-radius: var(--radius-md)`, dark-blue text, centered):
- **Scenario title** (Montserrat Bold 15px), e.g. `Choose a HIGHER deductible`.
- **Two arrows** (`.trade-arrows`, 34px gap). Each arrow is a 56×118px block with an up/down chevron
  clip-path; color by factor: deductible = primary-blue, limit = bright-blue, premium = light-blue.
  Under each arrow: an ALL-CAPS label (Deductible / Limit / Premium) + a `$`/`$$$` amount (22px bold, color-matched).
- **Takeaway** (Montserrat Bold 15px).

Scenario data (exact):
- **Deductible group**
  - HIGHER deductible: Deductible ↑ `$$$`, Premium ↓ `$` — *Pay less each month, but more out of pocket if you file a claim.*
  - LOWER deductible: Deductible ↓ `$`, Premium ↑ `$$$` — *Pay more each month, but less out of pocket if you file a claim.*
- **Coverage-limit group**
  - HIGHER limit: Limit ↑ `$$$`, Premium ↑ `$$$` — *More protection if you file a claim for a higher cost each month.*
  - LOWER limit: Limit ↓ `$`, Premium ↓ `$` — *A lower cost each month, but less protection if you file a claim.*

### 5. Footer (`.c-foot`)
`padding: 22px 56px 30px`, `border-top: 2px solid var(--ngpf-pale-navy)`. One row (`.c-foot-main`,
`justify-content: space-between`):
- **Left:** NGPF color horizontal logo, 150px (`assets/ngpf-horizontal-primary.png`).
- **Right:** sources cluster (`.c-foot-sources`) — an uppercase `Sources` label + two links separated by a `|`:
  - **Allstate** → `https://www.allstate.com/resources/Allstate/images/tools-resources-articles/insurance-basics/premium-limits-deductibles-infographic-desktop.jpg?v=40eb2a5e-d4e5-12f0-d905-e3b2f172119f`
  - **NJM** → `https://www.njm.com/ask/what-is-an-insurance-premium`
  - Links: Montserrat Bold 12px, `var(--ngpf-bright-blue)`, hover `var(--ngpf-primary-blue)`, `text-decoration: none`.

---

## Interactions & Behavior
This is a static poster — the only interactive elements are the two footer source links (open in a new tab,
`rel="noopener"`) and link hover color swaps (Bright Blue → True Blue). No JS behavior, no animation, no state.

The prototype's React component accepts a `tweaks` prop that toggles a few options (hero pattern color,
`beyondLimitColor`, deductible accent). These were a design-exploration convenience — **you do not need to
port them.** The delivered look is the default (`tweaks={{}}`): bright-blue hero fallback, gold deductible
segment, pale-blue "above limit" segment.

## Design Tokens
All values come from the NGPF design system (`tokens/colors_and_type.css` in this bundle — reference it for
the full set). Key ones used here:

**Color**
- `--ngpf-primary-blue` **#1f3b9b** (True Blue)
- `--ngpf-bright-blue` **#275ce4** (Bright Blue — links, coverage segment, headings)
- `--ngpf-dark-blue` **#0b1541** (Midnight — body text)
- `--ngpf-light-blue` (Sky — premium arrows, sky badge)
- `--ngpf-gold` **#f4ad00** (deductible segment accent)
- `--ngpf-orange` **#f78219** (coverage-limit divider + tick)
- `--ngpf-pale-blue` / `--ngpf-pale-blue-3` **#dfe9ff / #edfaff** (card + "above limit" tints)
- `--ngpf-pale-navy` (hairline dividers), `--ngpf-gray-500` (the `|` separator)
- `--fg-2` / `--fg-3` (secondary/tertiary body grays)
- White `#ffffff`

**Type**
- `--font-display` = **PT Sans Bold** — page title ONLY (56px here).
- `--font-sans` = **Montserrat** — everything else. Bold 700 for sub-heads/labels/takeaways; Regular 400 body; ALL-CAPS +letter-spacing for h-labels.
- Scale used: title 56 · section-h 22 · term-name 28 · body 16–17 · label/gloss 12–15 · caption 11–13.

**Spacing** — 4-base scale; section padding `44px 56px`. **Radii** — cards `var(--radius-md)`, badges 12px, bar 6px, pills `var(--radius-pill)`. **No shadows** inside the artboard (the bundle HTML adds one only to frame the poster on screen).

## Assets
All in `assets/`. Provenance:
- `hero-insurance.jpg` — hero background photo (user-supplied upload).
- `ngpf-horizontal-primary-ko.svg` — white KO NGPF logo (design system brand asset).
- `ngpf-horizontal-primary.png` — color NGPF logo, footer (design system brand asset).
- `pattern-primary-blue.png`, `pattern-bright-blue.png` — NGPF tiling patterns (design system).
- **Icons** are **Line Awesome** (`las la-file-invoice-dollar`, `las la-wallet`, `las la-shield-alt`),
  loaded from the jsDelivr CDN in the HTML `<head>`. NGPF's house UI set is FontAwesome 6 Solid — if you
  standardize on FA in the codebase, the equivalents are `fa-file-invoice-dollar`, `fa-wallet`,
  `fa-shield-halved`.

## Files
- `Insurance Infographic (Ellie).html` — **open this to see the design (works on double-click, offline-safe except for the React/Babel/font/icon CDNs, which need internet).** The component code and all CSS are inlined into this file. The `src/` copies below are the same code, split out for readable reference.
- `src/layout-c-ellie.jsx` — the `InfographicCEllie` component (page structure, hero, terms, footer).
- `src/content-ellie.jsx` — copy data + reusable blocks: `CoverageBarE`, `RelationPairE`/`TradeoffE`/`LimitPremiumE`, `TradeArrowE`.
- `src/infographic.css` — shared helper styles (coverage bar, arrows, relationship groups, type helpers).
- `src/layout-c-ellie.css` — Ellie-branch overrides, all scoped under `.ig-ellie`.
- `tokens/colors_and_type.css` — NGPF design tokens (source of every `var(--ngpf-*)`).

### Note on the CSS scope
Every rule in `layout-c-ellie.css` is prefixed `.ig-ellie …` because this branch lived side-by-side with
another version in one document. When you recreate it as a standalone component you can drop the `.ig-ellie`
prefix (the root element carries classes `ig ig-c ig-ellie`).

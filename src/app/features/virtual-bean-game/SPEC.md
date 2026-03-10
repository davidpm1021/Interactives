# Virtual Bean Game — Implementation Spec

## Overview

A fully client-side Angular interactive that faithfully recreates the physical Bean Game with digital-only enhancements: drag-and-drop bean allocation, built-in Life Happens events with randomized "life paths" per student, and a shareable summary report for classroom comparison. No backend, no accounts, no websockets.

**What stays the same:** Abstract bean economy (no real dollar amounts), 11 spending categories with tiered options, starred required categories, the core pedagogical arc of allocate → cut → cope.

**What digital adds:** Animated bean interaction, built-in event system (replacing paper strips and spinner wheels), varied experiences across students, auto-generated comparison reports, a replay mode for testing different strategies against the same life path, a teacher aggregator for class-wide analysis, and inline reflection prompts.

---

## Game Structure

### Round 1: Full Income (20 Beans)

Students allocate 20 beans across 11 categories. Each category offers 2–5 tiered options at different bean costs. Starred categories (Housing, Food, Insurance, Clothing, Transportation, Furnishings) require at least one selection.

When all 20 beans are placed, the student submits their allocation and answers Round 1 discussion questions (displayed inline).

### Round 2: Income Cut (13 Beans)

The student's income drops to 13 beans. The interface animates the removal of 7 beans from their total, then highlights which current selections exceed the new budget. The student must reallocate — downgrading choices, dropping optional categories, or eliminating non-required spending — until they're at or below 13.

The UI shows a "what changed" diff: which categories were downgraded, which were dropped entirely. Round 2 discussion questions appear inline.

### Round 3: Life Happens (Variable Events)

Each student receives 3–5 events drawn randomly from a pool of 25+. Events are revealed one at a time (card-flip mechanic). After each event, the student adjusts their allocation if required, then advances to the next event.

Events vary in severity and type — some students get hit hard, others catch a break. This is intentional and creates the richest classroom discussion.

After all events resolve, Round 3 reflection questions appear, followed by the shareable report.

---

## Category & Tier Reference

All categories, options, and bean costs match the current worksheet exactly. The digital version changes nothing about the economy.

### ⭐ Housing (Required)

| Option                                        | Beans |
| --------------------------------------------- | ----- |
| Living with family, sharing cost of utilities | 2     |
| Share an apartment or house with roommates    | 3     |
| Rent your own place                           | 4     |

### ⭐ Food (Required)

| Option                                           | Beans |
| ------------------------------------------------ | ----- |
| Cook at home; dinner out once a week             | 2     |
| Frequent fast food lunches and weekly dinner out | 3     |
| All meals away from home                         | 4     |

### ⭐ Insurance (Required — 3 sub-categories)

**Auto Insurance**
| Option | Beans |
|--------|-------|
| No coverage (ONLY if no car selected in Transportation) | 0 |
| State minimum coverage | 2 |
| Additional coverage for your vehicle | 3 |

**Health & Disability**
| Option | Beans |
|--------|-------|
| No coverage | 0 |
| Basic health coverage | 2 |

**Property**
| Option | Beans |
|--------|-------|
| No coverage | 0 |
| Renters insurance | 1 |

### ⭐ Clothing (Required — 2 sub-categories)

**Clothing**
| Option | Beans |
|--------|-------|
| Wear present wardrobe | 0 |
| Shop at discount or thrift stores | 1 |
| Shop for new clothes | 2 |
| Shop for designer clothes | 3 |

**Laundry**
| Option | Beans |
|--------|-------|
| Do laundry at parent's house | 0 |
| Use laundromat; some dry cleaning | 1 |
| Rent or purchase washer and dryer | 2 |

### ⭐ Transportation (Required)

| Option                   | Beans |
| ------------------------ | ----- |
| Walk or bike             | 0     |
| Ride bus or join carpool | 1     |
| Buy fuel for family car  | 2     |
| Buy a used car and gas   | 3     |
| Buy new car and gas      | 4     |

### ⭐ Furnishings (Required)

| Option                                            | Beans |
| ------------------------------------------------- | ----- |
| Second-hand from relatives or friends             | 0     |
| Buy at a garage sale, thrift shop, or used online | 1     |
| Rent furniture or live in furnished apartment     | 2     |
| Buy new furniture                                 | 2     |

### Recreation (Optional)

| Option                                                 | Beans |
| ------------------------------------------------------ | ----- |
| Hiking, hanging out with friends, scrolling your phone | 0     |
| Streaming service for music, TV, movies                | 1     |
| Movie theaters, gym membership, clubs or hobby groups  | 2     |
| Concerts, sporting events                              | 2     |
| Big vacations                                          | 3     |

### Communication (Optional)

| Option                    | Beans |
| ------------------------- | ----- |
| No phone                  | 0     |
| Phone with limited data   | 1     |
| Phone with unlimited data | 2     |
| Wifi at your home         | 1     |

_Note: Communication is one of two multi-select categories — students can pick a phone plan AND wifi independently. Visually, multi-select categories use checkboxes (☐) instead of radio buttons (○) and display a "Select all that apply" label below the category name. This distinction prevents confusion with the single-select categories that make up the rest of the game board._

### Personal Care (Optional)

| Option                                                         | Beans |
| -------------------------------------------------------------- | ----- |
| Basic products: soap, shampoo, toothpaste, make-up, etc.       | 1     |
| Occasional professional haircuts, basic personal care products | 2     |
| Regular hairstyling, nails, name brand personal care products  | 3     |

### Gifts (Optional)

| Option                                             | Beans |
| -------------------------------------------------- | ----- |
| Make your own                                      | 1     |
| Purchase cards or small gifts occasionally         | 2     |
| Purchase frequent gifts for family and friends     | 3     |
| Contributions to charities and/or religious groups | 1     |

_Note: Gifts is the other multi-select category — students can select gift-giving AND charitable contributions independently. Uses the same checkbox + "Select all that apply" visual pattern as Communication._

### Savings (Optional)

| Option                            | Beans |
| --------------------------------- | ----- |
| Keep cash in a piggy bank at home | 0     |
| 5% of income                      | 1     |
| 10% of income                     | 2     |
| Invest for retirement             | 2     |

### Category Dependencies

Some categories have logical dependencies that the UI must enforce:

**Transportation → Auto Insurance:** If Transportation is set to "Walk or bike" (0 beans / no car), Auto Insurance must be "No coverage" (0 beans). Conversely, if Auto Insurance is set to any coverage level, Transportation must include a car. The UI enforces this bidirectionally:

- Selecting "Walk or bike" automatically resets Auto Insurance to "No coverage" (with a brief toast: "No car means no auto insurance needed")
- Selecting auto insurance coverage when no car is selected prompts: "You need a car to insure one. Choose a car option in Transportation first."

**During Round 2 and Round 3 adjustments:** If a student downgrades Transportation to "no car" to free up beans, auto insurance is automatically zeroed out (freeing those beans too). If an event forces a transportation change, the cascade is applied automatically with a clear explanation in the event resolution text.

**Housing → Property Insurance:** If Housing is "Living with family," Renters Insurance is not applicable (you don't rent). The option is grayed out with a note: "Renters insurance is for renters — you're living with family." If a student switches from family to renting, renters insurance becomes available.

**Implementation:** Dependencies are defined in the category JSON config as a `dependencies` array on each option, specifying which other category/option combinations are required or prohibited. The allocation service validates all dependencies on every selection change and auto-resolves conflicts with user-visible feedback.

---

## Life Happens Event System

### Design Principles

1. **Varied paths, not uniform experience.** Each student draws 3–5 events from a pool of 25+. No two students are likely to get the same set.
2. **Conditional consequences.** Several events check prior choices (insurance status, savings level, housing type). Students who made protective choices are rewarded; those who didn't feel the cost. This is where the deepest learning happens.
3. **Mix of setbacks, forced choices, and advantages.** Roughly 55% setbacks, 25% forced choices, 20% advantages. The distribution is weighted but random — some students will get hammered, others will coast.
4. **Abstract, not dollar-based.** Consequences are measured in beans gained/lost, not dollar amounts.
5. **Hard floor on required categories.** Events can never push a student below the minimum bean cost needed to cover all starred (required) categories. Before applying a setback's bean penalty, the system checks whether the student would still be able to afford at least the cheapest option in every required category. If not, the penalty is reduced to the maximum the student can absorb while still meeting requirements. The event card displays: "This would normally cost you 3 beans, but you can only afford to lose 1 without going below your essentials." This protects against un-resolvable game states while still making the hit feel painful.
6. **Sequential state checking.** Events check the student's allocation at the moment each event is revealed, after all prior events have been fully resolved. If Event 1 removes your car and Event 3 is "Car Trouble," Event 3 resolves as no-effect because you no longer have a car. This is the intuitive behavior and must be enforced in the event resolution logic.

### Event Pool

Each event has: a title, narrative text, a condition (if any), and a consequence.

#### Setbacks (14 events)

| #   | Title                | Narrative                                                                                                                          | Condition                                                       | Consequence                                                                |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| S1  | Broken Leg           | Someone in your family just broke their leg.                                                                                       | Has health insurance → no effect                                | No health insurance → remove 3 beans                                       |
| S2  | Water Damage         | An air conditioner leak from your upstairs neighbor destroyed your computer.                                                       | Has renters insurance → no effect                               | No renters insurance → remove 2 beans                                      |
| S3  | Winter Coat          | Your winter coat has ripped and cannot be repaired. You must replace it.                                                           | None                                                            | Remove 1 bean from any category                                            |
| S4  | Microwave            | Your microwave broke and you need to replace it.                                                                                   | None                                                            | Remove 1 bean from any category                                            |
| S5  | Mattress Ruined      | Your mattress got ruined and must be replaced.                                                                                     | None                                                            | Remove 1 bean from any category                                            |
| S6  | Stove Broken         | The stove in your apartment has broken and the landlord says it will take a month to replace it. You can't cook hot meals at home. | None                                                            | Must move Food to tier 2 (3 beans) minimum. Adjust allocation accordingly. |
| S7  | Car Trouble          | Your car needs an unexpected major repair.                                                                                         | Has a car (used or new) → remove 2 beans                        | No car → no effect                                                         |
| S8  | Hours Cut            | Your employer just cut your hours.                                                                                                 | None                                                            | Remove 2 beans from any categories                                         |
| S9  | Rent Increase        | Your landlord just raised the rent.                                                                                                | Rents own place → add 1 bean to Housing (remove from elsewhere) | Lives with family or roommates → no effect                                 |
| S10 | Phone Screen Cracked | You dropped your phone and the screen is cracked.                                                                                  | Has phone → remove 1 bean from any category                     | No phone → no effect                                                       |
| S11 | Medical Bill         | You had to visit urgent care for a bad infection.                                                                                  | Has health insurance → remove 1 bean                            | No health insurance → remove 2 beans                                       |
| S12 | Pet Emergency        | Your pet needs an emergency vet visit.                                                                                             | None                                                            | Remove 2 beans from any categories                                         |
| S13 | Identity Theft       | Someone stole your identity and drained your checking account. Recovery takes weeks.                                               | Has savings → absorb from savings (reduce savings by 1 tier)    | No savings → remove 2 beans from any categories                            |
| S14 | Parking Ticket       | You got a parking ticket you can't contest.                                                                                        | Has a car → remove 1 bean                                       | No car → no effect                                                         |

#### Forced Choices (6 events)

| #   | Title               | Narrative                                                                         | Condition                                                                                       | Consequence                                                                                                      |
| --- | ------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------ |
| F1  | Wedding Party       | Your best friend is getting married and has asked you to be in the wedding party. | None                                                                                            | Must allocate 3 beans to Gifts (adjust from other categories). If Gifts already at 3, no additional cost.        |
| F2  | Roommate Moves Out  | Your roommate just told you they're moving out next month.                        | Has roommates → must upgrade Housing to "Rent your own place" (4 beans) or find new arrangement | Lives alone or with family → no effect                                                                           |
| F3  | Summer Share        | Your friends are doing a summer share in a beach house and asked you to join.     | None                                                                                            | Student chooses: join (move 2 beans to Recreation) or decline (no cost). Discussion: peer pressure and spending. |
| F4  | Family Obligation   | A family member needs financial help this month.                                  | None                                                                                            | Remove 1 bean from any category. Cannot remove from Housing or Food.                                             |
| F5  | Job Dress Code      | Your new job requires professional attire you don't currently own.                | Clothing at "wear present wardrobe" → must upgrade to at least "discount/thrift" (1 bean)       | Already buying clothes → no effect                                                                               |
| F6  | Car Insurance Lapse | You got pulled over and realized your insurance lapsed.                           | Has car + minimum coverage → remove 1 bean (fine)                                               | Has car + no coverage → remove 2 beans (bigger fine + penalty)                                                   | No car → no effect |

#### Advantages (7 events)

| #   | Title               | Narrative                                                       | Condition                                               | Consequence                                                    |
| --- | ------------------- | --------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| A1  | Small Raise         | You just received a raise from your employer!                   | None                                                    | Add 2 beans to allocate anywhere                               |
| A2  | Tax Refund          | You filed your taxes and got a refund.                          | None                                                    | Add 1 bean to allocate anywhere                                |
| A3  | Side Gig            | You picked up a weekend side gig that pays decently.            | None                                                    | Add 2 beans. Discussion: where do you put extra income?        |
| A4  | Promotion           | Your hard work paid off — you got promoted!                     | None                                                    | Add 3 beans to allocate anywhere                               |
| A5  | Found a Deal        | You found a great deal on housing — your rent dropped.          | Rents own place → free up 1 bean from Housing           | Others → no effect                                             |
| A6  | Insurance Saved You | A covered incident occurred but your insurance handled it.      | Has relevant insurance → no cost, just the "aha" moment | No insurance → this event doesn't fire (replaced with re-draw) |
| A7  | Gift from Family    | A family member gave you a generous gift to help with expenses. | None                                                    | Add 1 bean to allocate anywhere                                |

### Event Draw Logic

When Round 3 begins, the system draws a "life path" for the student:

1. **Seed generation:** A 4-character alphanumeric seed is generated (e.g., "XKQM") and displayed prominently. All randomization for this life path is driven by a **seeded pseudo-random number generator** (e.g., a simple mulberry32 or xoshiro128 implementation — no need for a library). The same seed always produces the same event draw and the same event order. This enables two key features: (a) students can compare paths by sharing seeds, and (b) the replay / "what if" mode can re-run the exact same life path with different allocation choices.
2. **Draw count:** Using the seeded PRNG, select 3, 4, or 5 events (weighted: 30% get 3, 45% get 4, 25% get 5).
3. **Composition:** At least 1 setback, at least 1 forced choice OR advantage. Remaining slots drawn from the full pool with the 55/25/20 weighting.
4. **Conditional filtering:** Events whose conditions don't apply to the student's current allocation are still drawn but resolve as "no effect" with explanatory text (e.g., "You got lucky — your renters insurance covered the damage!"). Exception: event A6 re-draws if the student has no insurance.
5. **No duplicate categories:** The system avoids drawing two events that target the exact same category (e.g., won't draw both S3 Winter Coat and S5 Mattress Ruined since both are generic "remove 1 bean" appliance/item events). Events that check different conditions (S1 vs S2) are fine together.
6. **Hard floor enforcement:** After drawing events, no pre-filtering is done — the hard floor (Design Principle #5) is applied at resolution time, not draw time. A brutal event sequence is part of the learning; the floor just prevents it from being un-resolvable.
7. **Seed display:** The seed code is visible throughout Round 3 and appears on the final report. Students can manually enter a seed to replay a specific life path (see Replay Mode section).

---

## Shareable Report

After all rounds complete, the tool generates a **summary report** the student can copy, screenshot, or download as an image/PDF. The report is designed for pasting into a shared class doc (Google Doc, Padlet, Jamboard, etc.).

### Report Contents

```
╔══════════════════════════════════════════╗
║        🫘 MY BEAN GAME REPORT           ║
║           Life Path: XKQM               ║
╠══════════════════════════════════════════╣
║                                          ║
║  ROUND 1 (20 beans)                      ║
║  ─────────────────                       ║
║  Housing:        Own place (4)           ║
║  Food:           Cook at home (2)        ║
║  Auto Insurance: State minimum (2)       ║
║  Health:         Basic coverage (2)      ║
║  Renters:        Yes (1)                 ║
║  Clothing:       Thrift stores (1)       ║
║  Laundry:        Laundromat (1)          ║
║  Transportation: Used car (3)            ║
║  Furnishings:    Garage sale (1)         ║
║  Communication:  Limited phone (1)       ║
║  Personal Care:  Basics (1)             ║
║  Savings:        5% of income (1)        ║
║  Recreation:     —                       ║
║  Gifts:          —                       ║
║                                          ║
║  ROUND 2 (13 beans)                      ║
║  ─────────────────                       ║
║  ▼ Housing:      Roommates (3)  [-1]     ║
║    Food:         Cook at home (2)        ║
║  ▼ Auto:         State minimum (2)       ║
║  ✕ Health:       Dropped (0)    [-2]     ║
║    Renters:      Yes (1)                 ║
║  ✕ Clothing:     Wear present (0) [-1]   ║
║  ▼ Laundry:      Parents (0)    [-1]     ║
║  ▼ Transport:    Family car (2) [-1]     ║
║    Furnishings:  Garage sale (1)         ║
║    Communication: Limited (1)            ║
║    Personal Care: Basics (1)             ║
║  ✕ Savings:      Dropped (0)    [-1]     ║
║                                          ║
║  ROUND 3: LIFE HAPPENS                   ║
║  ──────────────────────                   ║
║  Event 1: Medical Bill                   ║
║    → No health insurance: -2 beans       ║
║  Event 2: Side Gig                       ║
║    → +2 beans (added to Savings)         ║
║  Event 3: Roommate Moves Out             ║
║    → Must upgrade housing: -1 bean       ║
║  Event 4: Tax Refund                     ║
║    → +1 bean (added to Health Ins.)      ║
║                                          ║
║  FINAL ALLOCATION: 13 beans              ║
║  ════════════════════                     ║
║  Housing ████████░░ 4                    ║
║  Food    ████░░░░░░ 2                    ║
║  Insurance ████░░░░ 2                    ║
║  Transport ████░░░░ 2                    ║
║  Savings  ██░░░░░░░ 1                    ║
║  Other    ████░░░░░ 2                    ║
║                                          ║
║  💡 INSIGHTS                             ║
║  • You dropped health insurance in       ║
║    Round 2, then got hit with a          ║
║    medical bill in Round 3.              ║
║  • You cut savings first — 62% of       ║
║    students do the same.                 ║
║  • Your biggest category: Housing (31%)  ║
║                                          ║
╚══════════════════════════════════════════╝
```

### Auto-Generated Insights

The report includes 2–3 insights tailored to the student's specific experience. These are selected from a template library based on what happened:

- **Insurance payoff/penalty:** "You had renters insurance when the water damage hit — it cost you nothing. Students without it lost 2 beans."
- **Savings behavior:** "You cut savings in Round 2. This is one of the most common moves — and one of the riskiest."
- **Housing dominance:** "Housing is your biggest expense at X%. The general guideline is to keep it under 30%."
- **Income shock response:** "When your income dropped, you cut [category] first. What does that tell you about your priorities?"
- **Advantage allocation:** "When you got a raise, you put it toward [category]. Most people put windfalls toward wants, not needs."
- **No insurance consequence:** "You got hit with [event] and had no insurance — that cost you X beans you could have protected for 1–2 beans."
- **Lucky path:** "You drew a lighter life path than most — only [N] setbacks. Not everyone is this fortunate."
- **Tough path:** "You drew [N] setbacks and [N] forced choices. Life can be unpredictable — that's why budgets need flexibility."

### Export Options

- **Copy to clipboard** — formatted plain text (for pasting into Google Docs, Padlet, etc.). Uses `navigator.clipboard.writeText()` with a fallback: if the Clipboard API is blocked (common on managed Chromebooks), the report text is displayed in a read-only `<textarea>` with a "Select All" button so students can manually copy.
- **Print / Save as PDF** — a `@media print` stylesheet renders the report cleanly on paper. Students and teachers can use the browser's built-in Print → "Save as PDF" flow. This is more reliable across devices than a programmatic PDF export and requires zero additional libraries.
- **Encoded result string** — a compact Base64-encoded string (40–60 characters) appended to the bottom of the report. This string encodes the student's final allocation, life path seed, event outcomes, and key choices. It is used by the Teacher Aggregator (see below) to reconstruct the student's full game data for class-wide analysis. Example: `BGv1:XKQM:h3f2ia2hb2c1l1t3fu1cm1pc1s1:S1x-2,A3+2,F2x-1,A2+1`

_Note on image export: Programmatic HTML-to-PNG rendering (html2canvas, dom-to-image) is unreliable on managed Chromebooks and iPads due to canvas permission restrictions and cross-browser quirks. Deferred to v2 only if teachers report that clipboard + print isn't sufficient._

---

## Replay / "What If" Mode

After completing all three rounds and viewing the report, students can tap **"Play Again — Same Life Path"** to restart the game with the same seeded event draw but fresh allocation choices. This is the single biggest pedagogical advantage of the digital version over the physical game — students can test whether different choices would have changed their outcomes.

### How It Works

1. After the report screen, two replay options are available:
   - **"Same Life, New Choices"** — restarts at Round 1 with 20 beans. The life path seed is preserved, so Round 3 will draw the exact same events in the exact same order. The student can now make different allocation choices and see how those choices interact with the same life events. Did keeping health insurance save them this time? Did cutting savings earlier make them more vulnerable to the same setback?
   - **"New Life Path"** — generates a fresh random seed and starts a completely new game. This is equivalent to a first-time play.

2. Students can also manually enter a seed code (from another student's report) to experience someone else's life path. This is accessed via a small "Enter seed" link on the start screen.

3. The report from a replay includes a comparison callout: "Replay of path XKQM. Compared to your first run: you saved 2 more beans by keeping insurance this time."

### Implementation

Replay is lightweight — it resets the `GameState` allocations and round history while preserving the `lifePathSeed` and `events` array. The seeded PRNG ensures deterministic event draws from the same seed. No additional data structures are needed.

The comparison between runs requires storing the previous run's final allocation in component state (not persisted — lost on page refresh, which is fine). If a previous run exists, the report template includes the delta.

---

## Teacher Aggregator Page

A separate client-side page within the same Angular app (routed at `/bean-game/aggregator`) that lets teachers visualize class-wide patterns without any backend infrastructure.

### Workflow

1. Students complete the Bean Game and copy their report (which includes the encoded result string at the bottom).
2. Students paste their result string into whatever collection method the teacher uses — Google Form, Google Classroom assignment, shared Google Doc, Padlet, or even just reading them aloud.
3. Teacher opens the Aggregator page and pastes all result strings into a text area (one per line, or comma-separated). The aggregator parses each string and builds the class dataset entirely client-side.

### Aggregator Views

Once result strings are loaded, the teacher sees:

**Allocation Distribution** — For each category, a horizontal bar chart showing how the class allocated beans. Example: "Housing: 15% chose family (2 beans), 55% chose roommates (3 beans), 30% chose own place (4 beans)." Shown for both Round 1 and Round 2, with the shift highlighted.

**Income Cut Response** — Which categories students downgraded first when beans dropped from 20 to 13. Ranked list: "68% cut Savings first, 52% cut Recreation, 35% dropped Health Insurance, 12% downgraded Housing." (Percentages exceed 100% because students cut multiple categories.)

**Event Impact Analysis** — For each event type that appeared across the class, the average bean impact. Highlights the insurance effect: "Students with health insurance lost an average of 0.8 beans to medical events. Students without lost 2.4 beans."

**Life Path Comparison** — Distribution of path difficulty across the class: "12 students got 3 events, 18 got 4 events, 5 got 5 events. Average net bean change from events: -2.1."

**Key Insights** — Auto-generated discussion prompts for the teacher based on class data:

- "Most of your class (68%) cut savings first when income dropped. Ask: why is savings the easiest thing to cut? Why is that risky?"
- "Students who kept insurance spent 1–2 more beans on coverage but lost 1.6 fewer beans to setbacks on average. Was the insurance worth it?"
- "Only 12% of students downgraded housing. Ask: is that because housing feels non-negotiable, or because the options don't allow much flexibility?"

### Encoded Result String Format

The result string is a compact, URL-safe encoding of the student's game data. Format:

```
BGv1:<seed>:<R1-alloc>:<R2-alloc>:<events-resolved>
```

Where:

- `BGv1` — version prefix for forward compatibility
- `<seed>` — 4-character life path seed
- `<R1-alloc>` — Round 1 allocation as a compressed key (category initials + option tier numbers, e.g., `h3f2ia2ih2ip1c1l1t3fu1cm1pc1s1`)
- `<R2-alloc>` — Round 2 allocation in the same format
- `<events-resolved>` — comma-separated event outcomes: event ID + condition result + bean delta (e.g., `S1n-3,A3+2,F2y-1,A2+1` where `n` = condition not met, `y` = condition met, `x` = no condition)

Total string length: approximately 60–80 characters. Short enough to paste into a form field or read aloud.

The aggregator page includes a "Copy class summary" button that exports the aggregate analysis as formatted text for the teacher's records.

### Aggregator Accessibility

The aggregator page follows all the same accessibility standards as the main game. Charts use semantic HTML tables as an alternative view (toggle between chart and table). All data is available to screen readers.

---

## UI/UX Design

### Layout

The game board is a single scrollable page (mobile-friendly) with all 11 categories visible as cards. Each card shows the category name, icon, required star (if applicable), and the tier options as selectable rows.

### Bean Interaction

Two options (decide during prototyping which feels better):

**Option A — Drag and Drop:** A "bean tray" at the top/bottom of the screen holds unallocated beans. Students drag individual beans onto category option rows. Beans snap into place with a satisfying micro-animation. The tray shows remaining count.

**Option B — Tap to Allocate:** Students tap a tier option within each category. The bean cost is deducted automatically from a visible counter. Tapping a different tier in the same category swaps the allocation. Simpler to implement, works better on mobile.

_Recommendation: Option B for v1. It's faster to build, works on all devices, and the pedagogical value is in the choices, not the dragging. Option A could be a v2 enhancement._

### Bean Counter

A persistent, always-visible element showing:

- **Beans remaining** (large number, minimum 24px/1.5rem)
- **Beans allocated** (small breakdown by category)
- Status indicator using color + icon + text: green checkmark "Under budget" / yellow dash "At budget" / red warning "Over budget (N beans over)"

### Round Transitions

- **Round 1 → Round 2:** A full-screen overlay announces the income cut. "Your income has been reduced. You now have 13 beans." The bean counter animates from 20 to 13. Categories that now exceed the budget highlight in red. The student must reallocate before proceeding.
- **Round 2 → Round 3:** Overlay: "Life happens. Let's see what's in store for you." The life path seed is displayed. Events are revealed one at a time.

### Event Cards

Each Life Happens event appears as a flippable card:

- **Front:** Category icon + "Life Happens" label
- **Back:** Event title, narrative text, consequence, and action required
- If the event checks a condition, the result is personalized: "You have renters insurance — you're covered!" vs. "You don't have renters insurance — remove 2 beans."
- After the student resolves the event (adjusts beans if needed), they tap "Next Event" to reveal the next card.

### Discussion Questions

Displayed inline after each round in expandable sections. Students can type responses directly (stored in local state, included in the report) or the teacher can facilitate these as verbal class discussion.

For the written responses: these are stored in component state only. They appear in the report but are not persisted anywhere beyond the session. If the student refreshes, they start over. This is fine — the Bean Game is a single-class-period activity.

---

## Teacher Configuration

A simple settings panel accessible via a gear icon or URL parameter. No login required — configuration is encoded in the URL so teachers can share a pre-configured link with students.

### Configurable Options

| Setting                      | Default      | Options                                                            |
| ---------------------------- | ------------ | ------------------------------------------------------------------ |
| Round 3 enabled              | Yes          | Yes / No                                                           |
| Number of events             | Random (3–5) | Fixed: 3, 4, or 5; or Random                                       |
| Event difficulty bias        | Balanced     | Easy (more advantages), Balanced, Tough (more setbacks)            |
| Show written response fields | Yes          | Yes / No (verbal discussion mode)                                  |
| Allow replay                 | Yes          | Yes / No (disable if you want a single-play experience)            |
| Seed                         | Random       | Random, or a specific 4-char seed (for whole-class same-path play) |
| Language                     | English      | English / Spanish                                                  |

### URL Parameter Encoding

Settings are encoded as query parameters so teachers can bookmark or distribute a configured link:

```
/bean-game?round3=true&events=random&difficulty=balanced&responses=true&replay=true&lang=en
/bean-game?seed=XKQM  (forces all students to get the same life path)
/bean-game/aggregator  (teacher aggregator page — separate route, no config needed)
```

This avoids any need for teacher accounts or saved configurations.

---

## Data Architecture

### Category/Tier Data

Stored as a JSON config file (or fetched from a Google Sheet via API for editability). Structure:

```json
{
  "categories": [
    {
      "id": "housing",
      "name": "Housing",
      "icon": "home",
      "required": true,
      "subCategories": null,
      "options": [
        { "id": "housing-1", "label": "Living with family, sharing cost of utilities", "beans": 2 },
        { "id": "housing-2", "label": "Share an apartment or house with roommates", "beans": 3 },
        { "id": "housing-3", "label": "Rent your own place", "beans": 4 }
      ]
    },
    {
      "id": "insurance",
      "name": "Insurance",
      "icon": "shield",
      "required": true,
      "subCategories": [
        {
          "id": "insurance-auto",
          "name": "Auto",
          "options": [
            {
              "id": "ins-auto-0",
              "label": "No coverage",
              "beans": 0,
              "condition": "transportation.selected.beans === 0"
            },
            { "id": "ins-auto-1", "label": "State minimum coverage", "beans": 2 },
            { "id": "ins-auto-2", "label": "Additional coverage for your vehicle", "beans": 3 }
          ]
        }
      ]
    }
  ]
}
```

### Event Data

Same approach — JSON config, one object per event:

```json
{
  "id": "S1",
  "type": "setback",
  "title": "Broken Leg",
  "narrative": "Someone in your family just broke their leg.",
  "condition": {
    "check": "insurance-health",
    "hasIt": { "text": "You have health insurance — you're covered!", "beans": 0 },
    "lacksIt": { "text": "You don't have health insurance. Remove 3 beans.", "beans": -3 }
  }
}
```

### State Management

All game state lives in Angular component state (or a lightweight service). Structure:

```typescript
interface GameState {
  currentRound: 1 | 2 | 3 | 'report';
  totalBeans: number; // 20 in R1, 13 in R2, variable in R3
  allocations: Map<string, string>; // categoryId → selected optionId
  roundHistory: {
    round1: Map<string, string>;
    round2: Map<string, string>;
    round3Final: Map<string, string>;
  };
  lifePathSeed: string; // 4-char code
  events: DrawnEvent[]; // the student's randomized event list
  eventResults: EventResult[]; // resolved outcomes (for report + encoding)
  eventIndex: number; // which event they're currently on
  responses: Map<string, string>; // questionId → student's typed answer
  isReplay: boolean; // true if replaying a previous seed
  previousRunFinal?: Map<string, string>; // prior run's final allocation (for comparison)
}

interface EventResult {
  eventId: string;
  conditionMet: boolean | null; // null = no condition
  beansChanged: number; // actual applied delta (may differ from event max due to hard floor)
  hardFloorApplied: boolean; // true if penalty was reduced by the floor
}
```

No persistence beyond the session. The report and encoded result string are generated from this state at the end.

The `previousRunFinal` field is populated only when a student uses "Same Life, New Choices" replay. It is cleared on page refresh or "New Life Path." This keeps the comparison feature zero-cost — no localStorage, no backend, just in-memory state.

---

## Content Editability

The category/tier data and event pool should be maintainable by the curriculum team without code deploys.

**Recommended approach:** Store the data in a Google Sheet with two tabs ("Categories" and "Events"). An API-driven build step (or runtime fetch) pulls the sheet data and converts it to the JSON config the Angular app consumes. This matches the pattern established for the flashcard feature and the NGPF Personal Finance Dictionary pipeline.

**Simpler alternative:** Ship the JSON as a static asset in the Angular app. Curriculum team submits changes as a content PR. Less flexible but zero infrastructure.

---

## Spanish Language Support

The existing Bean Game worksheet has a Spanish version. The virtual version should support a language toggle that swaps all UI text, category names, option labels, event narratives, and discussion questions to Spanish.

Implementation: a parallel set of string keys in the JSON config, keyed by locale (`en` / `es`). The toggle sets a global locale that all components read from.

---

## Accessibility & Inclusive Design

This interactive will be used in K-12 classrooms that include students with IEPs, 504 plans, and a wide range of physical, cognitive, and sensory needs. Accessibility is not a polish step — it is a core design constraint that shapes every interaction pattern.

**Target standard:** WCAG 2.1 AA compliance at minimum, with AAA targets for text contrast and timing controls.

### Visual Accessibility

**Color & Contrast**

- All text meets WCAG AA contrast ratios: 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
- Bean counter status (under/at/over budget) uses color AND icon AND text label — never color alone. Example: green circle + checkmark + "Under budget" vs. red circle + warning icon + "Over budget (3 beans over)"
- Required categories marked with both the ⭐ icon and a text label ("Required") — not just the star
- Category cards use distinct border/fill patterns (not just color) to indicate selection state: unselected (dashed border, no fill), selected (solid border, light fill + checkmark icon), over-budget (solid border, pattern fill + warning icon)
- Event card types (setback/advantage/forced choice) identified by icon + label, not just card color
- The "what changed" diff in Round 2 uses icons (▼ downgraded, ✕ dropped, — unchanged) alongside any color coding

**Low Vision & Zoom**

- All text renders in relative units (rem/em), not fixed px, so browser zoom and OS-level text scaling work correctly
- Layout remains functional and readable at 200% browser zoom with no horizontal scrolling (WCAG 1.4.10 Reflow)
- Bean counter number uses a minimum 24px (1.5rem) base size so it's visible at a glance
- No information conveyed solely through spatial positioning — screen readers and reflow can reorder content without losing meaning

**Motion & Animation**

- All animations respect `prefers-reduced-motion` media query. When reduced motion is preferred:
  - Bean counter updates instantly (no count animation)
  - Round transitions use a simple fade instead of the full-screen overlay animation
  - Event card reveal is an instant show (no flip animation)
  - Category selection is an instant state swap (no transition)
- No animation is required to understand game state — all information is available statically
- No flashing content, no auto-playing animations, no strobing effects

### Motor Accessibility

**Keyboard Navigation**

- Full keyboard operability — every action achievable without a mouse or touchscreen
- Category navigation: Tab moves between categories, Arrow Up/Down moves between tier options within a category, Enter/Space selects a tier
- Bean counter: accessible via a keyboard shortcut (e.g., `B` key announces remaining beans)
- Event cards: Enter/Space to reveal, Tab to navigate to action controls, Enter to confirm adjustment
- Round transitions: Enter/Space to proceed
- Discussion question fields: standard text input focus behavior
- Focus indicators are always visible and high-contrast (minimum 2px solid outline with offset, not the browser default which is often invisible)
- Focus order follows logical reading order: bean counter → categories (top to bottom) → action buttons
- No keyboard traps — Escape always moves focus back to the previous logical container

**Touch & Pointer**

- All interactive elements meet minimum 48×48px touch target size (WCAG 2.5.8 AAA target, exceeding the 44px AA minimum)
- Touch targets have at least 8px spacing between them to prevent mis-taps — critical for tier options listed vertically within a category
- No interactions require multi-finger gestures, long-press, or drag — all are single-tap/click
- No hover-dependent information — anything shown on hover is also available via focus or tap
- Swipe gestures (if implemented for event cards) always have a tap alternative

**Timing**

- No time limits on any round — students can take as long as needed to allocate beans, read events, and adjust
- No auto-advancing content — event cards wait for explicit student action to proceed
- If any future feature introduces timing (e.g., timed challenges), it must include: ability to extend time, ability to disable the timer entirely, and a warning before time expires

### Cognitive Accessibility

**Clarity & Predictability**

- Consistent layout across all three rounds — the game board doesn't reorganize between rounds, only the bean count and available actions change
- Clear, explicit instructions at the start of each round (not just "you now have 13 beans" but "Your income has been reduced to 13 beans. You need to remove beans from your choices until your total is 13 or less. Tap a cheaper option in any category to free up beans.")
- Event card consequences are stated in plain language with the specific action required: "Remove 2 beans. Tap on any category to downgrade or remove a selection."
- Progress indicators: which round the student is on (Round 1 of 3), how many events remain (Event 2 of 4), bean counter always visible
- No surprise UI changes — the interface never rearranges, hides controls, or changes navigation patterns mid-game

**Reading Level**

- All game text (category labels, event narratives, instructions, discussion questions) targets a 6th–8th grade reading level
- Event narratives are concise: 1–2 sentences for the scenario, 1 sentence for the consequence
- Technical financial terms (deductible, liability, comprehensive) include a brief inline definition on first appearance or a tap-to-define tooltip

**Error Prevention & Recovery**

- Students can change any selection at any time within a round — no "locked in" choices until the round is submitted
- A clear "Reset Round" button allows starting the current round over without losing previous rounds
- Before submitting a round, a confirmation summary shows all selections: "You're about to lock in your Round 1 choices. Here's what you selected: [summary]. Continue?"
- Undo support: at minimum, the last action can be undone (Ctrl+Z / Cmd+Z or an explicit Undo button)

### Screen Reader Support

- All category cards use semantic HTML: `<fieldset>` for each category with `<legend>` for the category name, `<input type="radio">` for tier options within single-select categories
- Bean counter is an `aria-live="polite"` region that announces changes: "14 beans remaining. 6 beans allocated."
- Round transitions announce via `aria-live="assertive"`: "Round 2. Your income has been reduced to 13 beans."
- Event cards announce their full content when revealed: "Life Happens event: Broken Leg. Someone in your family just broke their leg. You have health insurance — you're covered! No action needed."
- The "what changed" diff in Round 2 is announced as a list: "Changes from Round 1: Housing downgraded from own place to roommates, saving 1 bean. Health insurance dropped, saving 2 beans. [etc.]"
- Report generation announces: "Your Bean Game report is ready. It has been copied to your clipboard."
- All icons have `aria-hidden="true"` with adjacent text labels — icons are decorative, not informational

### Assistive Technology Compatibility

- Works with JAWS, NVDA, VoiceOver (macOS/iOS), and TalkBack (Android) — the four most common screen readers in K-12
- Compatible with switch access devices (all interactions are single-action, no multi-step gestures required)
- Compatible with voice control software (Dragon, Voice Control on macOS/iOS) — all interactive elements have visible text labels that can be spoken as commands
- Compatible with screen magnification software (ZoomText, built-in OS magnifiers) — layout reflows cleanly, no fixed-position overlays that break magnification context

---

## Device & Browser Compatibility

NGPF interactives are used in every type of K-12 classroom — from 1:1 Chromebook schools to BYOD phone-only environments to shared desktop labs. The Bean Game must work everywhere students are.

### Target Devices (Priority Order)

1. **Chromebooks** — The dominant K-12 device. Chrome OS, typically 11.6"–14" screens at 1366×768, often with older/slower hardware. This is the primary development target.
2. **iPads** — Common in elementary/middle school and in 1:1 iPad schools. Safari on iPadOS, 9.7"–12.9" screens, touch-only (no mouse unless external keyboard attached).
3. **Android tablets** — Less common but present in some districts, especially budget-conscious ones. Chrome on Android, wide range of screen sizes and performance levels.
4. **Phones (iOS and Android)** — Students may need to use phones if other devices aren't available, and teachers may preview on phones. Small screens (375px–428px width), touch-only.
5. **Windows/Mac desktops and laptops** — Computer labs, teacher stations, home use. Full-size screens, mouse + keyboard.

### Browser Support

- **Chrome 90+** (Chromebook, Windows, Mac, Android) — primary target
- **Safari 15+** (iPad, iPhone, Mac) — critical for Apple device coverage
- **Firefox 100+** (Windows, Mac, Linux) — secondary but should work
- **Edge 90+** (Windows) — shares Chromium engine with Chrome, minimal extra effort

No IE11 support. No Opera/Brave/etc. explicit testing needed (Chromium-based, will inherit Chrome compatibility).

### Responsive Breakpoints

| Breakpoint | Width          | Target Devices                                      | Layout Adjustments                                                                        |
| ---------- | -------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mobile     | < 600px        | Phones                                              | Single column, categories stack vertically, bean counter fixed at top, full-width buttons |
| Tablet     | 600px – 1024px | iPads, small Chromebooks, large phones in landscape | Two-column category grid, bean counter in sidebar or fixed top bar                        |
| Desktop    | > 1024px       | Chromebooks, laptops, desktops                      | Three-column category grid, bean counter sidebar, report preview alongside game board     |

### Responsive Design Principles

- **Mobile-first CSS** — base styles are for the smallest screen, media queries add complexity for larger screens
- **No horizontal scrolling at any breakpoint** — content reflows to fit
- **Touch-first interaction model** — Option B (tap to allocate) works identically on touch and mouse. No hover-dependent interactions.
- **Readable without zooming** — base font size 16px minimum, category labels and event text 14px minimum, bean counter 24px minimum
- **Thumb-reachable controls on mobile** — primary action buttons (Submit Round, Next Event) positioned in the bottom third of the screen where thumbs naturally rest
- **Landscape AND portrait support on tablets** — the layout adapts to both orientations without breaking

### Performance Constraints

- **Total bundle size under 200KB gzipped** (excluding fonts) — Chromebooks on school WiFi can be slow, and some districts have bandwidth restrictions
- **First meaningful paint under 2 seconds** on a mid-tier Chromebook (Intel Celeron N4020, 4GB RAM) over a 10Mbps connection
- **No external runtime dependencies** that require separate network requests to load (e.g., no Firebase SDK, no Google Fonts API calls). All assets bundled or self-hosted.
- **Smooth interaction at 30fps minimum** on target Chromebook hardware — animations should be CSS-only (GPU-accelerated transforms and opacity), not JavaScript-driven
- **Works offline once loaded** — since there's no backend, the entire game should function if the network drops mid-session. The Service Worker can cache the bundle for reliability, but this is a v2 enhancement, not v1.

### Testing Matrix

Before shipping, test on these specific combinations:

| Priority | Device                    | Browser       | Test Focus                                                      |
| -------- | ------------------------- | ------------- | --------------------------------------------------------------- |
| P0       | Chromebook (1366×768)     | Chrome        | Primary experience — layout, performance, touch + keyboard      |
| P0       | iPad 10th gen             | Safari        | Touch interaction, landscape/portrait, iOS-specific CSS issues  |
| P0       | iPhone SE (375px)         | Safari        | Smallest common phone — layout reflow, readability, thumb reach |
| P1       | Android phone (mid-range) | Chrome        | Touch, performance on lower-end hardware                        |
| P1       | Windows laptop            | Chrome        | Mouse + keyboard, large screen layout                           |
| P1       | Mac                       | Safari        | Mac-specific rendering, VoiceOver testing                       |
| P2       | iPad + external keyboard  | Safari        | Keyboard navigation on iPadOS                                   |
| P2       | Chromebook                | ChromeVox     | Screen reader testing on primary device                         |
| P2       | Windows                   | NVDA + Chrome | Screen reader testing                                           |

### Known Platform Gotchas

- **Safari CSS gaps:** `gap` in flexbox is supported in Safari 14.1+, but older iPads may run Safari 14. Use margin fallbacks or ensure minimum Safari version target.
- **Chromebook touch:** Many Chromebooks have touchscreens, some don't. Never assume touch OR mouse — support both.
- **iOS Safari viewport:** The `100vh` bug on iOS Safari (doesn't account for the URL bar). Use `100dvh` or JavaScript-based viewport height for any full-screen overlays.
- **ChromeVox quirks:** ChromeVox handles `aria-live` regions differently from JAWS/NVDA. Test announcements explicitly on ChromeVox.
- **Android WebView:** Some school-managed Android devices route through managed browsers or WebViews with restricted APIs. Avoid using `localStorage`, `IndexedDB`, or `Service Worker` in v1 — keep everything in-memory.
- **Print stylesheet:** Teachers will want to print reports. Include a `@media print` stylesheet that renders the final report cleanly on paper (hide game UI, show only the summary report).

---

## Implementation Architecture

### Project Context

This feature lives within the NGPF Interactives Angular 21 monorepo. It follows the same conventions established by the flashcard feature: standalone components (no NgModules), SCSS per component, shared `TopHeader`/`BottomHeader`, and route registration in `app.routes.ts`.

### Scaffolding

```bash
npm run feature bean-game
```

This creates `src/app/features/bean-game/` with the root component files and registers the route. The aggregator child route and all sub-components are added manually after scaffolding.

### File Structure

```
src/app/features/bean-game/
├── bean-game.ts                          # Root component — state machine + shared header hosting
├── bean-game.html
├── bean-game.scss                        # Print stylesheet (@media print) lives here
├── bean-game.routes.ts                   # Child route config (game vs aggregator)
├── data/
│   ├── categories.json                   # All 11 categories, tiers, bean costs, dependencies
│   ├── events.json                       # Full 27-event pool with conditions and consequences
│   └── discussion-questions.json         # Round 1, 2, 3 reflection prompts
├── models/
│   ├── game.models.ts                    # GameState, EventResult, CategoryConfig, etc.
│   └── aggregator.models.ts              # AggregatorData, ClassSummary, etc.
├── services/
│   ├── allocation.service.ts             # Bean allocation logic, dependency validation, hard floor
│   ├── event.service.ts                  # Event draw (seeded PRNG), resolution, condition checking
│   ├── report.service.ts                 # Report generation, encoded string encoding/decoding
│   └── prng.service.ts                   # Seeded pseudo-random number generator (mulberry32)
├── components/
│   ├── game-board/
│   │   ├── game-board.component.ts       # Main allocation screen — hosts category cards
│   │   ├── game-board.component.html
│   │   └── game-board.component.scss
│   ├── category-card/
│   │   ├── category-card.component.ts    # Single category with tier options (radio or checkbox)
│   │   ├── category-card.component.html
│   │   └── category-card.component.scss
│   ├── bean-counter/
│   │   ├── bean-counter.component.ts     # Persistent remaining/allocated display
│   │   ├── bean-counter.component.html
│   │   └── bean-counter.component.scss
│   ├── round-transition/
│   │   ├── round-transition.component.ts # Full-screen overlay for round changes
│   │   ├── round-transition.component.html
│   │   └── round-transition.component.scss
│   ├── event-card/
│   │   ├── event-card.component.ts       # Single Life Happens event (reveal + resolve)
│   │   ├── event-card.component.html
│   │   └── event-card.component.scss
│   ├── discussion-questions/
│   │   ├── discussion-questions.component.ts  # Expandable question fields per round
│   │   ├── discussion-questions.component.html
│   │   └── discussion-questions.component.scss
│   ├── report/
│   │   ├── report.component.ts           # Final summary, insights, encoded string, export
│   │   ├── report.component.html
│   │   └── report.component.scss
│   └── aggregator/
│       ├── aggregator.component.ts       # Teacher paste + class analysis dashboard
│       ├── aggregator.component.html
│       └── aggregator.component.scss
```

### Routing

The bean-game feature uses child routes to serve both the student game and the teacher aggregator from the same feature folder.

In `app.routes.ts` (replacing the single auto-generated route):

```typescript
{
  path: 'bean-game',
  loadChildren: () => import('./features/bean-game/bean-game.routes')
    .then(m => m.BEAN_GAME_ROUTES)
}
```

In `bean-game.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { BeanGameComponent } from './bean-game';
import { AggregatorComponent } from './components/aggregator/aggregator.component';

export const BEAN_GAME_ROUTES: Routes = [
  {
    path: '',
    component: BeanGameComponent, // Student game at /bean-game
  },
  {
    path: 'aggregator',
    component: AggregatorComponent, // Teacher dashboard at /bean-game/aggregator
  },
];
```

Both routes lazy-load as a single chunk. The aggregator shares the category/event data models and the report encoding/decoding service, but has its own UI. Angular's route-based code splitting means neither the game nor the aggregator loads until navigated to.

### Component Responsibilities

**`BeanGameComponent` (root)** — Manages the top-level state machine: `start` → `round1` → `round1-review` → `round2` → `round2-review` → `round3` → `report` → `replay`. Reads URL query parameters for teacher config (round3 toggle, event count, difficulty, seed, replay permission). Hosts `TopHeader` and `BottomHeader`. Owns the `GameState` (or delegates to a root-level service injected at the component level via `providers`).

**`GameBoardComponent`** — The main allocation screen used in Rounds 1, 2, and 3. Renders all 11 category cards and the bean counter. Accepts the current bean budget and current allocations as inputs. Emits allocation changes upward. Handles the "Submit Round" action. In Round 2, highlights categories that exceed the new budget and blocks submission until total ≤ 13.

**`CategoryCardComponent`** — A single category. Renders tier options as radio buttons (single-select categories) or checkboxes (Communication, Gifts). Shows the required star, category icon, and current bean cost. Handles the dependency validation display (e.g., graying out auto insurance when no car is selected). Emits selection changes.

**`BeanCounterComponent`** — Persistent display showing beans remaining, beans allocated, and budget status. Uses `aria-live="polite"` for screen reader announcements. Sticky-positioned at the top of the viewport on mobile, sidebar on desktop.

**`RoundTransitionComponent`** — Full-screen overlay shown between rounds. Announces the round change, explains what's happening (income cut / life happens intro), and waits for user action to proceed. Respects `prefers-reduced-motion`.

**`EventCardComponent`** — Displays a single Life Happens event. Handles the reveal animation (or instant show with reduced motion). Shows conditional resolution text based on current allocation. Displays hard floor messaging if the penalty was reduced. Emits the resolved `EventResult`.

**`DiscussionQuestionsComponent`** — Expandable section with text input fields for reflection questions. Appears after each round. Inputs stored in component state, included in final report.

**`ReportComponent`** — Generates the final summary from `GameState`. Renders the round-by-round allocation diff, event outcomes, auto-generated insights, and the encoded result string. Handles clipboard copy (with textarea fallback) and triggers print. In replay mode, shows the comparison delta against the previous run.

**`AggregatorComponent`** — Standalone page for teachers. Contains a textarea for pasting encoded result strings, a "Process" button, and the analysis dashboard. Uses the same `ReportService` for decoding strings. Renders charts as semantic HTML tables with a visual chart overlay (toggle between views for accessibility).

### Service Responsibilities

**`AllocationService`** — Pure logic, no UI. Methods: `validateAllocation(allocations, budget)` returns validity + violations; `getDependencyConflicts(allocations)` returns any broken dependencies; `calculateMinRequiredBeans(categories)` returns the hard floor (sum of cheapest required options); `applyHardFloor(penalty, currentBeans, minRequired)` returns the actual applicable penalty.

**`EventService`** — Draws events using the seeded PRNG. Methods: `generateLifePath(seed, config)` returns the ordered event list; `resolveEvent(event, currentAllocations, currentBeans, minRequired)` returns an `EventResult` with the actual bean delta (hard floor applied if needed). Stateless — all state lives in the root component.

**`ReportService`** — Generates the report text, auto-selects insights from the template library, encodes/decodes result strings. Methods: `generateReport(gameState)` returns the full report object; `encodeResult(gameState)` returns the compact string; `decodeResult(encodedString)` returns a parsed result object; `aggregateResults(results[])` returns the class-wide summary.

**`PrngService`** — A pure function wrapper around a mulberry32 PRNG. Methods: `create(seed: string)` returns a seeded random function; the returned function produces deterministic floats between 0 and 1. The seed string is hashed to a 32-bit integer internally. ~20 lines of code, no dependencies.

### Styling Architecture

**Global styles (inherited):** The monorepo's `styles.scss` provides base resets, shared variables (NGPF brand colors, font stack, spacing scale), and the shared component styles. These apply to all features automatically.

**Feature root (`bean-game.scss`):** Contains the `@media print` stylesheet that hides the game UI and shows only the report. Also contains `:host`-level layout rules (the overall page structure) and the `prefers-reduced-motion` overrides if using a CSS-class approach rather than per-component media queries.

**Component SCSS:** Each component has its own `.scss` file scoped by Angular's `ViewEncapsulation.Emulated` (the default). This means component styles don't leak out to other components or other features. Category cards, event cards, bean counter, etc. each own their own visual styling.

**Responsive breakpoints:** Defined as SCSS mixins in a shared `_breakpoints.scss` partial within the bean-game feature (or imported from the monorepo's shared styles if one exists). Components use `@include tablet {}` and `@include desktop {}` mixins rather than raw `@media` queries for consistency.

**Multi-select visual distinction:** `CategoryCardComponent` accepts an `isMultiSelect` input. When true, it renders checkboxes (☐) and a "Select all that apply" label. When false, radio buttons (○). The styling difference is handled entirely within `category-card.component.scss` — no global style changes needed.

### Data Flow

```
URL query params ──→ BeanGameComponent (root)
                         │
                         ├── reads categories.json, events.json, questions.json
                         ├── initializes GameState
                         ├── passes state + callbacks to child components
                         │
                         ├── GameBoardComponent
                         │     ├── CategoryCardComponent × 11
                         │     └── BeanCounterComponent
                         │
                         ├── RoundTransitionComponent (between rounds)
                         │
                         ├── EventCardComponent × N (Round 3)
                         │
                         ├── DiscussionQuestionsComponent (after each round)
                         │
                         └── ReportComponent (end of game)
                               ├── generates report via ReportService
                               ├── encodes result string
                               └── offers replay (resets GameState, preserves seed)
```

State flows **downward** via inputs. User actions flow **upward** via output event emitters. The root component is the single source of truth for `GameState`. No shared mutable state between siblings. This is the standard Angular unidirectional data flow pattern.

### Build & Bundle

The bean-game feature lazy-loads via the route config, so it's a separate chunk that only downloads when a student navigates to `/bean-game`. The chunk includes all components, services, and JSON data files.

Expected bundle size breakdown:

- Components + templates: ~30-40KB gzipped
- JSON data (categories + events + questions): ~5-8KB gzipped
- Services + PRNG: ~5KB gzipped
- Total: **~40-55KB gzipped** — well within the 200KB budget

The aggregator is part of the same lazy chunk (since it shares the route module), but its component code is only instantiated when navigated to directly. If bundle size becomes a concern, the aggregator could be split into its own lazy child route with a separate chunk, but at this scale it's unnecessary.

### Implementation Order

1. **Scaffold & data** — `npm run feature bean-game`, create models, populate JSON data files for categories and events
2. **PrngService** — Seeded PRNG with unit tests (determinism, distribution)
3. **AllocationService** — Allocation validation, dependency logic, hard floor calculation, with unit tests
4. **EventService** — Event draw and resolution logic with unit tests
5. **CategoryCardComponent + BeanCounterComponent** — Core allocation UI
6. **GameBoardComponent** — Compose category cards + bean counter into the game board
7. **Root state machine** — Wire rounds 1 and 2 (allocate → submit → income cut → reallocate)
8. **RoundTransitionComponent** — Overlays between rounds
9. **EventCardComponent** — Card reveal + resolution UI
10. **Round 3 integration** — Wire event cards into the root state machine
11. **DiscussionQuestionsComponent** — Inline question fields after each round
12. **ReportService** — Report generation, insight selection, encoded string
13. **ReportComponent** — Report UI, clipboard copy, print trigger
14. **Replay mode** — "Same Life, New Choices" + seed entry
15. **AggregatorComponent + child routing** — Teacher paste + analysis dashboard
16. **Accessibility pass** — Screen reader testing, focus management, ARIA
17. **Responsive pass** — Test at all three breakpoints, thumb-reach audit on mobile
18. **Reduced motion pass** — `prefers-reduced-motion` for all animations
19. **Cross-browser testing** — P0 and P1 testing matrix

### Testing Strategy

**Unit tests (Vitest):**

- `PrngService`: same seed produces same sequence; different seeds produce different sequences
- `AllocationService`: validates budget constraints; catches dependency violations; calculates hard floor correctly; applies floor reduction to penalties
- `EventService`: seeded draw is deterministic; composition rules enforced (min 1 setback, etc.); no duplicate-category draws; conditional resolution correct for has/lacks conditions; hard floor applied during resolution
- `ReportService`: encodes/decodes result strings round-trip; insight selection matches game outcomes; aggregation math correct across multiple results
- `CategoryCardComponent`: emits correct selection events; checkbox vs radio rendering based on `isMultiSelect`; dependency-disabled options are non-interactive

**Manual QA checklist:**

- [ ] Can allocate exactly 20 beans in Round 1, submit
- [ ] Over-budget state shows warning, blocks submission
- [ ] Required categories enforced — cannot submit with any starred category unselected
- [ ] Multi-select categories (Communication, Gifts) show checkboxes, allow multiple selections
- [ ] Transportation ↔ Auto Insurance dependency cascades correctly
- [ ] Round 2 reduces to 13 beans, highlights over-budget categories
- [ ] Round 3 events reveal one at a time, resolve conditionally
- [ ] Hard floor prevents impossible states — message shown when penalty is reduced
- [ ] Report shows correct round-by-round diff
- [ ] Encoded result string copies to clipboard (test on managed Chromebook)
- [ ] Clipboard fallback textarea appears when Clipboard API is blocked
- [ ] Print stylesheet renders report cleanly
- [ ] Replay with same seed produces identical events
- [ ] Replay comparison shows delta from previous run
- [ ] Aggregator decodes pasted strings and shows class analysis
- [ ] All keyboard shortcuts work (Tab, Arrow, Enter, Space, Escape)
- [ ] Screen reader announces round changes, bean counter updates, event reveals
- [ ] Reduced motion preference disables all animations
- [ ] Layout correct on Chromebook (1366×768), iPad (portrait + landscape), iPhone SE (375px)
- [ ] URL parameters correctly configure rounds, events, difficulty, seed

---

## Scope & Phasing

### v1 (Ship this)

- All 11 categories with exact tiers and bean costs from the worksheet
- Multi-select categories (Communication, Gifts) visually distinct with checkboxes + "Select all that apply"
- Category dependency validation (Transportation ↔ Auto Insurance, Housing → Renters Insurance)
- Rounds 1, 2, and 3 with the full 27-event pool
- Seeded PRNG for deterministic, reproducible life paths
- Hard floor enforcement: events cannot push below minimum required beans for starred categories
- Sequential event resolution: each event checks state at the moment it's revealed
- Tap-to-allocate interaction (Option B)
- Bean counter with color coding + icons + text labels
- Round transition animations (with `prefers-reduced-motion` support)
- Event card reveal mechanic with conditional logic
- Inline discussion question fields
- Shareable report with encoded result string (copy to clipboard with Clipboard API + textarea fallback)
- Print stylesheet for report output (teachers use browser Print → Save as PDF)
- Replay / "What If" mode: same life path with new choices, or enter another student's seed
- Teacher Aggregator page: paste encoded strings, see class-wide distributions and insights
- Teacher config via URL parameters
- English only
- Full WCAG 2.1 AA compliance (keyboard nav, screen reader support, semantic HTML, focus management)
- Responsive layout tested across Chromebook, iPad, phone, and desktop
- P0 and P1 testing matrix pass

### v2 (Later)

- Spanish language toggle
- Drag-and-drop bean interaction (Option A)
- Image export (HTML-to-PNG, pending device compatibility validation)
- Google Sheet–driven content pipeline for categories and events
- Additional events contributed by teachers (moderated submission)
- Cross-unit callouts on events (linking Bean Game lessons to specific NGPF units)
- Teacher facilitation mode (pause points between rounds for whole-class pacing)

### Explicitly Out of Scope

- Real dollar amounts or city-specific cost data
- Backend, accounts, or saved state
- Real-time class comparison dashboard (websockets / live sync)
- Websockets or push events
- Integration with the Salary-Based Budget spreadsheet

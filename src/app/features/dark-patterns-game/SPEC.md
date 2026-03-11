# Dark Patterns: A Day in Your Digital Life

## Product Spec for NGPF Interactive

**Author:** Dave (NGPF Curriculum)
**Target Builder:** Claude Code
**Tech Stack:** Angular 21+ (standalone components, SCSS, Angular CLI scaffolding via `npm run feature`)
**Deployment:** Hosted as a feature within the NgpfInteractives Angular project

---

## Overview

An interactive educational game that teaches students to recognize and resist dark patterns, the deceptive design tricks websites and apps use to manipulate user behavior. Students navigate a simulated "day in their digital life," encountering realistic dark pattern challenges across four time-of-day categories. The game builds a glossary of patterns as students play, tracks financial consequences of mistakes, and ends with a summary and reflection screen.

This is NOT a clone of the "Terms & Conditions Apply" game (termsandconditions.game). It shares the educational goal but differs meaningfully in structure, narrative framing, interaction types, and pedagogical approach.

---

## Core Design Principles

1. **Experiential learning first.** Students should feel the frustration and confusion of dark patterns, not just read about them.
2. **Realistic, not cartoonish.** Challenges should look and feel like real websites and apps students actually use, not exaggerated parodies.
3. **Teach in the moment.** After each challenge, reveal what happened, name the pattern, and connect it to real financial consequences.
4. **Build cumulative knowledge.** A glossary grows as students play. By the end, they have a toolkit for recognizing these patterns in the wild.
5. **Financial literacy integration.** Every dark pattern is connected to a dollar cost, time cost, or privacy cost. The summary screen quantifies the damage.

---

## Narrative Structure

The game is framed as a single day, broken into four time periods. Each period has a theme and 2-3 interactive challenges. The student plays as themselves, navigating realistic digital scenarios.

### Act 1: Morning -- Social Media & Apps (3 challenges)

**Context:** You wake up, grab your phone, and start your day. Every app has something to ask you...

**Challenge 1.1: Notification Permission Popup**

- **Dark pattern:** Confirmshaming
- **Setup:** A social media app asks to enable push notifications. The "Yes" button is large, colorful, and says something inviting like "Keep me in the loop!" The "No" option is small, gray text that reads something like "No thanks, I'd rather miss out on what my friends are sharing."
- **Correct action:** Click the small decline text.
- **Fail consequence:** "You enabled notifications. Studies show push notifications increase impulse purchases by driving you back into apps with flash sales and limited-time offers. Estimated annual cost of impulse purchases driven by notifications: $50-$150."
- **Financial impact:** $100

**Challenge 1.2: Cookie Consent Banner**

- **Dark pattern:** Misdirection (visual hierarchy manipulation)
- **Setup:** A news website shows a cookie banner. "Accept All" is a large, brightly colored button. "Reject All" does not exist as a button. Instead, there's a tiny "Manage Preferences" text link. If the student clicks "Manage Preferences," they see a screen with 6 toggle switches, ALL pre-set to ON. Each has vague, friendly-sounding descriptions ("Helps us improve your experience"). The student must manually toggle each one off, then find and click a small "Confirm Choices" button.
- **Dark patterns in play:** Misdirection + Preselection (combo)
- **Correct action:** Click "Manage Preferences," toggle all non-essential cookies off, then click "Confirm Choices."
- **Fail conditions:** (a) Clicking "Accept All" = full fail. (b) Missing any toggles = partial fail. (c) Successfully navigating it all = pass.
- **Fail consequence:** "You just gave this site permission to track your browsing across the web, build an advertising profile on you, and share that data with dozens of third-party companies."
- **Financial impact:** $0 direct, but note: "Your browsing data is worth an estimated $35-$240/year to data brokers."

**Challenge 1.3: App Update / Account Setup**

- **Dark pattern:** Preselection
- **Setup:** You're setting up a new account on a shopping app. At the bottom of the registration form, below the password field, there are three pre-checked checkboxes:
  - [x] "I agree to the Terms of Service and Privacy Policy"
  - [x] "Send me personalized deals and offers via email"
  - [x] "Share my activity with trusted partners to improve my experience"
- The "Create Account" button is prominently placed. The checkboxes are in smaller text.
- **Correct action:** Uncheck the second and third boxes before creating the account. (The first is required to use the service, so it's a judgment call, but the game should accept either unchecking all three or just the last two.)
- **Fail consequence:** "You just signed up for marketing emails and gave the company permission to share your data with 'trusted partners,' which could be hundreds of companies."
- **Financial impact:** $0 direct, but note impact on inbox and data exposure.

---

### Act 2: Midday -- Shopping Online (3 challenges)

**Context:** Time to buy those headphones you've been eyeing. But the checkout process has some surprises...

**Challenge 2.1: False Urgency on Product Page**

- **Dark pattern:** False Urgency
- **Setup:** A product page for headphones ($49.99) shows:
  - A countdown timer: "SALE ENDS IN 2:47:13"
  - "Only 3 left in stock!" in red text
  - "17 people are viewing this right now"
  - A banner: "Order in the next 23 minutes for same-day shipping!"
- Below all of this, the student must choose between "Add to Cart" (big orange button) and "Save for Later" (text link).
- **This is a teaching moment, not a right/wrong challenge.** The reveal explains that these urgency signals are almost always fake. The countdown resets if you refresh. The stock number doesn't change. The "people viewing" is generated randomly.
- **Correct action:** Either option is fine. The point is awareness. After they click, the reveal explains the tricks.
- **Financial impact:** Potential overspending due to pressure. "Fake urgency leads 35% of shoppers to buy faster than they planned, often skipping price comparisons."

**Challenge 2.2: Hidden Costs at Checkout**

- **Dark pattern:** Hidden Costs + Preselection
- **Setup:** The checkout screen for the $49.99 headphones. The itemized total shows:
  - Headphones: $49.99
  - Shipping: $5.99 (was not mentioned on the product page)
  - "HeadphoneGuard Protection Plan": $7.99 (pre-checked add-on)
  - "Priority Processing": $3.99 (pre-checked add-on)
  - **Total: $67.96**
- The pre-checked add-ons are styled to blend in with the order summary. The checkboxes are small. The "Place Order" button is prominent.
- **Correct action:** Uncheck both add-ons. (The shipping fee is unavoidable and is the "hidden cost" lesson.)
- **Fail consequence:** "You just paid $11.98 in add-ons you didn't ask for. The 'protection plan' covers almost nothing, and 'priority processing' just means normal processing speed. Plus, the $5.99 shipping fee wasn't shown until checkout."
- **Financial impact:** $11.98 (if add-ons not unchecked), note $5.99 shipping as hidden cost lesson.

**Challenge 2.3: Post-Purchase Upsell / Subscription Trap**

- **Dark pattern:** Hidden Subscription / Forced Continuity
- **Setup:** After "completing" the purchase, a congratulations screen appears: "Unlock FREE shipping on all future orders! Start your ShopPlus membership -- first 30 days FREE!" There's a big "Start Free Trial" button and, in very small light-gray text at the bottom: "After your free trial, ShopPlus automatically renews at $12.99/month. Cancel anytime."
- **Correct action:** Find and click "No thanks" (small text, not styled as a button) or simply close/skip the popup.
- **Fail consequence:** "You just signed up for a subscription that auto-renews at $12.99/month. Most people forget to cancel free trials. The average person loses $200+/year on forgotten subscriptions."
- **Financial impact:** $155.88/year (12 x $12.99)

---

### Act 3: Afternoon -- Subscriptions & Entertainment (2 challenges)

**Context:** You want to watch a new show everyone's talking about. Signing up is easy... but what about when you want to leave?

**Challenge 3.1: Free Trial Signup with Buried Terms**

- **Dark pattern:** Hidden Subscription / Trick Questions
- **Setup:** A streaming service offers "Watch FREE for 7 days!" The signup form asks for email and payment info. Below the payment fields, in small text: "By clicking Start Watching, you agree that your free trial will automatically convert to a Premium subscription at $14.99/month unless you cancel before the trial ends."
- There's also a question: "Would you like to NOT receive promotional emails from us and our partners?"
  - [ ] Yes
  - [ ] No
- (This is a double-negative trick. "Yes" means you DO want to not receive them, i.e., opt out. "No" means you don't want to not receive them, i.e., opt in. It's deliberately confusing.)
- **Correct action:** (a) Notice the auto-renewal terms and (b) answer "Yes" to the double-negative question (opting OUT of emails).
- **Fail consequence:** For missing the terms: "In 7 days, you'll be charged $14.99. If you forget to cancel, that's $179.88 over a year." For the email question: "You just opted IN to promotional emails because the question was phrased as a double negative."
- **Financial impact:** $179.88/year if trial not cancelled.

**Challenge 3.2: Cancellation Flow (Roach Motel)**

- **Dark pattern:** Roach Motel
- **Setup:** You've decided to cancel that streaming subscription. The cancellation flow is a multi-step gauntlet:
  1. "We're sorry to see you go! Before you cancel, check out these shows you haven't watched yet..." [Continue to Cancel] button is small and gray. [Keep My Subscription] is big and blue.
  2. "How about a discount? We'll give you 50% off for the next 3 months!" [Accept Offer] is big. [Continue to Cancel] is small.
  3. "Are you sure? You'll lose access to all your saved shows and watchlists." [Keep My Subscription] and [Yes, Cancel]. But "Yes, Cancel" has a sub-question: "Select your reason for canceling" with a required dropdown. The dropdown options are things like "Too expensive," "Not enough content," etc.
  4. FINAL confirmation: "Your subscription will remain active until [date]. Click below to confirm cancellation." [Confirm Cancellation] button.
- **Correct action:** Navigate all four steps without accepting any retention offers. Each step where the student clicks the wrong button counts as a fail.
- **Fail consequence:** "It took 4 separate screens to cancel. This is called a 'roach motel,' easy to get in, hard to get out. The FTC has sued companies over exactly this kind of cancellation flow."
- **Financial impact:** Depends on where they fail. If they accept the discount, note that's still $7.50/month x 3 = $22.50, and it auto-renews to full price after.

---

### Act 4: Evening -- Banking & Finance (2 challenges)

**Context:** Time to check in on your finances and set up that new bank account. But the fine print is hiding some important details...

**Challenge 4.1: Bank Account Signup with Disguised Opt-ins**

- **Dark pattern:** Disguised Ads / Preselection
- **Setup:** A bank account application form. Mixed in with legitimate form fields (name, email, SSN) are:
  - A section styled exactly like the form: "Protect your account with IdentityShield" with a pre-checked toggle. It looks like a security feature but is actually a paid add-on ($9.99/month).
  - A "Recommended for you" card that looks like part of the application but is actually an ad for a credit card with a high APR.
- **Correct action:** Uncheck the IdentityShield toggle and skip/ignore the credit card ad (don't click "Apply Now").
- **Fail consequence:** "IdentityShield is a third-party service that costs $9.99/month, billed to your new account. The credit card 'recommendation' has a 24.99% APR, well above average."
- **Financial impact:** $119.88/year for IdentityShield.

**Challenge 4.2: Privacy Settings Maze**

- **Dark pattern:** Misdirection + Roach Motel (for settings)
- **Setup:** After creating your account, the bank's app asks you to "Review your privacy preferences." The screen shows toggles for:
  - "Share my transaction data to receive personalized financial insights" (ON by default)
  - "Allow trusted partners to contact me with relevant offers" (ON by default)
  - "Participate in product improvement research" (ON by default)
- But here's the trick: the toggle labels and the toggle positions are visually misaligned. The ON/OFF positions are swapped from what students expect (left = ON instead of the standard right = ON). Or, the toggles are styled so that the "off" state looks like the "on" state (green when off, gray when on), the opposite of convention.
- **Correct action:** Carefully toggle all three to the actual OFF position, paying attention to the reversed visual convention.
- **Fail consequence:** "You thought you turned off data sharing, but the toggles were designed to trick you. The bank is now sharing your transaction data with marketing partners."
- **Financial impact:** $0 direct, but note: "Your financial transaction data is among the most valuable personal data for marketers."

---

## Dark Pattern Glossary

These patterns should be added to a sidebar/overlay glossary as students encounter them. Each entry includes:

| Pattern                 | Definition                                                                                                 | Financial Connection                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Confirmshaming**      | Making the decline option use guilt-tripping language to pressure you into accepting.                      | Gets you to enable features that drive impulse spending.          |
| **Misdirection**        | Using color, size, and placement to make one option obvious and the alternative nearly invisible.          | Tricks you into accepting data collection or paid add-ons.        |
| **Preselection**        | Pre-checking boxes or pre-enabling toggles so the default benefits the company.                            | Quietly adds charges, subscriptions, or data sharing.             |
| **Hidden Costs**        | Revealing additional fees late in the process after you're already committed to buying.                    | Directly increases what you pay beyond the advertised price.      |
| **False Urgency**       | Fake countdown timers, low-stock warnings, or "others viewing" messages to rush your decision.             | Pressures you to buy before comparing prices or thinking it over. |
| **Trick Questions**     | Confusing phrasing (especially double negatives) so you accidentally choose the opposite of what you want. | Opts you into emails, data sharing, or paid services.             |
| **Hidden Subscription** | Burying auto-renewal terms in fine print during a "free trial" signup.                                     | Charges you monthly long after you've forgotten about it.         |
| **Roach Motel**         | Making it easy to sign up but requiring many confusing steps to cancel.                                    | Keeps you paying for services you no longer want.                 |
| **Forced Continuity**   | Free trials that silently convert to paid subscriptions without a clear reminder.                          | Average person loses $200+/year on forgotten subscriptions.       |
| **Disguised Ads**       | Making ads or paid upsells look like regular content or required form fields.                              | Tricks you into applying for products you didn't intend to.       |

---

## Scoring & Summary Screen

### During the Game

- Track each challenge as Pass / Partial Fail / Full Fail.
- Track cumulative financial impact of mistakes.
- Track which dark patterns were encountered and whether they were recognized.

### End-of-Game Summary

**Section 1: Your Score**

- X out of 10 challenges navigated successfully.
- Visual representation (progress bar, star rating, or similar).
- Tiered feedback:
  - 9-10: "Dark Pattern Detective -- You're nearly impossible to fool."
  - 7-8: "Privacy Pro -- You caught most of the tricks, but a few slipped by."
  - 5-6: "Getting Wiser -- You fell for some common traps. Now you know what to look for."
  - 0-4: "Easy Target -- But not anymore. Now that you've seen these tricks, you'll spot them everywhere."

**Section 2: Your Financial Damage Report**

- Total estimated annual cost of the dark patterns you fell for.
- Breakdown by challenge, with a one-liner about what each cost.
- Example: "Forgotten streaming subscription: $179.88/year. Unwanted protection plan: $119.88/year. **Total: $455.64/year you didn't mean to spend.**"

**Section 3: Your Pattern Glossary**

- Show the full glossary of all patterns encountered.
- Highlight which ones tripped you up.

**Section 4: What Can You Do?**
A brief list of real-world tips:

- Always look for the smallest, least colorful option on permission screens.
- Uncheck every pre-checked box before submitting forms.
- Set a calendar reminder to cancel free trials before they renew.
- If a site makes it hard to say no, that's a red flag about how they treat your data.
- Read the sentence around every checkbox, especially if it contains "not" or "un-".
- Check your bank/credit card statements monthly for charges you don't recognize.

---

## UI/UX Design Notes

### Visual Design Direction

- **Aesthetic:** Clean, modern, slightly corporate-satirical. The fake websites/apps within the challenges should look convincingly real (like actual checkout pages, app popups, cookie banners, etc.). The framing UI around them (the day timeline, score tracking, glossary) should feel like a polished educational tool.
- **Color palette:** Use a neutral/dark background for the framing UI. Each time-of-day section gets an accent color (warm yellow for morning, blue for midday, purple for afternoon, green for evening). The fake website challenges within each section should use their own "realistic" color schemes.
- **Typography:** Use clean, readable fonts. The fake websites should use typical web fonts to look authentic.

### Interaction Patterns

- Each challenge should be a self-contained "card" or "screen" that simulates a real website/app interface.
- After each challenge attempt, show a reveal overlay with:
  - Whether they passed or failed (and why)
  - The name of the dark pattern used
  - The real-world example callout
  - The financial impact
  - A button to add this pattern to their glossary (or auto-add it)
- Transitions between challenges and time periods should feel like progressing through a day (subtle time-of-day visual shifts).

### Responsive Design

- Must work on both desktop and mobile (many students will play on Chromebooks or tablets).
- The simulated popups and websites should scale appropriately.

### Accessibility

- All interactive elements should be keyboard-navigable.
- Color should not be the only indicator of state (use labels, icons, or positioning too).
- Sufficient contrast ratios on all text.

---

## Technical Notes for Claude Code

### Project Setup

This is an Angular CLI project (v21+). To scaffold the feature:

```bash
npm run feature dark-patterns
```

This will generate the feature at `src/app/features/dark-patterns/` with:

- `dark-patterns.ts` (component)
- `dark-patterns.html` (template)
- `dark-patterns.scss` (styles)

It will also auto-configure routing at `/dark-patterns` and add a nav card to the home page.

### Architecture

- **Framework:** Angular (standalone components, signals or traditional change detection)
- **Styling:** SCSS (component-scoped). No Tailwind. Use the project's existing conventions.
- **Shared components available:** `TopHeader`, `BottomHeader`, `ExampleComponent`. Use `TopHeader` and `BottomHeader` for consistency with other NGPF interactives. Remove `ExampleComponent` import.
- **No external dependencies** unless already in the project's package.json. Check before adding anything.

### Component Structure

Break the interactive into child components within the feature folder:

```
src/app/features/dark-patterns/
  ├── dark-patterns.ts              # Main orchestrator component
  ├── dark-patterns.html            # Main template
  ├── dark-patterns.scss            # Main styles
  ├── components/
  │   ├── intro-screen/             # Welcome / instructions screen
  │   ├── challenge-card/           # Reusable wrapper for each challenge
  │   ├── challenge-reveal/         # Post-challenge result overlay
  │   ├── act-transition/           # Transition screen between acts
  │   ├── glossary-panel/           # Sidebar/overlay glossary
  │   ├── summary-screen/           # End-of-game results
  │   └── challenges/               # Individual challenge components
  │       ├── notification-popup/
  │       ├── cookie-banner/
  │       ├── account-signup/
  │       ├── false-urgency/
  │       ├── hidden-costs/
  │       ├── post-purchase-upsell/
  │       ├── free-trial-signup/
  │       ├── cancellation-flow/
  │       ├── bank-signup/
  │       └── privacy-settings/
  ├── models/
  │   ├── challenge.model.ts        # Challenge, ChallengeResult, DarkPattern interfaces
  │   └── game-state.model.ts       # GameState, Act, ScoreTier interfaces
  └── services/
      └── game-state.service.ts     # Central game state management
```

### State Management

Use an injectable `GameStateService` to manage:

- Current act (1-4) and challenge index within the act
- Results array for each challenge (pass / partial-fail / full-fail + financial cost incurred)
- Set of discovered dark patterns (for the glossary)
- Current phase: intro | challenge | reveal | act-transition | summary
- Total financial damage accumulator

This service should be provided at the feature level (not root) so state resets if the student navigates away and comes back.

### Data Model

Define challenge data as a typed constant array rather than fetching from an API. Each challenge object should include:

- Act metadata (id, title, subtitle, icon, color, description)
- Challenge metadata (id, dark pattern key, setup text, correct action description)
- Fail/partial-fail consequence text
- Financial impact amount
- Real-world callout text

The dark pattern glossary entries should be a separate constant map keyed by pattern ID, so the glossary can look up definitions as patterns are discovered.

### Interaction Flow

1. **Intro screen** -- explains the premise and rules, "Start" button
2. **Act transition** -- shows time of day, theme, brief context paragraph
3. **Challenge** -- renders the simulated UI. Student interacts. Component emits a result event.
4. **Reveal overlay** -- shows pass/fail, pattern name, real-world callout, financial impact. "Next" button.
5. Repeat 3-4 for each challenge in the act, then back to 2 for the next act.
6. **Summary screen** -- score, financial damage report, full glossary, tips.

### Styling Approach

- The outer game shell (timeline, score tracker, glossary button) should use NGPF-consistent styling.
- The simulated websites/apps inside each challenge should be styled to look like realistic, distinct interfaces (a social media popup, a checkout page, a cookie banner, a streaming service, a bank app). Each should feel like a different "website" with its own color scheme and typography. Use component-scoped SCSS for this.
- Use CSS variables at the feature level for the act accent colors (morning: warm yellow, midday: blue, afternoon: purple, evening: green).
- All challenge simulations should be responsive and work on Chromebooks/tablets (minimum ~768px wide, but degrade gracefully narrower).

### No External API Calls

Everything runs client-side. No backend, no localStorage, no sessionStorage. All state lives in the Angular service for the duration of the session.

---

## What This Is NOT

To be clear, this interactive:

- Does NOT copy specific challenges or UI from the "Terms & Conditions Apply" game.
- Uses a narrative day-in-the-life structure instead of a random popup gauntlet.
- Simulates full realistic web interfaces instead of stylized pop-up boxes.
- Teaches pattern names and financial consequences in-context rather than just scoring at the end.
- Covers financial dark patterns (hidden fees, subscriptions, checkout tricks) in addition to privacy/data patterns.
- Is framed around scenarios students actually encounter rather than an abstract "EVIL CORP" villain.

---

## Open Questions / Future Enhancements

These are not in scope for v1 but worth noting:

- **Build-a-Trap Mode:** A second mode where students flip perspective and design dark patterns themselves (choose a goal, select techniques, see effectiveness). This deepens understanding. Could be a v2 feature.
- **Teacher Dashboard / Worksheet Export:** Ability to export results for classroom discussion.
- **Difficulty Levels:** Beginner mode with hints, advanced mode with more subtle tricks.
- **Multiplayer / Leaderboard:** Compare scores across the class.

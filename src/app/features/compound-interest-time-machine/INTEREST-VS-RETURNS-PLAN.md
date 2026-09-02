# Separating interest (savings) from returns (investments)

**Status: shipped, with one change from the recommendation below.** The plan
recommended naming the savings/investment contrast once in the intro. On review
that paragraph was cut, so the activity now uses returns language throughout and
does not mention savings accounts at all. Everything else shipped as written.
See commits 0280783, 3df5d8d and the follow-up removing the paragraph.


**Context:** NGPF distinguishes interest from returns in all PDs. Savings accounts pay
interest; investments earn returns from price changes plus dividends. The 10% example
currently in this activity is appropriate for an investment and not for a savings account.

---

## The answer: full investment

This is not a preference. The activity structurally cannot be a savings-account activity.
Its four challenges, run at savings rates against investment rates:

| Challenge | At savings rates | At investment rates |
|---|---|---|
| 1. $1,000 sits for 40 years | $1,221 at 0.5%, $4,940 at 4% | $16,311 at 7% |
| 2. Does double the rate double the money? | 2% to 4% gives **2.2x** | 5% to 10% gives **7.3x** |
| 3. $1,000 + $200/mo for 40 years | $241,332 | $541,274 |
| 4. Starting 10 years earlier | $97,582 gap | $280,968 gap |

**Challenge 2 is the decisive one.** Its title is "Does Double the Rate of Return Mean
Double the Money?" and the correct answer is meant to land as a shock: no, about 7x. At
savings rates the answer becomes "yes, about double." The lesson does not merely weaken,
it inverts and teaches the exact misconception the challenge exists to correct.

**Challenge 1 has the same problem.** A graduation gift growing to $1,221 over 40 years is
a flat line, not a hockey stick. The "watch it accelerate" reveal has nothing to reveal.

Every dramatic moment in this activity depends on 7% to 10% returns, which are investment
returns. There is no version that works as a savings account without rebuilding all four
challenges into a different and much flatter lesson.

---

## The activity is already investing

The numbers are already investing numbers. Only the vocabulary lags.

| Where | Rate | Framing |
|---|---|---|
| Session rate (Challenges 1 and 3) | 7% | investing |
| Challenge 2 | 5% vs 10% | investing |
| Challenge 4 | pinned 7% | investing |
| Sandbox helper text | "stock market has historically averaged about 7-10% per year before inflation" | investing |
| Scenarios (`scenarios.ts`) | 5-7% | "You invest $200/month..." |

The scenarios say "invest", Challenge 4's reflection prompt says "I'll just start investing
later", and the takeaways block is already written in growth and rate language. Nothing
about the substance needs to change.

---

## So the real question is narrower

Given that this is an investing activity, does the word "interest" appear anywhere at all?

| Option | Trade-off |
|---|---|
| Purge it entirely | Never say interest; say return, earnings, growth. Clean, but students never learn the distinction. They simply stop seeing the wrong word. |
| **Name the contrast once, then go all-investment (recommended)** | One sentence in the intro: a savings account pays *interest* at a rate the bank sets; investments earn *returns* from price changes and dividends, which is what this activity models. Everything after that is return language. |

The stated goal is that the distinction is made in all PDs, which means students should
*hold* the distinction, not merely avoid the wrong word. That points to the second option.
It also repairs the one genuinely wrong sentence in the activity (below).

### The sentence that is actually wrong

`intro.component.html`:

> Compound interest is the money your money earns just by sitting in an account
> that pays interest, **like a savings account or an investment account**.

That explicitly merges the two things the PDs separate.

Immediately after it, `concept-demo.component.ts` says:

> You start with $100. Imagine you put it in **an account that pays 10% every year**.

Which reads as a savings account paying 10%. That is the case flagged in the request. The
fix is to frame it as an investment return, keeping 10% so the arithmetic stays vivid
($10.00, then $11.00, then $12.10). At a realistic 4% APY the steps are $4.00, $4.16 and
$4.33, and the entire point of the demo is that year two is visibly bigger than year one.

---

## Decisions still needed

### D1. The feature name

It is called "Compound Interest Time Machine" but teaches investment returns end to end.

| Option | Trade-off |
|---|---|
| Keep as is | "Compound interest" is the colloquial umbrella term. No broken links. Loudest remaining place the wrong word appears. |
| **Change display title, keep the URL (recommended)** | Home tile and page title updated; existing teacher links to `/compound-interest-time-machine` keep working. |
| Rename title and route | Cleanest, but breaks existing links and needs a Notion update. |

### D2. Internal field names

`interestRate`, `totalInterestEarned`, `compound-interest.service.ts` and about 27 spec
references use interest naming. Students never see these.

**Recommendation:** leave them for now, or do them as a separate mechanical commit after
the copy lands, so a copy review is not buried in a rename diff.

---

## Change inventory

### Student-facing copy that must change

| File | What changes |
|---|---|
| `components/intro/intro.component.html` | The hook sentence conflating savings and investment accounts, replaced with the contrast sentence; step 1 "how interest earns interest"; the `h2` title if D1 says rename |
| `components/concept-demo/concept-demo.component.html` | Lede ("the whole story of compound interest", "the interest you earn also earns interest"); chart legend "Interest earned"; figure label "Interest earned this year" |
| `components/concept-demo/concept-demo.component.ts` | Four narrative strings, including "an account that pays 10% every year" and "that extra dollar is interest earning interest" |
| `data/challenge-content.ts` | Three `reflectInsight` strings: C1 "earns interest on the interest", C2 "With compound interest", C3 "Compound interest turned..." |
| `components/summary-panel/summary-panel.component.html` | "Interest Earned" stat card label; "That means interest earned more than you ever put in" |
| `components/growth-table/growth-table.component.html` | The "Interest" column header (this table is live in the sandbox) |
| `components/reflection-form/reflection-form.component.ts` | Two of the three prompts say "compound interest" |
| `src/app/features/home/home.html`, `src/app/app.routes.ts` | Tile heading and page title, only if D1 says rename |

### Already correct, no change needed

- All rates and scenarios (`data/scenarios.ts`)
- Sandbox rate labels and the stock-market helper text
- `data/takeaways-fill.ts` sentences and word-bank distractors
- Challenge 2's title and setup ("rate of return")
- Challenge 5's input prompts

### Flagged, not proposed

`components/input-panel/input-panel.component.*` still says "Interest Rate", but nothing
renders it. It is dead code superseded by the sandbox. Not worth editing as part of this;
worth deleting in a separate cleanup.

---

## Risks

A partial conversion reads worse than no conversion. A screen with "return" in the heading
and "interest" in the stat card underneath is more confusing than one that is consistently
wrong. The sweep therefore needs to be by rendered text, not by file.

Several of the 59 existing tests assert on copy and will need updating in the same commit.

## Verification

1. Walk all six screens (intro, concept demo, four challenges, sandbox, results) in the
   browser and grep the rendered DOM for "interest", confirming only the intended contrast
   sentence survives.
2. Run the feature's test suite; update any copy assertions.
3. Re-check the takeaways word bank still has no valid-but-marked-wrong answer after any
   wording change.

## Scope

Roughly a dozen strings across eight files, one commit, assuming D1 keeps the route.
If the internal rename is wanted too, that is a second commit of mechanical churn across
the service, models, charts and specs.

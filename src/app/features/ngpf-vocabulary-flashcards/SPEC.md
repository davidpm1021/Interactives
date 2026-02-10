# NGPF Flashcard Interactive — Claude Code Spec

## Overview

Build a **Flashcard** feature for the NGPF Interactives Angular 21 monorepo that replicates core Quizlet-style study functionality for NGPF personal finance vocabulary. This includes a data pipeline that converts the NGPF Personal Finance Dictionary (a Google Doc / Word document) into structured JSON, and an Angular feature that lets students select units, study flashcards, and track progress.

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
npm run feature flash-cards
```
This creates `src/app/features/flash-cards/` with `.ts`, `.html`, and `.scss` files, adds the route to `app.routes.ts`, and adds a nav card to the home page.

---

## 2. Data Model

### 2.1 Vocabulary JSON Schema

The flashcard app is powered by a single JSON file at:
```
src/assets/data/flashcard-vocabulary.json
```

Schema:
```json
{
  "metadata": {
    "version": "1.0.0",
    "generatedAt": "2026-02-03T00:00:00Z",
    "sourceDocument": "NGPF Personal Finance Dictionary",
    "totalTerms": 450
  },
  "units": [
    {
      "id": 1,
      "name": "Behavioral Economics",
      "slug": "behavioral-economics",
      "terms": [
        {
          "id": "be-001",
          "term": "Authority Bias",
          "definition": "A cognitive bias where people tend to attribute greater accuracy to the opinion of an authority figure.",
          "spanish": {
            "term": "El sesgo de la autoridad",
            "definition": "Un sesgo cognitivo donde las personas tienden a atribuir mayor precisión a la opinión de una figura de autoridad."
          }
        }
      ]
    }
  ]
}
```

### 2.2 TypeScript Interfaces

Create at: `src/app/features/flash-cards/models/flashcard.models.ts`

```typescript
export interface VocabularyData {
  metadata: VocabularyMetadata;
  units: Unit[];
}

export interface VocabularyMetadata {
  version: string;
  generatedAt: string;
  sourceDocument: string;
  totalTerms: number;
}

export interface Unit {
  id: number;
  name: string;
  slug: string;
  terms: Term[];
}

export interface Term {
  id: string;
  term: string;
  definition: string;
  spanish: SpanishTranslation;
}

export interface SpanishTranslation {
  term: string;
  definition: string;
}

/** Represents a single flashcard in the study session */
export interface Flashcard {
  term: Term;
  unitId: number;
  unitName: string;
  /** Which side shows first: 'term' means show term first, 'definition' means show definition first */
  frontSide: 'term' | 'definition';
  /** Whether the card is flipped to show the back */
  isFlipped: boolean;
  /** Whether the user marked this card as "missed" */
  isMissed: boolean;
}

export type StudyMode = 'term-first' | 'definition-first' | 'mixed';

export interface StudySession {
  cards: Flashcard[];
  currentIndex: number;
  totalCards: number;
  completedCards: number;
  missedCards: Flashcard[];
  studyMode: StudyMode;
  isSpanish: boolean;
  /** true when reviewing only missed cards */
  isReviewRound: boolean;
}
```

### 2.3 NGPF Semester Course Units

The dictionary organizes vocabulary into 11 units. The unit selection UI must present these in order:

| Unit # | Name | Slug |
|--------|------|------|
| 1 | Behavioral Economics | `behavioral-economics` |
| 2 | Banking | `banking` |
| 3 | Investing | `investing` |
| 4 | Types of Credit | `types-of-credit` |
| 5 | Managing Credit | `managing-credit` |
| 6 | Paying for College | `paying-for-college` |
| 7 | Career | `career` |
| 8 | Insurance | `insurance` |
| 9 | Taxes | `taxes` |
| 10 | Budgeting | `budgeting` |
| 11 | Consumer Skills | `consumer-skills` |

### 2.4 Spanish Translations

The main NGPF Personal Finance Dictionary contains both English AND Spanish versions of every term and definition in a single document. There is no separate Spanish file needed — the parser extracts both languages from the same source document.

The Spanish toggle should:
- Show the **Spanish term** on the term side
- Show the **Spanish definition** on the definition side
- Both `spanish.term` and `spanish.definition` should be populated for every entry

If a term is missing its Spanish translation for any reason, the UI should fall back to the English version with a small "(English)" label indicator.

---

## 3. Feature Architecture

### 3.1 File Structure

After scaffolding with `npm run feature flash-cards`, expand the generated structure to:

```
src/app/features/flash-cards/
├── flash-cards.ts                    # Root component (container/router)
├── flash-cards.html
├── flash-cards.scss
├── models/
│   └── flashcard.models.ts           # All interfaces from §2.2
├── services/
│   └── flashcard.service.ts          # Data loading, session management, shuffle logic
├── components/
│   ├── unit-selection/
│   │   ├── unit-selection.component.ts
│   │   ├── unit-selection.component.html
│   │   └── unit-selection.component.scss
│   ├── study-settings/
│   │   ├── study-settings.component.ts
│   │   ├── study-settings.component.html
│   │   └── study-settings.component.scss
│   ├── flashcard-viewer/
│   │   ├── flashcard-viewer.component.ts
│   │   ├── flashcard-viewer.component.html
│   │   └── flashcard-viewer.component.scss
│   ├── progress-bar/
│   │   ├── progress-bar.component.ts
│   │   ├── progress-bar.component.html
│   │   └── progress-bar.component.scss
│   └── completion-screen/
│       ├── completion-screen.component.ts
│       ├── completion-screen.component.html
│       └── completion-screen.component.scss
```

### 3.2 Component Responsibilities

#### `FlashCardsComponent` (root)
- Manages the overall flow state machine: `unit-selection` → `study-settings` → `studying` → `completion`
- Hosts `TopHeader` and `BottomHeader` shared components
- Holds the `StudySession` state (or delegates to the service)

#### `UnitSelectionComponent`
- Displays all 11 units as selectable cards/checkboxes
- Multi-select: users can pick 1 or more units
- "Select All" / "Deselect All" convenience buttons
- Shows term count per unit (e.g., "Banking — 24 terms")
- "Continue" button is disabled until ≥1 unit is selected
- Emits: `unitsSelected: Unit[]`

#### `StudySettingsComponent`
- Shown after unit selection, before study begins
- Three study mode options (radio buttons or segmented control):
  - **Term → Definition** (see the word, guess the definition)
  - **Definition → Term** (see the definition, guess the word)
  - **Mixed** (random per card)
- Spanish toggle switch (labeled "Estudiar en Español" / "Study in Spanish")
- Summary: "You're about to study X cards from Y units"
- "Start Studying" button
- "Back" button to return to unit selection
- Emits: `settingsConfirmed: { mode: StudyMode, isSpanish: boolean }`

#### `FlashcardViewerComponent`
- The main study screen — displays one card at a time
- **Card display:**
  - Shows front side (term or definition depending on mode + Spanish toggle)
  - Click/tap anywhere on card to flip and reveal back side
  - CSS 3D flip animation (rotateY transform)
  - Card should be large and centered, easy to read on mobile
- **Navigation:**
  - "Got it ✓" button — marks card as correct, advances to next card
  - "Missed ✗" button — marks card as missed, advances to next card
  - Both buttons only appear AFTER the card is flipped (user must see the answer first)
  - Keyboard shortcuts: Space to flip, Right arrow or Enter for "Got it", Left arrow for "Missed"
- **Progress bar** at the top showing `currentIndex / totalCards`
- **Card counter** text: "Card 5 of 20"
- When all cards are exhausted:
  - If there are missed cards → prompt: "You missed X cards. Review them?" with "Review Missed" and "Finish" buttons
  - If "Review Missed" → reset the deck to only the missed cards (shuffled), clear missed state, study again
  - If no missed cards or user clicks "Finish" → go to completion screen
- Inputs: `session: StudySession`
- Outputs: `cardResult: { card: Flashcard, result: 'correct' | 'missed' }`, `sessionComplete: void`

#### `ProgressBarComponent`
- Simple progress bar (filled portion = completedCards / totalCards)
- Shows fraction text: "5 / 20"
- Inputs: `current: number`, `total: number`

#### `CompletionScreenComponent`
- "Congratulations! You've completed all cards." message
- Stats summary:
  - Total cards studied
  - Cards correct on first pass
  - Cards that needed review
  - Units covered
  - Study mode used
- Action buttons:
  - "Study Again" (same units & settings)
  - "Change Units" (go back to unit selection)
  - "Back to Home" (navigate to `/`)

### 3.3 FlashcardService

Located at: `src/app/features/flash-cards/services/flashcard.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class FlashcardService {
  /** Load vocabulary data from the JSON asset */
  loadVocabulary(): Observable<VocabularyData>

  /** Build a study session from selected units and settings */
  createSession(
    units: Unit[],
    mode: StudyMode,
    isSpanish: boolean
  ): StudySession

  /** Fisher-Yates shuffle */
  shuffleCards(cards: Flashcard[]): Flashcard[]

  /** Get the current card */
  getCurrentCard(session: StudySession): Flashcard | null

  /** Advance to next card, marking current as correct or missed */
  advanceCard(
    session: StudySession,
    result: 'correct' | 'missed'
  ): StudySession

  /** Create a review session from missed cards */
  createReviewSession(session: StudySession): StudySession
}
```

Key behaviors:
- `loadVocabulary()` fetches `assets/data/flashcard-vocabulary.json` via Angular's `HttpClient`
- `createSession()` collects all terms from selected units, assigns `frontSide` based on mode ('term' for term-first, 'definition' for definition-first, random for mixed), shuffles the deck
- Shuffle uses Fisher-Yates algorithm for true randomization
- Session is immutable-style: methods return new session objects rather than mutating

---

## 4. User Flow

```
┌─────────────────────┐
│   Unit Selection     │  ← Pick 1+ units, see term counts
│   [Select units...]  │
│   [Continue →]       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Study Settings     │  ← Pick mode, Spanish toggle
│   [Term → Def]       │
│   [Def → Term]       │
│   [Mixed]            │
│   [🇪🇸 Spanish]      │
│   [Start Studying →] │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Flashcard Viewer   │  ← Study loop
│   ┌───────────────┐  │
│   │               │  │
│   │  [FRONT SIDE] │  │  ← Tap to flip
│   │               │  │
│   └───────────────┘  │
│   ━━━━━━━░░░░░░░░░░  │  ← Progress bar
│   Card 5 of 20       │
│   [✗ Missed] [Got it ✓]│  ← Appear after flip
└─────────┬───────────┘
          │
          ▼ (all cards done)
┌─────────────────────┐
│  Missed cards?       │
│  [Review Missed]     │──→ loops back to Flashcard Viewer
│  [Finish]            │      with only missed cards
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Completion Screen   │
│  🎉 Congrats!        │
│  Stats summary       │
│  [Study Again]       │
│  [Change Units]      │
│  [Back to Home]      │
└─────────────────────┘
```

---

## 5. UI / UX Requirements

### 5.1 Card Interaction
- **Flip animation:** CSS 3D transform (`perspective`, `rotateY(180deg)`, `backface-visibility: hidden`). Duration: 400–500ms ease-in-out.
- **Tap/click anywhere on the card** to flip. Visual hint on unflipped card: "Tap to reveal" or a subtle flip icon.
- Card should be sized to be comfortable on mobile (min-height ~250px, responsive width).
- Front and back of card should have distinct visual treatment (e.g., slightly different background shade or a subtle border difference) so the flip feels meaningful.

### 5.2 Card Content Display
- **Term-first mode (English):** Front shows term in large bold text. Back shows definition in regular text.
- **Definition-first mode (English):** Front shows definition. Back shows term in large bold text.
- **Mixed mode:** Randomly assigns per card.
- **Spanish toggle ON:**
  - Front shows the Spanish version of whichever side is "front" (Spanish term or Spanish definition)
  - Back shows the Spanish version of the other side
  - If a Spanish field happens to be empty for a specific term, fall back to the English version with a small "(English)" label
- Unit name should appear as a subtle tag/badge on the card (e.g., bottom corner) so students know which unit each term belongs to.

### 5.3 Progress Bar
- Horizontal bar at the top of the study screen, below the header
- Filled portion transitions smoothly (CSS transition on width)
- Fraction label centered or right-aligned: "5 / 20"

### 5.4 "Got it" / "Missed" Buttons
- These buttons are **hidden until the card is flipped** to encourage students to actually try to recall the answer before moving on
- "Got it ✓" — primary/green styled button, right side
- "Missed ✗" — secondary/red styled button, left side
- On mobile, these should be large touch targets (min 48px tall)
- After clicking either, the card auto-advances to the next card (unflipped state) with a brief transition

### 5.5 Unit Selection
- Cards or large checkboxes for each unit
- Each shows: unit number, unit name, term count
- Selected units get a highlighted border/background
- Responsive grid: 2 columns on mobile, 3 on tablet, 4 on desktop

### 5.6 Accessibility
- All interactive elements must be keyboard-navigable
- Card flip: Space or Enter to flip
- Navigation: Arrow keys or Tab
- ARIA labels on card faces (e.g., `aria-label="Flashcard front: [term]"`)
- Progress bar has `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Screen reader announcements when card flips and when advancing to next card
- Sufficient color contrast on all text (WCAG AA minimum)

### 5.7 Responsive Design
- Mobile-first approach
- Card should take ~90% width on mobile, max ~600px on desktop
- Navigation buttons stack below card on small screens
- Unit selection grid collapses to single column on very small screens

---

## 6. Data Pipeline — Dictionary Parser Script

### 6.1 Purpose

Convert the NGPF Personal Finance Dictionary (Google Doc exported as .docx) into the `flashcard-vocabulary.json` described in §2.1.

### 6.2 Script Location
```
scripts/parse-dictionary.ts
```

Runnable via:
```bash
npm run parse-dictionary
```

Add to `package.json`:
```json
{
  "scripts": {
    "parse-dictionary": "npx ts-node scripts/parse-dictionary.ts"
  }
}
```

### 6.3 Input

The script pulls directly from the Google Doc — no manual export or file download required.

```bash
npm run parse-dictionary
```

The script accesses the NGPF Personal Finance Dictionary via the Google Docs/Drive API using the document ID:
```
Document ID: 1YH07bp18mb2fLOlJqvRMpiEAJ0oodsZRzEhEHPwjEDo
```

**Authentication:** The script uses a Google Service Account for API access. The service account credentials JSON file should be stored at `config/google-service-account.json` (gitignored). The dictionary Google Doc must be shared with the service account email address (read-only is sufficient).

**Setup (one-time):**
1. Create a Google Cloud project and enable the Google Docs API
2. Create a service account and download the credentials JSON
3. Place the credentials at `config/google-service-account.json`
4. Share the NGPF Personal Finance Dictionary with the service account email
5. Add `config/` to `.gitignore`

**Alternative approach if service account is too complex:** The script can use the Google Docs export endpoint to download the document as plain text or HTML, which may not require full OAuth if the document is shared with "anyone with the link" (view-only). The parser developer should evaluate both approaches and pick the simplest one that works given the doc's sharing settings.

### 6.4 Parsing Strategy

The dictionary Google Doc is structured as follows (based on inspection of the document):

1. **Unit headings** appear as major section headings in the document (e.g., Heading 1 or Heading 2 level). They correspond to the 11 units listed in §2.3. The document contains section markers that group terms by unit.

2. **Terms** appear as bold or heading-level entries, followed by their definitions as body text. Both English and Spanish versions are included for each term.

3. **The parser must:**
   - Use the Google Docs API to fetch the document's structured content (which returns a JSON representation of the doc with paragraphs, headings, text runs, and formatting info) — OR use the Google Drive export API to download as HTML/plain text and parse that
   - Identify unit section boundaries (look for headings matching known unit names)
   - Extract term-definition pairs within each unit section, including both English AND Spanish versions of each term and definition
   - Generate unique IDs per term (e.g., `unit-slug + incrementing number`)
   - Output the JSON to `src/assets/data/flashcard-vocabulary.json`

4. **Edge cases to handle:**
   - Terms that appear in multiple units (include in each unit, deduplicated by term text within a unit)
   - Terms with parenthetical abbreviations, e.g., "Annual Percentage Rate (APR)" — keep full text as the term
   - Definitions that span multiple paragraphs — concatenate with space
   - Special characters and accents in Spanish terms — preserve UTF-8

### 6.5 Spanish Data Extraction

The main dictionary Google Doc contains both English and Spanish for every term. The parser extracts both languages from the same document during the main parse pass via the Google Docs API. There is no separate Spanish translations file and no manual file export needed.

### 6.6 Output

The script writes to: `src/assets/data/flashcard-vocabulary.json`

After running, the script should log:
```
✓ Parsed 11 units, 452 terms
✓ Extracted 452 English terms, 450 Spanish translations (2 missing)
✓ Missing Spanish translations:
  - "Some New Term" (Unit 3: Investing)
  - ...
✓ Output written to src/assets/data/flashcard-vocabulary.json
```

### 6.7 Validation

The script should validate the output:
- Every term must have a non-empty `term` and `definition`
- Every unit must have ≥1 term
- Warn (don't fail) if a term has no Spanish translation
- Warn if duplicate terms exist within the same unit
- Log total counts for human verification

### 6.8 Workflow for Non-Technical Team Members

The intended workflow:
1. A team member edits the NGPF Personal Finance Dictionary directly in Google Docs (as they already do)
2. That's it — they're done. No exporting, no file management.
3. A developer (or CI job) runs `npm run parse-dictionary`
4. The script pulls the latest version of the Google Doc via API, parses it, and outputs updated JSON
5. The developer commits the updated JSON

**Future enhancement (not MVP):** A CI/CD job, GitHub Action, or Google Apps Script webhook that automatically triggers the parse whenever the Google Doc is edited (or on a schedule, e.g., nightly). This would make the entire pipeline zero-touch — edits in Google Docs flow automatically to the app. For now, the manual `npm run parse-dictionary` step is sufficient.

---

## 7. State Management

Use Angular signals (since Angular 21 supports them well) for reactive state management within the feature. No need for NgRx or other external state libraries — this is a self-contained feature.

### Key Signals in FlashCardsComponent:
```typescript
// Flow state
currentView = signal<'unit-selection' | 'study-settings' | 'studying' | 'completion'>('unit-selection');

// Data
vocabularyData = signal<VocabularyData | null>(null);
selectedUnits = signal<Unit[]>([]);

// Session
studySession = signal<StudySession | null>(null);

// Settings
studyMode = signal<StudyMode>('term-first');
isSpanish = signal<boolean>(false);
```

### State Transitions:
1. `unit-selection` → user selects units → `study-settings`
2. `study-settings` → user picks mode & Spanish → `studying` (session created)
3. `studying` → all cards done + no review → `completion`
4. `studying` → all cards done + review missed → stays in `studying` (new review session)
5. `completion` → "Study Again" → `studying` (same settings)
6. `completion` → "Change Units" → `unit-selection`

---

## 8. Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `Space` | Flip card | While studying, card not yet flipped |
| `Enter` or `→` | "Got it" (correct) | While studying, card is flipped |
| `←` | "Missed" | While studying, card is flipped |
| `Escape` | Back to previous screen | Any screen |

Implement via `@HostListener('document:keydown')` on the FlashcardViewerComponent.

---

## 9. Animations

Use Angular's `@angular/animations` for:
- **Card flip:** 3D transform animation (can also be pure CSS — either approach is fine, but be consistent)
- **Card entrance:** Subtle slide-in from the right when advancing to next card
- **Progress bar fill:** CSS transition (`transition: width 300ms ease`)
- **Button reveal:** Fade-in when card flips to show "Got it" / "Missed" buttons

---

## 10. Testing Expectations

### Unit Tests (Vitest)
- `FlashcardService`:
  - `createSession` correctly builds cards from selected units
  - `shuffleCards` produces a different order (statistical test or seed-based)
  - `advanceCard` correctly updates index and marks missed
  - `createReviewSession` only includes missed cards
  - Mixed mode assigns roughly equal term-first and definition-first
- `UnitSelectionComponent`: selecting/deselecting units, select all, continue disabled when none selected
- `FlashcardViewerComponent`: flip toggling, button visibility tied to flip state, navigation

### Manual QA Checklist
- [ ] Can select single unit and study
- [ ] Can select multiple units and study
- [ ] Term→Definition mode shows term first
- [ ] Definition→Term mode shows definition first
- [ ] Mixed mode varies front side
- [ ] Spanish toggle shows Spanish terms
- [ ] Card flip animation works on click/tap
- [ ] Card flip works on Space key
- [ ] "Got it" / "Missed" buttons hidden until flip
- [ ] Progress bar updates correctly
- [ ] Missed cards prompt appears at end
- [ ] Review round only shows missed cards
- [ ] Completion screen shows correct stats
- [ ] "Study Again" restarts with same settings
- [ ] "Change Units" goes back to selection
- [ ] Responsive on mobile/tablet/desktop
- [ ] Keyboard navigation works throughout

---

## 11. Implementation Order

Recommended build sequence:

1. **Scaffold & data model** — Run `npm run feature flash-cards`, create interfaces and mock JSON data for 2–3 units (don't need the full dictionary yet)
2. **FlashcardService** — Implement all core logic with unit tests
3. **UnitSelectionComponent** — Build the unit picker UI
4. **StudySettingsComponent** — Build the settings screen
5. **FlashcardViewerComponent + ProgressBarComponent** — Core study experience with flip, navigation, and progress
6. **CompletionScreenComponent** — End-of-session summary
7. **Root component state machine** — Wire everything together
8. **Spanish toggle** — Layer in Spanish display logic
9. **Keyboard shortcuts** — Add keyboard support
10. **Animations & polish** — Card flip animation, transitions, responsive refinement
11. **Parser script** — Build `parse-dictionary.ts` to extract English + Spanish from the single dictionary .docx
12. **Full data import** — Run parser on real dictionary, replace mock data

---

## 12. Dependencies

No new external dependencies should be needed for the Angular feature itself (Angular's built-in HttpClient, animations, and signals are sufficient).

For the parser script:
- `googleapis` — Google Docs/Drive API client for fetching document content directly from Google Docs
- `ts-node` — to run TypeScript scripts directly (likely already a dev dependency)
- `commander` or `yargs` — optional, for CLI argument parsing (can also use `process.argv` directly)

---

## 13. Open Questions / Future Enhancements

These are NOT part of MVP but should be kept in mind during architecture:

1. **Spaced repetition** — Could track which terms a student struggles with across sessions (would need persistent storage, e.g., localStorage or a backend)
2. **Matching game mode** — Drag term to definition, timed
3. **Quiz mode** — Multiple choice (show 4 definitions, pick the right one)
4. **Teacher dashboard** — Aggregate class performance data (requires backend)
5. **Automated Google Doc sync** — Since the script already pulls via API, add a scheduled CI/CD job (e.g., nightly GitHub Action) that runs `npm run parse-dictionary`, and if the JSON changed, auto-commits and deploys
6. **Print mode** — Export flashcards as printable PDF
7. **Share deck** — URL-encoded unit selection for teachers to share specific study sets with students

---

## 14. Dictionary Document Structure Notes

The NGPF Personal Finance Dictionary (Google Doc ID: `1YH07bp18mb2fLOlJqvRMpiEAJ0oodsZRzEhEHPwjEDo`) is approximately 140 pages. Key structural observations:

- **It is too large** to read in a single context window — the parser script pulls it via Google Docs API and processes it programmatically
- Terms are organized by unit sections within the document
- Each term entry includes: the English term (bold), English definition, Spanish term, and Spanish definition
- The document uses heading levels to separate unit sections
- All data (English and Spanish) comes from this single document — no separate Spanish file is needed

**Important for the parser developer:** Use the Google Docs API `documents.get` endpoint first, which returns a structured JSON representation of the document (paragraphs, headings, text runs with formatting). This is far easier to parse than HTML or raw text. Inspect the returned structure to confirm heading levels, bold formatting patterns, and how English/Spanish entries are delineated before writing the full parser.

---

*End of spec. This document should provide everything needed for Claude Code to implement the flashcard feature end-to-end.*
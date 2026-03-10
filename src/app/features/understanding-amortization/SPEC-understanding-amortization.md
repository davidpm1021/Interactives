# Understanding Amortization - Feature Spec

> Spec for rebuilding the Loan Amortization Calculator as a feature in **NGPFInteractives** (Angular 21, standalone components, D3.js, Signals).

---

## 1. Overview

An interactive loan amortization calculator that lets students enter loan parameters, optionally add extra payments, and see how a loan is paid off month by month. The calculator generates a full amortization schedule table, a summary bar with key metrics, and two charts (payment breakdown + balance over time).

**Feature route:** `/understanding-amortization`

---

## 2. Feature Structure

```
features/understanding-amortization/
├── understanding-amortization.ts
├── understanding-amortization.html
├── understanding-amortization.scss
├── components/
│   ├── loan-form/
│   │   ├── loan-form.ts
│   │   ├── loan-form.html
│   │   └── loan-form.scss
│   ├── summary-bar/
│   │   ├── summary-bar.ts
│   │   ├── summary-bar.html
│   │   └── summary-bar.scss
│   ├── amortization-table/
│   │   ├── amortization-table.ts
│   │   ├── amortization-table.html
│   │   └── amortization-table.scss
│   └── loan-charts/
│       ├── loan-charts.ts
│       ├── loan-charts.html
│       └── loan-charts.scss
├── services/
│   └── amortization.service.ts
├── models/
│   └── amortization.models.ts
└── utils/
    └── formatters.ts
```

---

## 3. Data Models

```typescript
interface LoanInputs {
  loanAmount: number;             // Positive number, no upper limit
  annualInterestRate: number;     // >= 0, percentage (e.g. 5 for 5%)
  loanTermYears: number;          // 1-40 years
  monthlyExtraPayment: number;    // >= 0, default 0
  oneTimeExtraPayment: number;    // >= 0, default 0
  oneTimeExtraPaymentMonth: number; // 1 to (loanTermYears * 12), default 1
}

interface Payment {
  paymentNumber: number;          // Month number (1-indexed)
  paymentAmount: number;          // The base payment for this month (may be reduced on final month)
  principal: number;              // Principal portion of payment
  interest: number;               // Interest portion of payment
  extraPayment: number | undefined; // Extra payment applied this month, if any
  totalPayment: number;           // paymentAmount + extraPayment
  remainingBalance: number;       // Balance after this month's payment (>= 0)
}

interface LoanSummary {
  monthlyPayment: number;         // Standard monthly payment (before extras)
  totalPayment: number;           // Sum of all totalPayment values in schedule
  totalInterest: number;          // Cumulative interest paid
  monthsToPayoff: number;         // Actual number of months until balance = 0
  totalSaved: number;             // Interest savings from extra payments vs. no extras
}
```

---

## 4. Calculation Logic

### 4.1 Monthly Payment Formula

```
monthlyRate = annualInterestRate / 100 / 12   (rounded to 6 decimal places)
n = loanTermYears * 12

If interestRate === 0:
  monthlyPayment = loanAmount / n
Else:
  monthlyPayment = loanAmount * (monthlyRate * (1 + monthlyRate)^n) / ((1 + monthlyRate)^n - 1)
```

### 4.2 Amortization Schedule Loop

For each month from 1 to n (or until balance <= 0):

1. **Calculate interest:** `interestPayment = balance * monthlyRate`
2. **Set payment:** `currentPayment = monthlyPayment`
3. **Calculate principal:** `principalPayment = currentPayment - interestPayment`
4. **Determine extra payment:**
   - Add `monthlyExtraPayment` if > 0
   - Add `oneTimeExtraPayment` if this is the designated month and amount > 0
5. **Final month cap (CRITICAL):** If `balance + interestPayment <= currentPayment`, then:
   - `currentPayment = balance + interestPayment`
   - `principalPayment = balance`
   - `extraPayment = 0`
6. **Extra payment cap:** Else if `principalPayment + extraPayment > balance`, then:
   - `extraPayment = balance - principalPayment`
7. **Apply payments:**
   - `balance -= principalPayment`
   - `balance -= extraPayment` (if any)
8. **Accumulate:** `totalInterest += interestPayment`
9. **Record:** Push `Payment` to schedule with `remainingBalance = max(0, balance)`
10. **Exit loop** if balance <= 0

### 4.3 Savings Calculation

```
originalTotalInterest = (monthlyPayment * numberOfPayments) - loanAmount
totalSaved = originalTotalInterest - actualTotalInterest
```

### 4.4 Total Payment

```
totalPayment = sum of all schedule[i].totalPayment
```

(NOT `monthlyPayment * months` -- because the final month may be a reduced payment.)

---

## 5. Input Validation

All validation runs before calculation. Display one error message at a time.

| Field | Rule | Error Message |
|-------|------|---------------|
| Loan Amount | Must be > 0 | "Please enter a positive loan amount" |
| Interest Rate | Must be >= 0 | "Please enter a positive interest rate" |
| Loan Term | Must be 1-40 years | "Loan term must be between 1 and 40 years" |
| Monthly Extra Payment | Must be >= 0 | "Monthly extra payment cannot be negative" |
| One-time Extra Payment | Must be >= 0 | "One-time extra payment cannot be negative" |
| One-time Payment Month | Must be 1 to (term * 12) | "One-time extra payment month must be within the loan term" |

---

## 6. UI Sections

### 6.1 Header

Use the shared `TopHeader` and `BottomHeader` components from NGPFInteractives.

**Title:** "Loan Amortization Calculator"

### 6.2 Loan Form

A centered form (max-width ~600px) with a card-style container (white background, rounded corners, shadow).

**Basic Inputs:**
- **Loan Amount ($)** -- text input with live comma formatting (strips non-numeric chars on input, displays with locale commas)
- **Annual Interest Rate (%)** -- number input, step 0.1
- **Loan Term (Years)** -- number input

**Extra Payments Section** (visually grouped with a light blue background):
- Section heading: "Extra Payments"
- **Monthly Extra Payment ($)** -- number input, min 0
- **One-time Extra Payment ($)** -- number input, min 0
- **Apply One-time Payment in Month** -- number input, min 1, max (term * 12). **Only visible when one-time extra payment > 0.**

**Error Display:** Below inputs, orange background with white text.

**Calculate Button:** Full-width, blue, uppercase, disabled while calculating (text changes to "Calculating...").

**Form Labels:** Bold, uppercase, navy blue.

### 6.3 Form Toggle

After calculation, a toggle button appears:
- Text: "Hide Calculator" / "Show Calculator"
- **The form auto-collapses after a successful calculation.**
- Collapse animation: CSS transition on max-height (1000px -> 0) and opacity (1 -> 0), 0.3s ease.

### 6.4 Summary Bar

Displayed only after calculation. A horizontal bar with 4 metric cards:

| Metric | Format |
|--------|--------|
| Monthly Payment | `$X,XXX.XX` |
| Total Interest | `$X,XXX.XX` |
| Total Payment | `$X,XXX.XX` |
| Months to Payoff | integer |

- Flex row on desktop, column stack on mobile (< 768px).
- Each item: centered text, bold label (uppercase, small font), large value (royal blue).

### 6.5 Amortization Schedule Table

Displayed only after calculation. Card container with heading "Amortization Schedule".

**7 Columns:**

| Column | Format |
|--------|--------|
| Month | integer |
| Payment Amount | `$X,XXX.XX` |
| Principal | `$X,XXX.XX` |
| Interest | `$X,XXX.XX` |
| Extra Payment | `$X,XXX.XX` (show `$0.00` if none) |
| Total Payment | `$X,XXX.XX` |
| Remaining Balance | `$X,XXX.XX` |

**Pagination:**
- Show 24 rows initially.
- "Show More Payments" button loads 24 more rows at a time.
- Button hidden when all rows are displayed.

**Table Styling:**
- Right-aligned numeric cells.
- Sticky header row.
- Row hover highlight.
- Horizontal scroll on mobile (`overflow-x: auto`).
- Reduced font/padding at < 768px.

### 6.6 Charts (D3.js)

Two charts, rendered with D3 (not Chart.js -- NGPFInteractives uses D3):

#### Payment Breakdown -- Doughnut/Donut Chart
- Two segments: **Principal** (blue) and **Interest** (red)
- Data: `[loanAmount, totalInterest]`
- Title: "Payment Breakdown"
- Responsive

#### Balance Over Time -- Line Chart
- X-axis: Month number (from schedule)
- Y-axis: Remaining balance (starts at 0)
- Single line, blue stroke
- Title: "Balance Over Time"
- Responsive

### 6.7 CSV Export

A function (can be triggered by a button) that exports the full amortization schedule as a CSV file.

**CSV Columns:** `Payment #, Payment Amount, Principal, Interest, Extra Payment, Total Payment, Remaining Balance`

**Behavior:**
- Creates a Blob with `text/csv` MIME type.
- Triggers download with filename: `amortization_schedule_{timestamp}.csv`
- All dollar amounts formatted to 2 decimal places.
- Extra payment defaults to `0.00` if undefined.

---

## 7. State Management

Use Angular Signals for all reactive state.

**Input signals:**
```typescript
loanAmount = signal(0);
interestRate = signal(0);
loanTerm = signal(0);
monthlyExtraPayment = signal(0);
oneTimeExtraPayment = signal(0);
oneTimeExtraPaymentMonth = signal(1);
```

**Derived/computed state:**
```typescript
amortizationSchedule = signal<Payment[]>([]);
loanSummary = signal<LoanSummary | null>(null);
```

**UI state:**
```typescript
isCalculating = signal(false);
hasError = signal(false);
errorMessage = signal('');
isFormVisible = signal(true);
displayedRows = signal(24);
```

**Computed:**
```typescript
hasResults = computed(() => this.amortizationSchedule().length > 0);
visibleRows = computed(() => this.amortizationSchedule().slice(0, this.displayedRows()));
hasMoreRows = computed(() => this.displayedRows() < this.amortizationSchedule().length);
formattedLoanAmount = computed(() => this.loanAmount().toLocaleString());
```

---

## 8. Component Communication

```
UnderstandingAmortization (main)
├── TopHeader (shared)
├── LoanForm
│   - Inputs: isFormVisible, isCalculating, hasError, errorMessage
│   - Outputs: calculate(LoanInputs), toggleForm()
├── SummaryBar
│   - Inputs: loanSummary
├── AmortizationTable
│   - Inputs: visibleRows, hasMoreRows
│   - Outputs: loadMore()
├── LoanCharts
│   - Inputs: amortizationSchedule, loanAmount, totalInterest
└── BottomHeader (shared)
```

---

## 9. Service API

```typescript
@Injectable()
export class AmortizationService {

  /** Standard monthly payment (before extras) */
  calculateMonthlyPayment(
    principal: number,
    monthlyRate: number,
    numberOfPayments: number
  ): number;

  /** Full amortization schedule with extra payment support */
  generateSchedule(inputs: LoanInputs): Payment[];

  /** Summary metrics including savings from extra payments */
  calculateSummary(inputs: LoanInputs, schedule: Payment[]): LoanSummary;
}
```

Provide at the feature component level (`providers: [AmortizationService]`).

---

## 10. Loan Amount Formatting

The loan amount input requires special handling:

- **On input:** Strip all non-numeric characters, store as a raw number.
- **On display:** Format with locale commas (e.g. `10,000`).
- Use a text input (not number) to support comma-formatted display.

---

## 11. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| > 768px | Form centered at 600px max-width. Summary bar horizontal. Full table font. |
| <= 768px | Form padding reduced. Summary bar stacks vertically. Table font/padding reduced. Table scrolls horizontally. |

---

## 12. Accessibility

- All form inputs have associated `<label>` elements.
- Error messages announced to screen readers (use `aria-live="polite"` on error container).
- Calculate button has disabled state with visual indicator.
- Table uses proper `<thead>`/`<tbody>` semantics.
- Charts should include `aria-label` descriptions summarizing the data.
- Keyboard navigation: all interactive elements reachable via Tab.

---

## 13. Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| 0% interest rate | Monthly payment = loanAmount / months. No interest column values. |
| Extra payment exceeds remaining balance | Cap extra payment to remaining balance. Loan pays off early. |
| One-time extra payment in month 1 | Applied in the very first month. |
| Final month payment | Payment capped at (remaining balance + that month's interest). Principal = remaining balance exactly. |
| Very large loan + very small rate | Schedule generates up to 480 months (40 years). Pagination handles display. |
| Extra payments reduce loan to 0 mid-term | Loop exits when balance <= 0. Schedule is shorter than original term. |

---

## 14. Default Values

| Field | Default |
|-------|---------|
| Loan Amount | 0 |
| Interest Rate | 0 |
| Loan Term | 0 |
| Monthly Extra Payment | 0 |
| One-time Extra Payment | 0 |
| One-time Payment Month | 1 |
| Displayed Rows | 24 |
| Form Visible | true |

---

## 15. Styling Notes (for NGPFInteractives)

- Use the global NGPF design system CSS variables (`--color-royal-blue`, `--font-heading`, `--spacing-md`, etc.) defined in `src/styles.scss`.
- No custom theme toggle needed -- the project handles theming globally.
- Form card: white background, `--border-radius-lg`, `--shadow-md`.
- Buttons: use `button.primary` pattern from global styles.
- Extra payments section: `--color-soft-blue` background.
- Error messages: `--color-orange` background, white text.
- Summary values: `--color-royal-blue`, bold, `--font-size-h3`.
- Table header: `--color-soft-blue` background, sticky.
- Charts: use D3.js with NGPF brand colors (blue: `--color-bright-blue` / `--color-royal-blue`, red for interest).

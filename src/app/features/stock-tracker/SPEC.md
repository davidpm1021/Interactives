# 5 Stocks on Your Birthday -- Interactive Spec

## Overview

Build a **5 Stocks on Your Birthday** interactive for the NGPF Interactives Angular 21 monorepo that faithfully recreates the existing spreadsheet-based NGPF project as a self-contained web tool. The original activity has students manually looking up historical stock prices on Yahoo Finance, entering them into a Google Sheets tracker, building comparison charts by hand, and writing a report. This interactive automates the data fetching and chart generation so students spend their time on company selection, analysis, and reflection rather than spreadsheet mechanics.

**The premise:** Your wealthy grandma offers to buy you 100 shares of one stock on your 10th birthday. Pick 5 companies, track how each would have performed, compare them, and decide which one you'd choose.

This replaces:

- **PROJECT: 5 Stocks on Your Birthday** (Unit 8: Investing -- currently a Google Doc + Google Sheets workflow)
- **Stock Tracker spreadsheet** (companion Google Sheet with per-company tabs and a comparison tab)
- **Stock Report template** (companion Google Doc with structured analysis prompts)

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
npm run feature stock-birthday
```

This creates `src/app/features/stock-birthday/` with `.ts`, `.html`, and `.scss` files, adds the route to `app.routes.ts`, and adds a nav card to the home page.

---

## 2. Learning Objectives

These match the original activity's goals:

1. **Research publicly traded companies** and identify their stock ticker symbols
2. **Read and interpret historical stock price data** (specifically Adjusted Close prices)
3. **Calculate Return on Investment (ROI)** for a stock held over multiple years
4. **Compare investment performance** across multiple companies using line charts and ROI
5. **Analyze which factors contributed** to a stock's performance and articulate investment lessons learned

---

## 3. User Flow

The interactive follows the same four-part structure as the original activity, presented as a linear step-by-step flow. Students progress through each part in order, with the ability to go back and edit previous steps.

### Part 1: Setup & Pick 5 Companies

1. Student enters their **birthday** (month, day, year) via a date picker
2. The app calculates their **10th birthday** and displays it
3. If the 10th birthday falls on a weekend or market holiday, the app notes it will use the closest prior trading day
4. Student enters **5 companies**, one at a time:
   - Type a company name or ticker symbol into a search/autocomplete field
   - The app validates the ticker exists and was publicly traded on the student's 10th birthday
   - Display: company name, ticker symbol, and the Adj. Close price on (or nearest to) the 10th birthday
   - If the company did not exist as a public stock on that date, show an error and ask them to pick another
5. A summary table shows all 5 picks with their birthday prices
6. Student clicks **"Track My Stocks"** to proceed

### Part 2: Track the Prices

1. The app automatically fetches the **Adj. Close price on the student's birthday (or nearest prior trading day) for every year** from age 10 to the current year
2. Display a table for each company showing: Year, Age, Date Used, Adj. Close Price, and Value of 100 Shares. Each table has a small download icon button that saves it as a PNG image.
3. Also display a **combined data table** with all 5 companies side by side (rows = years, columns = companies) showing the value of 100 shares each year. This table also has a download button.
4. All data is fetched automatically; the student does not manually enter any prices
5. Student clicks **"Compare My Stocks"** to proceed

### Part 3: Compare the Stocks

1. **Multi-line chart**: All 5 stocks plotted on the same chart, x-axis = year (or age), y-axis = value of 100 shares. Each stock gets a distinct color. Hovering/tapping a point shows the exact value and date. Download-as-PNG button in the top-right corner.
2. **ROI summary table**: For each stock -- Company Name, Ticker, Price on 10th Birthday, Price Today (most recent available), Total Value of 100 Shares Today, ROI (%). Download-as-PNG button.
3. **ROI bar chart**: Horizontal or vertical bar chart comparing ROI % across all 5 stocks. Download-as-PNG button in the top-right corner.
4. **Highlight callouts**: The app automatically identifies and labels:
   - Best overall ROI
   - Highest current value
   - Most volatile (largest peak-to-trough swing)
5. Student clicks **"Write My Report"** to proceed

### Part 4: Stock Report

1. A structured report form with the following sections (mirroring the original template):
   - **Overview table** (auto-populated from Part 3 data, read-only)
   - **Best performer analysis**: "Which stock had the best ROI? Why do you think it performed so well?" (text area)
   - **Most valuable stock**: "Which stock is worth the most today? Is this the same as the best ROI? Why or why not?" (text area)
   - **Biggest surprise**: "Which stock's performance surprised you the most? Explain." (text area)
   - **Lessons learned**: "What did this project teach you about investing?" (text area)
   - The multi-line chart and ROI bar chart from Part 3 are embedded in the report view
2. **Export options**:
   - **Print/PDF**: Renders the full report (charts + tables + written responses) in a print-friendly layout
   - **Copy text**: Copies the written responses to clipboard (for pasting into a Google Doc or LMS submission)
   - **Download images**: Each chart and table in the report view retains its download-as-PNG button from Part 3, so students can save individual visuals to include in a separately written report (e.g., a Google Doc or Google Slides submission)

---

## 4. Data Architecture

### 4.1 Stock Price Data Source

**Primary approach: Lightweight proxy server wrapping Yahoo Finance's chart API.**

Yahoo Finance does not support CORS for direct browser requests, so a thin proxy is required. The proxy should be as simple as possible: it receives a ticker and date range, forwards the request to Yahoo Finance's `query1.finance.yahoo.com/v8/finance/chart/` endpoint, and returns the JSON response with appropriate CORS headers.

#### Proxy Implementation Options (pick one during build):

**Option A -- Cloudflare Worker (recommended)**

- Zero cold start, free tier handles classroom-scale traffic easily
- Deploy once, virtually no maintenance
- URL pattern: `https://stock-proxy.ngpf.workers.dev/chart/{TICKER}?period1={UNIX}&period2={UNIX}&interval=1mo`

**Option B -- Netlify/Vercel Serverless Function**

- If NGPF already deploys on one of these platforms, co-locate the function
- Same request forwarding pattern

**Option C -- Simple Express proxy in the Angular project's dev server**

- Only for local development/testing
- Not suitable for production classroom use

#### Fallback: Manual CSV Upload

If the proxy is unavailable or a teacher wants offline functionality, provide a fallback where students can download a CSV from Yahoo Finance's historical data page and upload it into the app. The app parses the CSV and populates the same data structures. This mirrors the original activity's workflow (students go to Yahoo Finance manually) and ensures the tool is never fully blocked by API issues.

### 4.2 Yahoo Finance Chart API Details

**Endpoint:** `https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}`

**Key parameters:**

- `period1`: Unix timestamp for start date
- `period2`: Unix timestamp for end date
- `interval`: `1d` for daily data (use this to find the nearest trading day to each birthday)
- `events`: `div,splits` (optional, for showing stock split history)

**Response structure (relevant fields):**

```json
{
  "chart": {
    "result": [{
      "meta": {
        "currency": "USD",
        "symbol": "AAPL",
        "regularMarketPrice": 227.48,
        "shortName": "Apple Inc."
      },
      "timestamp": [1234567890, ...],
      "indicators": {
        "quote": [{
          "close": [12.34, ...],
          "open": [...],
          "high": [...],
          "low": [...],
          "volume": [...]
        }],
        "adjclose": [{
          "adjclose": [11.98, ...]
        }]
      }
    }]
  }
}
```

**Important notes for the developer:**

- Always use `adjclose` (adjusted close), not `close`. Adjusted close accounts for stock splits and dividends, which is essential for accurate historical comparison.
- Yahoo Finance timestamps are in Unix seconds, not milliseconds.
- If a requested date falls on a weekend or holiday, Yahoo returns the nearest available trading day's data, but the developer should verify this and use the closest **prior** trading day (not the next one).
- Rate limiting: Yahoo may throttle requests. The proxy should implement basic caching (cache responses for 24 hours since historical data doesn't change) and the Angular app should batch requests where possible.

### 4.3 Ticker Search / Autocomplete

For the company search field in Part 1, use Yahoo Finance's search/autocomplete endpoint:

**Endpoint:** `https://query2.finance.yahoo.com/v1/finance/search?q={QUERY}&quotesCount=6&newsCount=0`

This returns matching tickers with company names. Filter results to show only equities (`quoteType: "EQUITY"`), excluding mutual funds, ETFs, futures, etc. This endpoint also needs to go through the CORS proxy.

### 4.4 Core Data Models

```typescript
// Student's birthday and derived dates
interface StudentProfile {
  birthday: Date; // Full birthday
  tenthBirthday: Date; // Computed: birthday + 10 years
  tradingDayOnTenth: Date; // Nearest prior trading day to 10th birthday
  currentAge: number; // Computed from birthday
}

// A single stock pick
interface StockPick {
  companyName: string; // e.g., "Apple Inc."
  ticker: string; // e.g., "AAPL"
  priceOnBirthday: number; // Adj. Close on (or nearest to) 10th birthday
  dateUsed: Date; // Actual trading day used
  sharesOwned: number; // Always 100
  annualData: AnnualDataPoint[];
  currentPrice: number; // Most recent Adj. Close
  currentValue: number; // currentPrice * 100
  roi: number; // ((currentPrice - priceOnBirthday) / priceOnBirthday) * 100
  totalReturn: number; // currentValue - (priceOnBirthday * 100)
}

// One year's snapshot for a stock
interface AnnualDataPoint {
  year: number; // Calendar year
  age: number; // Student's age that year
  dateUsed: Date; // Actual trading day used (nearest to birthday)
  adjClose: number; // Adjusted close price
  valueOf100Shares: number; // adjClose * 100
  yearOverYearChange: number; // % change from previous year
}

// The student's written report
interface StockReport {
  bestPerformerAnalysis: string;
  mostValuableAnalysis: string;
  biggestSurprise: string;
  lessonsLearned: string;
  generatedAt: Date;
}

// Full application state
interface AppState {
  currentStep: 'setup' | 'track' | 'compare' | 'report';
  profile: StudentProfile | null;
  picks: StockPick[]; // Length 0-5
  report: StockReport;
  isLoading: boolean;
  errors: string[];
}
```

---

## 5. Component Architecture

### 5.1 Component Tree

```
StockBirthdayComponent (host, manages state + routing between steps)
├── StepIndicatorComponent (progress bar showing Parts 1-4)
├── SetupComponent (Part 1)
│   ├── BirthdayInputComponent (date picker + 10th birthday display)
│   └── StockPickerComponent (x5, search + validate + display)
├── TrackComponent (Part 2)
│   ├── StockTableComponent (per-company annual data table)
│   └── CombinedTableComponent (all 5 side-by-side)
├── CompareComponent (Part 3)
│   ├── MultiLineChartComponent (all 5 stocks over time)
│   ├── RoiBarChartComponent (ROI comparison)
│   ├── RoiSummaryTableComponent (overview table)
│   └── CalloutCardsComponent (best ROI, highest value, most volatile)
└── ReportComponent (Part 4)
    ├── ReportOverviewTableComponent (read-only, auto-populated)
    ├── ReportChartsComponent (embedded charts from Part 3)
    ├── ReflectionFormComponent (text areas for analysis)
    └── ExportButtonsComponent (print/PDF, copy text)
```

### 5.2 Shared / Reusable Components

- **StepIndicatorComponent**: Horizontal progress bar with 4 labeled steps. Clickable to navigate back to completed steps. Current step is highlighted; future steps are disabled.
- **StockPickerComponent**: Reusable search + validate + display widget. Emits a `StockPick` on successful selection. Shows loading state while fetching price data. Shows error state if ticker is invalid or not available on the target date.
- **MultiLineChartComponent**: Accepts an array of `StockPick[]` and renders a multi-series line chart. Configurable for showing value of 100 shares (Part 3) or raw price. Supports hover tooltips. Includes a small download icon button in the top-right corner that saves the chart as a PNG via `ExportService.downloadChartAsImage()`.
- **RoiBarChartComponent**: Accepts `StockPick[]` and renders a bar chart of ROI percentages. Highlights the highest bar. Includes the same download icon button as MultiLineChartComponent.
- **DownloadButtonComponent**: Small icon button (download/arrow-down icon) positioned in the top-right corner of its parent container. Accepts an `exportType` input (`'chart'` or `'table'`) and a reference to the target element. On click, calls the appropriate `ExportService` method. Shows a brief "Saved!" toast or checkmark animation after download completes. The button should be visually subtle (muted gray, small) so it doesn't compete with the data content, but clearly discoverable on hover.

---

## 6. Services

### 6.1 StockDataService

Handles all communication with the proxy/Yahoo Finance API.

```typescript
@Injectable({ providedIn: 'root' })
export class StockDataService {
  private proxyBaseUrl = environment.stockProxyUrl;

  // Search for tickers by company name or symbol
  searchTickers(query: string): Observable<TickerSearchResult[]>;

  // Get the Adj. Close price on or nearest to a specific date
  getPriceOnDate(ticker: string, targetDate: Date): Observable<PriceOnDateResult>;

  // Get annual Adj. Close prices for a ticker on the student's birthday
  // each year from startYear to current year
  getAnnualBirthdayPrices(
    ticker: string,
    birthdayMonth: number,
    birthdayDay: number,
    startYear: number,
  ): Observable<AnnualDataPoint[]>;

  // Validate that a ticker existed as a public equity on a given date
  validateTickerOnDate(ticker: string, date: Date): Observable<boolean>;
}
```

**Implementation notes:**

- `getAnnualBirthdayPrices` should fetch the full date range in a single API call using `interval=1d`, then extract the data points nearest to each birthday from the response. Do NOT make a separate API call per year.
- Implement in-memory caching: if the same ticker + date range has been fetched already in this session, return the cached result. This prevents redundant calls when students navigate back and forth between steps.
- All methods should return user-friendly error messages (not raw API errors). Common cases: ticker not found, ticker not public on that date, network error, rate limited.

### 6.2 CalculationService

Pure calculation logic, no API calls.

```typescript
@Injectable({ providedIn: 'root' })
export class CalculationService {
  // Calculate ROI percentage
  calculateROI(purchasePrice: number, currentPrice: number): number;

  // Calculate total return in dollars
  calculateTotalReturn(purchasePrice: number, currentPrice: number, shares: number): number;

  // Calculate year-over-year percentage change
  calculateYoYChange(previousPrice: number, currentPrice: number): number;

  // Find the nearest prior trading day to a target date
  // (given an array of available timestamps from the API response)
  findNearestPriorTradingDay(targetDate: Date, availableTimestamps: number[]): Date;

  // Identify the most volatile stock (largest peak-to-trough swing)
  findMostVolatile(picks: StockPick[]): StockPick;

  // Identify best ROI
  findBestROI(picks: StockPick[]): StockPick;

  // Identify highest current value
  findHighestValue(picks: StockPick[]): StockPick;
}
```

### 6.3 ExportService

Handles print, copy, and image download functionality.

```typescript
@Injectable({ providedIn: 'root' })
export class ExportService {
  // Trigger browser print with print-specific CSS
  printReport(): void;

  // Copy the student's written responses as formatted text
  copyReportText(report: StockReport, picks: StockPick[]): void;

  // Download a Chart.js canvas as a PNG image
  // Uses chart.toBase64Image() to get the chart content,
  // then triggers a browser download with the given filename
  downloadChartAsImage(chart: Chart, filename: string): void;

  // Download an HTML table element as a PNG image
  // Uses html2canvas to render the table to a canvas,
  // then triggers a browser download with the given filename
  downloadTableAsImage(tableElement: HTMLElement, filename: string): void;
}
```

**Image download implementation notes:**

- For charts, Chart.js provides `toBase64Image()` natively, so no extra library is needed. Create a temporary `<a>` element with `href` set to the base64 data and `download` set to the filename, then programmatically click it.
- For tables, use **html2canvas** (add as a dependency) to render the DOM element to a `<canvas>`, then convert to PNG via `canvas.toDataURL('image/png')` and trigger the same download pattern.
- Filenames should be descriptive and include the student's context, e.g., `stock-comparison-chart.png`, `roi-bar-chart.png`, `annual-prices-AAPL.png`, `roi-summary-table.png`.
- Downloaded images should have a white background (not transparent) so they paste cleanly into Google Docs or other report tools.
- For html2canvas table rendering, apply a small amount of padding around the table so the image doesn't crop tightly against the edges.

---

## 7. Chart Specifications

Use **Chart.js** for all charts (consistent with the rest of the NGPF interactives project).

### 7.1 Multi-Line Stock Comparison Chart

- **Type:** Line chart
- **X-axis:** Year (or toggle to show Age). Labels: "2015", "2016", ... or "Age 10", "Age 11", ...
- **Y-axis:** Value of 100 Shares ($). Formatted as currency.
- **Series:** One line per stock (5 total). Each line gets a distinct color from a predefined palette.
- **Legend:** Below the chart, showing company name + ticker + line color. Clickable to toggle visibility of each line.
- **Tooltip:** On hover/tap, show: Company Name, Date, Adj. Close Price, Value of 100 Shares, YoY Change %
- **Responsive:** Fills container width. On mobile, legend moves below chart and tooltip triggers on tap.
- **Color palette:** Use 5 visually distinct, accessible colors. Suggested: `#2563EB` (blue), `#DC2626` (red), `#059669` (green), `#D97706` (amber), `#7C3AED` (purple). Ensure sufficient contrast against white background and between each other.

### 7.2 ROI Bar Chart

- **Type:** Horizontal bar chart
- **X-axis:** ROI %
- **Y-axis:** Company names (ticker in parentheses)
- **Bars:** Colored to match the line chart colors for each company
- **Labels:** ROI % displayed at the end of each bar
- **Highlight:** The best-performing bar gets a subtle highlight or border treatment
- **Negative ROI:** If any stock lost money, the bar extends left of the zero line in a muted/desaturated version of its color

### 7.3 Common Chart Config

```typescript
const STOCK_COLORS = ['#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED'];

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 16,
        font: { size: 13 },
      },
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
      },
    },
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false,
  },
};
```

---

## 8. Validation & Error Handling

### 8.1 Birthday Validation

- Birthday must result in a 10th birthday that is at least 1 full year in the past (so there's meaningful data to track)
- Birthday must result in a 10th birthday no earlier than ~1970 (Yahoo Finance data reliability drops before this)
- If invalid, display a clear message explaining why

### 8.2 Stock Picker Validation

- Ticker must be a valid, currently active US equity
- Ticker must have been publicly traded on the student's 10th birthday (check that historical data exists for that date)
- No duplicate tickers (can't pick the same company twice)
- Search field should debounce input (300ms) before hitting the autocomplete API
- Show a clear error if the company went public after the student's 10th birthday (e.g., "Meta went public in 2012, but your 10th birthday was in 2008")

### 8.3 Data Fetching Errors

- If the proxy is unreachable, show: "We're having trouble connecting to our stock data service. You can try again, or download the data manually from Yahoo Finance and upload it here." (with a link to the fallback CSV upload)
- If Yahoo Finance returns no data for a valid ticker on a specific date, show: "No trading data available for [TICKER] on [DATE]. This may mean the stock hadn't gone public yet or was temporarily delisted."
- If rate limited, show: "We've made too many requests. Please wait a moment and try again."

### 8.4 Network Resilience

- Retry failed API requests once after a 2-second delay
- Show a loading spinner with the company name while fetching ("Looking up Apple Inc. prices...")
- If a single stock fails to load in Part 2 but others succeed, show the successful ones and offer a retry button for the failed one rather than blocking the entire flow

---

## 9. Formatting Utilities

```typescript
// Format a number as USD currency: $1,234.56
function formatCurrency(value: number): string;

// Format a number as percentage with sign: +45.2% or -12.8%
function formatPercent(value: number, decimals: number = 1): string;

// Format a date as "Mar 15, 2018"
function formatDate(date: Date): string;

// Format a large currency value compactly: $12.3K or $1.2M
function formatCurrencyCompact(value: number): string;

// Pluralize a word: "year" / "years"
function pluralize(count: number, singular: string, plural?: string): string;
```

---

## 10. Responsive Design

### Desktop (>= 1024px)

- Parts 1-2: Single column, centered, max-width 800px
- Part 3: Charts and tables fill available width, up to 1200px
- Part 4: Two-column layout for report (charts on left, text areas on right)

### Tablet (768px - 1023px)

- Same as desktop but charts and report go single-column

### Mobile (< 768px)

- All content single-column
- Stock picker search field fills width
- Charts are horizontally scrollable if needed (with scroll hint)
- Tables switch to a card-based layout (one card per year per stock) instead of wide tables
- Step indicator becomes a compact "Step 2 of 4" text instead of a full horizontal bar
- Touch targets minimum 44px

---

## 11. Accessibility

- All form inputs have associated `<label>` elements
- Charts include `aria-label` descriptions summarizing the data (e.g., "Line chart showing the value of 100 shares of 5 stocks from 2010 to 2025. Apple performed best with an ROI of 1,245%.")
- Tab order follows logical flow: step indicator, then main content, then navigation buttons
- Color is not the only differentiator for chart lines. Use distinct line styles (solid, dashed, dotted) in addition to color, or ensure the legend is clear enough.
- All interactive elements (buttons, date picker, search field) are keyboard accessible
- Loading states are announced to screen readers via `aria-live="polite"` regions
- Print/export buttons have descriptive labels ("Print full report as PDF", "Copy written responses to clipboard")
- Support `prefers-reduced-motion`: disable chart animations if the user has requested reduced motion

---

## 12. State Management

Use Angular signals for reactive state management. The host `StockBirthdayComponent` owns the state and passes slices to child components via inputs.

```typescript
// In StockBirthdayComponent
currentStep = signal<'setup' | 'track' | 'compare' | 'report'>('setup');
profile = signal<StudentProfile | null>(null);
picks = signal<StockPick[]>([]);
report = signal<StockReport>({
  bestPerformerAnalysis: '',
  mostValuableAnalysis: '',
  biggestSurprise: '',
  lessonsLearned: '',
  generatedAt: new Date(),
});
isLoading = signal<boolean>(false);

// Computed signals
allPicksComplete = computed(() => this.picks().length === 5);
bestRoiPick = computed(() => this.calculationService.findBestROI(this.picks()));
highestValuePick = computed(() => this.calculationService.findHighestValue(this.picks()));
mostVolatilePick = computed(() => this.calculationService.findMostVolatile(this.picks()));
```

### Navigation Guards

- Cannot advance to Part 2 without a valid birthday and exactly 5 stock picks
- Cannot advance to Part 3 without all 5 stocks having loaded annual data
- Cannot advance to Part 4 without Part 3 being viewed (no skipping)
- CAN go back to any previous step and edit (e.g., swap out a stock pick)
- Going back to Part 1 and changing a stock pick invalidates Parts 2-4 for that stock (re-fetch required)

---

## 13. Environment Configuration

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  stockProxyUrl: 'http://localhost:3001/api', // Local Express proxy for dev
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  stockProxyUrl: 'https://stock-proxy.ngpf.workers.dev', // Cloudflare Worker
};
```

---

## 14. Proxy Server Specification

The proxy is intentionally minimal. Its only job is to forward requests to Yahoo Finance with CORS headers.

### Endpoints

**GET `/api/chart/:ticker`**

- Forwards to `https://query1.finance.yahoo.com/v8/finance/chart/:ticker`
- Passes through all query parameters (`period1`, `period2`, `interval`, `events`)
- Returns the Yahoo Finance JSON response as-is
- Adds `Access-Control-Allow-Origin: *` header

**GET `/api/search`**

- Forwards to `https://query2.finance.yahoo.com/v1/finance/search`
- Passes through the `q` parameter
- Adds `quotesCount=8&newsCount=0&enableFuzzyQuery=true` if not specified
- Returns the Yahoo Finance JSON response as-is
- Adds `Access-Control-Allow-Origin: *` header

### Caching

- Cache `chart` responses for 24 hours (historical data doesn't change)
- Cache `search` responses for 1 hour
- Use the Cloudflare Worker KV store (if using Option A) or in-memory cache (if using Express)

### Rate Limiting

- Limit each client IP to 60 requests per minute (more than enough for one student session)
- Return HTTP 429 with a `Retry-After` header if exceeded

### Security

- Allow requests only from known origins (`*.ngpf.org`, `localhost:4200`)
- Do not expose the proxy to arbitrary cross-origin usage
- Do not store or log any personally identifiable information from requests

---

## 15. CSV Fallback Upload Specification

For offline or backup usage, the app accepts CSV files exported from Yahoo Finance's historical data download feature.

### Expected CSV Format

```csv
Date,Open,High,Low,Close,Adj Close,Volume
2024-03-15,171.17,172.62,170.29,172.62,172.33,65201800
```

### Upload Flow

1. In Part 1, next to each stock picker, show a small "or upload CSV" link
2. Clicking it opens a file input that accepts `.csv` files
3. The app parses the CSV, extracts the `Date` and `Adj Close` columns
4. Populates the same `AnnualDataPoint[]` structure as the API would
5. Displays a note: "Data loaded from uploaded file. Prices may not reflect the most recent trading day."

### Parser Rules

- Skip the header row
- Parse dates as `YYYY-MM-DD`
- Use the `Adj Close` column (column index 5, zero-indexed)
- Reject files that don't match the expected column structure
- Show a helpful error if the CSV appears to be in a different format

---

## 16. Print / PDF Layout

When the student clicks "Print Report", apply a print-specific stylesheet that:

1. Hides the step indicator, navigation buttons, and any interactive controls
2. Renders the report as a clean, single-column document
3. Includes at the top:
   - Student name (optional text field in the report) and date
   - "5 Stocks on Your Birthday -- Investment Report"
   - "Birthday: [date] | 10th Birthday: [date]"
4. Overview table (all 5 stocks with prices and ROI)
5. Multi-line chart (rendered as a static image via Chart.js `toBase64Image()`)
6. ROI bar chart (same treatment)
7. Written analysis sections with headers
8. Page breaks between major sections
9. NGPF branding/attribution in footer

---

## 17. Implementation Order

Build in this sequence to have a working (if incomplete) tool at each stage:

1. **Scaffold + data models** -- `npm run feature stock-birthday`, create all TypeScript interfaces, set up the host component with step navigation
2. **Proxy server** -- Set up the Cloudflare Worker (or Express dev proxy) with the two endpoints, test with curl
3. **StockDataService** -- Implement all API methods with caching and error handling, write unit tests against mocked responses
4. **Part 1: Setup** -- Birthday input, stock picker with autocomplete, validation, summary table
5. **Part 2: Track** -- Fetch annual data on "Track My Stocks" click, display per-company and combined tables
6. **Part 3: Compare** -- Multi-line chart, ROI bar chart, summary table, callout cards
7. **Part 4: Report** -- Reflection form, embedded charts, export functionality
8. **CSV fallback** -- Upload parsing and integration
9. **Responsive pass** -- Mobile layout, touch targets, scrollable charts
10. **Accessibility pass** -- Labels, ARIA, keyboard nav, reduced motion
11. **Print stylesheet** -- Print-specific layout and chart image export
12. **Polish** -- Loading animations, error state refinement, final QA

---

## 18. Testing Checklist

### Part 1: Setup

- [ ] Birthday date picker accepts valid dates and rejects future dates / too-old dates
- [ ] 10th birthday is calculated correctly, including leap year birthdays
- [ ] Stock search returns relevant results and filters to equities only
- [ ] Selecting a stock fetches and displays the price on the 10th birthday
- [ ] Stocks that weren't public on the 10th birthday show a clear error
- [ ] Duplicate tickers are rejected
- [ ] Summary table shows all 5 picks correctly

### Part 2: Track

- [ ] Annual data is fetched for all 5 stocks in a single pass
- [ ] Prices on weekends/holidays correctly resolve to the nearest prior trading day
- [ ] Per-company tables show correct year, age, date, price, and value
- [ ] Combined table aligns all 5 stocks by year
- [ ] Loading states display properly for each stock
- [ ] A failed fetch for one stock doesn't block the others
- [ ] Download-as-PNG button on per-company tables and combined table saves valid PNGs

### Part 3: Compare

- [ ] Multi-line chart renders all 5 lines with correct data
- [ ] Chart legend is interactive (click to hide/show lines)
- [ ] Tooltip shows correct values on hover
- [ ] ROI bar chart correctly calculates and displays all 5 ROIs
- [ ] Negative ROI displays correctly (bar extends left)
- [ ] Callout cards correctly identify best ROI, highest value, most volatile
- [ ] Year/Age toggle works on the x-axis
- [ ] Download-as-PNG button on the multi-line chart saves a valid PNG with white background
- [ ] Download-as-PNG button on the ROI bar chart saves a valid PNG
- [ ] Download-as-PNG button on the ROI summary table saves a valid PNG via html2canvas

### Part 4: Report

- [ ] Overview table auto-populates from calculated data
- [ ] Text areas accept and preserve student input
- [ ] Charts are embedded and match Part 3
- [ ] Print produces a clean, well-formatted document
- [ ] Copy text captures all written responses
- [ ] Download buttons on embedded charts and tables still work in the report view
- [ ] Downloaded images are correctly sized and legible when inserted into a Google Doc

### Cross-Cutting

- [ ] Back navigation works without losing data
- [ ] Changing a stock in Part 1 correctly invalidates downstream data
- [ ] CSV upload works as a fallback for each stock
- [ ] Mobile layout is usable on a phone-sized screen
- [ ] All interactive elements are keyboard accessible
- [ ] Screen reader can navigate the full flow

---

## 19. Dependencies

- **Chart.js** (already in the project) for line and bar charts
- **html2canvas** for rendering HTML tables as downloadable PNG images
- **No additional frontend dependencies** beyond what Angular provides
- **Proxy server**: Cloudflare Worker (recommended) or Express.js for development
- **No database** -- all state is in-memory for the browser session. Students export their report; nothing is persisted server-side.

---

## 20. Future Enhancements (Out of Scope for v1)

1. **Stock split timeline** -- Show stock split events on the chart as annotated markers, with a brief explanation of what a split means
2. **Dividend tracking** -- Track and display dividend payments alongside price appreciation for a total return view
3. **Benchmark comparison** -- Add an optional S&P 500 line to the chart so students can compare their picks against the market
4. **Peer comparison mode** -- Students share their report via a URL; a class view aggregates everyone's picks and shows which stocks were most popular and which performed best
5. **"What if I bought the index instead?"** -- Automatically calculate what $X invested in an S&P 500 index fund on the same date would be worth today, displayed as a comparison line
6. **Predict-then-reveal layer** -- Before showing the data in Part 3, ask students to predict which of their 5 stocks performed best and by how much, then reveal the actual results (applies the Predict/Reveal/Reflect framework from the Compound Interest Time Machine)
7. **Save/resume** -- Persist state to localStorage so students can come back to their work across sessions
8. **Google Classroom integration** -- Submit the report directly to a Google Classroom assignment

---

_End of spec. This document provides everything needed for Claude Code to implement the 5 Stocks on Your Birthday interactive end-to-end._

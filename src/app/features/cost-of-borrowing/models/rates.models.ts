export interface RateSeries {
  id: string;
  label: string;
  fredCode: string;
  /** Full title as published on FRED. */
  fredTitle: string;
  /** Direct link to the FRED series page. */
  fredUrl: string;
  /** Who publishes the underlying data (FRED just republishes). */
  sourcePublisher: string;
  /** e.g. "Percent, Not Seasonally Adjusted". */
  units: string;
  /** e.g. "Quarterly" or "Weekly". */
  frequency: string;
  /** One-sentence plain-English explanation of what the series measures. */
  methodology: string;
  currentRate: number;
  currentAsOf: string;             // YYYY-MM date of the current data point
  twentyYearAverage: number;
  history: { year: number; value: number }[];
}

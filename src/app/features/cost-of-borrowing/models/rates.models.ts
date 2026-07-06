export interface RateSeries {
  id: string;
  label: string;
  fredCode: string;
  currentRate: number;
  currentAsOf: string;             // YYYY-MM date of the current data point
  twentyYearAverage: number;
  history: { year: number; value: number }[];
}

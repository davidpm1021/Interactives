#!/usr/bin/env node
/**
 * Cost-of-Borrowing data refresh.
 *
 * Run quarterly:
 *   node src/app/features/cost-of-borrowing/scripts/refresh-rates.mjs
 *
 * Pulls FRED CSV endpoints for four consumer credit interest rates,
 * extracts the most recent value + 20-year annualized trend, and
 * writes to data/rates.generated.ts.
 *
 * FRED is maintained by the St. Louis Fed. Public CSV endpoints,
 * no API key required.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// FRED series to pull. Each: [id, label, fredCode].
const SERIES = [
  ['credit-card', 'Credit card (avg)',      'TERMCBCCALLNS'],  // Commercial Bank Interest Rate on Credit Card Plans, quarterly
  ['personal-loan', 'Personal loan (24-mo)', 'TERMCBPER24NS'], // 24-Month Personal Loan Rate, quarterly
  ['auto-loan', 'Auto loan (48-mo)',        'TERMCBAUTO48NS'], // 48-Month New Car Loan Rate, quarterly
  ['mortgage', 'Mortgage (30-yr fixed)',    'MORTGAGE30US'],   // 30-Year Fixed Rate Mortgage, weekly
];

async function fetchRaw(url, timeoutMs = 20000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: ac.signal,
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/**
 * Parse a FRED CSV into an array of { date: YYYY-MM-DD, value: number }.
 * FRED CSVs use two columns: DATE, VALUE. Missing values show as ".".
 */
function parseFredCsv(csv) {
  const lines = csv.trim().split('\n');
  const points = [];
  for (let i = 1; i < lines.length; i++) {
    const [date, value] = lines[i].split(',');
    if (!date || !value || value === '.' || value.trim() === '.') continue;
    const num = parseFloat(value);
    if (!Number.isFinite(num)) continue;
    points.push({ date: date.trim(), value: num });
  }
  return points;
}

function pickCurrent(points) {
  // Most recent point
  return points[points.length - 1];
}

function annualize(points, yearsBack) {
  // Take yearly snapshots — pick the December (or last available) point per year.
  const yearMap = new Map();
  for (const p of points) {
    const year = parseInt(p.date.slice(0, 4), 10);
    if (Number.isNaN(year)) continue;
    // Keep the latest date per year
    const existing = yearMap.get(year);
    if (!existing || p.date > existing.date) yearMap.set(year, p);
  }
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - yearsBack;
  const out = [];
  for (const [year, p] of [...yearMap.entries()].sort((a, b) => a[0] - b[0])) {
    if (year < startYear) continue;
    out.push({ year, value: Math.round(p.value * 100) / 100 });
  }
  return out;
}

function twentyYearAvg(history) {
  if (history.length === 0) return 0;
  const sum = history.reduce((s, h) => s + h.value, 0);
  return Math.round((sum / history.length) * 100) / 100;
}

function formatRefreshDate(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function toTs(series) {
  const historyLines = series.history
    .map((h) => `    { year: ${h.year}, value: ${h.value} }`)
    .join(',\n');
  return `  {
    id: ${JSON.stringify(series.id)},
    label: ${JSON.stringify(series.label)},
    fredCode: ${JSON.stringify(series.fredCode)},
    currentRate: ${series.currentRate},
    currentAsOf: ${JSON.stringify(series.currentAsOf)},
    twentyYearAverage: ${series.twentyYearAverage},
    history: [
${historyLines}
    ],
  },`;
}

async function main() {
  console.log(`Refreshing ${SERIES.length} FRED series...\n`);
  const generated = [];

  for (const [id, label, fredCode] of SERIES) {
    process.stdout.write(`  ${id.padEnd(15)} `);
    try {
      const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${fredCode}`;
      const csv = await fetchRaw(url);
      const points = parseFredCsv(csv);
      if (points.length === 0) throw new Error('No usable data points');

      const current = pickCurrent(points);
      const history = annualize(points, 20);
      const avg = twentyYearAvg(history);

      generated.push({
        id,
        label,
        fredCode,
        currentRate: Math.round(current.value * 100) / 100,
        currentAsOf: current.date.slice(0, 7),
        twentyYearAverage: avg,
        history,
      });
      console.log(`OK (current ${current.value}% as of ${current.date}, ${history.length}y history)`);
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
    }
  }

  if (generated.length === 0) {
    console.error('\nNo series fetched. Aborting.');
    process.exit(1);
  }

  const refreshed = new Date();
  const refreshedAt = refreshed.toISOString();
  const refreshedAtDisplay = formatRefreshDate(refreshed);

  const ts = `// Auto-generated by scripts/refresh-rates.mjs. Do not edit by hand.
// Re-run quarterly:  node src/app/features/cost-of-borrowing/scripts/refresh-rates.mjs

import { RateSeries } from '../models/rates.models';

export const REFRESHED_AT = '${refreshedAt}';
export const REFRESHED_AT_DISPLAY = '${refreshedAtDisplay}';

export const RATE_SERIES: RateSeries[] = [
${generated.map(toTs).join('\n')}
];
`;

  const outPath = resolve(__dirname, '..', 'data', 'rates.generated.ts');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, ts);

  console.log(`\nWrote ${generated.length} series to:\n  ${outPath}`);
  console.log(`Refreshed at: ${refreshedAtDisplay}`);
}

main().catch((e) => {
  console.error('\nFatal error:', e);
  process.exit(1);
});

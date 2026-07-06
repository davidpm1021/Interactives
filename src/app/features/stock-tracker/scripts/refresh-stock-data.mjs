#!/usr/bin/env node
/**
 * Stock-tracker data refresh.
 *
 * Run periodically (every few months):
 *   node src/app/features/stock-tracker/scripts/refresh-stock-data.mjs
 *
 * Pulls the current S&P 500 constituent list from a public CSV,
 * combines it with the EXTRA_TICKERS list of well-known non-S&P names,
 * fetches monthly history from Yahoo Finance for each, and writes the
 * result into data/stock-prices.generated.ts.
 *
 * Runtime: ~5-10 minutes (500-ish HTTP requests, 250ms apart to be polite).
 *
 * To bias the curated list: edit EXTRA_TICKERS or SKIP_TICKERS below.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Source for the S&P 500 constituent list. CSV columns:
//   Symbol,Security,GICS Sector,GICS Sub-Industry,Headquarters Location,Date added,CIK,Founded
const SP500_CSV_URL =
  'https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv';

// Well-known non-S&P names worth including for student recognizability.
// Format: [symbol, longname, exchange].
const EXTRA_TICKERS = [
  ['RBLX', 'Roblox Corporation', 'NYQ'],
  ['SPOT', 'Spotify Technology S.A.', 'NYQ'],
  ['DUOL', 'Duolingo, Inc.', 'NMS'],
  ['SNAP', 'Snap Inc.', 'NYQ'],
  ['PINS', 'Pinterest, Inc.', 'NYQ'],
  ['U', 'Unity Software Inc.', 'NYQ'],
  ['HOOD', 'Robinhood Markets, Inc.', 'NMS'],
  ['SOFI', 'SoFi Technologies, Inc.', 'NMS'],
  ['DKNG', 'DraftKings Inc.', 'NMS'],
  ['CVNA', 'Carvana Co.', 'NYQ'],
  ['GME', 'GameStop Corp.', 'NYQ'],
  ['AMC', 'AMC Entertainment Holdings, Inc.', 'NYQ'],
  ['NTDOY', 'Nintendo Co., Ltd.', 'PNK'],
  ['BABA', 'Alibaba Group Holding Limited', 'NYQ'],
  ['LCID', 'Lucid Group, Inc.', 'NMS'],
  ['RIVN', 'Rivian Automotive, Inc.', 'NMS'],
  ['PTON', 'Peloton Interactive, Inc.', 'NMS'],
  ['WIX', 'Wix.com Ltd.', 'NMS'],
  ['ETSY', 'Etsy, Inc.', 'NMS'],
  ['ROKU', 'Roku, Inc.', 'NMS'],
  ['PYPL', 'PayPal Holdings, Inc.', 'NMS'],
];

// Tickers we want to skip even if they show up in S&P 500.
// Mostly tickers with punctuation that breaks Yahoo URLs cleanly, or
// holding companies / share classes that duplicate another listing.
const SKIP_TICKERS = new Set([
  'BRK.B', // Berkshire Hathaway B (uses period; covered by BRK-B)
  'BF.B',  // Brown-Forman B
  'GOOG',  // Alphabet Class C — duplicate of GOOGL
  'NWS',   // News Corp B — duplicate of NWSA
  'FOX',   // Fox B — duplicate of FOXA
  // Recent spin-offs / re-IPOs with too little history for the 10th-birthday activity:
  'Q',     // Qnity Electronics (2025 spin-off)
  'FDXF',  // FedEx Freight (2026 spin-off)
  'SNDK',  // SanDisk re-IPO (2025 — also has Yahoo ghost-price issue in 2025-2026)
]);

// How long to wait between Yahoo requests to be polite.
const DELAY_MS = 250;

// Each request is retried once after this delay if it fails.
const RETRY_DELAY_MS = 2000;

function fetchRaw(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0', ...headers } }, (res) => {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchRaw(res.headers.location, headers).then(resolve, reject);
          return;
        }
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} from ${url}`));
          return;
        }
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(body));
      })
      .on('error', reject);
  });
}

function fetchJson(url) {
  return fetchRaw(url).then((body) => {
    try {
      return JSON.parse(body);
    } catch (e) {
      throw new Error(`Bad JSON from ${url}: ${e.message}`);
    }
  });
}

async function fetchSp500() {
  const csv = await fetchRaw(SP500_CSV_URL);
  const lines = csv.split('\n').filter((l) => l.trim());
  // Skip header
  const tickers = [];
  for (let i = 1; i < lines.length; i++) {
    // Naive CSV split — security names with commas need handling
    const match = lines[i].match(/^([^,]+),(.*?),([^,]+),/);
    if (!match) continue;
    const symbol = match[1].trim();
    let name = match[2].trim();
    // Strip surrounding quotes from quoted CSV fields
    if (name.startsWith('"') && name.endsWith('"')) name = name.slice(1, -1);
    if (!symbol) continue;
    if (SKIP_TICKERS.has(symbol)) continue;
    tickers.push([symbol, name, 'NYQ']); // Exchange will be overwritten by Yahoo's metadata anyway
  }
  return tickers;
}

async function fetchHistory(ticker) {
  const period1 = 315532800; // 1980-01-01
  const period2 = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker,
  )}?period1=${period1}&period2=${period2}&interval=1mo`;
  return fetchJson(url);
}

function extractAnnualPrices(chartData) {
  const r = chartData?.chart?.result?.[0];
  if (!r) return null;

  const timestamps = r.timestamp ?? [];
  const adjCloses = r.indicators?.adjclose?.[0]?.adjclose ?? [];
  const meta = r.meta ?? {};

  // For each year, keep the price closest to July (mid-year canonical snapshot).
  const yearMap = {};
  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const price = adjCloses[i];
    if (price == null) continue;
    const date = new Date(ts * 1000);
    const year = date.getFullYear();
    const monthDistance = Math.abs(date.getMonth() - 6);
    if (yearMap[year] === undefined || monthDistance < yearMap[year].monthDistance) {
      yearMap[year] = { price: Math.round(price * 100) / 100, monthDistance };
    }
  }

  const priceHistory = {};
  for (const year of Object.keys(yearMap).sort()) {
    priceHistory[Number(year)] = yearMap[year].price;
  }

  if (Object.keys(priceHistory).length === 0) return null;

  return {
    priceHistory,
    currentPrice: Math.round((meta.regularMarketPrice ?? 0) * 100) / 100,
    shortName: meta.shortName,
    exchange: meta.exchangeName ?? meta.fullExchangeName,
  };
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatRefreshDate(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function priceHistoryToTs(priceHistory) {
  const entries = Object.entries(priceHistory).map(([year, price]) => `${year}: ${price}`);
  const lines = [];
  for (let i = 0; i < entries.length; i += 5) {
    lines.push(entries.slice(i, i + 5).join(', '));
  }
  return '{\n' + lines.map((line) => `      ${line},`).join('\n') + '\n    }';
}

function stockToTs(stock) {
  return `  {
    symbol: ${JSON.stringify(stock.symbol)},
    shortname: ${JSON.stringify(stock.shortname)},
    longname: ${JSON.stringify(stock.longname)},
    exchange: ${JSON.stringify(stock.exchange)},
    priceHistory: ${priceHistoryToTs(stock.priceHistory)},
    currentPrice: ${stock.currentPrice},
  },`;
}

async function fetchOneStock(symbol, longname, fallbackExchange) {
  try {
    const chart = await fetchHistory(symbol);
    const extracted = extractAnnualPrices(chart);
    if (!extracted) return null;
    return {
      symbol,
      shortname: extracted.shortName || longname,
      longname,
      exchange: extracted.exchange || fallbackExchange,
      priceHistory: extracted.priceHistory,
      currentPrice: extracted.currentPrice,
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  console.log('Fetching S&P 500 constituent list...');
  const sp500 = await fetchSp500();
  console.log(`  Got ${sp500.length} S&P 500 tickers`);

  // Merge with extras (extras take precedence on metadata if duplicates)
  const seen = new Set();
  const merged = [];
  for (const row of [...EXTRA_TICKERS, ...sp500]) {
    if (seen.has(row[0])) continue;
    seen.add(row[0]);
    merged.push(row);
  }

  console.log(`Fetching prices for ${merged.length} tickers from Yahoo Finance...`);
  console.log(`(~${Math.round((merged.length * (DELAY_MS + 400)) / 60000)} minutes estimated)\n`);

  const stocks = [];
  const failed = [];

  for (let i = 0; i < merged.length; i++) {
    const [symbol, longname, exchange] = merged[i];
    process.stdout.write(`  [${(i + 1).toString().padStart(3)}/${merged.length}] ${symbol.padEnd(6)} `);

    let result = await fetchOneStock(symbol, longname, exchange);

    // One retry after a longer delay if the first attempt errored
    if (result && result.error) {
      await delay(RETRY_DELAY_MS);
      result = await fetchOneStock(symbol, longname, exchange);
    }

    if (!result) {
      console.log('SKIP (no data)');
      failed.push(symbol);
    } else if (result.error) {
      console.log(`FAIL: ${result.error}`);
      failed.push(symbol);
    } else {
      const years = Object.keys(result.priceHistory).length;
      console.log(`OK (${years}y, $${result.currentPrice})`);
      stocks.push(result);
    }

    await delay(DELAY_MS);
  }

  if (stocks.length === 0) {
    console.error('\nNo stocks fetched. Aborting (will not overwrite existing data).');
    process.exit(1);
  }

  // Stable sort by symbol for clean diffs
  stocks.sort((a, b) => a.symbol.localeCompare(b.symbol));

  const refreshedDate = new Date();
  const refreshedAt = refreshedDate.toISOString();
  const refreshedAtDisplay = formatRefreshDate(refreshedDate);

  const ts = `// Auto-generated by scripts/refresh-stock-data.mjs. Do not edit by hand.
// Re-run periodically:  node src/app/features/stock-tracker/scripts/refresh-stock-data.mjs

import { MockStock } from '../services/mock-data';

export const REFRESHED_AT = '${refreshedAt}';
export const REFRESHED_AT_DISPLAY = '${refreshedAtDisplay}';

export const MOCK_STOCKS: MockStock[] = [
${stocks.map(stockToTs).join('\n')}
];
`;

  const outPath = resolve(__dirname, '..', 'data', 'stock-prices.generated.ts');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, ts);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Wrote ${stocks.length} stocks to:`);
  console.log(`  ${outPath}`);
  console.log(`Refreshed at: ${refreshedAtDisplay}`);
  if (failed.length > 0) {
    console.log(`\nSkipped ${failed.length} tickers: ${failed.join(', ')}`);
  }
}

main().catch((e) => {
  console.error('\nFatal error:', e);
  process.exit(1);
});

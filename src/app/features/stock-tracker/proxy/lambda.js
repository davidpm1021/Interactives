/**
 * AWS Lambda function that proxies Yahoo Finance API requests.
 * Deployed with a Lambda Function URL (no API Gateway needed).
 *
 * Endpoints:
 *   GET /chart/{TICKER}?period1=X&period2=Y&interval=1d
 *   GET /search?q=apple
 *
 * Setup (one-time, ~5 minutes):
 *   1. Go to AWS Lambda console
 *   2. Create function > Author from scratch
 *      - Name: ngpf-stock-proxy
 *      - Runtime: Node.js 20.x
 *      - Architecture: arm64
 *   3. Paste this code into the inline editor
 *   4. Configuration > Function URL > Create
 *      - Auth type: NONE
 *      - CORS: Enable, allow origin "*"
 *   5. Copy the Function URL (e.g., https://abc123.lambda-url.us-east-1.on.aws/)
 *   6. Update PROXY_URL in stock-data.service.ts
 *   7. Done. Never touch it again.
 */

const https = require('https');

// Simple in-memory cache (persists across warm Lambda invocations)
const cache = new Map();
const CHART_TTL = 24 * 60 * 60 * 1000; // 24 hours
const SEARCH_TTL = 60 * 60 * 1000;     // 1 hour

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': statusCode === 200 ? 'public, max-age=3600' : 'no-cache',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  const path = event.rawPath || '';
  const params = event.queryStringParameters || {};

  // CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return jsonResponse(204, '');
  }

  // Chart endpoint: /chart/AAPL?period1=X&period2=Y&interval=1d
  const chartMatch = path.match(/\/chart\/([A-Za-z0-9.\-^]+)$/);
  if (chartMatch) {
    const ticker = chartMatch[1];
    const qs = new URLSearchParams();
    if (params.period1) qs.set('period1', params.period1);
    if (params.period2) qs.set('period2', params.period2);
    if (params.interval) qs.set('interval', params.interval);
    if (params.events) qs.set('events', params.events);

    const cacheKey = `chart:${ticker}:${qs}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.time < CHART_TTL) {
      return jsonResponse(200, cached.data);
    }

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?${qs}`;
      const result = await fetchUrl(url);
      if (result.status === 200) {
        cache.set(cacheKey, { data: result.body, time: Date.now() });
      }
      return jsonResponse(result.status, result.body);
    } catch (err) {
      return jsonResponse(502, { error: err.message });
    }
  }

  // Search endpoint: /search?q=apple
  if (path === '/search' || path.endsWith('/search')) {
    const q = params.q || '';
    if (!q) return jsonResponse(400, { error: 'Missing q parameter' });

    const cacheKey = `search:${q.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.time < SEARCH_TTL) {
      return jsonResponse(200, cached.data);
    }

    try {
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&enableFuzzyQuery=true`;
      const result = await fetchUrl(url);
      if (result.status === 200) {
        cache.set(cacheKey, { data: result.body, time: Date.now() });
      }
      return jsonResponse(result.status, result.body);
    } catch (err) {
      return jsonResponse(502, { error: err.message });
    }
  }

  // Health check
  if (path === '/health' || path.endsWith('/health')) {
    return jsonResponse(200, { status: 'ok' });
  }

  return jsonResponse(404, { error: 'Not found. Use /chart/{TICKER} or /search?q=...' });
};

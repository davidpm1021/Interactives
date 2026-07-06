/**
 * Dev proxy server for Yahoo Finance API.
 *
 * Usage:
 *   node src/app/features/stock-tracker/scripts/dev-proxy.js
 *
 * This starts a local proxy on port 3001 that forwards requests to
 * Yahoo Finance with proper CORS headers. Configure Angular's proxy
 * to forward /api/* to http://localhost:3001/api/*.
 *
 * Endpoints:
 *   GET /api/chart/:ticker?period1=X&period2=Y&interval=1d
 *   GET /api/search?q=apple
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;

function proxyRequest(targetUrl, res) {
  https.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => { data += chunk; });
    proxyRes.on('end', () => {
      res.writeHead(proxyRes.statusCode || 200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end(data);
    });
  }).on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: err.message }));
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || '';

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // Chart endpoint
  const chartMatch = pathname.match(/^\/api\/chart\/(.+)$/);
  if (chartMatch) {
    const ticker = encodeURIComponent(chartMatch[1]);
    const params = new URLSearchParams();
    if (parsed.query.period1) params.set('period1', parsed.query.period1);
    if (parsed.query.period2) params.set('period2', parsed.query.period2);
    if (parsed.query.interval) params.set('interval', parsed.query.interval);
    if (parsed.query.events) params.set('events', parsed.query.events);

    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?${params}`;
    console.log(`[proxy] chart -> ${targetUrl}`);
    proxyRequest(targetUrl, res);
    return;
  }

  // Search endpoint
  if (pathname === '/api/search') {
    const q = parsed.query.q || '';
    const targetUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&enableFuzzyQuery=true`;
    console.log(`[proxy] search -> ${targetUrl}`);
    proxyRequest(targetUrl, res);
    return;
  }

  // Health check
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Stock data proxy running at http://localhost:${PORT}/api`);
  console.log('Endpoints:');
  console.log('  GET /api/chart/:ticker?period1=X&period2=Y&interval=1d');
  console.log('  GET /api/search?q=apple');
  console.log('  GET /api/health');
});

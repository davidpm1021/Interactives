/**
 * Curated seed list of recognizable companies used by the "Not sure where to
 * start?" chip strip in the setup step. The strip randomly samples 8 chips
 * from this list (filtered by sector + by whether the stock has data for the
 * student's 10th-birthday year) so different students see different starters
 * — no canonical "here are the popular ones" leaderboard.
 *
 * Every ticker MUST exist in `stock-prices.generated.ts`. Anything that isn't
 * in MOCK_STOCKS is dropped at runtime.
 */

export type Sector =
  | 'Tech'
  | 'Consumer'
  | 'Retail'
  | 'Entertainment'
  | 'Automotive'
  | 'Food & Bev'
  | 'Financial'
  | 'Industrial'
  | 'Media';

export interface CuratedSuggestion {
  ticker: string;
  name: string;
  sector: Sector;
}

export const SECTORS: Sector[] = [
  'Tech',
  'Consumer',
  'Retail',
  'Entertainment',
  'Automotive',
  'Food & Bev',
  'Financial',
  'Industrial',
  'Media',
];

export const CURATED_SUGGESTIONS: CuratedSuggestion[] = [
  // Tech
  { ticker: 'AAPL', name: 'Apple',           sector: 'Tech' },
  { ticker: 'MSFT', name: 'Microsoft',       sector: 'Tech' },
  { ticker: 'GOOGL', name: 'Alphabet (Google)', sector: 'Tech' },
  { ticker: 'META', name: 'Meta (Facebook)', sector: 'Tech' },
  { ticker: 'NVDA', name: 'NVIDIA',          sector: 'Tech' },
  { ticker: 'AMD',  name: 'AMD',             sector: 'Tech' },
  { ticker: 'INTC', name: 'Intel',           sector: 'Tech' },
  { ticker: 'CRM',  name: 'Salesforce',      sector: 'Tech' },
  { ticker: 'ORCL', name: 'Oracle',          sector: 'Tech' },
  { ticker: 'ADBE', name: 'Adobe',           sector: 'Tech' },
  { ticker: 'CSCO', name: 'Cisco',           sector: 'Tech' },
  { ticker: 'IBM',  name: 'IBM',             sector: 'Tech' },

  // Consumer (apparel, personal care, lifestyle)
  { ticker: 'NKE',  name: 'Nike',            sector: 'Consumer' },
  { ticker: 'LULU', name: 'Lululemon',       sector: 'Consumer' },
  { ticker: 'PG',   name: 'Procter & Gamble', sector: 'Consumer' },
  { ticker: 'CL',   name: 'Colgate-Palmolive', sector: 'Consumer' },
  { ticker: 'EL',   name: "Estee Lauder",    sector: 'Consumer' },

  // Retail
  { ticker: 'AMZN', name: 'Amazon',          sector: 'Retail' },
  { ticker: 'WMT',  name: 'Walmart',         sector: 'Retail' },
  { ticker: 'TGT',  name: 'Target',          sector: 'Retail' },
  { ticker: 'COST', name: 'Costco',          sector: 'Retail' },
  { ticker: 'HD',   name: 'Home Depot',      sector: 'Retail' },
  { ticker: 'LOW',  name: 'Lowe\'s',         sector: 'Retail' },
  { ticker: 'BBY',  name: 'Best Buy',        sector: 'Retail' },

  // Entertainment / Gaming / Streaming
  { ticker: 'DIS',  name: 'Disney',          sector: 'Entertainment' },
  { ticker: 'NFLX', name: 'Netflix',         sector: 'Entertainment' },
  { ticker: 'EA',   name: 'Electronic Arts', sector: 'Entertainment' },
  { ticker: 'TTWO', name: 'Take-Two (GTA, NBA 2K)', sector: 'Entertainment' },
  { ticker: 'RBLX', name: 'Roblox',          sector: 'Entertainment' },
  { ticker: 'HAS',  name: 'Hasbro',          sector: 'Entertainment' },

  // Automotive
  { ticker: 'TSLA', name: 'Tesla',           sector: 'Automotive' },
  { ticker: 'F',    name: 'Ford',            sector: 'Automotive' },
  { ticker: 'GM',   name: 'General Motors',  sector: 'Automotive' },

  // Food & Bev
  { ticker: 'MCD',  name: "McDonald's",      sector: 'Food & Bev' },
  { ticker: 'SBUX', name: 'Starbucks',       sector: 'Food & Bev' },
  { ticker: 'CMG',  name: 'Chipotle',        sector: 'Food & Bev' },
  { ticker: 'DPZ',  name: "Domino's Pizza",  sector: 'Food & Bev' },
  { ticker: 'YUM',  name: 'Yum! Brands (KFC, Taco Bell)', sector: 'Food & Bev' },
  { ticker: 'KO',   name: 'Coca-Cola',       sector: 'Food & Bev' },
  { ticker: 'PEP',  name: 'PepsiCo',         sector: 'Food & Bev' },

  // Financial
  { ticker: 'V',    name: 'Visa',            sector: 'Financial' },
  { ticker: 'MA',   name: 'Mastercard',      sector: 'Financial' },
  { ticker: 'PYPL', name: 'PayPal',          sector: 'Financial' },
  { ticker: 'JPM',  name: 'JPMorgan Chase',  sector: 'Financial' },
  { ticker: 'BAC',  name: 'Bank of America', sector: 'Financial' },
  { ticker: 'GS',   name: 'Goldman Sachs',   sector: 'Financial' },
  { ticker: 'COIN', name: 'Coinbase',        sector: 'Financial' },
  { ticker: 'HOOD', name: 'Robinhood',       sector: 'Financial' },

  // Industrial
  { ticker: 'BA',   name: 'Boeing',          sector: 'Industrial' },
  { ticker: 'CAT',  name: 'Caterpillar',     sector: 'Industrial' },
  { ticker: 'GE',   name: 'GE Aerospace',    sector: 'Industrial' },
  { ticker: 'UPS',  name: 'UPS',             sector: 'Industrial' },
  { ticker: 'FDX',  name: 'FedEx',           sector: 'Industrial' },
  { ticker: 'LMT',  name: 'Lockheed Martin', sector: 'Industrial' },
  { ticker: 'DE',   name: 'John Deere',      sector: 'Industrial' },

  // Media / Communications
  { ticker: 'CMCSA', name: 'Comcast',        sector: 'Media' },
  { ticker: 'T',    name: 'AT&T',            sector: 'Media' },
  { ticker: 'VZ',   name: 'Verizon',         sector: 'Media' },
  { ticker: 'SPOT', name: 'Spotify',         sector: 'Media' },
  { ticker: 'SNAP', name: 'Snap (Snapchat)', sector: 'Media' },
  { ticker: 'PINS', name: 'Pinterest',       sector: 'Media' },
];

import { TestBed } from '@angular/core/testing';
import { StockDataService } from './stock-data.service';
import { CalculationService } from './calculation.service';

// Mock Yahoo Finance chart response
function mockChartResponse(ticker: string, timestamps: number[], adjCloses: number[], regularMarketPrice = 200) {
  return {
    chart: {
      result: [{
        meta: {
          currency: 'USD',
          symbol: ticker,
          regularMarketPrice,
          shortName: `${ticker} Inc.`,
        },
        timestamp: timestamps,
        indicators: {
          quote: [{ close: adjCloses, open: adjCloses, high: adjCloses, low: adjCloses, volume: adjCloses.map(() => 1000000) }],
          adjclose: [{ adjclose: adjCloses }],
        },
      }],
      error: null,
    },
  };
}

// Mock Yahoo Finance search response
function mockSearchResponse(results: { symbol: string; shortname: string; quoteType: string }[]) {
  return {
    quotes: results.map(r => ({
      symbol: r.symbol,
      shortname: r.shortname,
      longname: r.shortname,
      exchange: 'NMS',
      quoteType: r.quoteType,
    })),
  };
}

describe('StockDataService', () => {
  let service: StockDataService;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StockDataService, CalculationService],
    });
    service = TestBed.inject(StockDataService);
    service.useMock = false; // Use real fetch path for unit tests

    // Mock fetch globally
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('searchTickers', () => {
    it('should return equity results only', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(
        mockSearchResponse([
          { symbol: 'AAPL', shortname: 'Apple Inc.', quoteType: 'EQUITY' },
          { symbol: 'AAPL230120C00150000', shortname: 'AAPL Option', quoteType: 'OPTION' },
          { symbol: 'GOOG', shortname: 'Alphabet Inc.', quoteType: 'EQUITY' },
        ])
      )));

      const results = await service.searchTickers('apple');
      expect(results.length).toBe(2);
      expect(results[0].symbol).toBe('AAPL');
      expect(results[1].symbol).toBe('GOOG');
    });

    it('should return empty for blank query', async () => {
      const results = await service.searchTickers('');
      expect(results).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should cache search results', async () => {
      fetchSpy.mockResolvedValue(new Response(JSON.stringify(
        mockSearchResponse([{ symbol: 'AAPL', shortname: 'Apple Inc.', quoteType: 'EQUITY' }])
      )));

      await service.searchTickers('apple');
      await service.searchTickers('apple');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw user-friendly error on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('Failed to fetch'));

      await expect(service.searchTickers('apple')).rejects.toThrow(/trouble connecting/);
    });
  });

  describe('getPriceOnDate', () => {
    it('should return price and nearest trading day', async () => {
      const targetDate = new Date(2020, 0, 15);
      const timestamps = [
        Math.floor(new Date(2020, 0, 13).getTime() / 1000),
        Math.floor(new Date(2020, 0, 14).getTime() / 1000),
        Math.floor(new Date(2020, 0, 15).getTime() / 1000),
      ];

      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(
        mockChartResponse('AAPL', timestamps, [300, 305, 310])
      )));

      const result = await service.getPriceOnDate('AAPL', targetDate);
      expect(result.ticker).toBe('AAPL');
      expect(result.adjClose).toBe(310);
      expect(result.companyName).toBe('AAPL Inc.');
    });

    it('should throw if no data available', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({
        chart: { result: [], error: null },
      })));

      await expect(service.getPriceOnDate('FAKE', new Date(2020, 0, 15)))
        .rejects.toThrow(/No trading data/);
    });
  });

  describe('getAnnualBirthdayPrices', () => {
    it('should extract annual data points', async () => {
      // Build timestamps for Jan 15 across 3 years
      const timestamps: number[] = [];
      const adjCloses: number[] = [];
      for (let year = 2015; year <= 2017; year++) {
        for (let day = 10; day <= 20; day++) {
          const d = new Date(year, 0, day);
          if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
            timestamps.push(Math.floor(d.getTime() / 1000));
            adjCloses.push(100 + (year - 2015) * 20 + day);
          }
        }
      }

      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(
        mockChartResponse('AAPL', timestamps, adjCloses, 200)
      )));

      const result = await service.getAnnualBirthdayPrices('AAPL', 0, 15, 2015, 2005);
      expect(result.annualData.length).toBe(3);
      expect(result.annualData[0].year).toBe(2015);
      expect(result.annualData[0].age).toBe(10);
      expect(result.currentPrice).toBe(200);
      expect(result.companyName).toBe('AAPL Inc.');
    });

    it('should throw if no historical data', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({
        chart: { result: [], error: null },
      })));

      await expect(service.getAnnualBirthdayPrices('FAKE', 0, 15, 2015, 2005))
        .rejects.toThrow(/No historical data/);
    });
  });

  describe('validateTickerOnDate', () => {
    it('should return true if price data exists', async () => {
      const ts = Math.floor(new Date(2020, 0, 15).getTime() / 1000);
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(
        mockChartResponse('AAPL', [ts], [310])
      )));

      const valid = await service.validateTickerOnDate('AAPL', new Date(2020, 0, 15));
      expect(valid).toBe(true);
    });

    it('should return false if no data', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({
        chart: { result: [], error: null },
      })));

      const valid = await service.validateTickerOnDate('FAKE', new Date(2020, 0, 15));
      expect(valid).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle rate limiting', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Too Many Requests', { status: 429 }));

      await expect(service.searchTickers('test')).rejects.toThrow(/too many requests/i);
    });

    it('should retry once on non-rate-limit failure', async () => {
      fetchSpy
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Response(JSON.stringify(
          mockSearchResponse([{ symbol: 'AAPL', shortname: 'Apple', quoteType: 'EQUITY' }])
        )));

      const results = await service.searchTickers('apple');
      expect(results.length).toBe(1);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { CalculationService } from './calculation.service';
import { StockPick } from '../models/stock-tracker.models';

function makePick(overrides: Partial<StockPick> = {}): StockPick {
  return {
    companyName: 'Test Inc.',
    ticker: 'TEST',
    priceOnBirthday: 50,
    dateUsed: new Date(2010, 5, 15),
    sharesOwned: 100,
    annualData: [],
    currentPrice: 100,
    currentValue: 10000,
    roi: 100,
    totalReturn: 5000,
    ...overrides,
  };
}

describe('CalculationService', () => {
  let service: CalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CalculationService] });
    service = TestBed.inject(CalculationService);
  });

  // ── ROI ──

  it('should calculate positive ROI', () => {
    expect(service.calculateROI(50, 150)).toBe(200);
  });

  it('should calculate negative ROI', () => {
    expect(service.calculateROI(100, 75)).toBe(-25);
  });

  it('should return 0 ROI for zero purchase price', () => {
    expect(service.calculateROI(0, 100)).toBe(0);
  });

  it('should calculate 0% ROI for same price', () => {
    expect(service.calculateROI(100, 100)).toBe(0);
  });

  // ── Total Return ──

  it('should calculate positive total return', () => {
    expect(service.calculateTotalReturn(50, 150, 100)).toBe(10000);
  });

  it('should calculate negative total return', () => {
    expect(service.calculateTotalReturn(100, 75, 100)).toBe(-2500);
  });

  // ── YoY Change ──

  it('should calculate YoY change', () => {
    expect(service.calculateYoYChange(100, 120)).toBe(20);
  });

  it('should handle negative YoY change', () => {
    expect(service.calculateYoYChange(100, 80)).toBe(-20);
  });

  it('should return 0 for zero previous price', () => {
    expect(service.calculateYoYChange(0, 100)).toBe(0);
  });

  // ── Nearest Prior Trading Day ──

  it('should find exact trading day', () => {
    const target = new Date(2020, 0, 15); // Jan 15
    const timestamps = [
      Math.floor(new Date(2020, 0, 13).getTime() / 1000),
      Math.floor(new Date(2020, 0, 14).getTime() / 1000),
      Math.floor(new Date(2020, 0, 15).getTime() / 1000),
      Math.floor(new Date(2020, 0, 16).getTime() / 1000),
    ];
    const result = service.findNearestPriorTradingDay(target, timestamps);
    expect(result.getDate()).toBe(15);
  });

  it('should find prior trading day when target is weekend', () => {
    const target = new Date(2020, 0, 18); // Saturday Jan 18
    const timestamps = [
      Math.floor(new Date(2020, 0, 16).getTime() / 1000), // Thursday
      Math.floor(new Date(2020, 0, 17).getTime() / 1000), // Friday
      Math.floor(new Date(2020, 0, 20).getTime() / 1000), // Monday
    ];
    const result = service.findNearestPriorTradingDay(target, timestamps);
    expect(result.getDate()).toBe(17); // Friday
  });

  it('should use first timestamp if all are after target', () => {
    const target = new Date(2020, 0, 1);
    const timestamps = [
      Math.floor(new Date(2020, 0, 5).getTime() / 1000),
      Math.floor(new Date(2020, 0, 6).getTime() / 1000),
    ];
    const result = service.findNearestPriorTradingDay(target, timestamps);
    expect(result.getDate()).toBe(5);
  });

  // ── Tenth Birthday ──

  it('should calculate 10th birthday', () => {
    const birthday = new Date(2000, 5, 15);
    const tenth = service.calculateTenthBirthday(birthday);
    expect(tenth.getFullYear()).toBe(2010);
    expect(tenth.getMonth()).toBe(5);
    expect(tenth.getDate()).toBe(15);
  });

  it('should handle leap year birthdays', () => {
    const birthday = new Date(2000, 1, 29); // Feb 29, 2000
    const tenth = service.calculateTenthBirthday(birthday);
    expect(tenth.getFullYear()).toBe(2010);
    // JS Date handles Feb 29 + 10 years: 2010 is not a leap year, so March 1
    expect(tenth.getMonth()).toBe(2); // March
    expect(tenth.getDate()).toBe(1);
  });

  // ── Current Age ──

  it('should calculate current age', () => {
    const today = new Date();
    const birthday = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate());
    expect(service.calculateCurrentAge(birthday)).toBe(20);
  });

  it('should handle birthday not yet reached this year', () => {
    const today = new Date();
    // Birthday is next month
    const futureMonth = (today.getMonth() + 1) % 12;
    const futureYear = futureMonth < today.getMonth() ? today.getFullYear() + 1 : today.getFullYear();
    const birthday = new Date(futureYear - 20, futureMonth, 15);
    expect(service.calculateCurrentAge(birthday)).toBe(19);
  });
});

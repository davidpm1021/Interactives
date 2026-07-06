import { TestBed } from '@angular/core/testing';
import { StockTrackerStateService } from './stock-tracker-state.service';
import { StockPick, StudentProfile } from '../models/stock-tracker.models';

function makeProfile(): StudentProfile {
  return {
    birthday: new Date(2000, 5, 15),
    tenthBirthday: new Date(2010, 5, 15),
    tradingDayOnTenth: new Date(2010, 5, 15),
    currentAge: 25,
  };
}

function makePick(ticker: string): StockPick {
  return {
    companyName: `${ticker} Inc.`,
    ticker,
    priceOnBirthday: 50,
    dateUsed: new Date(2010, 5, 15),
    sharesOwned: 100,
    annualData: [],
    currentPrice: 100,
    currentValue: 10000,
    roi: 100,
    totalReturn: 5000,
  };
}

describe('StockTrackerStateService', () => {
  let service: StockTrackerStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StockTrackerStateService],
    });
    service = TestBed.inject(StockTrackerStateService);
  });

  it('should start on setup step', () => {
    expect(service.currentStep()).toBe('setup');
  });

  it('should not advance from setup without profile and 5 picks', () => {
    expect(service.canAdvance()).toBe(false);
    service.advanceStep();
    expect(service.currentStep()).toBe('setup');
  });

  it('should mark steps correctly', () => {
    const steps = service.steps();
    expect(steps[0].status).toBe('active');
    expect(steps[1].status).toBe('locked');
    expect(steps[2].status).toBe('locked');
    expect(steps[3].status).toBe('locked');
  });

  it('should advance to track after profile + 5 picks', () => {
    service.setProfile(makeProfile());
    ['AAPL', 'GOOG', 'MSFT', 'AMZN', 'TSLA'].forEach(t => service.addPick(makePick(t)));
    expect(service.canAdvance()).toBe(true);

    service.advanceStep();
    expect(service.currentStep()).toBe('track');

    const steps = service.steps();
    expect(steps[0].status).toBe('completed');
    expect(steps[1].status).toBe('active');
  });

  it('should not allow duplicate tickers', () => {
    service.addPick(makePick('AAPL'));
    service.addPick(makePick('AAPL'));
    expect(service.picks().length).toBe(1);
  });

  it('should not allow more than 5 picks', () => {
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(t => service.addPick(makePick(t)));
    expect(service.picks().length).toBe(5);
  });

  it('should remove a pick by ticker', () => {
    service.addPick(makePick('AAPL'));
    service.addPick(makePick('GOOG'));
    service.removePick('AAPL');
    expect(service.picks().length).toBe(1);
    expect(service.picks()[0].ticker).toBe('GOOG');
  });

  it('should replace a pick', () => {
    service.addPick(makePick('AAPL'));
    service.replacePick('AAPL', makePick('MSFT'));
    expect(service.picks().length).toBe(1);
    expect(service.picks()[0].ticker).toBe('MSFT');
  });

  it('should not advance from track without annual data', () => {
    service.setProfile(makeProfile());
    ['AAPL', 'GOOG', 'MSFT', 'AMZN', 'TSLA'].forEach(t => service.addPick(makePick(t)));
    service.advanceStep(); // -> track
    expect(service.canAdvance()).toBe(false);
  });

  it('should advance from track when all picks have annual data', () => {
    service.setProfile(makeProfile());
    ['AAPL', 'GOOG', 'MSFT', 'AMZN', 'TSLA'].forEach(t => service.addPick(makePick(t)));
    service.advanceStep(); // -> track

    // Populate annual data for all picks
    service.picks().forEach(p => {
      service.updatePickData(p.ticker, [
        { year: 2010, age: 10, dateUsed: new Date(), adjClose: 50, valueOf100Shares: 5000, yearOverYearChange: 0 },
      ], 100);
    });

    expect(service.canAdvance()).toBe(true);
    service.advanceStep(); // -> compare
    expect(service.currentStep()).toBe('compare');
  });

  it('should allow navigating back to completed steps', () => {
    service.setProfile(makeProfile());
    ['AAPL', 'GOOG', 'MSFT', 'AMZN', 'TSLA'].forEach(t => service.addPick(makePick(t)));
    service.advanceStep(); // -> track
    service.goToStep('setup');
    expect(service.currentStep()).toBe('setup');
  });

  it('should not allow navigating to locked steps', () => {
    service.goToStep('compare');
    expect(service.currentStep()).toBe('setup');
  });

  it('should invalidate downstream steps when removing a pick', () => {
    service.setProfile(makeProfile());
    ['AAPL', 'GOOG', 'MSFT', 'AMZN', 'TSLA'].forEach(t => service.addPick(makePick(t)));
    service.advanceStep(); // -> track

    // Populate data and advance
    service.picks().forEach(p => {
      service.updatePickData(p.ticker, [
        { year: 2010, age: 10, dateUsed: new Date(), adjClose: 50, valueOf100Shares: 5000, yearOverYearChange: 0 },
      ], 100);
    });
    service.advanceStep(); // -> compare

    // Go back and remove a pick
    service.goToStep('setup');
    service.removePick('AAPL');

    // Track and compare should no longer be completed
    const steps = service.steps();
    expect(steps[1].status).toBe('locked'); // track
    expect(steps[2].status).toBe('locked'); // compare
  });

  it('should update report fields', () => {
    service.updateReport({ bestPerformerAnalysis: 'AAPL was great' });
    expect(service.report().bestPerformerAnalysis).toBe('AAPL was great');
    expect(service.report().mostValuableAnalysis).toBe(''); // Unchanged
  });

  it('should reset all state', () => {
    service.setProfile(makeProfile());
    ['AAPL', 'GOOG', 'MSFT', 'AMZN', 'TSLA'].forEach(t => service.addPick(makePick(t)));
    service.advanceStep();

    service.reset();
    expect(service.currentStep()).toBe('setup');
    expect(service.profile()).toBeNull();
    expect(service.picks()).toEqual([]);
    expect(service.steps().every(s => s.status === 'locked' || s.status === 'active')).toBe(true);
  });

  it('should update pick data with calculated ROI and value', () => {
    service.addPick(makePick('AAPL'));
    service.updatePickData('AAPL', [
      { year: 2010, age: 10, dateUsed: new Date(), adjClose: 50, valueOf100Shares: 5000, yearOverYearChange: 0 },
    ], 200);

    const pick = service.picks()[0];
    expect(pick.currentPrice).toBe(200);
    expect(pick.currentValue).toBe(20000);
    expect(pick.roi).toBe(300); // ((200-50)/50)*100
    expect(pick.totalReturn).toBe(15000); // 20000 - 5000
  });

  it('currentStepConfig returns correct config', () => {
    expect(service.currentStepConfig().id).toBe('setup');
    expect(service.currentStepConfig().number).toBe(1);
  });
});

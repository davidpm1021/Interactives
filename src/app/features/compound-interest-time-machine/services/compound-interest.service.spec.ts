import { TestBed } from '@angular/core/testing';
import { CompoundInterestService } from './compound-interest.service';
import { SimulationInputs } from '../models/compound-interest.models';
import { SCENARIOS } from '../data/scenarios';

describe('CompoundInterestService', () => {
  let service: CompoundInterestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompoundInterestService);
  });

  function makeInputs(overrides: Partial<SimulationInputs> = {}): SimulationInputs {
    return {
      principal: 1000,
      interestRate: 0.07,
      timeHorizon: 10,
      contributionAmount: 0,
      contributionFrequency: 'none',
      compoundingFrequency: 'annually',
      ...overrides,
    };
  }

  it('should calculate $1,000 at 10% for 1 year compounded annually = $1,100', () => {
    const result = service.calculate(
      makeInputs({ interestRate: 0.10, timeHorizon: 1 }),
    );
    expect(result.dataPoints[1].compoundBalance).toBeCloseTo(1100, 2);
  });

  it('should calculate $1,000 at 10% for 1 year compounded monthly ≈ $1,104.71', () => {
    const result = service.calculate(
      makeInputs({
        interestRate: 0.10,
        timeHorizon: 1,
        compoundingFrequency: 'monthly',
      }),
    );
    expect(result.dataPoints[1].compoundBalance).toBeCloseTo(1104.71, 0);
  });

  it('should calculate $0 principal + $100/mo for 10yr at 7%', () => {
    const result = service.calculate(
      makeInputs({
        principal: 0,
        interestRate: 0.07,
        timeHorizon: 10,
        contributionAmount: 100,
        contributionFrequency: 'monthly',
        compoundingFrequency: 'monthly',
      }),
    );
    const final = result.dataPoints[10].compoundBalance;
    // ~$17,308 (future value of annuity)
    expect(final).toBeGreaterThan(17000);
    expect(final).toBeLessThan(17500);
  });

  it('should calculate $5,000 principal, no contributions, 30yr at 7% ≈ $38,061', () => {
    const result = service.calculate(
      makeInputs({
        principal: 5000,
        timeHorizon: 30,
        compoundingFrequency: 'annually',
      }),
    );
    expect(result.dataPoints[30].compoundBalance).toBeCloseTo(38061, -2);
  });

  it('should produce linear simple interest', () => {
    const result = service.calculate(
      makeInputs({ interestRate: 0.10, timeHorizon: 5 }),
    );
    // Simple interest: 1000 * (1 + 0.10 * year)
    for (let y = 0; y <= 5; y++) {
      expect(result.dataPoints[y].simpleBalance).toBeCloseTo(1000 + 1000 * 0.10 * y, 2);
    }
  });

  it('should find doublingYear correctly', () => {
    // $1,000 at 10% annually, no contributions
    // Rule of 72: ~7.2 years to double
    const result = service.calculate(
      makeInputs({ interestRate: 0.10, timeHorizon: 20 }),
    );
    expect(result.summary.doublingYear).toBe(8); // first year balance >= 2 * contributions
  });

  it('should return null doublingYear at 0% interest', () => {
    const result = service.calculate(
      makeInputs({ interestRate: 0, timeHorizon: 50 }),
    );
    expect(result.summary.doublingYear).toBeNull();
  });

  it('should produce flat line at 0% interest', () => {
    const result = service.calculate(
      makeInputs({ interestRate: 0, timeHorizon: 10 }),
    );
    for (const dp of result.dataPoints) {
      expect(dp.compoundBalance).toBeCloseTo(1000, 2);
      expect(dp.totalInterestEarned).toBeCloseTo(0, 2);
    }
  });

  it('should handle time horizon of 1 year', () => {
    const result = service.calculate(
      makeInputs({ timeHorizon: 1 }),
    );
    expect(result.dataPoints).toHaveLength(2); // year 0 + year 1
    expect(result.dataPoints[0].compoundBalance).toBe(1000);
  });

  it('should have consistent summary math (interest + contributions = balance)', () => {
    const result = service.calculate(
      makeInputs({
        principal: 2000,
        interestRate: 0.08,
        timeHorizon: 20,
        contributionAmount: 150,
        contributionFrequency: 'monthly',
        compoundingFrequency: 'monthly',
      }),
    );
    const { finalBalance, totalContributions, totalInterestEarned } = result.summary;
    expect(totalContributions + totalInterestEarned).toBeCloseTo(finalBalance, 2);
  });

  it('should produce daily > monthly > annual compounding ordering', () => {
    const annual = service.calculate(
      makeInputs({ timeHorizon: 20, compoundingFrequency: 'annually' }),
    );
    const monthly = service.calculate(
      makeInputs({ timeHorizon: 20, compoundingFrequency: 'monthly' }),
    );
    const daily = service.calculate(
      makeInputs({ timeHorizon: 20, compoundingFrequency: 'daily' }),
    );
    const annualFinal = annual.summary.finalBalance;
    const monthlyFinal = monthly.summary.finalBalance;
    const dailyFinal = daily.summary.finalBalance;
    expect(dailyFinal).toBeGreaterThan(monthlyFinal);
    expect(monthlyFinal).toBeGreaterThan(annualFinal);
  });

  it('should clamp negative values to 0', () => {
    const result = service.calculate(
      makeInputs({ principal: -500, contributionAmount: -100 }),
    );
    expect(result.dataPoints[0].compoundBalance).toBe(0);
  });

  it('should clamp interest rate > 15%', () => {
    const result = service.calculate(
      makeInputs({ interestRate: 0.25, timeHorizon: 1 }),
    );
    // Should be clamped to 15%
    expect(result.dataPoints[1].compoundBalance).toBeCloseTo(1150, 2);
  });

  it('should clamp time horizon to 1-50', () => {
    const resultLow = service.calculate(
      makeInputs({ timeHorizon: 0 }),
    );
    expect(resultLow.dataPoints).toHaveLength(2); // clamped to 1

    const resultHigh = service.calculate(
      makeInputs({ timeHorizon: 100 }),
    );
    expect(resultHigh.dataPoints).toHaveLength(51); // clamped to 50
  });

  it('should produce valid results for all 5 scenarios', () => {
    for (const scenario of SCENARIOS) {
      const result = service.calculate(scenario.inputs);
      expect(result.dataPoints.length).toBeGreaterThan(1);
      expect(result.summary.finalBalance).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalContributions).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalContributions + result.summary.totalInterestEarned)
        .toBeCloseTo(result.summary.finalBalance, 1);
    }
  });

  // ── Challenge convenience methods ──────────────────

  describe('challenge convenience methods', () => {
    it('calculateChallenge1 returns ~$14,974 at year 40', () => {
      const result = service.calculateChallenge1();
      expect(result.dataPoints).toHaveLength(41);
      expect(result.summary.finalBalance).toBeCloseTo(14974, -2);
    });

    it('calculateChallenge2Low returns ~$7,040 at year 40', () => {
      const result = service.calculateChallenge2Low();
      expect(result.summary.finalBalance).toBeCloseTo(7040, -2);
    });

    it('calculateChallenge2High returns ~$45,259 at year 40', () => {
      const result = service.calculateChallenge2High();
      expect(result.summary.finalBalance).toBeCloseTo(45259, -2);
    });

    it('challenge2 high/low ratio is ~6.4x', () => {
      const low = service.calculateChallenge2Low();
      const high = service.calculateChallenge2High();
      const ratio = high.summary.finalBalance / low.summary.finalBalance;
      expect(ratio).toBeGreaterThan(6);
      expect(ratio).toBeLessThan(7);
    });

    it('calculateChallenge3 returns ~$262k at year 40', () => {
      const result = service.calculateChallenge3();
      expect(result.summary.finalBalance).toBeGreaterThan(240000);
      expect(result.summary.finalBalance).toBeLessThan(290000);
    });

    it('challenge3 total contributions = $49,000 principal+monthly', () => {
      const result = service.calculateChallenge3();
      // $1,000 principal + $100/mo * 12 * 40 = $49,000
      expect(result.summary.totalContributions).toBeCloseTo(49000, 0);
    });

    it('calculateChallenge4Early returns ~$528k', () => {
      const result = service.calculateChallenge4Early();
      expect(result.summary.finalBalance).toBeGreaterThan(500000);
      expect(result.summary.finalBalance).toBeLessThan(550000);
    });

    it('calculateChallenge4Late returns ~$236k', () => {
      const result = service.calculateChallenge4Late();
      expect(result.summary.finalBalance).toBeGreaterThan(220000);
      expect(result.summary.finalBalance).toBeLessThan(250000);
    });

    it('challenge4 gap is > $200,000', () => {
      const early = service.calculateChallenge4Early();
      const late = service.calculateChallenge4Late();
      const gap = early.summary.finalBalance - late.summary.finalBalance;
      expect(gap).toBeGreaterThan(200000);
    });

    it('challenge4 contribution difference is $24,000', () => {
      const early = service.calculateChallenge4Early();
      const late = service.calculateChallenge4Late();
      const diff = early.summary.totalContributions - late.summary.totalContributions;
      expect(diff).toBeCloseTo(24000, 0);
    });
  });

  // ── Milestone detection ────────────────────────────

  describe('milestones', () => {
    it('should detect balance-100k milestone for large balances', () => {
      const result = service.calculateChallenge3();
      const m100k = result.summary.milestones?.find((m) => m.type === 'balance-100k');
      expect(m100k).toBeDefined();
      expect(m100k!.year).toBeGreaterThan(0);
      expect(m100k!.year).toBeLessThan(40);
    });

    it('should detect interest-exceeds-contributions for long horizons', () => {
      const result = service.calculateChallenge3();
      const m = result.summary.milestones?.find(
        (m) => m.type === 'interest-exceeds-contributions',
      );
      expect(m).toBeDefined();
    });

    it('should not detect balance-1m for small investments', () => {
      const result = service.calculateChallenge1();
      const m1m = result.summary.milestones?.find((m) => m.type === 'balance-1m');
      expect(m1m).toBeUndefined();
    });

    it('should return milestones in chronological order', () => {
      const result = service.calculateChallenge4Early();
      const milestones = result.summary.milestones ?? [];
      for (let i = 1; i < milestones.length; i++) {
        expect(milestones[i].year).toBeGreaterThanOrEqual(milestones[i - 1].year);
      }
    });
  });
});

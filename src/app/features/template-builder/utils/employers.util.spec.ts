import { describe, expect, it } from 'vitest';
import { EMPLOYER_STATES, EMPLOYERS } from './employers.util';
import { NEIGHBOR_CITIES } from './pools.util';

/** Every US state, so a coverage gap fails rather than going unnoticed. */
const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL',
  'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT',
  'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

describe('employer pool coverage', () => {
  it('supplies an employer for every state', () => {
    expect([...EMPLOYER_STATES]).toEqual([...ALL_STATES].sort());
  });

  it('has exactly one employer per state, so the filter is unambiguous', () => {
    expect(EMPLOYERS).toHaveLength(ALL_STATES.length);
    const states = EMPLOYERS.map((e) => e.stateAbbr);
    expect(new Set(states).size).toBe(states.length);
  });

  it('gives every employer a distinct name', () => {
    const names = EMPLOYERS.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('employer addresses', () => {
  it('ends every address with the employer own state and a five-digit ZIP', () => {
    for (const e of EMPLOYERS) {
      expect(e.addr2, `${e.name}`).toMatch(new RegExp(`, ${e.stateAbbr} \\d{5}$`));
    }
  });

  it('gives every employer a street line', () => {
    for (const e of EMPLOYERS) {
      expect(e.addr1.trim().length, `${e.name}`).toBeGreaterThan(0);
      expect(e.addr2.split(',')[0].trim().length, `${e.name}`).toBeGreaterThan(0);
    }
  });

  it('offers nearby towns in every state, so employees do not all live at work', () => {
    for (const state of ALL_STATES) {
      const cities = NEIGHBOR_CITIES[state];
      expect(cities, `${state} has no neighbouring towns`).toBeDefined();
      expect(cities.length).toBeGreaterThan(0);
      for (const city of cities) {
        expect(city, `${state}: ${city}`).toMatch(new RegExp(`, ${state} \\d{5}$`));
      }
    }
  });

  it('never lists a neighbouring town identical to the employer own city', () => {
    for (const e of EMPLOYERS) {
      expect(NEIGHBOR_CITIES[e.stateAbbr]).not.toContain(e.addr2);
    }
  });
});

describe('retirement plan availability', () => {
  /**
   * With one employer per state this flag decides whether a teacher filtering
   * to their own state can generate a 401(k) stub at all, so it needs to be
   * spread around rather than clustered in a handful of states.
   */
  it('offers a 401(k) in a reasonable share of states', () => {
    const offering = EMPLOYERS.filter((e) => e.offers401k).length;
    expect(offering).toBeGreaterThanOrEqual(10);
    expect(offering).toBeLessThanOrEqual(EMPLOYERS.length / 2);
  });

  it('keeps plenty of employers without one, so both cases are teachable', () => {
    expect(EMPLOYERS.filter((e) => !e.offers401k).length).toBeGreaterThanOrEqual(10);
  });
});

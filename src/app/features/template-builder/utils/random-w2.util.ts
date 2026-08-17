import { W2 } from '../models/w2.model';
import { pick, randInt, round2 } from './random-helpers.util';
import { FIRST_NAMES, LAST_NAMES, NEIGHBOR_CITIES, STREETS } from './pools.util';
import { effectiveFederalRate, effectiveStateRate, hasStateIncomeTax } from './tax-rates.util';
// Shared with the paystub generator, so a W-2 can come from any state too.
import { EMPLOYERS } from './employers.util';

/**
 * Deliberately-obvious fake SSN. Uses a single repeated digit (e.g.
 * 222-22-2222) so no student mistakes it for a real number and no
 * randomly-generated form accidentally resembles a real person's SSN.
 * NGPF's convention across classroom materials.
 */
function randomSSN(): string {
  const d = randInt(1, 9);
  return `${d}${d}${d}-${d}${d}-${d}${d}${d}${d}`;
}

/**
 * Deliberately-obvious fake EIN, same repeated-digit convention as randomSSN.
 * IRS never issues EINs with all-repeated digits.
 */
function randomEIN(): string {
  const d = randInt(1, 9);
  return `${d}${d}-${d}${d}${d}${d}${d}${d}${d}`;
}

export function randomW2(now: Date = new Date()): W2 {
  const employer = pick(EMPLOYERS);
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const stateHasTax = hasStateIncomeTax(employer.stateAbbr);

  const isLowWage = Math.random() < 0.2;
  const annualWages = isLowWage
    ? round2(4000 + Math.random() * 11000)
    : round2(randInt(22000, 68000) + Math.random() * 1000);

  const has401k = !isLowWage && Math.random() < 0.5;
  const contrib401k = has401k ? round2(annualWages * pick([0.03, 0.04, 0.05, 0.06])) : 0;

  const wagesBox1 = round2(annualWages - contrib401k);
  const ssWages = annualWages;
  const ssTax = round2(ssWages * 0.062);
  const medicareTax = round2(ssWages * 0.0145);

  // FIT withholds against Box 1 wages (post-401(k)), not the pre-401(k) total.
  const fed = round2(wagesBox1 * effectiveFederalRate(wagesBox1));

  const stateTax = stateHasTax
    ? round2(wagesBox1 * effectiveStateRate(employer.stateAbbr, wagesBox1))
    : 0;

  const employerHealth = isLowWage
    ? 0
    : Math.random() < 0.7
      ? pick([4200, 5400, 6240, 7800])
      : 0;

  const box12 = [];
  if (contrib401k > 0) box12.push({ code: 'D', amount: contrib401k });
  if (employerHealth > 0) box12.push({ code: 'DD', amount: employerHealth });

  const liveInNeighbor = Math.random() < 0.3 && NEIGHBOR_CITIES[employer.stateAbbr];
  const employeeAddrLine2 = liveInNeighbor
    ? pick(NEIGHBOR_CITIES[employer.stateAbbr])
    : employer.addr2;

  return {
    taxYear: now.getFullYear() - 1,
    employeeSSN: randomSSN(),
    employerEIN: randomEIN(),
    employer: { name: employer.name, addressLine1: employer.addr1, addressLine2: employer.addr2 },
    controlNumber: `A${randInt(1000, 9999)}-${randInt(10, 99)}`,
    employee: {
      firstName,
      lastName,
      addressLine1: `${randInt(100, 9999)} ${pick(STREETS)}`,
      addressLine2: employeeAddrLine2,
    },
    wages: wagesBox1,
    fedTaxWithheld: fed,
    ssWages,
    ssTaxWithheld: ssTax,
    medicareWages: ssWages,
    medicareTaxWithheld: medicareTax,
    ssTips: 0,
    allocatedTips: 0,
    dependentCareBenefits: 0,
    nonqualifiedPlans: 0,
    box12,
    statutoryEmployee: false,
    retirementPlan: has401k,
    thirdPartySickPay: false,
    box14: '',
    stateAbbr: employer.stateAbbr,
    employerStateIdNumber: stateHasTax ? `${employer.stateAbbr}-${randInt(10000, 99999)}` : '',
    stateWages: stateHasTax ? wagesBox1 : 0,
    stateTaxWithheld: stateTax,
  };
}

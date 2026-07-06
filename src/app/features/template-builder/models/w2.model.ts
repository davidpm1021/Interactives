export interface W2Box12 {
  code: string;
  amount: number;
}

export interface W2 {
  taxYear: number;
  employeeSSN: string;
  employerEIN: string;
  employer: { name: string; addressLine1: string; addressLine2: string };
  controlNumber: string;
  employee: { firstName: string; lastName: string; addressLine1: string; addressLine2: string };
  wages: number;
  fedTaxWithheld: number;
  ssWages: number;
  ssTaxWithheld: number;
  medicareWages: number;
  medicareTaxWithheld: number;
  box12: W2Box12[];
  statutoryEmployee: boolean;
  retirementPlan: boolean;
  thirdPartySickPay: boolean;
  box14: string;
  stateAbbr: string;
  employerStateIdNumber: string;
  stateWages: number;
  stateTaxWithheld: number;
}

export function emptyBox12(): W2Box12 {
  return { code: '', amount: 0 };
}

export function sampleW2(): W2 {
  return {
    taxYear: 2025,
    employeeSSN: '123-45-6789',
    employerEIN: '93-1234567',
    employer: {
      name: 'Riverside Coffee Co.',
      addressLine1: '482 Market Street',
      addressLine2: 'Portland, OR 97204',
    },
    controlNumber: 'A2204-93',
    employee: {
      firstName: 'Alex',
      lastName: 'Morgan',
      addressLine1: '1130 NE Halsey Street',
      addressLine2: 'Portland, OR 97232',
    },
    wages: 37454.0,
    fedTaxWithheld: 3573.72,
    ssWages: 38954.0,
    ssTaxWithheld: 2415.15,
    medicareWages: 38954.0,
    medicareTaxWithheld: 564.83,
    box12: [
      { code: 'D', amount: 1500.0 },
      { code: 'DD', amount: 6240.0 },
    ],
    statutoryEmployee: false,
    retirementPlan: true,
    thirdPartySickPay: false,
    box14: '',
    stateAbbr: 'OR',
    employerStateIdNumber: 'OR-99841',
    stateWages: 37454.0,
    stateTaxWithheld: 2400.42,
  };
}

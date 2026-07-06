import { FinancialProfile } from '../models/net-worth.models';

/**
 * Two profiles chosen so salary and net worth point in opposite directions.
 * Marcus makes twice what Priya makes and has negative net worth. Priya's
 * home equity flips the story.
 *
 * Edit these values (or the whole profiles) to run different scenarios —
 * the app renders whatever you put here.
 */
export const PROFILE_A: FinancialProfile = {
  id: 'marcus',
  name: 'Marcus',
  age: 32,
  occupation: 'Software sales rep',
  salary: 110000,
  cashOnHand: 8000,
  assets: [
    { label: 'Car', value: 22000 },
  ],
  debts: [
    { label: 'Student loans', value: 45000 },
    { label: 'Credit card', value: 6500 },
    { label: 'Auto loan', value: 16000 },
  ],
};

export const PROFILE_B: FinancialProfile = {
  id: 'priya',
  name: 'Priya',
  age: 34,
  occupation: 'High-school teacher',
  salary: 55000,
  cashOnHand: 4000,
  assets: [
    { label: 'Car', value: 12000 },
    { label: 'Home', value: 160000 },
  ],
  debts: [
    { label: 'Student loans', value: 8000 },
    { label: 'Mortgage', value: 120000 },
  ],
};

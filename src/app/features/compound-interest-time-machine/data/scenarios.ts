import { Scenario } from '../models/compound-interest.models';

export const SCENARIOS: Scenario[] = [
  {
    id: 'high-school-saver',
    label: 'High School Saver',
    description: 'You save $50/month from a part-time job starting at age 16',
    inputs: {
      principal: 500,
      interestRate: 0.07,
      timeHorizon: 10,
      contributionAmount: 50,
      contributionFrequency: 'monthly',
      compoundingFrequency: 'monthly',
    },
  },
  {
    id: 'early-starter',
    label: 'Start at 22',
    description: 'You invest $200/month right after college for 40 years',
    inputs: {
      principal: 1000,
      interestRate: 0.07,
      timeHorizon: 40,
      contributionAmount: 200,
      contributionFrequency: 'monthly',
      compoundingFrequency: 'monthly',
    },
  },
  {
    id: 'late-starter',
    label: 'Start at 35',
    description: 'Same $200/month, but you waited 13 years to start',
    inputs: {
      principal: 1000,
      interestRate: 0.07,
      timeHorizon: 27,
      contributionAmount: 200,
      contributionFrequency: 'monthly',
      compoundingFrequency: 'monthly',
    },
  },
  {
    id: 'lump-sum',
    label: 'Lump Sum Only',
    description: '$5,000 gift - just let it sit for 30 years, no additional contributions',
    inputs: {
      principal: 5000,
      interestRate: 0.07,
      timeHorizon: 30,
      contributionAmount: 0,
      contributionFrequency: 'none',
      compoundingFrequency: 'monthly',
    },
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Set your own values',
    inputs: {
      principal: 1000,
      interestRate: 0.05,
      timeHorizon: 20,
      contributionAmount: 100,
      contributionFrequency: 'monthly',
      compoundingFrequency: 'monthly',
    },
  },
];

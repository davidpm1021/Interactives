import { type GameEvent } from '../models/game.models';

export const EVENTS: readonly GameEvent[] = [
  // ═══════════════════════════════════════
  // SETBACKS (14)
  // ═══════════════════════════════════════

  {
    id: 'S1',
    type: 'setback',
    title: 'Broken Leg',
    narrative: 'Someone in your family just broke their leg.',
    targetCategory: 'insurance-health',
    condition: {
      type: 'has-option',
      check: 'ins-health-1',
      met: { text: "You have health insurance. You're covered! No cost to you.", beans: 0 },
      notMet: { text: "You don't have health insurance. Remove 3 beans.", beans: -3, playerChoice: true },
    },
    consequence: null,
  },
  {
    id: 'S2',
    type: 'setback',
    title: 'Water Damage',
    narrative:
      'An air conditioner leak from your upstairs neighbor destroyed your computer.',
    targetCategory: 'insurance-property',
    condition: {
      type: 'has-option',
      check: 'ins-property-1',
      met: { text: 'Your renters insurance covered the damage! No cost to you.', beans: 0 },
      notMet: {
        text: "You don't have renters insurance. Remove 2 beans.",
        beans: -2,
        playerChoice: true,
      },
    },
    consequence: null,
  },
  {
    id: 'S3',
    type: 'setback',
    title: 'Winter Coat',
    narrative: 'Your winter coat has ripped and cannot be repaired. You must replace it.',
    targetCategory: 'clothing-clothes',
    condition: null,
    consequence: { text: 'Remove 1 bean from any category.', beans: -1, playerChoice: true },
  },
  {
    id: 'S4',
    type: 'setback',
    title: 'Microwave',
    narrative: 'Your microwave broke and you need to replace it.',
    targetCategory: 'furnishings',
    condition: null,
    consequence: { text: 'Remove 1 bean from any category.', beans: -1, playerChoice: true },
  },
  {
    id: 'S5',
    type: 'setback',
    title: 'Mattress Ruined',
    narrative: 'Your mattress got ruined and must be replaced.',
    targetCategory: 'furnishings',
    condition: null,
    consequence: { text: 'Remove 1 bean from any category.', beans: -1, playerChoice: true },
  },
  {
    id: 'S6',
    type: 'setback',
    title: 'Stove Broken',
    narrative:
      "The stove in your apartment has broken and the landlord says it will take a month to replace it. You can't cook hot meals at home.",
    targetCategory: 'food',
    condition: null,
    consequence: {
      text: 'You must move Food to at least tier 2 (3 beans). Adjust your allocation accordingly.',
      beans: 0,
      forceOption: { categoryId: 'food', optionId: 'food-2' },
    },
  },
  {
    id: 'S7',
    type: 'setback',
    title: 'Car Trouble',
    narrative: 'Your car needs an unexpected major repair.',
    targetCategory: 'transportation',
    condition: {
      type: 'has-car',
      check: 'transportation',
      met: { text: 'Your car needs a major repair. Remove 2 beans.', beans: -2, playerChoice: true },
      notMet: { text: "You don't have a car, so this doesn't affect you.", beans: 0 },
    },
    consequence: null,
  },
  {
    id: 'S8',
    type: 'setback',
    title: 'Hours Cut',
    narrative: 'Your employer just cut your hours.',
    targetCategory: null,
    condition: null,
    consequence: { text: 'Remove 2 beans from any categories.', beans: -2, playerChoice: true },
  },
  {
    id: 'S9',
    type: 'setback',
    title: 'Rent Increase',
    narrative: 'Your landlord just raised the rent.',
    targetCategory: 'housing',
    condition: {
      type: 'housing-type',
      check: 'housing-3',
      met: {
        text: 'Your rent went up! Add 1 bean to Housing. Remove it from somewhere else.',
        beans: -1,
        playerChoice: true,
        forceOption: { categoryId: 'housing', optionId: 'housing-3' },
      },
      notMet: {
        text: "You don't rent your own place, so this doesn't affect you.",
        beans: 0,
      },
    },
    consequence: null,
  },
  {
    id: 'S10',
    type: 'setback',
    title: 'Phone Screen Cracked',
    narrative: 'You dropped your phone and the screen is cracked.',
    targetCategory: 'communication-phone',
    condition: {
      type: 'has-phone',
      check: 'communication-phone',
      met: {
        text: 'Your phone screen is cracked. Remove 1 bean from any category.',
        beans: -1,
        playerChoice: true,
      },
      notMet: { text: "You don't have a phone, so this doesn't affect you.", beans: 0 },
    },
    consequence: null,
  },
  {
    id: 'S11',
    type: 'setback',
    title: 'Medical Bill',
    narrative: 'You had to visit urgent care for a bad infection.',
    targetCategory: 'insurance-health',
    condition: {
      type: 'has-option',
      check: 'ins-health-1',
      met: {
        text: 'You have health insurance, but you still owe a copay. Remove 1 bean.',
        beans: -1,
        playerChoice: true,
      },
      notMet: {
        text: "You don't have health insurance. The full bill hits hard. Remove 2 beans.",
        beans: -2,
        playerChoice: true,
      },
    },
    consequence: null,
  },
  {
    id: 'S12',
    type: 'setback',
    title: 'Pet Emergency',
    narrative: 'Your pet needs an emergency vet visit.',
    targetCategory: null,
    condition: null,
    consequence: { text: 'Remove 2 beans from any categories.', beans: -2, playerChoice: true },
  },
  {
    id: 'S13',
    type: 'setback',
    title: 'Identity Theft',
    narrative:
      'Someone stole your identity and drained your checking account. Recovery takes weeks.',
    targetCategory: 'savings',
    condition: {
      type: 'has-savings',
      check: 'savings',
      met: {
        text: 'Your savings cushioned the blow. Reduce your savings by 1 tier.',
        beans: -1,
        forceOption: { categoryId: 'savings', optionId: '__downgrade__' },
      },
      notMet: {
        text: 'With no savings, you have no buffer. Remove 2 beans from any categories.',
        beans: -2,
        playerChoice: true,
      },
    },
    consequence: null,
  },
  {
    id: 'S14',
    type: 'setback',
    title: 'Parking Ticket',
    narrative: "You got a parking ticket you can't contest.",
    targetCategory: 'transportation',
    condition: {
      type: 'has-car',
      check: 'transportation',
      met: { text: 'You got a parking ticket. Remove 1 bean.', beans: -1, playerChoice: true },
      notMet: { text: "You don't have a car, so no parking tickets for you.", beans: 0 },
    },
    consequence: null,
  },

  // ═══════════════════════════════════════
  // FORCED CHOICES (6)
  // ═══════════════════════════════════════

  {
    id: 'F1',
    type: 'forced-choice',
    title: 'Wedding Party',
    narrative:
      'Your best friend is getting married and has asked you to be in the wedding party.',
    targetCategory: 'gifts',
    condition: null,
    consequence: {
      text: 'You must allocate 3 beans to Gifts. Adjust from other categories if needed.',
      beans: 0,
      forceOption: { categoryId: 'gifts-giving', optionId: 'gifts-3' },
    },
  },
  {
    id: 'F2',
    type: 'forced-choice',
    title: 'Roommate Moves Out',
    narrative: 'Your roommate just told you they\'re moving out next month.',
    targetCategory: 'housing',
    condition: {
      type: 'housing-type',
      check: 'housing-2',
      met: {
        text: 'Your roommate moved out! You must upgrade to renting your own place (4 beans).',
        beans: 0,
        forceOption: { categoryId: 'housing', optionId: 'housing-3' },
      },
      notMet: {
        text: "You don't have roommates, so this doesn't affect you.",
        beans: 0,
      },
    },
    consequence: null,
  },
  {
    id: 'F3',
    type: 'forced-choice',
    title: 'Summer Share',
    narrative:
      'Your friends are doing a summer share in a beach house and asked you to join.',
    targetCategory: 'recreation',
    condition: null,
    consequence: {
      text: 'Choose: join the summer share (move 2 beans to Recreation) or decline (no cost).',
      beans: 0,
      playerChoice: true,
    },
  },
  {
    id: 'F4',
    type: 'forced-choice',
    title: 'Family Obligation',
    narrative: 'A family member needs financial help this month.',
    targetCategory: null,
    condition: null,
    consequence: {
      text: 'Remove 1 bean from any category except Housing or Food.',
      beans: -1,
      playerChoice: true,
      protectedCategories: ['housing', 'food'],
    },
  },
  {
    id: 'F5',
    type: 'forced-choice',
    title: 'Job Dress Code',
    narrative: "Your new job requires professional attire you don't currently own.",
    targetCategory: 'clothing-clothes',
    condition: {
      type: 'clothing-level',
      check: 'clothes-0',
      met: {
        text: "You need work clothes! Upgrade Clothing to at least discount/thrift stores (1 bean).",
        beans: 0,
        forceOption: { categoryId: 'clothing-clothes', optionId: 'clothes-1' },
      },
      notMet: {
        text: 'You already buy clothes, so you can manage with your current wardrobe.',
        beans: 0,
      },
    },
    consequence: null,
  },
  {
    id: 'F6',
    type: 'forced-choice',
    title: 'Car Insurance Lapse',
    narrative: 'You got pulled over and realized your insurance lapsed.',
    targetCategory: 'insurance-auto',
    condition: {
      type: 'has-car',
      check: 'transportation',
      met: {
        text: 'You have a car but your insurance lapsed.',
        beans: 0,
      },
      notMet: {
        text: "You don't have a car, so this doesn't affect you.",
        beans: 0,
      },
    },
    consequence: null,
  },

  // ═══════════════════════════════════════
  // ADVANTAGES (7)
  // ═══════════════════════════════════════

  {
    id: 'A1',
    type: 'advantage',
    title: 'Small Raise',
    narrative: 'You just received a raise from your employer!',
    targetCategory: null,
    condition: null,
    consequence: { text: 'Add 2 beans to allocate anywhere.', beans: 2, playerChoice: true },
  },
  {
    id: 'A2',
    type: 'advantage',
    title: 'Tax Refund',
    narrative: 'You filed your taxes and got a refund.',
    targetCategory: null,
    condition: null,
    consequence: { text: 'Add 1 bean to allocate anywhere.', beans: 1, playerChoice: true },
  },
  {
    id: 'A3',
    type: 'advantage',
    title: 'Side Gig',
    narrative: 'You picked up a weekend side gig that pays decently.',
    targetCategory: null,
    condition: null,
    consequence: { text: 'Add 2 beans. Where do you put extra income?', beans: 2, playerChoice: true },
  },
  {
    id: 'A4',
    type: 'advantage',
    title: 'Promotion',
    narrative: 'Your hard work paid off. You got promoted!',
    targetCategory: null,
    condition: null,
    consequence: { text: 'Add 3 beans to allocate anywhere.', beans: 3, playerChoice: true },
  },
  {
    id: 'A5',
    type: 'advantage',
    title: 'Found a Deal',
    narrative: 'You found a great deal on housing. Your rent dropped.',
    targetCategory: 'housing',
    condition: {
      type: 'housing-type',
      check: 'housing-3',
      met: { text: 'Great deal! Free up 1 bean from Housing.', beans: 1 },
      notMet: { text: "You don't rent your own place, so this deal doesn't help you.", beans: 0 },
    },
    consequence: null,
  },
  {
    id: 'A6',
    type: 'advantage',
    title: 'Insurance Saved You',
    narrative: 'A covered incident occurred but your insurance handled it.',
    targetCategory: 'insurance',
    condition: {
      type: 'has-option',
      check: '__any_insurance__',
      met: {
        text: 'Your insurance saved you! No cost. This is why coverage matters.',
        beans: 0,
      },
      notMet: {
        text: '',
        beans: 0,
      },
    },
    consequence: null,
  },
  {
    id: 'A7',
    type: 'advantage',
    title: 'Gift from Family',
    narrative: 'A family member gave you a generous gift to help with expenses.',
    targetCategory: null,
    condition: null,
    consequence: { text: 'Add 1 bean to allocate anywhere.', beans: 1, playerChoice: true },
  },
] as const;

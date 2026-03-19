import { type CategoryConfig } from '../models/game.models';

export const CATEGORIES: readonly CategoryConfig[] = [
  // ⭐ Housing (Required)
  {
    id: 'housing',
    name: 'Housing',
    icon: '🏠',
    required: true,
    multiSelect: false,
    subCategories: null,
    options: [
      { id: 'housing-1', label: 'Living with family, sharing cost of utilities', beans: 2 },
      { id: 'housing-2', label: 'Share an apartment or house with roommates', beans: 3 },
      { id: 'housing-3', label: 'Rent your own place', beans: 4 },
    ],
  },

  // ⭐ Food (Required)
  {
    id: 'food',
    name: 'Food',
    icon: '🍽️',
    required: true,
    multiSelect: false,
    subCategories: null,
    options: [
      { id: 'food-1', label: 'Cook at home; dinner out once a week', beans: 2 },
      { id: 'food-2', label: 'Frequent fast food lunches and weekly dinner out', beans: 3 },
      { id: 'food-3', label: 'All meals away from home', beans: 4 },
    ],
  },

  // ⭐ Insurance (Required — 3 sub-categories)
  {
    id: 'insurance',
    name: 'Insurance',
    icon: '🛡️',
    required: true,
    multiSelect: false,
    subCategories: [
      {
        id: 'insurance-auto',
        name: 'Auto Insurance',
        options: [
          { id: 'ins-auto-0', label: 'No coverage', beans: 0 },
          { id: 'ins-auto-1', label: 'State minimum coverage', beans: 2 },
          { id: 'ins-auto-2', label: 'Additional coverage for your vehicle', beans: 3 },
        ],
        dependencies: [
          {
            dependsOnCategory: 'transportation',
            dependsOnOptionId: 'transport-1',
            effect: 'require',
            message: 'No car means no auto insurance needed',
          },
        ],
      },
      {
        id: 'insurance-health',
        name: 'Health & Disability',
        options: [
          { id: 'ins-health-0', label: 'No coverage', beans: 0 },
          { id: 'ins-health-1', label: 'Basic health coverage', beans: 2 },
        ],
      },
      {
        id: 'insurance-property',
        name: 'Property',
        options: [
          { id: 'ins-property-0', label: 'No coverage', beans: 0 },
          { id: 'ins-property-1', label: 'Renters insurance', beans: 1 },
        ],
        dependencies: [
          {
            dependsOnCategory: 'housing',
            dependsOnOptionId: 'housing-1',
            effect: 'prohibit',
            message: "Renters insurance is for renters - you're living with family",
          },
        ],
      },
    ],
    options: null,
  },

  // ⭐ Clothing (Required — 2 sub-categories)
  {
    id: 'clothing',
    name: 'Clothing & Laundry',
    icon: '👔',
    required: true,
    multiSelect: false,
    subCategories: [
      {
        id: 'clothing-clothes',
        name: 'Clothing',
        options: [
          { id: 'clothes-0', label: 'Wear present wardrobe', beans: 0 },
          { id: 'clothes-1', label: 'Shop at discount or thrift stores', beans: 1 },
          { id: 'clothes-2', label: 'Shop for new clothes', beans: 2 },
          { id: 'clothes-3', label: 'Shop for designer clothes', beans: 3 },
        ],
      },
      {
        id: 'clothing-laundry',
        name: 'Laundry',
        options: [
          { id: 'laundry-0', label: "Do laundry at parent's house", beans: 0 },
          { id: 'laundry-1', label: 'Use laundromat; some dry cleaning', beans: 1 },
          { id: 'laundry-2', label: 'Rent or purchase washer and dryer', beans: 2 },
        ],
      },
    ],
    options: null,
  },

  // ⭐ Transportation (Required)
  {
    id: 'transportation',
    name: 'Transportation',
    icon: '🚗',
    required: true,
    multiSelect: false,
    subCategories: null,
    options: [
      { id: 'transport-1', label: 'Walk or bike', beans: 0 },
      { id: 'transport-2', label: 'Ride bus or join carpool', beans: 1 },
      { id: 'transport-3', label: 'Buy fuel for family car', beans: 2 },
      { id: 'transport-4', label: 'Buy a used car and gas', beans: 3 },
      { id: 'transport-5', label: 'Buy new car and gas', beans: 4 },
    ],
  },

  // ⭐ Furnishings (Required)
  {
    id: 'furnishings',
    name: 'Furnishings',
    icon: '🛋️',
    required: true,
    multiSelect: false,
    subCategories: null,
    options: [
      { id: 'furnish-0', label: 'Second-hand from relatives or friends', beans: 0 },
      { id: 'furnish-1', label: 'Buy at a garage sale, thrift shop, or used online', beans: 1 },
      { id: 'furnish-2', label: 'Rent furniture or live in furnished apartment', beans: 2 },
      { id: 'furnish-3', label: 'Buy new furniture', beans: 2 },
    ],
  },

  // Recreation (Optional)
  {
    id: 'recreation',
    name: 'Recreation',
    icon: '🎮',
    required: false,
    multiSelect: false,
    subCategories: null,
    options: [
      { id: 'rec-0', label: 'Hiking, hanging out with friends, scrolling your phone', beans: 0 },
      { id: 'rec-1', label: 'Streaming service for music, TV, movies', beans: 1 },
      { id: 'rec-2', label: 'Movie theaters, gym membership, clubs or hobby groups', beans: 2 },
      { id: 'rec-3', label: 'Concerts, sporting events', beans: 2 },
      { id: 'rec-4', label: 'Big vacations', beans: 3 },
    ],
  },

  // Communication (Optional, Multi-select)
  {
    id: 'communication',
    name: 'Communication',
    icon: '📱',
    required: false,
    multiSelect: true,
    subCategories: [
      {
        id: 'communication-phone',
        name: 'Phone',
        options: [
          { id: 'comm-phone-0', label: 'No phone', beans: 0 },
          { id: 'comm-phone-1', label: 'Phone with limited data', beans: 1 },
          { id: 'comm-phone-2', label: 'Phone with unlimited data', beans: 2 },
        ],
      },
      {
        id: 'communication-wifi',
        name: 'Wifi',
        options: [
          { id: 'comm-wifi-0', label: 'No wifi at home', beans: 0 },
          { id: 'comm-wifi-1', label: 'Wifi at your home', beans: 1 },
        ],
      },
    ],
    options: null,
  },

  // Personal Care (Optional)
  {
    id: 'personal-care',
    name: 'Personal Care',
    icon: '💆',
    required: false,
    multiSelect: false,
    subCategories: null,
    options: [
      { id: 'pcare-0', label: 'No personal care budget', beans: 0 },
      { id: 'pcare-1', label: 'Basic products: soap, shampoo, toothpaste, make-up, etc.', beans: 1 },
      { id: 'pcare-2', label: 'Occasional professional haircuts, basic personal care products', beans: 2 },
      { id: 'pcare-3', label: 'Regular hairstyling, nails, name brand personal care products', beans: 3 },
    ],
  },

  // Gifts (Optional, Multi-select)
  {
    id: 'gifts',
    name: 'Gifts',
    icon: '🎁',
    required: false,
    multiSelect: true,
    subCategories: [
      {
        id: 'gifts-giving',
        name: 'Gift Giving',
        options: [
          { id: 'gifts-0', label: 'No gift budget', beans: 0 },
          { id: 'gifts-1', label: 'Make your own', beans: 1 },
          { id: 'gifts-2', label: 'Purchase cards or small gifts occasionally', beans: 2 },
          { id: 'gifts-3', label: 'Purchase frequent gifts for family and friends', beans: 3 },
        ],
      },
      {
        id: 'gifts-charity',
        name: 'Charity',
        options: [
          { id: 'charity-0', label: 'No charitable contributions', beans: 0 },
          { id: 'charity-1', label: 'Contributions to charities and/or religious groups', beans: 1 },
        ],
      },
    ],
    options: null,
  },

  // Savings (Optional)
  {
    id: 'savings',
    name: 'Savings',
    icon: '💰',
    required: false,
    multiSelect: false,
    subCategories: null,
    options: [
      { id: 'savings-0', label: 'Keep cash in a piggy bank at home', beans: 0 },
      { id: 'savings-1', label: '5% of income', beans: 1 },
      { id: 'savings-2', label: '10% of income', beans: 2 },
      { id: 'savings-3', label: 'Invest for retirement', beans: 2 },
    ],
  },
] as const;

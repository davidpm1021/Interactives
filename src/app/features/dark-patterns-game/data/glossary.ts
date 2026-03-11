import { DarkPatternKey, GlossaryEntry } from '../models/challenge.model';

export const GLOSSARY: ReadonlyMap<DarkPatternKey, GlossaryEntry> = new Map<
  DarkPatternKey,
  GlossaryEntry
>([
  [
    'confirmshaming',
    {
      key: 'confirmshaming',
      name: 'Confirmshaming',
      definition:
        'Making the decline option use guilt-tripping language to pressure you into accepting.',
      financialConnection:
        'Gets you to enable features that drive impulse spending.',
    },
  ],
  [
    'misdirection',
    {
      key: 'misdirection',
      name: 'Misdirection',
      definition:
        'Using color, size, and placement to make one option obvious and the alternative nearly invisible.',
      financialConnection:
        'Tricks you into accepting data collection or paid add-ons.',
    },
  ],
  [
    'preselection',
    {
      key: 'preselection',
      name: 'Preselection',
      definition:
        'Pre-checking boxes or pre-enabling toggles so the default benefits the company.',
      financialConnection:
        'Quietly adds charges, subscriptions, or data sharing.',
    },
  ],
  [
    'hidden-costs',
    {
      key: 'hidden-costs',
      name: 'Hidden Costs',
      definition:
        "Revealing additional fees late in the process after you're already committed to buying.",
      financialConnection:
        'Directly increases what you pay beyond the advertised price.',
    },
  ],
  [
    'false-urgency',
    {
      key: 'false-urgency',
      name: 'False Urgency',
      definition:
        'Fake countdown timers, low-stock warnings, or "others viewing" messages to rush your decision.',
      financialConnection:
        'Pressures you to buy before comparing prices or thinking it over.',
    },
  ],
  [
    'trick-questions',
    {
      key: 'trick-questions',
      name: 'Trick Questions',
      definition:
        'Confusing phrasing (especially double negatives) so you accidentally choose the opposite of what you want.',
      financialConnection:
        'Opts you into emails, data sharing, or paid services.',
    },
  ],
  [
    'hidden-subscription',
    {
      key: 'hidden-subscription',
      name: 'Hidden Subscription',
      definition:
        'Burying auto-renewal terms in fine print during a "free trial" signup.',
      financialConnection:
        "Charges you monthly long after you've forgotten about it.",
    },
  ],
  [
    'roach-motel',
    {
      key: 'roach-motel',
      name: 'Roach Motel',
      definition:
        'Making it easy to sign up but requiring many confusing steps to cancel.',
      financialConnection:
        'Keeps you paying for services you no longer want.',
    },
  ],
  [
    'forced-continuity',
    {
      key: 'forced-continuity',
      name: 'Forced Continuity',
      definition:
        'Free trials that silently convert to paid subscriptions without a clear reminder.',
      financialConnection:
        'Average person loses $200+/year on forgotten subscriptions.',
    },
  ],
  [
    'disguised-ads',
    {
      key: 'disguised-ads',
      name: 'Disguised Ads',
      definition:
        "Making ads or paid upsells look like regular content or required form fields.",
      financialConnection:
        "Tricks you into applying for products you didn't intend to.",
    },
  ],
]);

import {
  ErrorScenario,
  GuidedScenario,
  PracticeScenario,
  WalkthroughScenario,
} from '../models/check.models';

const TODAY = new Date();
const TODAY_STR = `${(TODAY.getMonth() + 1).toString().padStart(2, '0')}/${TODAY.getDate().toString().padStart(2, '0')}/${TODAY.getFullYear()}`;

const BANK_DEFAULTS = {
  routingNumber: '021000021',
  accountNumber: '1234567890',
};

const SIGNER = 'Alex Morgan';

// ── I do: annotated worked example ───────────────────

export const WALKTHROUGH: WalkthroughScenario = {
  prompt:
    'A friend asks you to chip in $45 for a shared concert ticket. Pay them by check. Here\'s how it should look.',
  check: {
    date: TODAY_STR,
    payee: 'Jamie Rivera',
    amountNumeric: '45.00',
    amountWritten: 'Forty-five and 00/100',
    memo: 'Concert ticket',
    signature: SIGNER,
    checkNumber: '1001',
    ...BANK_DEFAULTS,
  },
  steps: [
    {
      field: 'date',
      value: TODAY_STR,
      callout: "Today's date, in MM/DD/YYYY format.",
    },
    {
      field: 'payee',
      value: 'Jamie Rivera',
      callout: "Who's being paid. Use their full name.",
    },
    {
      field: 'amountNumeric',
      value: '45.00',
      callout: 'The dollar amount in numbers, including cents.',
    },
    {
      field: 'amountWritten',
      value: 'Forty-five and 00/100',
      callout: 'The same amount spelled out, plus the cents as a fraction over 100.',
    },
    {
      field: 'memo',
      value: 'Concert ticket',
      callout: 'A short note about what the payment is for. Optional.',
    },
    {
      field: 'signature',
      value: SIGNER,
      callout: "Your signature. Without it, the check isn't valid.",
    },
  ],
};

// ── We do: guided practice ───────────────────────────

export const GUIDED: GuidedScenario = {
  prompt:
    'Your electric bill came in. Write a check to Northeast Electric for $187.33. Use today\'s date and write "Electric bill" in the memo.',
  expectedCheck: {
    date: TODAY_STR,
    payee: 'Northeast Electric',
    amountNumeric: '187.33',
    amountWritten: 'One hundred eighty-seven and 33/100',
    memo: 'Electric bill',
    signature: SIGNER,
    checkNumber: '1002',
    ...BANK_DEFAULTS,
  },
  fieldHints: {
    date: 'Today\'s date, in MM/DD/YYYY format.',
    payee: 'Who is being paid? The prompt names them.',
    amountNumeric: 'The dollar amount as a number, including cents (e.g. 187.33).',
    amountWritten:
      'Spell it out in words, then "and" then the cents as a fraction (XX/100).',
    memo: 'A short note. The prompt suggests one.',
    signature: 'Click to sign as the account holder.',
  },
};

// ── You do: independent practice ─────────────────────

export const PRACTICE: PracticeScenario = {
  prompt:
    'Your rent is due. Write a check to Riverside Property Management for $1,247.50. Use today\'s date.',
  expectedCheck: {
    date: TODAY_STR,
    payee: 'Riverside Property Management',
    amountNumeric: '1,247.50',
    amountWritten: 'One thousand two hundred forty-seven and 50/100',
    memo: 'April rent',
    signature: SIGNER,
    checkNumber: '1003',
    ...BANK_DEFAULTS,
  },
};

// ── Show understanding: error-spotting scenarios ─────

export const ERROR_SCENARIOS: readonly ErrorScenario[] = [
  {
    id: 'err-mismatch',
    prompt:
      'Someone hands you this check at the counter. Click any field that looks wrong, then submit.',
    check: {
      date: TODAY_STR,
      payee: 'City Water Department',
      amountNumeric: '350.00',
      amountWritten: 'Three hundred fifteen and 00/100',
      memo: 'Water bill',
      signature: 'Taylor Kim',
      checkNumber: '2148',
      ...BANK_DEFAULTS,
    },
    errors: [
      {
        field: 'amountWritten',
        errorType: 'mismatch',
        description:
          'The written amount says "Three hundred fifteen" but the numeric box says "350.00." The two need to match.',
        bestPractice:
          'Always double-check that the numbers and words match before the check leaves your hands.',
      },
    ],
  },
  {
    id: 'err-missing-signature',
    prompt: 'How about this one?',
    check: {
      date: TODAY_STR,
      payee: 'Northeast Electric',
      amountNumeric: '94.50',
      amountWritten: 'Ninety-four and 50/100',
      memo: 'Electric bill',
      signature: '',
      checkNumber: '2149',
      ...BANK_DEFAULTS,
    },
    errors: [
      {
        field: 'signature',
        errorType: 'missing',
        description: 'The check is not signed. Without a signature, it isn\'t authorized.',
        bestPractice:
          'A check is not legally valid until the account holder signs it. The bank will reject an unsigned check.',
      },
    ],
  },
  {
    id: 'err-clean-1',
    prompt: 'And this one. Anything wrong?',
    check: {
      date: TODAY_STR,
      payee: 'Dr. Sarah Chen',
      amountNumeric: '85.00',
      amountWritten: 'Eighty-five and 00/100',
      memo: 'Dental copay',
      signature: 'Jordan Patel',
      checkNumber: '2151',
      ...BANK_DEFAULTS,
    },
    errors: [],
  },
  {
    id: 'err-missing-cents',
    prompt: 'How about this check?',
    check: {
      date: TODAY_STR,
      payee: 'Bayside Tennis Club',
      amountNumeric: '125.00',
      amountWritten: 'One hundred twenty-five dollars',
      memo: 'Court fees',
      signature: 'Morgan Lee',
      checkNumber: '2152',
      ...BANK_DEFAULTS,
    },
    errors: [
      {
        field: 'amountWritten',
        errorType: 'format',
        description:
          'The written amount is missing the cents fraction. The standard form is "and XX/100" (or "and no/100" for zero cents) so there\'s no ambiguity.',
        bestPractice:
          'Always finish the written amount with "and XX/100." This prevents someone from adding cents after the fact.',
      },
    ],
  },
  {
    id: 'err-clean-2',
    prompt: 'Last one. What do you think?',
    check: {
      date: TODAY_STR,
      payee: 'Sunrise Pediatrics',
      amountNumeric: '60.00',
      amountWritten: 'Sixty and 00/100',
      memo: 'Annual visit',
      signature: 'Riley Nguyen',
      checkNumber: '2153',
      ...BANK_DEFAULTS,
    },
    errors: [],
  },
];

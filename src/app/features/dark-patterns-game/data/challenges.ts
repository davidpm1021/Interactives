import { Act, ChallengeDefinition } from '../models/challenge.model';

export const ACTS: readonly Act[] = [
  {
    id: 1,
    title: 'Morning',
    timeOfDay: 'morning',
    subtitle: 'Social Media & Apps',
    description:
      'You wake up, grab your phone, and start your day. Every app has something to ask you...',
    accentColor: '#f59e0b',
  },
  {
    id: 2,
    title: 'Midday',
    timeOfDay: 'midday',
    subtitle: 'Shopping Online',
    description:
      "Time to buy those headphones you've been eyeing. But the checkout process has some surprises...",
    accentColor: '#3b82f6',
  },
  {
    id: 3,
    title: 'Afternoon',
    timeOfDay: 'afternoon',
    subtitle: 'Subscriptions & Entertainment',
    description:
      "You want to watch a new show everyone's talking about. Signing up is easy... but what about when you want to leave?",
    accentColor: '#8b5cf6',
  },
  {
    id: 4,
    title: 'Evening',
    timeOfDay: 'evening',
    subtitle: 'Banking & Finance',
    description:
      'Time to check in on your finances and set up that new bank account. But the fine print is hiding some important details...',
    accentColor: '#10b981',
  },
];

export const CHALLENGES: readonly ChallengeDefinition[] = [
  // --- Act 1: Morning ---
  {
    id: '1-1',
    actId: 1,
    title: 'Notification Permission Popup',
    taskLabel: 'Check that app notification',
    darkPatterns: ['confirmshaming'],
    setupText:
      'A social media app asks to enable push notifications. The "Yes" button is large and colorful. The "No" option is small gray text with guilt-tripping language.',
    correctActionDescription: 'Click the small decline text to reject notifications.',
    failConsequence:
      'You enabled notifications. Studies show push notifications increase impulse purchases by driving you back into apps with flash sales and limited-time offers. Estimated annual cost of impulse purchases driven by notifications: $50–$150.',
    financialImpact: 100,
    realWorldCallout:
      'Apps use confirmshaming to make you feel bad about protecting your attention. The decline option is intentionally worded to guilt you.',
    hasPartialFail: false,
  },
  {
    id: '1-2',
    actId: 1,
    title: 'Cookie Consent Banner',
    taskLabel: 'Read the news',
    darkPatterns: ['misdirection', 'preselection'],
    setupText:
      'A news website shows a cookie banner. "Accept All" is a large, bright button. There\'s no "Reject All" — just a tiny "Manage Preferences" link. Inside, 6 toggles are all pre-set to ON.',
    correctActionDescription:
      'Click "Manage Preferences," toggle all non-essential cookies off, then click "Confirm Choices."',
    failConsequence:
      'You just gave this site permission to track your browsing across the web, build an advertising profile on you, and share that data with dozens of third-party companies.',
    partialFailConsequence:
      'You managed some preferences but left some tracking cookies enabled. Partial data sharing is still happening.',
    financialImpact: 0,
    financialNote:
      'Your browsing data is worth an estimated $35–$240/year to data brokers.',
    realWorldCallout:
      'Cookie banners are designed to make "Accept All" the path of least resistance. The real choices are buried behind extra clicks.',
    hasPartialFail: true,
  },
  {
    id: '1-3',
    actId: 1,
    title: 'App Account Setup',
    taskLabel: 'Create your new shopping account',
    darkPatterns: ['preselection'],
    setupText:
      'You\'re setting up a new account on a shopping app. Below the password field are three pre-checked checkboxes for Terms of Service, marketing emails, and data sharing with "trusted partners."',
    correctActionDescription:
      'Uncheck the marketing emails and data sharing checkboxes before creating the account.',
    failConsequence:
      'You just signed up for marketing emails and gave the company permission to share your data with "trusted partners," which could be hundreds of companies.',
    partialFailConsequence:
      'You unchecked one box but missed the other. You\'re still opted in to either marketing emails or data sharing.',
    financialImpact: 0,
    financialNote: 'No direct cost, but increased inbox spam and data exposure.',
    realWorldCallout:
      'Pre-checked boxes are one of the most common dark patterns. Companies count on you not reading the fine print.',
    hasPartialFail: true,
  },

  // --- Act 2: Midday ---
  {
    id: '2-1',
    actId: 2,
    title: 'False Urgency on Product Page',
    taskLabel: "Buy those headphones you've been eyeing",
    darkPatterns: ['false-urgency'],
    setupText:
      'A product page for $49.99 headphones shows a countdown timer, "Only 3 left!" warning, "17 people viewing" message, and a same-day shipping deadline.',
    correctActionDescription:
      'This is a teaching moment — either "Add to Cart" or "Save for Later" is acceptable. The reveal explains the tricks.',
    failConsequence:
      'These urgency signals are almost always fake. The countdown resets if you refresh. The stock number doesn\'t change. The "people viewing" is randomly generated.',
    financialImpact: 0,
    financialNote:
      'Fake urgency leads 35% of shoppers to buy faster than they planned, often skipping price comparisons.',
    realWorldCallout:
      'Try refreshing the page next time you see a countdown timer or "low stock" warning. Most of the time, nothing changes.',
    hasPartialFail: false,
  },
  {
    id: '2-2',
    actId: 2,
    title: 'Hidden Costs at Checkout',
    taskLabel: 'Check out and pay',
    darkPatterns: ['hidden-costs', 'preselection'],
    setupText:
      'The checkout screen shows your $49.99 headphones plus a surprise $5.99 shipping fee, a pre-checked $7.99 protection plan, and a pre-checked $3.99 "Priority Processing" add-on. Total: $67.96.',
    correctActionDescription:
      'Uncheck both pre-selected add-ons (protection plan and priority processing).',
    failConsequence:
      'You just paid $11.98 in add-ons you didn\'t ask for. The "protection plan" covers almost nothing, and "priority processing" just means normal processing speed. Plus, the $5.99 shipping fee wasn\'t shown until checkout.',
    partialFailConsequence:
      'You unchecked one add-on but missed the other. You\'re still paying for something you didn\'t intentionally choose.',
    financialImpact: 11.98,
    realWorldCallout:
      'Hidden costs added at checkout are so common that the FTC has taken action against companies for "drip pricing" — revealing the true cost only at the last step.',
    hasPartialFail: true,
  },
  {
    id: '2-3',
    actId: 2,
    title: 'Post-Purchase Upsell',
    taskLabel: 'Check your post-purchase offers',
    darkPatterns: ['hidden-subscription', 'forced-continuity'],
    setupText:
      'After your purchase, a popup offers "FREE shipping on all future orders" with a ShopPlus membership — first 30 days free. The big button says "Start Free Trial." In tiny gray text: "Auto-renews at $12.99/month."',
    correctActionDescription:
      'Find and click "No thanks" (small text, not styled as a button) or close the popup.',
    failConsequence:
      'You just signed up for a subscription that auto-renews at $12.99/month. Most people forget to cancel free trials. The average person loses $200+/year on forgotten subscriptions.',
    financialImpact: 155.88,
    realWorldCallout:
      'Free trial traps rely on you forgetting to cancel. Set a calendar reminder the moment you sign up for any free trial.',
    hasPartialFail: false,
  },

  // --- Act 3: Afternoon ---
  {
    id: '3-1',
    actId: 3,
    title: 'Free Trial Signup with Buried Terms',
    taskLabel: 'Sign up for that streaming free trial',
    darkPatterns: ['hidden-subscription', 'trick-questions'],
    setupText:
      'A streaming service offers "Watch FREE for 7 days!" with a payment form. In small text: auto-renews at $14.99/month. There\'s also a tricky double-negative question about promotional emails.',
    correctActionDescription:
      'Notice the auto-renewal terms and answer "Yes" to the double-negative email question (opting OUT of emails).',
    failConsequence:
      'In 7 days, you\'ll be charged $14.99. If you forget to cancel, that\'s $179.88 over a year.',
    partialFailConsequence:
      'You caught one trick but missed the other — either the auto-renewal terms or the double-negative email opt-in.',
    financialImpact: 179.88,
    realWorldCallout:
      'Double-negative questions are designed to confuse you into choosing the opposite of what you want. Always read twice.',
    hasPartialFail: true,
  },
  {
    id: '3-2',
    actId: 3,
    title: 'Cancellation Flow',
    taskLabel: 'Cancel that old streaming subscription',
    darkPatterns: ['roach-motel'],
    setupText:
      "You've decided to cancel your streaming subscription. The cancellation flow is a 4-step gauntlet with retention offers, discounts, guilt trips, and a required reason dropdown.",
    correctActionDescription:
      'Navigate all four cancellation steps without accepting any retention offers.',
    failConsequence:
      "It took 4 separate screens to cancel. This is called a 'roach motel' — easy to get in, hard to get out. The FTC has sued companies over exactly this kind of cancellation flow.",
    partialFailConsequence:
      'You accepted a discount offer. That\'s still $7.50/month for 3 months ($22.50), and it auto-renews to full price after.',
    financialImpact: 22.5,
    financialNote:
      'If you accept the discount: $7.50/month × 3 = $22.50, then auto-renews at full price.',
    realWorldCallout:
      "If a company makes it easy to sign up but hard to cancel, that tells you a lot about how they view their customers.",
    hasPartialFail: true,
  },

  // --- Act 4: Evening ---
  {
    id: '4-1',
    actId: 4,
    title: 'Bank Account Signup with Disguised Opt-ins',
    taskLabel: 'Set up your new bank account',
    darkPatterns: ['disguised-ads', 'preselection'],
    setupText:
      'A bank account application has a pre-checked "IdentityShield" toggle ($9.99/month) styled to look like a security feature, and a credit card ad disguised as part of the application.',
    correctActionDescription:
      'Uncheck the IdentityShield toggle and skip the credit card advertisement.',
    failConsequence:
      'IdentityShield is a third-party service that costs $9.99/month, billed to your new account. The credit card "recommendation" has a 24.99% APR — well above average.',
    partialFailConsequence:
      'You caught one trick but missed the other — either the hidden fee or the disguised ad.',
    financialImpact: 119.88,
    realWorldCallout:
      'Banks and financial institutions often bundle paid add-ons into their signup flow, styled to look like required security features.',
    hasPartialFail: true,
  },
  {
    id: '4-2',
    actId: 4,
    title: 'Privacy Settings Maze',
    taskLabel: 'Review your bank privacy settings',
    darkPatterns: ['misdirection', 'roach-motel'],
    setupText:
      "After creating your bank account, the app asks you to review privacy preferences. Three data-sharing toggles are ON by default — but the toggle visuals are reversed from convention, making OFF look like ON.",
    correctActionDescription:
      'Carefully toggle all three to the actual OFF position, paying attention to the reversed visual convention.',
    failConsequence:
      'You thought you turned off data sharing, but the toggles were designed to trick you. The bank is now sharing your transaction data with marketing partners.',
    partialFailConsequence:
      'You correctly toggled some settings but were tricked by the reversed visuals on others.',
    financialImpact: 0,
    financialNote:
      'Your financial transaction data is among the most valuable personal data for marketers.',
    realWorldCallout:
      'Some companies intentionally reverse toggle conventions or use confusing visual states to trick you into sharing more data.',
    hasPartialFail: true,
  },
];

export function getChallengesByAct(actId: number): readonly ChallengeDefinition[] {
  return CHALLENGES.filter((c) => c.actId === actId);
}

export function getActById(actId: number): Act | undefined {
  return ACTS.find((a) => a.id === actId);
}

import { CATEGORIES } from '../data/categories';
import { type Allocations, type CategoryOption } from '../models/game.models';

interface SlotInfo {
  slotId: string;
  slotName: string;
  options: readonly CategoryOption[];
  required: boolean;
}

/** Narrative-friendly phrases for notable spending choices */
const HIGHLIGHT_PHRASES: Record<string, string> = {
  // Housing
  'housing-3': 'rented your own place',
  // Food
  'food-3': 'ate all your meals out',
  'food-2': 'went out to eat frequently',
  // Clothing
  'clothes-3': 'bought designer clothes',
  'clothes-2': 'shopped for new clothes',
  // Laundry
  'laundry-2': 'got your own washer and dryer',
  // Transportation
  'transport-5': 'bought a new car',
  'transport-4': 'bought a used car',
  // Furnishings
  'furnish-3': 'bought new furniture',
  'furnish-2': 'rented furniture',
  // Insurance
  'ins-auto-2': 'got full auto coverage',
  'ins-health-1': 'got health insurance',
  'ins-property-1': 'got renters insurance',
  // Recreation
  'rec-4': 'planned big vacations',
  'rec-3': 'budgeted for concerts and sporting events',
  'rec-2': 'joined a gym',
  'rec-1': 'paid for streaming services',
  // Communication
  'comm-phone-2': 'got unlimited phone data',
  'comm-phone-1': 'got a phone plan',
  'comm-wifi-1': 'set up wifi at home',
  // Personal Care
  'pcare-3': 'budgeted for regular hairstyling',
  'pcare-2': 'budgeted for haircuts and personal care',
  'pcare-1': 'covered basic personal care',
  // Gifts
  'gifts-3': 'bought frequent gifts for family and friends',
  'gifts-2': 'set aside money for gifts',
  'gifts-1': 'made your own gifts',
  'charity-1': 'donated to charity',
  // Savings
  'savings-3': 'invested for retirement',
  'savings-2': 'saved 10% of your income',
  'savings-1': 'put away some savings',
};

/** Friendly labels for things students went without */
const SKIP_LABELS: Record<string, string> = {
  'insurance-auto': 'auto insurance',
  'insurance-health': 'health insurance',
  'insurance-property': 'renters insurance',
  'communication-phone': 'a phone',
  'communication-wifi': 'home wifi',
  'personal-care': 'personal care',
  recreation: 'recreation',
  'gifts-giving': 'a gift budget',
  'gifts-charity': 'charitable giving',
  savings: 'savings',
};

function getAllSlots(): SlotInfo[] {
  const slots: SlotInfo[] = [];
  for (const cat of CATEGORIES) {
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        slots.push({
          slotId: sub.id,
          slotName: sub.name,
          options: sub.options,
          required: cat.required,
        });
      }
    } else {
      slots.push({
        slotId: cat.id,
        slotName: cat.name,
        options: cat.options!,
        required: cat.required,
      });
    }
  }
  return slots;
}

/** Build a personalized narrative summary of Round 1 allocations */
export function generateRound1Narrative(allocations: Allocations): string {
  const slots = getAllSlots();
  const highlights: { phrase: string; priority: number }[] = [];
  const skips: string[] = [];

  for (const slot of slots) {
    const selectedId = allocations[slot.slotId] as string | undefined;

    if (!selectedId) {
      // Unselected - only note if we have a skip label
      if (SKIP_LABELS[slot.slotId]) {
        skips.push(SKIP_LABELS[slot.slotId]);
      }
      continue;
    }

    const selectedOption = slot.options.find((o) => o.id === selectedId);
    if (!selectedOption) continue;

    // 0-bean selection = "went without"
    if (selectedOption.beans === 0 && SKIP_LABELS[slot.slotId]) {
      skips.push(SKIP_LABELS[slot.slotId]);
      continue;
    }

    const phrase = HIGHLIGHT_PHRASES[selectedId];
    if (!phrase) continue;

    const maxBeans = Math.max(...slot.options.map((o) => o.beans));
    const isTopTier = selectedOption.beans === maxBeans && maxBeans >= 2;

    // Priority: bean cost + bonus for top-tier + bonus for optional spending
    let priority = selectedOption.beans;
    if (isTopTier) priority += 1;
    if (!slot.required) priority += 1;

    highlights.push({ phrase, priority });
  }

  // Sort by priority descending, take top 3
  const topHighlights = highlights
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map((h) => h.phrase);

  if (topHighlights.length > 0 && skips.length > 0) {
    return `You ${joinList(topHighlights)}, but went without ${joinList(skips)}.`;
  }
  if (topHighlights.length > 0) {
    return `You ${joinList(topHighlights)} - and still covered all your needs!`;
  }
  if (skips.length > 0) {
    return `You kept things practical, but went without ${joinList(skips)}.`;
  }
  return 'You found a balanced budget across all categories.';
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

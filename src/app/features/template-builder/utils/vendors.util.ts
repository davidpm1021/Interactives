// Shared vendor pool used by Checkbook Register and Bank Statement generators.
// The VendorPicker enforces realistic transaction frequency: monthly bills
// (rent, electric, mobile, internet) appear at most once per statement, and
// no vendor — including frequent ones like groceries — appears in two
// back-to-back entries.

export type VendorRecurrence = 'monthly' | 'frequent' | 'occasional';
export type VendorRefKind = 'check' | 'pos' | 'ach' | 'atm' | 'dep';

export interface VendorPreset {
  id: string;
  description: string;
  refKind: VendorRefKind;
  amtMin: number;
  amtMax: number;
  recurrence: VendorRecurrence;
  // Only customers in these states get billed by this vendor (e.g. utilities).
  // Undefined = nationwide.
  geoStates?: string[];
}

export const DEBIT_VENDORS: VendorPreset[] = [
  // Monthly bills — at most once per statement.
  { id: 'rent', description: 'Lakeview Apartments (rent)', refKind: 'check', amtMin: 800, amtMax: 1400, recurrence: 'monthly' },
  { id: 'mobile', description: 'Cascade Mobile', refKind: 'ach', amtMin: 50, amtMax: 95, recurrence: 'monthly' },
  { id: 'internet', description: 'Westridge Internet', refKind: 'ach', amtMin: 55, amtMax: 80, recurrence: 'monthly' },
  { id: 'streaming', description: 'Streaming subscription', refKind: 'ach', amtMin: 8, amtMax: 18, recurrence: 'monthly' },
  { id: 'insurance', description: 'Coastline Insurance', refKind: 'ach', amtMin: 90, amtMax: 180, recurrence: 'monthly' },
  { id: 'gym', description: 'Riverside Fitness', refKind: 'ach', amtMin: 25, amtMax: 55, recurrence: 'monthly' },

  // Geographic monthly bills — utilities only match local customers.
  { id: 'electric-pnw', description: 'Pacific NW Electric', refKind: 'check', amtMin: 60, amtMax: 130, recurrence: 'monthly', geoStates: ['OR', 'WA'] },
  { id: 'electric-bayfront', description: 'Bayfront Power', refKind: 'check', amtMin: 70, amtMax: 150, recurrence: 'monthly', geoStates: ['FL', 'CA'] },
  { id: 'electric-greenmtn', description: 'Green Mountain Power', refKind: 'check', amtMin: 60, amtMax: 130, recurrence: 'monthly', geoStates: ['VT', 'NH'] },
  { id: 'electric-prairie', description: 'Prairie Electric Co-op', refKind: 'check', amtMin: 55, amtMax: 120, recurrence: 'monthly', geoStates: ['CO', 'MT', 'TX'] },
  { id: 'electric-badger', description: 'Badger Energy', refKind: 'check', amtMin: 60, amtMax: 130, recurrence: 'monthly', geoStates: ['WI', 'MN', 'NC'] },
  { id: 'water-streamcity', description: 'Stream City Water', refKind: 'check', amtMin: 35, amtMax: 70, recurrence: 'monthly', geoStates: ['WI', 'MN'] },
  { id: 'water-coastline', description: 'Coastline Water', refKind: 'check', amtMin: 32, amtMax: 65, recurrence: 'monthly', geoStates: ['FL', 'CA'] },
  { id: 'water-cascade', description: 'Cascade Water Bureau', refKind: 'check', amtMin: 30, amtMax: 60, recurrence: 'monthly', geoStates: ['OR', 'WA'] },

  // Frequent (multiple per statement OK, but no back-to-back).
  { id: 'grocery', description: 'Greenleaf Grocery', refKind: 'pos', amtMin: 25, amtMax: 110, recurrence: 'frequent' },
  { id: 'coffee', description: 'Brightline Coffee', refKind: 'pos', amtMin: 4, amtMax: 12, recurrence: 'frequent' },
  { id: 'pizza', description: 'Sunset Pizzeria', refKind: 'pos', amtMin: 15, amtMax: 45, recurrence: 'frequent' },
  { id: 'hardware', description: 'Crescent Hardware', refKind: 'pos', amtMin: 12, amtMax: 85, recurrence: 'frequent' },
  { id: 'print', description: 'Atlas Print Shop', refKind: 'pos', amtMin: 8, amtMax: 30, recurrence: 'frequent' },
  { id: 'books', description: 'Ironwood Books', refKind: 'pos', amtMin: 12, amtMax: 40, recurrence: 'frequent' },
  { id: 'gas', description: 'Gas station', refKind: 'pos', amtMin: 18, amtMax: 65, recurrence: 'frequent' },
  { id: 'atm', description: 'Cash withdrawal', refKind: 'atm', amtMin: 20, amtMax: 100, recurrence: 'frequent' },
];

export const CREDIT_VENDORS: VendorPreset[] = [
  { id: 'paycheck', description: 'Paycheck deposit', refKind: 'dep', amtMin: 800, amtMax: 1800, recurrence: 'frequent' },
  { id: 'birthday', description: 'Birthday gift', refKind: 'dep', amtMin: 25, amtMax: 100, recurrence: 'occasional' },
  { id: 'refund', description: 'Tax refund', refKind: 'ach', amtMin: 150, amtMax: 600, recurrence: 'occasional' },
  { id: 'reimburse', description: 'Reimbursement', refKind: 'dep', amtMin: 20, amtMax: 90, recurrence: 'occasional' },
];

export const REF_LABELS: Record<VendorRefKind, string> = {
  check: '',
  pos: 'POS',
  ach: 'ACH',
  atm: 'ATM',
  dep: 'DEP',
};

/**
 * Picks vendors from a pool while enforcing two rules:
 *   1) Monthly vendors appear at most once per VendorPicker lifetime.
 *   2) The same vendor never appears in two adjacent picks (configurable
 *      window for "adjacent").
 */
export class VendorPicker {
  private monthlyUsed = new Set<string>();
  private recent: string[] = [];

  constructor(
    private readonly adjacencyWindow = 3,
    private readonly customerState?: string,
  ) {}

  /**
   * Returns a vendor from `pool`, respecting recurrence and recency rules.
   * Returns null if the pool is fully exhausted by the constraints (caller
   * can fall back to ignoring rules if needed).
   */
  pick(pool: readonly VendorPreset[]): VendorPreset | null {
    const filtered = pool.filter((v) => {
      if (v.recurrence === 'monthly' && this.monthlyUsed.has(v.id)) return false;
      if (this.recent.includes(v.id)) return false;
      if (v.geoStates && this.customerState && !v.geoStates.includes(this.customerState)) {
        return false;
      }
      if (v.geoStates && !this.customerState) return false;
      return true;
    });
    if (filtered.length === 0) return null;
    const chosen = filtered[Math.floor(Math.random() * filtered.length)];
    this.record(chosen);
    return chosen;
  }

  private record(v: VendorPreset): void {
    if (v.recurrence === 'monthly') this.monthlyUsed.add(v.id);
    this.recent.push(v.id);
    if (this.recent.length > this.adjacencyWindow) this.recent.shift();
  }
}

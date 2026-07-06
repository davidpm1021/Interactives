// Shared character / address pools used by every random-*.util.ts in the
// template-builder feature. Centralizing them means a name like "Skyler Hayes"
// or a street like "Spring Hollow Lane" can show up consistently across a
// paystub, a checkbook register, and a credit report.

export const FIRST_NAMES: readonly string[] = [
  'Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie',
  'Drew', 'Quinn', 'Avery', 'Reese', 'Devin', 'Skyler', 'Robin', 'Cameron',
  'Hayden', 'Emerson', 'Sage', 'Rowan', 'Parker', 'Blake', 'Finley', 'Harper',
];

export const LAST_NAMES: readonly string[] = [
  'Morgan', 'Patel', 'Chen', 'Garcia', 'Johnson', 'Nguyen', 'Williams',
  'Davis', 'Lee', 'Brown', 'Martinez', 'Hernandez', 'Walker', 'Thomas',
  'Rivera', 'Cooper', 'Reed', 'Fisher', 'Sullivan', 'Bennett', 'Hayes',
];

export const STREETS: readonly string[] = [
  'NE Halsey St', 'Maple Ave', 'W 14th St', 'Pine Court', 'Sycamore Lane',
  'Adams Boulevard', 'Lincoln Drive', 'Willow Way', 'Riverbend Road',
  'Birchwood Place', 'Spring Hollow Lane', 'Cherry Blossom Drive',
  'Lakeshore Avenue', 'Old Mill Road', 'Sunrise Street',
];

export interface CityEntry {
  city: string;
  state: string;
  zip: string;
}

export const CITIES: readonly CityEntry[] = [
  { city: 'Portland', state: 'OR', zip: '97232' },
  { city: 'Boulder', state: 'CO', zip: '80302' },
  { city: 'Austin', state: 'TX', zip: '78704' },
  { city: 'Madison', state: 'WI', zip: '53703' },
  { city: 'Tampa', state: 'FL', zip: '33602' },
  { city: 'Asheville', state: 'NC', zip: '28801' },
  { city: 'Minneapolis', state: 'MN', zip: '55402' },
  { city: 'San Diego', state: 'CA', zip: '92103' },
  { city: 'Seattle', state: 'WA', zip: '98109' },
  { city: 'Bozeman', state: 'MT', zip: '59715' },
  { city: 'Concord', state: 'NH', zip: '03301' },
  { city: 'Burlington', state: 'VT', zip: '05401' },
];

/**
 * Neighboring cities keyed by state abbreviation. Used by Paystub and W-2 to
 * occasionally have an employee live in a different town than their employer.
 */
export const NEIGHBOR_CITIES: Record<string, readonly string[]> = {
  OR: ['Beaverton, OR 97005', 'Gresham, OR 97030', 'Lake Oswego, OR 97034'],
  CO: ['Lafayette, CO 80026', 'Longmont, CO 80501', 'Louisville, CO 80027'],
  NC: ['Hendersonville, NC 28791', 'Black Mountain, NC 28711'],
  WA: ['Lakewood, WA 98499', 'Puyallup, WA 98371'],
  WI: ['Sun Prairie, WI 53590', 'Fitchburg, WI 53711'],
  CA: ['Chula Vista, CA 91910', 'La Mesa, CA 91942'],
  VT: ['South Burlington, VT 05403', 'Winooski, VT 05404'],
  MN: ['St. Paul, MN 55102', 'Bloomington, MN 55420'],
  TX: ['Round Rock, TX 78664', 'Cedar Park, TX 78613'],
  FL: ['St. Petersburg, FL 33701', 'Brandon, FL 33510'],
  NH: ['Manchester, NH 03101', 'Bow, NH 03304'],
  MT: ['Belgrade, MT 59714', 'Livingston, MT 59047'],
};

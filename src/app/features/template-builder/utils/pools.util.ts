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
  AL: ['Prattville, AL 36067', 'Wetumpka, AL 36092'],
  AK: ['Eagle River, AK 99577', 'Palmer, AK 99645'],
  AZ: ['Tempe, AZ 85281', 'Glendale, AZ 85301'],
  AR: ['Springdale, AR 72762', 'Rogers, AR 72756'],
  CT: ['West Hartford, CT 06107', 'Newington, CT 06111'],
  DE: ['Newark, DE 19711', 'New Castle, DE 19720'],
  GA: ['Decatur, GA 30030', 'Marietta, GA 30060'],
  HI: ['Kailua, HI 96734', 'Pearl City, HI 96782'],
  ID: ['Meridian, ID 83642', 'Nampa, ID 83651'],
  IL: ['Oak Park, IL 60302', 'Evanston, IL 60201'],
  IN: ['Carmel, IN 46032', 'Greenwood, IN 46142'],
  IA: ['West Des Moines, IA 50265', 'Ankeny, IA 50023'],
  KS: ['Eudora, KS 66025', 'Topeka, KS 66603'],
  KY: ['Nicholasville, KY 40356', 'Georgetown, KY 40324'],
  LA: ['Metairie, LA 70001', 'Kenner, LA 70062'],
  ME: ['South Portland, ME 04106', 'Westbrook, ME 04092'],
  MD: ['Towson, MD 21204', 'Dundalk, MD 21222'],
  MA: ['Cambridge, MA 02139', 'Somerville, MA 02143'],
  MI: ['Dearborn, MI 48124', 'Royal Oak, MI 48067'],
  MS: ['Ridgeland, MS 39157', 'Clinton, MS 39056'],
  MO: ['Maplewood, MO 63143', 'Kirkwood, MO 63122'],
  NE: ['Waverly, NE 68462', 'Hickman, NE 68372'],
  NV: ['Henderson, NV 89014', 'North Las Vegas, NV 89030'],
  NJ: ['Highland Park, NJ 08904', 'Edison, NJ 08817'],
  NM: ['Rio Rancho, NM 87124', 'Corrales, NM 87048'],
  NY: ['Cheektowaga, NY 14225', 'Tonawanda, NY 14150'],
  ND: ['West Fargo, ND 58078', 'Horace, ND 58047'],
  OH: ['Dublin, OH 43017', 'Westerville, OH 43081'],
  OK: ['Edmond, OK 73034', 'Moore, OK 73160'],
  PA: ['Upper Darby, PA 19082', 'Drexel Hill, PA 19026'],
  RI: ['Cranston, RI 02910', 'Pawtucket, RI 02860'],
  SC: ['Mount Pleasant, SC 29464', 'North Charleston, SC 29405'],
  SD: ['Box Elder, SD 57719', 'Sturgis, SD 57785'],
  TN: ['Brentwood, TN 37027', 'Hendersonville, TN 37075'],
  UT: ['Murray, UT 84107', 'Sandy, UT 84070'],
  VA: ['Henrico, VA 23228', 'Chesterfield, VA 23832'],
  WV: ['South Charleston, WV 25303', 'Dunbar, WV 25064'],
  WY: ['Burns, WY 82053', 'Pine Bluffs, WY 82082'],
};

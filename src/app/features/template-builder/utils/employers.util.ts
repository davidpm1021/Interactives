/**
 * Fictional employers, one per state, shared by the Paystub and W-2
 * generators.
 *
 * One per state so a teacher can filter to their own and get a local business
 * on the page rather than borrowing another state's. Every name, street and
 * city here is invented; the cities are real places with plausible ZIPs so an
 * address reads as an address, but no business named here exists.
 *
 * Previously the two generators kept separate lists, twelve states for the
 * paystub and eight for the W-2, which is why the paystub's employer-state
 * filter only offered twelve options.
 */
export interface EmployerPool {
  name: string;
  addr1: string;
  addr2: string;
  stateAbbr: string;
  /**
   * Whether the employer plausibly offers a 401(k). Small independent shops
   * (coffee, grocery, pizzeria, bookstore, daycare) usually don't; a
   * logistics, manufacturing or professional-services operation does. The
   * paystub generator only rolls a 401(k) deduction when this is true.
   *
   * Spread across roughly a third of the states rather than concentrated,
   * because with one employer per state this flag also decides whether a
   * teacher filtering to their own state can generate a 401(k) stub at all.
   */
  offers401k: boolean;
}

export const EMPLOYERS: EmployerPool[] = [
  { name: 'Magnolia Auto Care',       addr1: '410 Dexter Avenue',        addr2: 'Montgomery, AL 36104',    stateAbbr: 'AL', offers401k: false },
  { name: 'Kodiak Outfitters',        addr1: '220 Ship Creek Avenue',    addr2: 'Anchorage, AK 99501',     stateAbbr: 'AK', offers401k: false },
  { name: 'Saguaro Landscaping',      addr1: '1830 Camelback Road',      addr2: 'Phoenix, AZ 85015',       stateAbbr: 'AZ', offers401k: false },
  { name: 'Ozark Feed & Supply',      addr1: '95 Dickson Street',        addr2: 'Fayetteville, AR 72701',  stateAbbr: 'AR', offers401k: false },
  { name: 'Sunset Pizzeria',          addr1: '74 Beach Boulevard',       addr2: 'San Diego, CA 92103',     stateAbbr: 'CA', offers401k: false },
  { name: 'Greenleaf Grocery',        addr1: '215 Oak Avenue',           addr2: 'Boulder, CO 80302',       stateAbbr: 'CO', offers401k: false },
  { name: 'Charter Oak Insurance',    addr1: '500 Asylum Avenue',        addr2: 'Hartford, CT 06103',      stateAbbr: 'CT', offers401k: true  },
  { name: 'Brandywine Print Works',   addr1: '88 Market Street',         addr2: 'Wilmington, DE 19801',    stateAbbr: 'DE', offers401k: true  },
  { name: 'Bayfront Dental',          addr1: '95 Harbor Drive',          addr2: 'Tampa, FL 33602',         stateAbbr: 'FL', offers401k: false },
  { name: 'Peachtree Staffing',       addr1: '1201 Peachtree Street',    addr2: 'Atlanta, GA 30309',       stateAbbr: 'GA', offers401k: true  },
  { name: 'Island Breeze Catering',   addr1: '615 Kapiolani Boulevard',  addr2: 'Honolulu, HI 96813',      stateAbbr: 'HI', offers401k: false },
  { name: 'Sawtooth Sporting Goods',  addr1: '74 Capitol Boulevard',     addr2: 'Boise, ID 83702',         stateAbbr: 'ID', offers401k: false },
  { name: 'Lakeshore Freight',        addr1: '2200 South Halsted Street', addr2: 'Chicago, IL 60608',      stateAbbr: 'IL', offers401k: true  },
  { name: 'Wabash Machine Shop',      addr1: '310 Massachusetts Avenue', addr2: 'Indianapolis, IN 46204',  stateAbbr: 'IN', offers401k: true  },
  { name: 'Prairie Grain Co-op',      addr1: '145 Locust Street',        addr2: 'Des Moines, IA 50309',    stateAbbr: 'IA', offers401k: true  },
  { name: 'Sunflower Bakery',         addr1: '622 Massachusetts Street', addr2: 'Lawrence, KS 66044',      stateAbbr: 'KS', offers401k: false },
  { name: 'Bluegrass Landscaping',    addr1: '288 Vine Street',          addr2: 'Lexington, KY 40507',     stateAbbr: 'KY', offers401k: false },
  { name: 'Bayou Seafood Market',     addr1: '730 Magazine Street',      addr2: 'New Orleans, LA 70130',   stateAbbr: 'LA', offers401k: false },
  { name: 'Harborview Boatworks',     addr1: '55 Commercial Street',     addr2: 'Portland, ME 04101',      stateAbbr: 'ME', offers401k: true  },
  { name: 'Chesapeake Marine Supply', addr1: '410 Light Street',         addr2: 'Baltimore, MD 21230',     stateAbbr: 'MD', offers401k: true  },
  { name: 'Beacon Street Books',      addr1: '129 Tremont Street',       addr2: 'Boston, MA 02108',        stateAbbr: 'MA', offers401k: false },
  { name: 'Great Lakes Tool & Die',   addr1: '1520 Woodward Avenue',     addr2: 'Detroit, MI 48226',       stateAbbr: 'MI', offers401k: true  },
  { name: 'Atlas Print Shop',         addr1: '155 Lakeview Drive',       addr2: 'Minneapolis, MN 55402',   stateAbbr: 'MN', offers401k: false },
  { name: 'Delta Cotton Supply',      addr1: '205 Capitol Street',       addr2: 'Jackson, MS 39201',       stateAbbr: 'MS', offers401k: false },
  { name: 'Gateway Moving Co.',       addr1: '840 Olive Street',         addr2: 'St. Louis, MO 63101',     stateAbbr: 'MO', offers401k: true  },
  { name: 'Pioneer Outfitters',       addr1: '38 Mountain View Road',    addr2: 'Bozeman, MT 59715',       stateAbbr: 'MT', offers401k: false },
  { name: 'Cornhusker Grain',         addr1: '318 O Street',             addr2: 'Lincoln, NE 68508',       stateAbbr: 'NE', offers401k: true  },
  { name: 'Silver State Catering',    addr1: '2450 Fremont Street',      addr2: 'Las Vegas, NV 89104',     stateAbbr: 'NV', offers401k: false },
  { name: 'Maple Hill Daycare',       addr1: '11 Sycamore Place',        addr2: 'Concord, NH 03301',       stateAbbr: 'NH', offers401k: false },
  { name: 'Garden State Nursery',     addr1: '165 Raritan Avenue',       addr2: 'New Brunswick, NJ 08901', stateAbbr: 'NJ', offers401k: false },
  { name: 'High Desert Pottery',      addr1: '412 Central Avenue',       addr2: 'Albuquerque, NM 87102',   stateAbbr: 'NM', offers401k: false },
  { name: 'Empire Bagel Company',     addr1: '88 Delaware Avenue',       addr2: 'Buffalo, NY 14202',       stateAbbr: 'NY', offers401k: false },
  { name: 'Crescent Hardware',        addr1: '88 Industrial Way',        addr2: 'Asheville, NC 28801',     stateAbbr: 'NC', offers401k: false },
  { name: 'Red River Equipment',      addr1: '210 Broadway',             addr2: 'Fargo, ND 58102',         stateAbbr: 'ND', offers401k: true  },
  { name: 'Buckeye Auto Glass',       addr1: '1105 High Street',         addr2: 'Columbus, OH 43201',      stateAbbr: 'OH', offers401k: true  },
  { name: 'Sooner Plumbing',          addr1: '640 Robinson Avenue',      addr2: 'Oklahoma City, OK 73102', stateAbbr: 'OK', offers401k: false },
  { name: 'Riverside Coffee Co.',     addr1: '482 Market Street',        addr2: 'Portland, OR 97204',      stateAbbr: 'OR', offers401k: false },
  { name: 'Liberty Bell Bakery',      addr1: '320 Chestnut Street',      addr2: 'Philadelphia, PA 19106',  stateAbbr: 'PA', offers401k: false },
  { name: 'Narragansett Coffee',      addr1: '145 Westminster Street',   addr2: 'Providence, RI 02903',    stateAbbr: 'RI', offers401k: false },
  { name: 'Palmetto Roofing',         addr1: '78 King Street',           addr2: 'Charleston, SC 29401',    stateAbbr: 'SC', offers401k: true  },
  { name: 'Black Hills Hardware',     addr1: '512 Main Street',          addr2: 'Rapid City, SD 57701',    stateAbbr: 'SD', offers401k: false },
  { name: 'Riverbend Music Supply',   addr1: '900 Broadway',             addr2: 'Nashville, TN 37203',     stateAbbr: 'TN', offers401k: false },
  { name: 'Lone Star Auto Parts',     addr1: '720 Crockett Lane',        addr2: 'Austin, TX 78704',        stateAbbr: 'TX', offers401k: true  },
  { name: 'Wasatch Ski Rental',       addr1: '250 State Street',         addr2: 'Salt Lake City, UT 84111', stateAbbr: 'UT', offers401k: false },
  { name: 'Ironwood Books',           addr1: '301 Main Street',          addr2: 'Burlington, VT 05401',    stateAbbr: 'VT', offers401k: false },
  { name: 'Old Dominion Landscaping', addr1: '615 Broad Street',         addr2: 'Richmond, VA 23219',      stateAbbr: 'VA', offers401k: true  },
  { name: 'Brightline Logistics',     addr1: '1450 Cedar Road',          addr2: 'Tacoma, WA 98402',        stateAbbr: 'WA', offers401k: true  },
  { name: 'Mountaineer Hardware',     addr1: '180 Capitol Street',       addr2: 'Charleston, WV 25301',    stateAbbr: 'WV', offers401k: false },
  { name: 'Northside Veterinary',     addr1: '602 Elm Street',           addr2: 'Madison, WI 53703',       stateAbbr: 'WI', offers401k: false },
  { name: 'Frontier Feed & Tack',     addr1: '310 Carey Avenue',         addr2: 'Cheyenne, WY 82001',      stateAbbr: 'WY', offers401k: false },
];

/** States the employer pool can supply, sorted. */
export const EMPLOYER_STATES: readonly string[] = Array.from(
  new Set(EMPLOYERS.map((e) => e.stateAbbr)),
).sort();

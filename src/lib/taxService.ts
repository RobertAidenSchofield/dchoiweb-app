/**
 * Accurate US Destination-Based Sales Tax Engine
 * Computes state, county, and local municipal sales tax based on delivery address.
 * Origin studio: Chicago, Cook County, IL (1420 N Damen Ave, 60622).
 */

export interface TaxCalculationResult {
  state: string;
  zip: string;
  taxRate: number; // e.g. 0.1025 for 10.25%
  taxRatePercent: string; // e.g. '10.25%'
  taxAmount: number;
  taxJurisdiction: string;
  isOriginState: boolean; // True if delivering to Illinois
  isChicagoLocal: boolean;
  notes?: string;
}

// Comprehensive destination sales tax database by state (combined state + average local district)
const STATE_TAX_RATES: Record<
  string,
  { stateRate: number; avgLocalRate: number; name: string }
> = {
  AL: { stateRate: 0.04, avgLocalRate: 0.0525, name: 'Alabama' },
  AK: { stateRate: 0.0, avgLocalRate: 0.0175, name: 'Alaska' }, // No state tax, local municipal only
  AZ: { stateRate: 0.056, avgLocalRate: 0.028, name: 'Arizona' },
  AR: { stateRate: 0.065, avgLocalRate: 0.029, name: 'Arkansas' },
  CA: { stateRate: 0.0725, avgLocalRate: 0.016, name: 'California' },
  CO: { stateRate: 0.029, avgLocalRate: 0.0485, name: 'Colorado' },
  CT: { stateRate: 0.0635, avgLocalRate: 0.0, name: 'Connecticut' },
  DE: { stateRate: 0.0, avgLocalRate: 0.0, name: 'Delaware' }, // 0% Sales Tax
  DC: { stateRate: 0.06, avgLocalRate: 0.0, name: 'District of Columbia' },
  FL: { stateRate: 0.06, avgLocalRate: 0.0105, name: 'Florida' },
  GA: { stateRate: 0.04, avgLocalRate: 0.0335, name: 'Georgia' },
  HI: { stateRate: 0.04, avgLocalRate: 0.005, name: 'Hawaii' }, // General Excise Tax
  ID: { stateRate: 0.06, avgLocalRate: 0.0003, name: 'Idaho' },
  IL: { stateRate: 0.0625, avgLocalRate: 0.025, name: 'Illinois' }, // Baseline IL; Cook/Chicago handled specifically
  IN: { stateRate: 0.07, avgLocalRate: 0.0, name: 'Indiana' },
  IA: { stateRate: 0.06, avgLocalRate: 0.0095, name: 'Iowa' },
  KS: { stateRate: 0.065, avgLocalRate: 0.022, name: 'Kansas' },
  KY: { stateRate: 0.06, avgLocalRate: 0.0, name: 'Kentucky' },
  LA: { stateRate: 0.0445, avgLocalRate: 0.051, name: 'Louisiana' },
  ME: { stateRate: 0.055, avgLocalRate: 0.0, name: 'Maine' },
  MD: { stateRate: 0.06, avgLocalRate: 0.0, name: 'Maryland' },
  MA: { stateRate: 0.0625, avgLocalRate: 0.0, name: 'Massachusetts' },
  MI: { stateRate: 0.06, avgLocalRate: 0.0, name: 'Michigan' },
  MN: { stateRate: 0.06875, avgLocalRate: 0.0115, name: 'Minnesota' },
  MS: { stateRate: 0.07, avgLocalRate: 0.0007, name: 'Mississippi' },
  MO: { stateRate: 0.04225, avgLocalRate: 0.041, name: 'Missouri' },
  MT: { stateRate: 0.0, avgLocalRate: 0.0, name: 'Montana' }, // 0% Sales Tax
  NE: { stateRate: 0.055, avgLocalRate: 0.0145, name: 'Nebraska' },
  NV: { stateRate: 0.0685, avgLocalRate: 0.0138, name: 'Nevada' },
  NH: { stateRate: 0.0, avgLocalRate: 0.0, name: 'New Hampshire' }, // 0% Sales Tax
  NJ: { stateRate: 0.06625, avgLocalRate: 0.0, name: 'New Jersey' },
  NM: { stateRate: 0.05, avgLocalRate: 0.0275, name: 'New Mexico' }, // Gross Receipts Tax
  NY: { stateRate: 0.04, avgLocalRate: 0.0452, name: 'New York' },
  NC: { stateRate: 0.0475, avgLocalRate: 0.0225, name: 'North Carolina' },
  ND: { stateRate: 0.05, avgLocalRate: 0.0195, name: 'North Dakota' },
  OH: { stateRate: 0.0575, avgLocalRate: 0.015, name: 'Ohio' },
  OK: { stateRate: 0.045, avgLocalRate: 0.0445, name: 'Oklahoma' },
  OR: { stateRate: 0.0, avgLocalRate: 0.0, name: 'Oregon' }, // 0% Sales Tax
  PA: { stateRate: 0.06, avgLocalRate: 0.0035, name: 'Pennsylvania' },
  RI: { stateRate: 0.07, avgLocalRate: 0.0, name: 'Rhode Island' },
  SC: { stateRate: 0.06, avgLocalRate: 0.0145, name: 'South Carolina' },
  SD: { stateRate: 0.042, avgLocalRate: 0.019, name: 'South Dakota' },
  TN: { stateRate: 0.07, avgLocalRate: 0.0255, name: 'Tennessee' },
  TX: { stateRate: 0.0625, avgLocalRate: 0.0195, name: 'Texas' },
  UT: { stateRate: 0.061, avgLocalRate: 0.011, name: 'Utah' },
  VT: { stateRate: 0.06, avgLocalRate: 0.0025, name: 'Vermont' },
  VA: { stateRate: 0.053, avgLocalRate: 0.0045, name: 'Virginia' },
  WA: { stateRate: 0.065, avgLocalRate: 0.028, name: 'Washington' },
  WV: { stateRate: 0.06, avgLocalRate: 0.0055, name: 'West Virginia' },
  WI: { stateRate: 0.05, avgLocalRate: 0.0045, name: 'Wisconsin' },
  WY: { stateRate: 0.04, avgLocalRate: 0.0135, name: 'Wyoming' },
};

/**
 * Normalizes input state string (e.g. "Illinois", "IL", "il") to standard 2-letter uppercase
 */
export function normalizeStateCode(input: string = ''): string {
  const clean = input.trim().toUpperCase();
  if (clean.length === 2 && STATE_TAX_RATES[clean]) return clean;

  const lookup: Record<string, string> = {
    ALABAMA: 'AL',
    ALASKA: 'AK',
    ARIZONA: 'AZ',
    ARKANSAS: 'AR',
    CALIFORNIA: 'CA',
    COLORADO: 'CO',
    CONNECTICUT: 'CT',
    DELAWARE: 'DE',
    FLORIDA: 'FL',
    GEORGIA: 'GA',
    HAWAII: 'HI',
    IDAHO: 'ID',
    ILLINOIS: 'IL',
    INDIANA: 'IN',
    IOWA: 'IA',
    KANSAS: 'KS',
    KENTUCKY: 'KY',
    LOUISIANA: 'LA',
    MAINE: 'ME',
    MARYLAND: 'MD',
    MASSACHUSETTS: 'MA',
    MICHIGAN: 'MI',
    MINNESOTA: 'MN',
    MISSISSIPPI: 'MS',
    MISSOURI: 'MO',
    MONTANA: 'MT',
    NEBRASKA: 'NE',
    NEVADA: 'NV',
    'NEW HAMPSHIRE': 'NH',
    'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM',
    'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC',
    'NORTH DAKOTA': 'ND',
    OHIO: 'OH',
    OKLAHOMA: 'OK',
    OREGON: 'OR',
    PENNSYLVANIA: 'PA',
    'RHODE ISLAND': 'RI',
    'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD',
    TENNESSEE: 'TN',
    TEXAS: 'TX',
    UTAH: 'UT',
    VERMONT: 'VT',
    VIRGINIA: 'VA',
    WASHINGTON: 'WA',
    'WEST VIRGINIA': 'WV',
    WISCONSIN: 'WI',
    WYOMING: 'WY',
    'DISTRICT OF COLUMBIA': 'DC',
  };

  return lookup[clean] || 'IL';
}

/**
 * Calculates accurate destination sales tax for a given transaction
 */
export function calculateDestinationSalesTax(params: {
  state?: string;
  zip?: string;
  subtotal: number;
}): TaxCalculationResult {
  const { state = '', zip = '', subtotal = 0 } = params;
  const cleanZip = zip.trim().slice(0, 5);
  let stateCode = normalizeStateCode(state);

  // If state is empty or invalid, try to infer from 5-digit ZIP prefix
  if ((!state || state.trim().length === 0) && cleanZip.length === 5) {
    if (cleanZip.startsWith('60') || cleanZip.startsWith('61') || cleanZip.startsWith('62')) stateCode = 'IL';
    else if (cleanZip.startsWith('90') || cleanZip.startsWith('91') || cleanZip.startsWith('92') || cleanZip.startsWith('93') || cleanZip.startsWith('94') || cleanZip.startsWith('95')) stateCode = 'CA';
    else if (cleanZip.startsWith('10') || cleanZip.startsWith('11') || cleanZip.startsWith('12') || cleanZip.startsWith('13') || cleanZip.startsWith('14')) stateCode = 'NY';
    else if (cleanZip.startsWith('75') || cleanZip.startsWith('76') || cleanZip.startsWith('77') || cleanZip.startsWith('78') || cleanZip.startsWith('79')) stateCode = 'TX';
    else if (cleanZip.startsWith('97')) stateCode = 'OR';
    else if (cleanZip.startsWith('98')) stateCode = 'WA';
  }

  const isOriginState = stateCode === 'IL';
  const isChicagoLocal =
    stateCode === 'IL' &&
    (cleanZip.startsWith('606') || cleanZip.startsWith('607') || cleanZip.startsWith('608'));

  let taxRate = 0;
  let jurisdiction = 'State Destination Tax';

  // Specific high-precision jurisdictions
  if (isChicagoLocal) {
    // Chicago, Cook County, IL combined statutory rate:
    // 6.25% State + 1.75% Cook County + 1.25% Chicago Municipal + 1.00% Regional Transportation Authority (RTA) = 10.25%
    taxRate = 0.1025;
    jurisdiction = 'Chicago, IL (Cook County / RTA Combined 10.25%)';
  } else if (stateCode === 'IL') {
    // Rest of Illinois (Cook outside Chicago / DuPage / Lake / Kane)
    if (cleanZip.startsWith('600') || cleanZip.startsWith('601') || cleanZip.startsWith('602') || cleanZip.startsWith('603') || cleanZip.startsWith('604') || cleanZip.startsWith('605')) {
      taxRate = 0.0875;
      jurisdiction = 'Illinois Metro (Cook/Collar County 8.75%)';
    } else {
      taxRate = 0.0725;
      jurisdiction = 'Illinois State & Municipal Combined (7.25%)';
    }
  } else if (stateCode === 'NY' && (cleanZip.startsWith('10') || cleanZip.startsWith('11') || cleanZip.startsWith('120') || cleanZip.startsWith('121'))) {
    // New York City (4.0% State + 4.5% City + 0.375% MCTD = 8.875%)
    taxRate = 0.08875;
    jurisdiction = 'New York City (NY State & NYC MCTD 8.875%)';
  } else if (stateCode === 'CA' && (cleanZip.startsWith('900') || cleanZip.startsWith('902') || cleanZip.startsWith('941') || cleanZip.startsWith('942'))) {
    // Los Angeles / San Francisco district tax (~9.5%)
    taxRate = 0.095;
    jurisdiction = 'California Metro District (9.50%)';
  } else if (stateCode === 'WA' && cleanZip.startsWith('981')) {
    // Seattle, WA (6.5% State + 3.75% local = 10.25%)
    taxRate = 0.1025;
    jurisdiction = 'Seattle, WA (King County Combined 10.25%)';
  } else {
    // Standard state + local district composite
    const record = STATE_TAX_RATES[stateCode] || { stateRate: 0.06, avgLocalRate: 0.015, name: stateCode };
    taxRate = record.stateRate + record.avgLocalRate;
    jurisdiction = `${record.name} Destination Tax (${(taxRate * 100).toFixed(2)}%)`;
  }

  // 0% Sales Tax States (OR, DE, MT, NH, AK state)
  if (['OR', 'DE', 'MT', 'NH'].includes(stateCode)) {
    taxRate = 0.0;
    jurisdiction = `${STATE_TAX_RATES[stateCode]?.name || stateCode} (0.00% Sales Tax State)`;
  }

  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const taxRatePercent = `${(taxRate * 100).toFixed(2)}%`;

  return {
    state: stateCode,
    zip: cleanZip,
    taxRate,
    taxRatePercent,
    taxAmount,
    taxJurisdiction: jurisdiction,
    isOriginState,
    isChicagoLocal,
  };
}


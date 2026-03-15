const CONVERSIONS: Record<string, { metric: string; factor: number }> = {
  cup: { metric: 'ml', factor: 236.588 },
  cups: { metric: 'ml', factor: 236.588 },
  tbsp: { metric: 'ml', factor: 14.787 },
  tablespoon: { metric: 'ml', factor: 14.787 },
  tablespoons: { metric: 'ml', factor: 14.787 },
  tsp: { metric: 'ml', factor: 4.929 },
  teaspoon: { metric: 'ml', factor: 4.929 },
  teaspoons: { metric: 'ml', factor: 4.929 },
  oz: { metric: 'g', factor: 28.3495 },
  ounce: { metric: 'g', factor: 28.3495 },
  ounces: { metric: 'g', factor: 28.3495 },
  lb: { metric: 'g', factor: 453.592 },
  lbs: { metric: 'g', factor: 453.592 },
  pound: { metric: 'g', factor: 453.592 },
  pounds: { metric: 'g', factor: 453.592 },
  'fl oz': { metric: 'ml', factor: 29.5735 },
  quart: { metric: 'ml', factor: 946.353 },
  quarts: { metric: 'ml', factor: 946.353 },
  gallon: { metric: 'L', factor: 3.785 },
  gallons: { metric: 'L', factor: 3.785 },
  pint: { metric: 'ml', factor: 473.176 },
  pints: { metric: 'ml', factor: 473.176 },
};

// Volume units that can be converted to grams using density data
const VOLUME_UNIT_TO_CUP_FRACTION: Record<string, number> = {
  cup: 1,
  cups: 1,
  tbsp: 1 / 16,
  tablespoon: 1 / 16,
  tablespoons: 1 / 16,
  tsp: 1 / 48,
  teaspoon: 1 / 48,
  teaspoons: 1 / 48,
};

export function toMetric(quantity: number, unit: string): { quantity: number; unit: string } {
  const conversion = CONVERSIONS[unit.toLowerCase().trim()];
  if (!conversion) return { quantity, unit };

  let converted = quantity * conversion.factor;
  let metricUnit = conversion.metric;

  // Convert ml to L if >= 1000
  if (metricUnit === 'ml' && converted >= 1000) {
    converted /= 1000;
    metricUnit = 'L';
  }
  // Convert g to kg if >= 1000
  if (metricUnit === 'g' && converted >= 1000) {
    converted /= 1000;
    metricUnit = 'kg';
  }

  // Round to 1 decimal
  converted = Math.round(converted * 10) / 10;

  return { quantity: converted, unit: metricUnit };
}

export function isImperialUnit(unit: string): boolean {
  return unit.toLowerCase().trim() in CONVERSIONS;
}

/**
 * Looks up grams-per-cup for an ingredient using fuzzy matching against the density map.
 * Tries: exact match, then checks if any key is contained in the ingredient name,
 * or the ingredient name is contained in any key.
 */
export function lookupGramsPerCup(
  ingredient: string,
  densityMap: Map<string, number>
): number | null {
  const lower = ingredient.toLowerCase().trim();

  // Exact match
  const exact = densityMap.get(lower);
  if (exact != null) return exact;

  // Check if any density key is a substring of the ingredient
  // e.g. "parmesan cheese" contains "parmesan"
  // Prefer longest match to avoid false positives
  let bestMatch: string | null = null;
  let bestLen = 0;
  for (const [key, _val] of densityMap) {
    if (lower.includes(key) && key.length > bestLen) {
      bestMatch = key;
      bestLen = key.length;
    }
  }
  if (bestMatch) return densityMap.get(bestMatch)!;

  // Check if ingredient is a substring of any density key
  // e.g. "flour" matches "all-purpose flour"
  for (const [key, val] of densityMap) {
    if (key.includes(lower)) return val;
  }

  return null;
}

/**
 * Converts a quantity+unit+ingredient into a metric display string.
 * Uses density data when available for volume-to-weight conversion of solids.
 * Falls back to standard ml conversion for volume units without density data.
 *
 * Examples:
 *   convertDisplayText(2, "tbsp", "Parmesan cheese", densityMap)  => "13.8 g Parmesan cheese"
 *   convertDisplayText(1, "cup", "flour", densityMap)             => "120 g flour"
 *   convertDisplayText(1, "cup", "stock")                         => "236.6 ml stock"
 *   convertDisplayText(4, "oz", "pork cheek")                     => "113.4 g pork cheek"
 */
export function convertDisplayText(
  quantity: number,
  unit: string,
  ingredient: string,
  densityMap?: Map<string, number>
): string {
  if (!isImperialUnit(unit)) {
    return `${quantity} ${unit} ${ingredient}`.trim();
  }

  const unitLower = unit.toLowerCase().trim();
  const cupFraction = VOLUME_UNIT_TO_CUP_FRACTION[unitLower];

  // If it's a volume unit and we have density data, convert to grams
  if (cupFraction != null && densityMap) {
    const gramsPerCup = lookupGramsPerCup(ingredient, densityMap);
    if (gramsPerCup != null) {
      let grams = quantity * cupFraction * gramsPerCup;
      let metricUnit = 'g';

      if (grams >= 1000) {
        grams /= 1000;
        metricUnit = 'kg';
      }

      grams = Math.round(grams * 10) / 10;
      return `${grams} ${metricUnit} ${ingredient}`.trim();
    }
  }

  // Fall back to standard conversion (ml for volume, g for weight)
  const m = toMetric(quantity, unit);
  return `${m.quantity} ${m.unit} ${ingredient}`.trim();
}

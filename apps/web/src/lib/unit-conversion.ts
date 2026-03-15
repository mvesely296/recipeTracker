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
 * Takes a displayText string and replaces the imperial quantity+unit at the
 * start with its metric equivalent. If the unit is not imperial, returns the
 * original displayText unchanged.
 *
 * Examples:
 *   convertDisplayText("4 oz crispy pork cheek", 4, "oz")  => "113.4 g crispy pork cheek"
 *   convertDisplayText("2 cups flour", 2, "cups")          => "473.2 ml flour"
 */
export function convertDisplayText(displayText: string, quantity: number, unit: string): string {
  if (!isImperialUnit(unit)) return displayText;

  const m = toMetric(quantity, unit);

  // Build a regex that matches the quantity + unit at the start of the string.
  // The quantity in displayText might be formatted differently (e.g. "1/2" vs 0.5),
  // so we match any leading number-like pattern followed by the unit.
  const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^[\\d./\\s-]+\\s*${escapedUnit}\\b`, 'i');

  if (pattern.test(displayText)) {
    return displayText.replace(pattern, `${m.quantity} ${m.unit}`);
  }

  // Fallback: just prepend metric and strip original quantity+unit manually
  return `${m.quantity} ${m.unit} ${displayText.replace(new RegExp(`^[\\d./\\s-]+\\s*${escapedUnit}\\s*`, 'i'), '')}`;
}

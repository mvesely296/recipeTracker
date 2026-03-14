/**
 * Unit conversion utilities
 */

export interface UnitConversion {
  from: string;
  to: string;
  factor: number;
}

// Standard conversions
const conversions: UnitConversion[] = [
  // Volume
  { from: 'tsp', to: 'tbsp', factor: 1 / 3 },
  { from: 'tbsp', to: 'cup', factor: 1 / 16 },
  { from: 'cup', to: 'ml', factor: 236.588 },
  { from: 'ml', to: 'l', factor: 1 / 1000 },

  // Weight
  { from: 'oz', to: 'lb', factor: 1 / 16 },
  { from: 'g', to: 'kg', factor: 1 / 1000 },
  { from: 'oz', to: 'g', factor: 28.3495 },
  { from: 'lb', to: 'kg', factor: 0.453592 },
];

/**
 * Convert quantity from one unit to another
 */
export function convertUnit(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | null {
  if (fromUnit === toUnit) {
    return quantity;
  }

  // Direct conversion
  const direct = conversions.find(
    (c) => c.from === fromUnit && c.to === toUnit
  );
  if (direct) {
    return quantity * direct.factor;
  }

  // Reverse conversion
  const reverse = conversions.find(
    (c) => c.from === toUnit && c.to === fromUnit
  );
  if (reverse) {
    return quantity / reverse.factor;
  }

  // No conversion found
  return null;
}

/**
 * Normalize unit names to standard form
 */
export function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    tablespoon: 'tbsp',
    tablespoons: 'tbsp',
    teaspoon: 'tsp',
    teaspoons: 'tsp',
    cups: 'cup',
    ounce: 'oz',
    ounces: 'oz',
    pound: 'lb',
    pounds: 'lb',
    gram: 'g',
    grams: 'g',
    kilogram: 'kg',
    kilograms: 'kg',
    milliliter: 'ml',
    milliliters: 'ml',
    liter: 'l',
    liters: 'l',
  };

  const lower = unit.toLowerCase().trim();
  return unitMap[lower] || lower;
}

import type { RecipeIngredient } from '@recipe-tracker/types';

/**
 * Scale recipe ingredients to a new serving size
 */
export function scaleIngredients(
  ingredients: RecipeIngredient[],
  originalServings: number,
  newServings: number
): RecipeIngredient[] {
  if (originalServings <= 0 || newServings <= 0) {
    throw new Error('Servings must be positive');
  }

  const scaleFactor = newServings / originalServings;

  return ingredients.map((ing) => ({
    ...ing,
    quantity: roundQuantity(ing.quantity * scaleFactor),
    displayText: formatDisplayText(
      roundQuantity(ing.quantity * scaleFactor),
      ing.unit,
      ing.ingredient
    ),
  }));
}

/**
 * Round quantity to reasonable precision
 */
function roundQuantity(quantity: number): number {
  if (quantity < 0.125) {
    return Math.round(quantity * 16) / 16; // 1/16 precision
  }
  if (quantity < 1) {
    return Math.round(quantity * 4) / 4; // 1/4 precision
  }
  if (quantity < 10) {
    return Math.round(quantity * 2) / 2; // 1/2 precision
  }
  return Math.round(quantity);
}

/**
 * Format display text for ingredient
 */
function formatDisplayText(quantity: number, unit: string, ingredient: string): string {
  // Convert decimal to fraction for common values
  const fractionMap: Record<number, string> = {
    0.25: '1/4',
    0.33: '1/3',
    0.5: '1/2',
    0.67: '2/3',
    0.75: '3/4',
  };

  const decimal = quantity % 1;
  const whole = Math.floor(quantity);

  let quantityStr: string;
  if (decimal === 0) {
    quantityStr = whole.toString();
  } else if (fractionMap[Math.round(decimal * 100) / 100]) {
    quantityStr =
      whole > 0
        ? `${whole} ${fractionMap[Math.round(decimal * 100) / 100]}`
        : fractionMap[Math.round(decimal * 100) / 100];
  } else {
    quantityStr = quantity.toFixed(2).replace(/\.?0+$/, '');
  }

  return `${quantityStr} ${unit} ${ingredient}`;
}

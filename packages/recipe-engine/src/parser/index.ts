import type { NormalizedIngredient } from '@recipe-tracker/types';

export interface ParsedIngredient {
  quantity: number;
  unit: string;
  ingredient: string;
  attributes: string | null;
  brandCandidate: string | null;
}

/**
 * Parse an ingredient string into structured data
 * Example: "1 can San Marzano tomatoes" -> { quantity: 1, unit: "can", ingredient: "tomatoes", ... }
 */
export function parseIngredient(text: string): ParsedIngredient {
  // Basic implementation - would be enhanced with NLP in production
  const parts = text.trim().split(/\s+/);

  // Try to extract quantity
  let quantity = 1;
  let startIndex = 0;

  const firstPart = parts[0];
  const parsedNum = parseFloat(firstPart);
  if (!isNaN(parsedNum)) {
    quantity = parsedNum;
    startIndex = 1;
  }

  // Common units
  const units = [
    'cup',
    'cups',
    'tbsp',
    'tsp',
    'oz',
    'lb',
    'g',
    'kg',
    'ml',
    'l',
    'can',
    'cans',
    'bunch',
    'clove',
    'cloves',
    'piece',
    'pieces',
  ];

  let unit = 'unit';
  if (parts[startIndex] && units.includes(parts[startIndex].toLowerCase())) {
    unit = parts[startIndex].toLowerCase();
    startIndex++;
  }

  // Remaining is the ingredient
  const ingredient = parts.slice(startIndex).join(' ');

  return {
    quantity,
    unit,
    ingredient,
    attributes: null,
    brandCandidate: null,
  };
}

/**
 * Convert parsed ingredient to normalized format
 */
export function normalizeIngredient(parsed: ParsedIngredient): NormalizedIngredient {
  return {
    quantity: parsed.quantity,
    unit: parsed.unit,
    ingredient: parsed.ingredient,
    attributes: parsed.attributes,
    brandCandidate: parsed.brandCandidate,
    category: null,
    displayText: `${parsed.quantity} ${parsed.unit} ${parsed.ingredient}`,
    ingredientCatalogId: null,
  };
}

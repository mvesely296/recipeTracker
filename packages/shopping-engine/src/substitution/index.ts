import type { SubstitutionRule, IngredientCatalog } from '@recipe-tracker/types';

export interface SubstitutionSuggestion {
  originalIngredient: string;
  substitute: string;
  conversionRatio: number;
  notes: string | null;
  source: 'user_rule' | 'system';
}

// Common system substitutions
const systemSubstitutions: Record<string, { substitute: string; ratio: number; notes: string }[]> =
  {
    butter: [
      { substitute: 'margarine', ratio: 1, notes: 'Direct replacement' },
      { substitute: 'coconut oil', ratio: 0.75, notes: 'Use less, adds coconut flavor' },
      { substitute: 'olive oil', ratio: 0.75, notes: 'Use for savory dishes' },
    ],
    'all-purpose flour': [
      { substitute: 'whole wheat flour', ratio: 1, notes: 'Denser texture' },
      { substitute: 'almond flour', ratio: 1, notes: 'Gluten-free, different texture' },
    ],
    'heavy cream': [
      { substitute: 'coconut cream', ratio: 1, notes: 'Dairy-free option' },
      { substitute: 'milk + butter', ratio: 1, notes: 'Mix 3/4 cup milk with 1/4 cup butter' },
    ],
    egg: [
      { substitute: 'flax egg', ratio: 1, notes: '1 tbsp ground flax + 3 tbsp water' },
      { substitute: 'banana', ratio: 0.5, notes: 'Half banana per egg, adds sweetness' },
    ],
  };

/**
 * Find substitutions for an ingredient
 */
export function findSubstitutions(
  ingredientName: string,
  userRules: SubstitutionRule[],
  ingredientCatalog: Map<string, IngredientCatalog>
): SubstitutionSuggestion[] {
  const suggestions: SubstitutionSuggestion[] = [];
  const nameLower = ingredientName.toLowerCase();

  // Check user rules first
  for (const rule of userRules) {
    const sourceIngredient = ingredientCatalog.get(rule.sourceIngredientId);
    const targetIngredient = ingredientCatalog.get(rule.targetIngredientId);

    if (sourceIngredient?.name.toLowerCase() === nameLower && targetIngredient) {
      suggestions.push({
        originalIngredient: ingredientName,
        substitute: targetIngredient.name,
        conversionRatio: rule.conversionRatio,
        notes: rule.notes,
        source: 'user_rule',
      });
    }
  }

  // Check system substitutions
  const systemSubs = systemSubstitutions[nameLower];
  if (systemSubs) {
    for (const sub of systemSubs) {
      // Don't add if user already has a rule for this
      const exists = suggestions.some(
        (s) => s.substitute.toLowerCase() === sub.substitute.toLowerCase()
      );

      if (!exists) {
        suggestions.push({
          originalIngredient: ingredientName,
          substitute: sub.substitute,
          conversionRatio: sub.ratio,
          notes: sub.notes,
          source: 'system',
        });
      }
    }
  }

  return suggestions;
}

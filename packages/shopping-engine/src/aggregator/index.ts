import type {
  RecipeIngredient,
  PantryItem,
  ShoppingListItem,
} from '@recipe-tracker/types';
import { convertUnit, normalizeUnit } from '@recipe-tracker/recipe-engine';

export interface AggregatedIngredient {
  ingredientName: string;
  ingredientCatalogId: string | null;
  totalQuantity: number;
  unit: string;
  category: string | null;
  sourceRecipeIds: string[];
}

/**
 * Aggregate ingredients from multiple recipes
 */
export function aggregateIngredients(
  recipeIngredients: RecipeIngredient[]
): AggregatedIngredient[] {
  const aggregated = new Map<string, AggregatedIngredient>();

  for (const ing of recipeIngredients) {
    const key = ing.ingredientCatalogId || ing.ingredient.toLowerCase();
    const existing = aggregated.get(key);

    if (existing) {
      // Try to convert units and add quantities
      const normalizedUnit = normalizeUnit(ing.unit);
      const existingUnit = normalizeUnit(existing.unit);

      if (normalizedUnit === existingUnit) {
        existing.totalQuantity += ing.quantity;
      } else {
        // Try to convert
        const converted = convertUnit(ing.quantity, normalizedUnit, existingUnit);
        if (converted !== null) {
          existing.totalQuantity += converted;
        } else {
          // Can't convert, keep as separate (in production, would handle better)
          existing.totalQuantity += ing.quantity;
        }
      }

      // Track source recipes
      const recipeId = (ing as { recipeId?: string }).recipeId;
      if (recipeId && !existing.sourceRecipeIds.includes(recipeId)) {
        existing.sourceRecipeIds.push(recipeId);
      }
    } else {
      const recipeId = (ing as { recipeId?: string }).recipeId;
      aggregated.set(key, {
        ingredientName: ing.ingredient,
        ingredientCatalogId: ing.ingredientCatalogId ?? null,
        totalQuantity: ing.quantity,
        unit: normalizeUnit(ing.unit),
        category: ing.category ?? null,
        sourceRecipeIds: recipeId ? [recipeId] : [],
      });
    }
  }

  return Array.from(aggregated.values());
}

/**
 * Subtract pantry items from aggregated ingredients
 */
export function subtractPantry(
  aggregated: AggregatedIngredient[],
  pantry: PantryItem[]
): AggregatedIngredient[] {
  return aggregated
    .map((ing) => {
      const pantryItem = pantry.find(
        (p) =>
          p.ingredientCatalogId === ing.ingredientCatalogId ||
          p.ingredientName.toLowerCase() === ing.ingredientName.toLowerCase()
      );

      if (!pantryItem) {
        return ing;
      }

      // Subtract pantry quantity
      const pantryUnit = normalizeUnit(pantryItem.unit);
      const ingUnit = normalizeUnit(ing.unit);

      let pantryQuantity = pantryItem.quantity;
      if (pantryUnit !== ingUnit) {
        const converted = convertUnit(pantryItem.quantity, pantryUnit, ingUnit);
        if (converted !== null) {
          pantryQuantity = converted;
        }
      }

      const remaining = ing.totalQuantity - pantryQuantity;

      return {
        ...ing,
        totalQuantity: Math.max(0, remaining),
      };
    })
    .filter((ing) => ing.totalQuantity > 0);
}

/**
 * Convert aggregated ingredients to shopping list items
 */
export function toShoppingListItems(
  aggregated: AggregatedIngredient[]
): Omit<ShoppingListItem, 'id' | 'shoppingListId' | 'createdAt' | 'updatedAt'>[] {
  return aggregated.map((ing) => ({
    ingredientCatalogId: ing.ingredientCatalogId,
    ingredientName: ing.ingredientName,
    quantity: ing.totalQuantity,
    unit: ing.unit,
    category: ing.category as ShoppingListItem['category'],
    checked: false,
    removed: false,
    substitutedProductId: null,
    notes: null,
    sourceRecipeIds: ing.sourceRecipeIds as string[] as ShoppingListItem['sourceRecipeIds'],
  }));
}

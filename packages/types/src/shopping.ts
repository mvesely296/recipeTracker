import type { UUID, Timestamps } from './common';
import type { IngredientCategory } from './ingredient';

export interface ShoppingList extends Timestamps {
  id: UUID;
  userId: UUID;
  householdId: UUID | null;
  mealPlanId: UUID | null;
  week: string | null;
  name: string | null;
  status: ShoppingListStatus;
}

export type ShoppingListStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface ShoppingListItem extends Timestamps {
  id: UUID;
  shoppingListId: UUID;
  ingredientCatalogId: UUID | null;
  ingredientName: string;
  quantity: number;
  unit: string;
  category: IngredientCategory | null;
  checked: boolean;
  removed: boolean;
  substitutedProductId: UUID | null;
  notes: string | null;
  // Computed from recipes
  sourceRecipeIds: UUID[];
}

// Grouped shopping list for UI
export interface GroupedShoppingList extends ShoppingList {
  itemsByCategory: Record<IngredientCategory | 'other', ShoppingListItem[]>;
}

// DTOs
export interface UpdateShoppingListItemInput {
  quantity?: number;
  checked?: boolean;
  substitutedProductId?: UUID;
  removed?: boolean;
  notes?: string;
}

export interface GenerateShoppingListInput {
  mealPlanId?: UUID;
  week?: string;
  name?: string;
}

import { create } from 'zustand';
import type { IngredientCategory } from '@recipe-tracker/types';

export interface CartItem {
  ingredientName: string;
  displayText: string;
  quantity: number;
  unit: string;
  category: IngredientCategory | null;
  sourceRecipeIds: string[];
  sourceRecipeTitles: string[];
}

interface CartStore {
  items: CartItem[];
  addRecipe: (recipe: {
    id: string;
    title: string;
    ingredients: Array<{
      quantity: number;
      unit: string;
      ingredient: string;
      displayText: string;
      category: IngredientCategory | null;
    }>;
  }) => void;
  removeRecipe: (recipeId: string) => void;
  removeItem: (ingredientName: string) => void;
  clearCart: () => void;
  isRecipeInCart: (recipeId: string) => boolean;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addRecipe: (recipe) => {
    set((state) => {
      if (state.items.some((item) => item.sourceRecipeIds.includes(recipe.id))) {
        return state;
      }

      const newItems = [...state.items];

      for (const ing of recipe.ingredients) {
        const key = ing.ingredient.toLowerCase().trim();
        const existing = newItems.find(
          (item) => item.ingredientName === key && item.unit === ing.unit
        );

        if (existing) {
          existing.quantity += ing.quantity;
          existing.sourceRecipeIds.push(recipe.id);
          existing.sourceRecipeTitles.push(recipe.title);
        } else {
          newItems.push({
            ingredientName: key,
            displayText: ing.displayText,
            quantity: ing.quantity,
            unit: ing.unit,
            category: ing.category,
            sourceRecipeIds: [recipe.id],
            sourceRecipeTitles: [recipe.title],
          });
        }
      }

      return { items: newItems };
    });
  },

  removeRecipe: (recipeId) => {
    set((state) => ({
      items: state.items
        .map((item) => {
          if (!item.sourceRecipeIds.includes(recipeId)) return item;
          const idx = item.sourceRecipeIds.indexOf(recipeId);
          const newIds = item.sourceRecipeIds.filter((_, i) => i !== idx);
          const newTitles = item.sourceRecipeTitles.filter((_, i) => i !== idx);
          if (newIds.length === 0) return null;
          return { ...item, sourceRecipeIds: newIds, sourceRecipeTitles: newTitles };
        })
        .filter(Boolean) as CartItem[],
    }));
  },

  removeItem: (ingredientName) => {
    set((state) => ({
      items: state.items.filter((item) => item.ingredientName !== ingredientName),
    }));
  },

  clearCart: () => set({ items: [] }),

  isRecipeInCart: (recipeId) => {
    return get().items.some((item) => item.sourceRecipeIds.includes(recipeId));
  },
}));

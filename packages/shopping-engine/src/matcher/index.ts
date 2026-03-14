import type {
  GroceryProduct,
  BrandPreference,
  IngredientCategory,
} from '@recipe-tracker/types';

export interface MatchedProduct {
  product: GroceryProduct;
  score: number;
  matchReason: string;
}

export interface MatchOptions {
  brandPreferences?: BrandPreference[];
  preferOrganic?: boolean;
  preferStoreBrand?: boolean;
}

/**
 * Find the best matching grocery products for an ingredient
 */
export function matchProducts(
  ingredientName: string,
  category: IngredientCategory | null,
  products: GroceryProduct[],
  options: MatchOptions = {}
): MatchedProduct[] {
  const { brandPreferences = [], preferOrganic = false, preferStoreBrand = false } = options;

  // Get brand preferences for this category
  const categoryPrefs = category
    ? brandPreferences.find((p) => p.ingredientCategory === category)
    : null;

  const scored = products
    .filter((p) => p.inStock)
    .map((product) => {
      let score = 0;
      const reasons: string[] = [];

      // Name match (basic fuzzy matching)
      const nameLower = product.name.toLowerCase();
      const searchLower = ingredientName.toLowerCase();

      if (nameLower.includes(searchLower)) {
        score += 50;
        reasons.push('Name match');
      } else if (searchLower.split(' ').some((word) => nameLower.includes(word))) {
        score += 25;
        reasons.push('Partial name match');
      }

      // Brand preference scoring
      if (categoryPrefs && product.brand) {
        const brandLower = product.brand.toLowerCase();

        if (categoryPrefs.preferredBrands.some((b) => brandLower.includes(b.toLowerCase()))) {
          score += 30;
          reasons.push('Preferred brand');
        }

        if (categoryPrefs.dislikedBrands.some((b) => brandLower.includes(b.toLowerCase()))) {
          score -= 50;
          reasons.push('Disliked brand');
        }
      }

      // Organic preference
      if (preferOrganic && nameLower.includes('organic')) {
        score += 10;
        reasons.push('Organic');
      }

      // Store brand preference
      if (preferStoreBrand && !product.brand) {
        score += 10;
        reasons.push('Store brand');
      }

      // Price consideration (lower is better, but capped)
      if (product.price < 5) {
        score += 5;
      }

      return {
        product,
        score,
        matchReason: reasons.join(', ') || 'Default match',
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored;
}

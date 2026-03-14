import { z } from 'zod';

const ingredientCategoryEnum = z.enum([
  'produce',
  'meat',
  'seafood',
  'dairy',
  'bakery',
  'frozen',
  'canned_goods',
  'dry_goods',
  'spices',
  'condiments',
  'beverages',
  'snacks',
  'other',
]);

const brandPreferenceSchema = z.object({
  ingredientCategory: ingredientCategoryEnum,
  preferredBrands: z.array(z.string()).default([]),
  dislikedBrands: z.array(z.string()).default([]),
});

export const updateBrandPreferencesSchema = z.object({
  preferences: z.array(brandPreferenceSchema),
  defaultOrganic: z.boolean().optional(),
  defaultStoreBrand: z.boolean().optional(),
});

const dietaryRestrictionSchema = z.object({
  restrictionType: z.enum([
    'vegetarian',
    'vegan',
    'gluten_free',
    'dairy_free',
    'nut_free',
    'keto',
    'paleo',
    'low_sodium',
    'halal',
    'kosher',
  ]),
  enabled: z.boolean(),
});

const allergySchema = z.object({
  allergen: z.string().min(1),
  severity: z.enum(['mild', 'moderate', 'severe']),
});

export const updateDietPreferencesSchema = z.object({
  restrictions: z.array(dietaryRestrictionSchema).optional(),
  allergies: z.array(allergySchema).optional(),
  maxCaloriesPerMeal: z.number().int().positive().optional(),
  preferredCuisines: z.array(z.string()).optional(),
  dislikedIngredients: z.array(z.string()).optional(),
});

export type UpdateBrandPreferencesInput = z.infer<typeof updateBrandPreferencesSchema>;
export type UpdateDietPreferencesInput = z.infer<typeof updateDietPreferencesSchema>;

import type { UUID, Timestamps } from './common';

// Canonical ingredient from the catalog
export interface IngredientCatalog extends Timestamps {
  id: UUID;
  name: string;
  category: IngredientCategory;
  defaultUnit: string;
  aliases: string[];
  embedding: number[] | null; // pgvector for semantic search
}

export type IngredientCategory =
  | 'produce'
  | 'meat'
  | 'seafood'
  | 'dairy'
  | 'bakery'
  | 'frozen'
  | 'canned_goods'
  | 'dry_goods'
  | 'spices'
  | 'condiments'
  | 'beverages'
  | 'snacks'
  | 'other';

// Normalized ingredient structure (from architecture)
export interface NormalizedIngredient {
  quantity: number;
  unit: string;
  ingredient: string;
  attributes: string | null;
  brandCandidate: string | null;
  category: IngredientCategory | null;
  displayText: string;
  ingredientCatalogId: UUID | null; // Link to canonical ingredient
}

// Brand preferences
export interface BrandPreference extends Timestamps {
  id: UUID;
  userId: UUID;
  ingredientCategory: IngredientCategory;
  preferredBrands: string[];
  dislikedBrands: string[];
}

// Substitution rules
export interface SubstitutionRule extends Timestamps {
  id: UUID;
  userId: UUID;
  sourceIngredientId: UUID;
  targetIngredientId: UUID;
  conversionRatio: number;
  notes: string | null;
}

// Unit conversion
export interface UnitConversion {
  fromUnit: string;
  toUnit: string;
  factor: number;
  ingredientId?: UUID; // Optional: specific to an ingredient
}

import type { UUID, Timestamps } from './common';
import type { NormalizedIngredient } from './ingredient';

export interface Recipe extends Timestamps {
  id: UUID;
  userId: UUID;
  householdId: UUID | null;
  title: string;
  description: string | null;
  servings: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  sourceType: RecipeSourceType;
  sourceUrl: string | null;
  confidenceScore: number;
  imageUrl: string | null;
}

export type RecipeSourceType = 'manual' | 'url' | 'image' | 'youtube' | 'instagram';

export interface RecipeIngredient extends NormalizedIngredient {
  id: UUID;
  recipeId: UUID;
  orderIndex: number;
}

export interface RecipeStep {
  id: UUID;
  recipeId: UUID;
  stepNumber: number;
  instruction: string;
  durationMinutes: number | null;
}

export interface RecipeTag {
  recipeId: UUID;
  tag: string;
}

export interface RecipeSource extends Timestamps {
  id: UUID;
  recipeId: UUID;
  sourceType: RecipeSourceType;
  sourceUrl: string | null;
  sourceMediaId: string | null;
  rawContent: string | null;
}

// Recipe with all related data
export interface RecipeWithDetails extends Recipe {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tags: string[];
}

// DTOs for API
export interface CreateRecipeInput {
  title: string;
  description?: string;
  servings: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  ingredients: Omit<NormalizedIngredient, 'id'>[];
  steps: { stepNumber: number; instruction: string; durationMinutes?: number }[];
  tags?: string[];
}

export interface ImportRecipeInput {
  sourceType: Exclude<RecipeSourceType, 'manual'>;
  sourceUrl?: string;
  sourceMediaId?: string;
}

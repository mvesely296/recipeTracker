import type { UUID, Timestamps } from './common';
import type { RecipeWithDetails } from './recipe';

export interface MealPlan extends Timestamps {
  id: UUID;
  userId: UUID;
  householdId: UUID | null;
  week: string; // ISO week format: YYYY-WXX
  notes: string | null;
}

export interface MealPlanEntry extends Timestamps {
  id: UUID;
  mealPlanId: UUID;
  day: DayOfWeek;
  mealType: MealType;
  recipeId: UUID | null;
  servings: number;
  skipped: boolean;
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Meal plan with recipes populated
export interface MealPlanWithEntries extends MealPlan {
  entries: (MealPlanEntry & { recipe: RecipeWithDetails | null })[];
}

// DTOs
export interface CreateMealPlanInput {
  week: string;
  entries?: MealPlanEntryInput[];
  notes?: string;
}

export interface MealPlanEntryInput {
  day: DayOfWeek;
  mealType: MealType;
  recipeId: UUID | null;
  servings?: number;
  skipped?: boolean;
}

export interface UpdateMealPlanInput {
  entries?: MealPlanEntryInput[];
  notes?: string;
}

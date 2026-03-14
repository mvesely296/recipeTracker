import type { UUID, Timestamps } from './common';

export interface User extends Timestamps {
  id: UUID;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  defaultHouseholdId: UUID | null;
}

export interface Household extends Timestamps {
  id: UUID;
  name: string;
  ownerId: UUID;
}

export interface HouseholdMember {
  householdId: UUID;
  userId: UUID;
  role: HouseholdRole;
  joinedAt: Date;
}

export type HouseholdRole = 'owner' | 'admin' | 'member';

export interface UserPreferences {
  userId: UUID;
  defaultOrganic: boolean;
  defaultStoreBrand: boolean;
  maxCaloriesPerMeal: number | null;
  preferredCuisines: string[];
  dislikedIngredients: string[];
}

export interface DietaryRestriction {
  userId: UUID;
  restrictionType: DietaryRestrictionType;
}

export type DietaryRestrictionType =
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'dairy_free'
  | 'nut_free'
  | 'keto'
  | 'paleo'
  | 'low_sodium'
  | 'halal'
  | 'kosher';

export interface Allergy {
  userId: UUID;
  allergen: string;
  severity: AllergySeverity;
}

export type AllergySeverity = 'mild' | 'moderate' | 'severe';

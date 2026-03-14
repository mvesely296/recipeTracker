import type { UUID, Timestamps } from './common';

export interface PantryItem extends Timestamps {
  id: UUID;
  userId: UUID;
  householdId: UUID | null;
  ingredientCatalogId: UUID | null;
  ingredientName: string;
  quantity: number;
  unit: string;
  expirationDate: Date | null;
  location: PantryLocation;
  confidenceSource: PantryConfidenceSource;
  isLowStock: boolean;
}

export type PantryLocation = 'refrigerator' | 'freezer' | 'pantry' | 'other';

export type PantryConfidenceSource = 'manual' | 'barcode' | 'receipt' | 'photo';

// DTOs
export interface CreatePantryItemInput {
  ingredientCatalogId?: UUID;
  ingredientName: string;
  quantity: number;
  unit: string;
  expirationDate?: string;
  location?: PantryLocation;
  confidenceSource?: PantryConfidenceSource;
}

export interface UpdatePantryItemInput {
  quantity?: number;
  unit?: string;
  expirationDate?: string | null;
  location?: PantryLocation;
  isLowStock?: boolean;
}

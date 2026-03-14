import { z } from 'zod';
import { uuidSchema } from './common';

export const createPantryItemSchema = z.object({
  ingredientCatalogId: uuidSchema.optional(),
  ingredientName: z.string().min(1).max(255),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  expirationDate: z.string().datetime().optional(),
  location: z.enum(['refrigerator', 'freezer', 'pantry', 'other']).default('pantry'),
  confidenceSource: z.enum(['manual', 'barcode', 'receipt', 'photo']).default('manual'),
});

export const updatePantryItemSchema = z.object({
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  expirationDate: z.string().datetime().nullable().optional(),
  location: z.enum(['refrigerator', 'freezer', 'pantry', 'other']).optional(),
  isLowStock: z.boolean().optional(),
});

export const pantryItemParamsSchema = z.object({
  id: uuidSchema,
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemSchema>;
export type UpdatePantryItemInput = z.infer<typeof updatePantryItemSchema>;

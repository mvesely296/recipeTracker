import { z } from 'zod';
import { uuidSchema } from './common';

export const shoppingListParamsSchema = z.object({
  id: uuidSchema,
});

export const shoppingListItemParamsSchema = z.object({
  id: uuidSchema,
  itemId: uuidSchema,
});

export const updateShoppingListItemSchema = z.object({
  quantity: z.number().positive().optional(),
  checked: z.boolean().optional(),
  substitutedProductId: uuidSchema.optional(),
  removed: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export const shoppingListQuerySchema = z.object({
  includeChecked: z.coerce.boolean().default(true),
  groupByCategory: z.coerce.boolean().default(true),
});

export type UpdateShoppingListItemInput = z.infer<typeof updateShoppingListItemSchema>;

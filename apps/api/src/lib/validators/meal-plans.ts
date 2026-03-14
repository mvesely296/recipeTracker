import { z } from 'zod';
import { uuidSchema } from './common';

export const weekSchema = z
  .string()
  .regex(/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/, 'Week must be in format YYYY-WXX (e.g., 2025-W01)');

export const generateListParamsSchema = z.object({
  id: weekSchema,
});

export const mealPlanEntrySchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  recipeId: uuidSchema.nullable(),
  servings: z.number().int().positive().default(2),
  skipped: z.boolean().default(false),
});

export const updateMealPlanSchema = z.object({
  entries: z.array(mealPlanEntrySchema).optional(),
  notes: z.string().max(1000).optional(),
});

export const mealPlanParamsSchema = z.object({
  id: uuidSchema,
});

export type GenerateListParams = z.infer<typeof generateListParamsSchema>;
export type UpdateMealPlanInput = z.infer<typeof updateMealPlanSchema>;

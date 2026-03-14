import { z } from 'zod';
import { uuidSchema } from './common';

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

export const ingredientSchema = z.object({
  quantity: z.number().positive(),
  unit: z.string().min(1),
  ingredient: z.string().min(1),
  attributes: z.string().optional(),
  brandCandidate: z.string().optional(),
  category: ingredientCategoryEnum.optional(),
  displayText: z.string().min(1),
});

export const recipeStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  instruction: z.string().min(1),
  durationMinutes: z.number().int().positive().optional(),
});

export const importRecipeSchema = z
  .object({
    sourceType: z.enum(['url', 'image', 'youtube', 'instagram']),
    sourceUrl: z.string().url().optional(),
    sourceMediaId: z.string().optional(),
  })
  .refine((data) => data.sourceUrl || data.sourceMediaId, {
    message: 'Either sourceUrl or sourceMediaId is required',
  });

export const createManualRecipeSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(recipeStepSchema).min(1),
  servings: z.number().int().positive(),
  prepTimeMinutes: z.number().int().nonnegative().optional(),
  cookTimeMinutes: z.number().int().nonnegative().optional(),
  tags: z.array(z.string()).default([]),
});

export const getRecipeParamsSchema = z.object({
  id: uuidSchema,
});

export type ImportRecipeInput = z.infer<typeof importRecipeSchema>;
export type CreateManualRecipeInput = z.infer<typeof createManualRecipeSchema>;

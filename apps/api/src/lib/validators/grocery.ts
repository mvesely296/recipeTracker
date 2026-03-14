import { z } from 'zod';
import { uuidSchema } from './common';

const cartItemSchema = z.object({
  shoppingListItemId: uuidSchema,
  productId: z.string(),
  quantity: z.number().int().positive(),
  substitutionAllowed: z.boolean().default(true),
});

export const syncCartSchema = z.object({
  provider: z.enum(['instacart', 'walmart', 'kroger']),
  shoppingListId: uuidSchema,
  items: z.array(cartItemSchema).optional(),
  deliveryDate: z.string().datetime().optional(),
  deliveryWindow: z
    .object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    })
    .optional(),
});

export const submitOrderSchema = z.object({
  provider: z.enum(['instacart', 'walmart', 'kroger']),
  cartId: z.string(),
  paymentMethodId: z.string(),
  deliveryInstructions: z.string().max(500).optional(),
  tipAmount: z.number().nonnegative().optional(),
  substitutionPreference: z.enum(['allow_all', 'contact_me', 'refund']).default('contact_me'),
});

export type SyncCartInput = z.infer<typeof syncCartSchema>;
export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;

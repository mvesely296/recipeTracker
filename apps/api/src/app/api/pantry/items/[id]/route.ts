import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import {
  pantryItemParamsSchema,
  updatePantryItemSchema,
  type UpdatePantryItemInput,
} from '@/lib/validators/pantry';
import { NotFoundError } from '@/lib/api/errors';

export const PATCH = createRouteHandler<UpdatePantryItemInput>({
  paramsSchema: pantryItemParamsSchema,
  bodySchema: updatePantryItemSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { params, body }) {
    const updateData: Record<string, unknown> = {};

    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.expirationDate !== undefined) updateData.expiration_date = body.expirationDate;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.isLowStock !== undefined) updateData.is_low_stock = body.isLowStock;

    const { data: item, error } = await supabase
      .from('pantry_items')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !item) {
      throw new NotFoundError('Pantry item');
    }

    return successResponse(item);
  },
});

export const DELETE = createRouteHandler({
  paramsSchema: pantryItemParamsSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { params }) {
    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      throw new NotFoundError('Pantry item');
    }

    return successResponse({ deleted: true });
  },
});

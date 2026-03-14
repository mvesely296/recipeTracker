import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import {
  shoppingListItemParamsSchema,
  updateShoppingListItemSchema,
  type UpdateShoppingListItemInput,
} from '@/lib/validators/shopping-lists';
import { NotFoundError, ForbiddenError } from '@/lib/api/errors';

export const PATCH = createRouteHandler<UpdateShoppingListItemInput>({
  paramsSchema: shoppingListItemParamsSchema,
  bodySchema: updateShoppingListItemSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { params, body }) {
    // Verify user owns the shopping list
    const { data: shoppingList } = await supabase
      .from('shopping_lists')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!shoppingList) {
      throw new NotFoundError('Shopping list');
    }

    if (shoppingList.user_id !== user.id) {
      throw new ForbiddenError();
    }

    const updateData: Record<string, unknown> = {};

    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.checked !== undefined) updateData.checked = body.checked;
    if (body.substitutedProductId !== undefined)
      updateData.substituted_product_id = body.substitutedProductId;
    if (body.removed !== undefined) updateData.removed = body.removed;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data: item, error } = await supabase
      .from('shopping_list_items')
      .update(updateData)
      .eq('id', params.itemId)
      .eq('shopping_list_id', params.id)
      .select()
      .single();

    if (error || !item) {
      throw new NotFoundError('Shopping list item');
    }

    return successResponse(item);
  },
});

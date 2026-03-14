import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import { syncCartSchema, type SyncCartInput } from '@/lib/validators/grocery';
import { NotFoundError, ApiError } from '@/lib/api/errors';

export const POST = createRouteHandler<SyncCartInput>({
  bodySchema: syncCartSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { body }) {
    // Verify shopping list ownership
    const { data: shoppingList } = await supabase
      .from('shopping_lists')
      .select('*, shopping_list_items(*)')
      .eq('id', body.shoppingListId)
      .eq('user_id', user.id)
      .single();

    if (!shoppingList) {
      throw new NotFoundError('Shopping list');
    }

    // Get user's grocery provider credentials
    const { data: credentials } = await supabase
      .from('grocery_provider_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', body.provider)
      .single();

    if (!credentials) {
      throw new ApiError(400, `No ${body.provider} account connected`, 'PROVIDER_NOT_CONNECTED');
    }

    // TODO: Use grocery integration service
    // const adapter = getGroceryAdapter(body.provider);
    // const cart = await adapter.syncCart({ ... });

    return successResponse({
      cartId: 'placeholder-cart-id',
      provider: body.provider,
      itemCount: shoppingList.shopping_list_items?.length || 0,
      status: 'synced',
    });
  },
});

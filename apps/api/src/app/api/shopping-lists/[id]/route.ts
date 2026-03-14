import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import { shoppingListParamsSchema, shoppingListQuerySchema } from '@/lib/validators/shopping-lists';
import { NotFoundError } from '@/lib/api/errors';

export const GET = createRouteHandler({
  paramsSchema: shoppingListParamsSchema,
  querySchema: shoppingListQuerySchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { params, query }) {
    const { data: shoppingList, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !shoppingList) {
      throw new NotFoundError('Shopping list');
    }

    let itemsQuery = supabase
      .from('shopping_list_items')
      .select('*')
      .eq('shopping_list_id', params.id);

    if (!query.includeChecked) {
      itemsQuery = itemsQuery.eq('checked', false);
    }

    const { data: items } = await itemsQuery;

    // Group by category if requested
    let groupedItems: unknown = items || [];
    if (query.groupByCategory && items) {
      const grouped: Record<string, typeof items> = {};
      for (const item of items) {
        const category = item.category || 'other';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(item);
      }
      groupedItems = grouped;
    }

    return successResponse({
      id: shoppingList.id,
      week: shoppingList.week,
      status: shoppingList.status,
      items: groupedItems,
      createdAt: shoppingList.created_at,
      updatedAt: shoppingList.updated_at,
    });
  },
});

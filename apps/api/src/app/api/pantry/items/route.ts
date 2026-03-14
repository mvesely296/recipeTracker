import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import { createPantryItemSchema, type CreatePantryItemInput } from '@/lib/validators/pantry';

export const POST = createRouteHandler<CreatePantryItemInput>({
  bodySchema: createPantryItemSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { body }) {
    const { data: item, error } = await supabase
      .from('pantry_items')
      .insert({
        user_id: user.id,
        ingredient_catalog_id: body.ingredientCatalogId,
        ingredient_name: body.ingredientName,
        quantity: body.quantity,
        unit: body.unit,
        expiration_date: body.expirationDate,
        location: body.location,
        confidence_source: body.confidenceSource,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create pantry item');
    }

    return successResponse(item, 201);
  },
});

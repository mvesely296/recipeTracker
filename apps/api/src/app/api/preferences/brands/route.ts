import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import {
  updateBrandPreferencesSchema,
  type UpdateBrandPreferencesInput,
} from '@/lib/validators/preferences';

export const PATCH = createRouteHandler<UpdateBrandPreferencesInput>({
  bodySchema: updateBrandPreferencesSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { body }) {
    // Upsert brand preferences
    for (const pref of body.preferences) {
      await supabase.from('brand_preferences').upsert(
        {
          user_id: user.id,
          ingredient_category: pref.ingredientCategory,
          preferred_brands: pref.preferredBrands,
          disliked_brands: pref.dislikedBrands,
        },
        {
          onConflict: 'user_id,ingredient_category',
        }
      );
    }

    // Update global preferences
    if (body.defaultOrganic !== undefined || body.defaultStoreBrand !== undefined) {
      await supabase.from('user_preferences').upsert(
        {
          user_id: user.id,
          default_organic: body.defaultOrganic,
          default_store_brand: body.defaultStoreBrand,
        },
        {
          onConflict: 'user_id',
        }
      );
    }

    return successResponse({ updated: true });
  },
});

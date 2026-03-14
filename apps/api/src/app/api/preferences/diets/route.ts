import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import {
  updateDietPreferencesSchema,
  type UpdateDietPreferencesInput,
} from '@/lib/validators/preferences';

export const PATCH = createRouteHandler<UpdateDietPreferencesInput>({
  bodySchema: updateDietPreferencesSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { body }) {
    // Update dietary restrictions
    if (body.restrictions) {
      // Clear existing restrictions
      await supabase.from('dietary_restrictions').delete().eq('user_id', user.id);

      // Insert new restrictions
      const restrictionRecords = body.restrictions
        .filter((r) => r.enabled)
        .map((r) => ({
          user_id: user.id,
          restriction_type: r.restrictionType,
        }));

      if (restrictionRecords.length > 0) {
        await supabase.from('dietary_restrictions').insert(restrictionRecords);
      }
    }

    // Update allergies
    if (body.allergies) {
      await supabase.from('allergies').delete().eq('user_id', user.id);

      if (body.allergies.length > 0) {
        const allergyRecords = body.allergies.map((a) => ({
          user_id: user.id,
          allergen: a.allergen,
          severity: a.severity,
        }));
        await supabase.from('allergies').insert(allergyRecords);
      }
    }

    // Update other preferences
    const prefsUpdate: Record<string, unknown> = { user_id: user.id };
    if (body.maxCaloriesPerMeal !== undefined)
      prefsUpdate.max_calories_per_meal = body.maxCaloriesPerMeal;
    if (body.preferredCuisines !== undefined)
      prefsUpdate.preferred_cuisines = body.preferredCuisines;
    if (body.dislikedIngredients !== undefined)
      prefsUpdate.disliked_ingredients = body.dislikedIngredients;

    await supabase.from('user_preferences').upsert(prefsUpdate, {
      onConflict: 'user_id',
    });

    return successResponse({ updated: true });
  },
});

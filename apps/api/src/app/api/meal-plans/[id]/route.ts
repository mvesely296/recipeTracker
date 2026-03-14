import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import {
  mealPlanParamsSchema,
  updateMealPlanSchema,
  type UpdateMealPlanInput,
} from '@/lib/validators/meal-plans';
import { NotFoundError } from '@/lib/api/errors';

export const PATCH = createRouteHandler<UpdateMealPlanInput>({
  paramsSchema: mealPlanParamsSchema,
  bodySchema: updateMealPlanSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { params, body }) {
    // Verify ownership
    const { data: existing } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      throw new NotFoundError('Meal plan');
    }

    // Update notes if provided
    if (body.notes !== undefined) {
      await supabase.from('meal_plans').update({ notes: body.notes }).eq('id', params.id);
    }

    // Update entries if provided
    if (body.entries) {
      // Delete existing entries
      await supabase.from('meal_plan_entries').delete().eq('meal_plan_id', params.id);

      // Insert new entries
      const entryRecords = body.entries.map((entry) => ({
        meal_plan_id: params.id,
        day: entry.day,
        meal_type: entry.mealType,
        recipe_id: entry.recipeId,
        servings: entry.servings,
        skipped: entry.skipped,
      }));

      await supabase.from('meal_plan_entries').insert(entryRecords);
    }

    return successResponse({ id: params.id, updated: true });
  },
});

import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import { generateListParamsSchema } from '@/lib/validators/meal-plans';
import { NotFoundError } from '@/lib/api/errors';

export const POST = createRouteHandler({
  paramsSchema: generateListParamsSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { params }) {
    // Find meal plan for the week
    const { data: mealPlan } = await supabase
      .from('meal_plans')
      .select(
        `
        *,
        meal_plan_entries (
          *,
          recipe:recipes (
            id,
            recipe_ingredients (*)
          )
        )
      `
      )
      .eq('week', params.week)
      .eq('user_id', user.id)
      .single();

    if (!mealPlan) {
      throw new NotFoundError('Meal plan');
    }

    // Create shopping list record
    const { data: shoppingList, error } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: user.id,
        meal_plan_id: mealPlan.id,
        week: params.week,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create shopping list');
    }

    // TODO: Call shopping-engine to compute items
    // const computedItems = await shoppingEngine.generateList({
    //   mealPlan,
    //   pantryItems,
    //   brandPreferences,
    // });

    return successResponse(
      {
        shoppingListId: shoppingList.id,
        week: params.week,
        itemCount: 0, // Would be computed
        status: 'draft',
      },
      201
    );
  },
});

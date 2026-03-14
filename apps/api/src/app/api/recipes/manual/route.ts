import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import { createManualRecipeSchema, type CreateManualRecipeInput } from '@/lib/validators/recipes';

export const POST = createRouteHandler<CreateManualRecipeInput>({
  bodySchema: createManualRecipeSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { body }) {
    // Create recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        title: body.title,
        description: body.description,
        servings: body.servings,
        prep_time_minutes: body.prepTimeMinutes,
        cook_time_minutes: body.cookTimeMinutes,
        source_type: 'manual',
        confidence_score: 1.0,
      })
      .select()
      .single();

    if (recipeError || !recipe) {
      throw new Error('Failed to create recipe');
    }

    // Insert ingredients
    const ingredientRecords = body.ingredients.map((ing, index) => ({
      recipe_id: recipe.id,
      order_index: index,
      quantity: ing.quantity,
      unit: ing.unit,
      ingredient: ing.ingredient,
      attributes: ing.attributes,
      brand_candidate: ing.brandCandidate,
      category: ing.category,
      display_text: ing.displayText,
    }));

    await supabase.from('recipe_ingredients').insert(ingredientRecords);

    // Insert steps
    const stepRecords = body.steps.map((step) => ({
      recipe_id: recipe.id,
      step_number: step.stepNumber,
      instruction: step.instruction,
      duration_minutes: step.durationMinutes,
    }));

    await supabase.from('recipe_steps').insert(stepRecords);

    // Insert tags
    if (body.tags.length > 0) {
      const tagRecords = body.tags.map((tag) => ({
        recipe_id: recipe.id,
        tag,
      }));
      await supabase.from('recipe_tags').insert(tagRecords);
    }

    return successResponse(
      {
        id: recipe.id,
        title: recipe.title,
        createdAt: recipe.created_at,
      },
      201
    );
  },
});

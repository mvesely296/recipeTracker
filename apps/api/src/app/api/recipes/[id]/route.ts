import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import { getRecipeParamsSchema } from '@/lib/validators/recipes';
import { NotFoundError } from '@/lib/api/errors';

export const GET = createRouteHandler({
  paramsSchema: getRecipeParamsSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { params }) {
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select(
        `
        *,
        recipe_ingredients (*),
        recipe_steps (*),
        recipe_tags (tag)
      `
      )
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !recipe) {
      throw new NotFoundError('Recipe');
    }

    return successResponse({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      servings: recipe.servings,
      prepTimeMinutes: recipe.prep_time_minutes,
      cookTimeMinutes: recipe.cook_time_minutes,
      sourceType: recipe.source_type,
      sourceUrl: recipe.source_url,
      ingredients: recipe.recipe_ingredients,
      steps: recipe.recipe_steps,
      tags: recipe.recipe_tags.map((t: { tag: string }) => t.tag),
      confidenceScore: recipe.confidence_score,
      createdAt: recipe.created_at,
      updatedAt: recipe.updated_at,
    });
  },
});

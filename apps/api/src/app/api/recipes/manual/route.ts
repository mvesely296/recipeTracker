import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { recipes, recipeIngredients, recipeSteps, recipeTags } from '@recipe-tracker/db';
import { createManualRecipeSchema } from '@/lib/validators/recipes';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { handleError } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const rawBody = await request.json();
    const body = createManualRecipeSchema.parse(rawBody);

    const db = getDb();

    // Create recipe
    const [recipe] = await db
      .insert(recipes)
      .values({
        userId: user.id,
        title: body.title,
        description: body.description,
        servings: body.servings,
        prepTimeMinutes: body.prepTimeMinutes,
        cookTimeMinutes: body.cookTimeMinutes,
        sourceType: 'manual',
        confidenceScore: 1.0,
      })
      .returning();

    // Insert ingredients
    if (body.ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        body.ingredients.map((ing, index) => ({
          recipeId: recipe.id,
          orderIndex: index,
          quantity: ing.quantity,
          unit: ing.unit,
          ingredient: ing.ingredient,
          attributes: ing.attributes ?? null,
          brandCandidate: ing.brandCandidate ?? null,
          category: ing.category ?? null,
          displayText: ing.displayText,
        }))
      );
    }

    // Insert steps
    if (body.steps.length > 0) {
      await db.insert(recipeSteps).values(
        body.steps.map((step) => ({
          recipeId: recipe.id,
          stepNumber: step.stepNumber,
          instruction: step.instruction,
          durationMinutes: step.durationMinutes ?? null,
        }))
      );
    }

    // Insert tags
    if (body.tags.length > 0) {
      await db.insert(recipeTags).values(
        body.tags.map((tag) => ({
          recipeId: recipe.id,
          tag,
        }))
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: recipe.id,
          title: recipe.title,
          createdAt: recipe.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

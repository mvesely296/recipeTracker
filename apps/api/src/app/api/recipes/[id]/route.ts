import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { recipes, recipeIngredients, recipeSteps, recipeTags } from '@recipe-tracker/db';
import { updateRecipeSchema } from '@/lib/validators/recipes';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { handleError } from '@/lib/api/response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = getDb();

    const [recipe] = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, user.id)));

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Recipe not found' } },
        { status: 404 }
      );
    }

    const ingredients = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, id));

    const steps = await db
      .select()
      .from(recipeSteps)
      .where(eq(recipeSteps.recipeId, id));

    const tags = await db
      .select()
      .from(recipeTags)
      .where(eq(recipeTags.recipeId, id));

    return NextResponse.json({
      success: true,
      data: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        servings: recipe.servings,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        sourceType: recipe.sourceType,
        sourceUrl: recipe.sourceUrl,
        imageUrl: recipe.imageUrl,
        confidenceScore: recipe.confidenceScore,
        approved: recipe.approved,
        ingredients: ingredients.map((ing) => ({
          id: ing.id,
          recipeId: ing.recipeId,
          orderIndex: ing.orderIndex,
          quantity: ing.quantity,
          unit: ing.unit,
          ingredient: ing.ingredient,
          attributes: ing.attributes,
          brandCandidate: ing.brandCandidate,
          category: ing.category,
          displayText: ing.displayText,
        })),
        steps: steps.map((s) => ({
          id: s.id,
          recipeId: s.recipeId,
          stepNumber: s.stepNumber,
          instruction: s.instruction,
          durationMinutes: s.durationMinutes,
        })),
        tags: tags.map((t) => t.tag),
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const rawBody = await request.json();
    const body = updateRecipeSchema.parse(rawBody);

    const db = getDb();

    // Verify recipe exists and belongs to user
    const [existing] = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, user.id)));

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Recipe not found' } },
        { status: 404 }
      );
    }

    // Update recipe fields
    const recipeUpdate: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (body.title !== undefined) recipeUpdate.title = body.title;
    if (body.description !== undefined) recipeUpdate.description = body.description;
    if (body.servings !== undefined) recipeUpdate.servings = body.servings;
    if (body.prepTimeMinutes !== undefined) recipeUpdate.prepTimeMinutes = body.prepTimeMinutes;
    if (body.cookTimeMinutes !== undefined) recipeUpdate.cookTimeMinutes = body.cookTimeMinutes;
    if (body.approved !== undefined) recipeUpdate.approved = body.approved;

    await db
      .update(recipes)
      .set(recipeUpdate)
      .where(eq(recipes.id, id));

    // Replace ingredients if provided
    if (body.ingredients) {
      await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
      await db.insert(recipeIngredients).values(
        body.ingredients.map((ing, index) => ({
          recipeId: id,
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

    // Replace steps if provided
    if (body.steps) {
      await db.delete(recipeSteps).where(eq(recipeSteps.recipeId, id));
      await db.insert(recipeSteps).values(
        body.steps.map((step) => ({
          recipeId: id,
          stepNumber: step.stepNumber,
          instruction: step.instruction,
          durationMinutes: step.durationMinutes ?? null,
        }))
      );
    }

    // Replace tags if provided
    if (body.tags) {
      await db.delete(recipeTags).where(eq(recipeTags.recipeId, id));
      if (body.tags.length > 0) {
        await db.insert(recipeTags).values(
          body.tags.map((tag) => ({
            recipeId: id,
            tag,
          }))
        );
      }
    }

    // Fetch and return the updated recipe (same format as GET)
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id));

    const ingredients = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, id));

    const steps = await db
      .select()
      .from(recipeSteps)
      .where(eq(recipeSteps.recipeId, id));

    const tags = await db
      .select()
      .from(recipeTags)
      .where(eq(recipeTags.recipeId, id));

    return NextResponse.json({
      success: true,
      data: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        servings: recipe.servings,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        sourceType: recipe.sourceType,
        sourceUrl: recipe.sourceUrl,
        imageUrl: recipe.imageUrl,
        confidenceScore: recipe.confidenceScore,
        approved: recipe.approved,
        ingredients: ingredients.map((ing) => ({
          id: ing.id,
          recipeId: ing.recipeId,
          orderIndex: ing.orderIndex,
          quantity: ing.quantity,
          unit: ing.unit,
          ingredient: ing.ingredient,
          attributes: ing.attributes,
          brandCandidate: ing.brandCandidate,
          category: ing.category,
          displayText: ing.displayText,
        })),
        steps: steps.map((s) => ({
          id: s.id,
          recipeId: s.recipeId,
          stepNumber: s.stepNumber,
          instruction: s.instruction,
          durationMinutes: s.durationMinutes,
        })),
        tags: tags.map((t) => t.tag),
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = getDb();

    const [deleted] = await db
      .delete(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, user.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Recipe not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: null }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

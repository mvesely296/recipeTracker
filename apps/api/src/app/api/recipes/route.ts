import { NextRequest, NextResponse } from 'next/server';
import { eq, desc, ilike, sql, count, inArray } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { recipes, recipeTags } from '@recipe-tracker/db';
import { recipeListQuerySchema } from '@/lib/validators/recipes';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { handleError } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { page, limit, search, tags } = recipeListQuerySchema.parse(searchParams);
    const offset = (page - 1) * limit;

    const db = getDb();

    // Count total
    const conditions = [eq(recipes.userId, user.id)];
    if (search) {
      conditions.push(ilike(recipes.title, `%${search}%`));
    }
    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        conditions.push(
          inArray(
            recipes.id,
            db
              .selectDistinct({ recipeId: recipeTags.recipeId })
              .from(recipeTags)
              .where(inArray(recipeTags.tag, tagList))
          )
        );
      }
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(recipes)
      .where(sql`${conditions.map((c) => sql`${c}`).reduce((a, b) => sql`${a} AND ${b}`)}`);
    const total = totalResult?.count ?? 0;

    // Fetch recipes
    let query = db
      .select()
      .from(recipes)
      .where(sql`${conditions.map((c) => sql`${c}`).reduce((a, b) => sql`${a} AND ${b}`)}`)
      .orderBy(desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);

    const recipeRows = await query;

    // Fetch tags for all recipes
    const recipeIds = recipeRows.map((r) => r.id);
    const tagRows = recipeIds.length > 0
      ? await db
          .select()
          .from(recipeTags)
          .where(sql`${recipeTags.recipeId} IN ${recipeIds}`)
      : [];

    const tagsByRecipe = tagRows.reduce<Record<string, string[]>>((acc, t) => {
      if (!acc[t.recipeId]) acc[t.recipeId] = [];
      acc[t.recipeId].push(t.tag);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        data: recipeRows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          servings: r.servings,
          prepTimeMinutes: r.prepTimeMinutes,
          cookTimeMinutes: r.cookTimeMinutes,
          sourceType: r.sourceType,
          sourceUrl: r.sourceUrl,
          imageUrl: r.imageUrl,
          confidenceScore: r.confidenceScore,
          approved: r.approved,
          tags: tagsByRecipe[r.id] || [],
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { recipes, recipeTags } from '@recipe-tracker/db';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { handleError } from '@/lib/api/response';

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const db = getDb();

    const tagRows = await db
      .selectDistinct({ tag: recipeTags.tag })
      .from(recipeTags)
      .innerJoin(recipes, eq(recipeTags.recipeId, recipes.id))
      .where(eq(recipes.userId, user.id))
      .orderBy(recipeTags.tag);

    const tags = tagRows.map((row) => row.tag);

    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { ingestionJobs } from '@recipe-tracker/db';
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

    const jobs = await db
      .select()
      .from(ingestionJobs)
      .where(eq(ingestionJobs.userId, user.id))
      .orderBy(desc(ingestionJobs.createdAt))
      .limit(20);

    return NextResponse.json({
      success: true,
      data: jobs.map((job) => ({
        id: job.id,
        sourceType: job.sourceType,
        sourceUrl: job.sourceUrl,
        status: job.status,
        recipeId: job.recipeId,
        errorMessage: job.errorMessage,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

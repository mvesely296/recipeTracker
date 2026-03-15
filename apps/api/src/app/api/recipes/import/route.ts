import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ingestionJobs } from '@recipe-tracker/db';
import { importRecipeSchema } from '@/lib/validators/recipes';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getRedisClient } from '@/lib/redis';
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
    const body = importRecipeSchema.parse(rawBody);

    const db = getDb();

    // Create ingestion job
    const [job] = await db
      .insert(ingestionJobs)
      .values({
        userId: user.id,
        sourceType: body.sourceType,
        sourceUrl: body.sourceUrl ?? null,
        sourceMediaId: body.sourceMediaId ?? null,
        status: 'pending',
      })
      .returning();

    // Push job to Redis queue for worker processing
    const redis = getRedisClient();
    await redis.lpush(
      'ingestion:jobs',
      JSON.stringify({
        id: job.id,
        user_id: user.id,
        source_type: body.sourceType,
        source_url: body.sourceUrl,
        source_media_id: body.sourceMediaId,
        title: body.title ?? null,
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: job.id,
          status: 'pending',
          message: 'Recipe import job created. Poll /api/ingestion-jobs/{jobId} for status.',
        },
      },
      { status: 202 }
    );
  } catch (error) {
    return handleError(error);
  }
}

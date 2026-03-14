import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import { importRecipeSchema, type ImportRecipeInput } from '@/lib/validators/recipes';
import { ConflictError } from '@/lib/api/errors';
import { getRedisClient } from '@/lib/redis';

export const POST = createRouteHandler<ImportRecipeInput>({
  bodySchema: importRecipeSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { body }) {
    // Create ingestion job
    const { data: job, error } = await supabase
      .from('ingestion_jobs')
      .insert({
        user_id: user.id,
        source_type: body.sourceType,
        source_url: body.sourceUrl,
        source_media_id: body.sourceMediaId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new ConflictError('Failed to create import job');
    }

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
      })
    );

    return successResponse(
      {
        jobId: job.id,
        status: 'pending',
        message: 'Recipe import job created. Poll /api/ingestion-jobs/{jobId} for status.',
      },
      202
    );
  },
});

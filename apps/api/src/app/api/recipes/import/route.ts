import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import { importRecipeSchema, type ImportRecipeInput } from '@/lib/validators/recipes';
import { ConflictError } from '@/lib/api/errors';

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

    // TODO: Emit event for worker to process
    // await recipeQueue.add('import', { jobId: job.id });

    return successResponse(
      {
        jobId: job.id,
        status: 'pending',
        message: 'Recipe import job created. You will be notified when processing completes.',
      },
      202
    );
  },
});

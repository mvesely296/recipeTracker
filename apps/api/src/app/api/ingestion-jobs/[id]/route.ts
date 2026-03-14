import { z } from 'zod';
import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import { uuidSchema } from '@/lib/validators/common';
import { NotFoundError, ForbiddenError } from '@/lib/api/errors';

const paramsSchema = z.object({
  id: uuidSchema,
});

export const GET = createRouteHandler({
  paramsSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { params }) {
    const { data: job, error } = await supabase
      .from('ingestion_jobs')
      .select('id, status, recipe_id, error_message, created_at, completed_at, user_id')
      .eq('id', params.id)
      .single();

    if (error || !job) {
      throw new NotFoundError('Ingestion job');
    }

    if (job.user_id !== user.id) {
      throw new ForbiddenError();
    }

    return successResponse({
      id: job.id,
      status: job.status,
      recipeId: job.recipe_id,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      completedAt: job.completed_at,
    });
  },
});

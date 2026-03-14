import { NextRequest, NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';
import type { User } from '@supabase/supabase-js';
import { getAuthenticatedUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { UnauthorizedError } from './errors';
import {
  handleError,
  successResponse,
  type ApiSuccessResponse,
  type ApiErrorResponse,
} from './response';

export interface RouteContext<TParams = Record<string, string>> {
  params: TParams;
  user: User;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
}

export interface RouteHandlerConfig<
  TBody = unknown,
  TQuery = unknown,
  TParams = Record<string, string>,
> {
  bodySchema?: ZodSchema<TBody>;
  querySchema?: ZodSchema<TQuery>;
  paramsSchema?: ZodSchema<TParams>;
  requireAuth?: boolean;
  handler: (
    request: NextRequest,
    context: RouteContext<TParams>,
    validated: {
      body: TBody;
      query: TQuery;
      params: TParams;
    }
  ) => Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>>;
}

export function createRouteHandler<
  TBody = unknown,
  TQuery = unknown,
  TParams = Record<string, string>,
>(config: RouteHandlerConfig<TBody, TQuery, TParams>) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<TParams> }
  ): Promise<NextResponse> => {
    try {
      const resolvedParams = await params;

      // Authentication check
      const user = await getAuthenticatedUser();
      if (config.requireAuth !== false && !user) {
        throw new UnauthorizedError();
      }

      // Validate params
      let validatedParams = resolvedParams;
      if (config.paramsSchema) {
        validatedParams = config.paramsSchema.parse(resolvedParams);
      }

      // Validate query parameters
      let validatedQuery = {} as TQuery;
      if (config.querySchema) {
        const searchParams = Object.fromEntries(request.nextUrl.searchParams);
        validatedQuery = config.querySchema.parse(searchParams);
      }

      // Validate request body
      let validatedBody = {} as TBody;
      if (config.bodySchema) {
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const rawBody = await request.json();
          validatedBody = config.bodySchema.parse(rawBody);
        }
      }

      // Get supabase client
      const supabase = await createSupabaseServerClient();

      // Execute handler
      return await config.handler(
        request,
        { params: validatedParams, user: user!, supabase },
        { body: validatedBody, query: validatedQuery, params: validatedParams }
      );
    } catch (error) {
      return handleError(error);
    }
  };
}

// Re-export for convenience
export { successResponse };

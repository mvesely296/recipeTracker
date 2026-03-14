import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError, ValidationError } from './errors';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: ApiError): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code || 'ERROR',
        message: error.message,
        details: error.details,
      },
    },
    { status: error.statusCode }
  );
}

export function formatZodError(zodError: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of zodError.issues) {
    const path = issue.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}

export function handleError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof ZodError) {
    return errorResponse(new ValidationError(formatZodError(error)));
  }

  if (error instanceof ApiError) {
    return errorResponse(error);
  }

  console.error('Unhandled error:', error);
  return errorResponse(new ApiError(500, 'Internal server error', 'INTERNAL_ERROR'));
}

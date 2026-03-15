'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { RecipeWithDetails, CreateRecipeInput, ImportRecipeInput } from '@recipe-tracker/types';

interface RecipeListItem {
  id: string;
  title: string;
  description: string | null;
  servings: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  sourceType: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  confidenceScore: number;
  approved: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PaginatedRecipes {
  data: RecipeListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface IngestionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  recipeId?: string;
  errorMessage?: string;
}

export function useRecipes(page = 1, search?: string, tags?: string[]) {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set('search', search);
  if (tags && tags.length > 0) params.set('tags', tags.join(','));

  return useQuery<PaginatedRecipes>({
    queryKey: ['recipes', page, search, tags],
    queryFn: () => apiFetch(`/recipes?${params}`),
  });
}

export function useRecipe(id: string | null) {
  return useQuery<RecipeWithDetails>({
    queryKey: ['recipe', id],
    queryFn: () => apiFetch(`/recipes/${id}`),
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRecipeInput) =>
      apiFetch('/recipes/manual', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useImportRecipe() {
  return useMutation<{ jobId: string }, Error, ImportRecipeInput>({
    mutationFn: (input) =>
      apiFetch('/recipes/import', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useIngestionJob(jobId: string | null) {
  const queryClient = useQueryClient();

  return useQuery<IngestionJob>({
    queryKey: ['ingestion-job', jobId],
    queryFn: () => apiFetch(`/ingestion-jobs/${jobId}`),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 2000;
    },
    select: (data) => {
      if (data.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['recipes'] });
      }
      return data;
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Record<string, any>) =>
      apiFetch(`/recipes/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/recipes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useTags() {
  return useQuery<string[]>({
    queryKey: ['tags'],
    queryFn: () => apiFetch('/tags'),
  });
}

export type { RecipeListItem, PaginatedRecipes };

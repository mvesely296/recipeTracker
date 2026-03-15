'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useIngredientDensities() {
  return useQuery({
    queryKey: ['ingredient-densities'],
    queryFn: () => apiFetch<Record<string, number>>('/ingredients/densities'),
    staleTime: Infinity,
  });
}

'use client';

import Link from 'next/link';
import { Card, Badge, Button } from '@recipe-tracker/ui';
import { useCartStore } from '@/stores/cart-store';
import { useDeleteRecipe, type RecipeListItem } from '@/hooks/use-recipes';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useState } from 'react';
import { IngredientPreviewModal } from './IngredientPreviewModal';

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  url: 'Web',
  image: 'Photo',
  youtube: 'YouTube',
  instagram: 'Instagram',
};

const SOURCE_VARIANTS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  manual: 'default',
  url: 'primary',
  image: 'warning',
  youtube: 'error',
  instagram: 'success',
};

interface RecipeCardProps {
  recipe: RecipeListItem;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const addRecipe = useCartStore((s) => s.addRecipe);
  const isInCart = useCartStore((s) => s.isRecipeInCart(recipe.id));
  const queryClient = useQueryClient();
  const deleteRecipe = useDeleteRecipe();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIngredients, setPreviewIngredients] = useState<Array<{ quantity: number; unit: string; ingredient: string; displayText: string; category: string | null }>>([]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInCart || loading) return;

    setLoading(true);
    try {
      const cached = queryClient.getQueryData<{ ingredients: Array<{ quantity: number; unit: string; ingredient: string; displayText: string; category: string | null }> }>(['recipe', recipe.id]);
      const details = cached || await apiFetch<{ ingredients: Array<{ quantity: number; unit: string; ingredient: string; displayText: string; category: string | null }> }>(`/recipes/${recipe.id}`);

      setPreviewIngredients(details.ingredients.map((ing) => ({
        ...ing,
        category: ing.category as any,
      })));
      setShowPreview(true);
    } catch {
      // Silently fail for now
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCart = (selected: Array<{ quantity: number; unit: string; ingredient: string; displayText: string; category: string | null }>) => {
    addRecipe({
      id: recipe.id,
      title: recipe.title,
      ingredients: selected.map((s) => ({ ...s, category: s.category as any })),
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this recipe?')) return;
    await deleteRecipe.mutateAsync(recipe.id);
  };

  // Prefetch on hover
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['recipe', recipe.id],
      queryFn: () => apiFetch(`/recipes/${recipe.id}`),
      staleTime: 5 * 60 * 1000,
    });
  };

  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  const cardHref = recipe.approved === false
    ? `/recipes/${recipe.id}/review`
    : `/recipes/${recipe.id}`;

  return (
    <>
      <Link href={cardHref as any} onMouseEnter={handleMouseEnter}>
        <Card className="hover:shadow-md transition-shadow h-full flex flex-col dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
              {recipe.title}
            </h3>
            <div className="flex items-center gap-1.5">
              {recipe.approved === false && (
                <Badge variant="warning">Pending Review</Badge>
              )}
              <Badge variant={SOURCE_VARIANTS[recipe.sourceType] || 'default'}>
                {SOURCE_LABELS[recipe.sourceType] || recipe.sourceType}
              </Badge>
            </div>
          </div>

          {recipe.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{recipe.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
            {totalTime > 0 && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {totalTime} min
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {recipe.servings} servings
            </span>
          </div>

          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {recipe.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
              {recipe.tags.length > 3 && (
                <span className="text-xs text-gray-400 dark:text-gray-500">+{recipe.tags.length - 3}</span>
              )}
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
            {recipe.approved !== false ? (
              <Button
                variant={isInCart ? 'secondary' : 'primary'}
                size="sm"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={isInCart || loading}
              >
                {isInCart ? 'In Cart' : loading ? 'Adding...' : 'Add to Cart'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-yellow-400 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                onClick={(e) => e.preventDefault()}
              >
                Needs Review
              </Button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition"
              aria-label="Delete recipe"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </Card>
      </Link>

      <IngredientPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        recipeTitle={recipe.title}
        ingredients={previewIngredients}
        onConfirm={handleConfirmCart}
      />
    </>
  );
}

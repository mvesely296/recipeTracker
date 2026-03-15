'use client';
import { useState } from 'react';
import { Button } from '@recipe-tracker/ui';

interface Ingredient {
  quantity: number;
  unit: string;
  ingredient: string;
  displayText: string;
  category: string | null;
}

interface IngredientPreviewModalProps {
  open: boolean;
  onClose: () => void;
  recipeTitle: string;
  ingredients: Ingredient[];
  onConfirm: (selected: Ingredient[]) => void;
}

export function IngredientPreviewModal({
  open,
  onClose,
  recipeTitle,
  ingredients,
  onConfirm,
}: IngredientPreviewModalProps) {
  const [excluded, setExcluded] = useState<Set<number>>(() => new Set());

  if (!open) return null;

  const toggleIngredient = (index: number) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectedCount = ingredients.length - excluded.size;

  const handleConfirm = () => {
    const selectedIngredients = ingredients.filter((_, i) => !excluded.has(i));
    if (selectedIngredients.length > 0) {
      onConfirm(selectedIngredients);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">🛒</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add to Cart</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-10">{recipeTitle}</p>
          </div>

          {/* Ingredient list */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">
            {ingredients.map((ing, i) => {
              const isIncluded = !excluded.has(i);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    isIncluded
                      ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                      : 'bg-gray-100 dark:bg-gray-800 border-l-4 border-transparent opacity-60'
                  }`}
                >
                  <span
                    className={`flex-1 text-base transition-all ${
                      isIncluded
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-400 dark:text-gray-500 line-through'
                    }`}
                  >
                    <span className="font-bold">
                      {ing.quantity} {ing.unit}
                    </span>{' '}
                    {ing.ingredient}
                  </span>

                  <button
                    onClick={() => toggleIngredient(i)}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isIncluded
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg'
                        : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
                    }`}
                    aria-label={isIncluded ? `Remove ${ing.ingredient}` : `Re-add ${ing.ingredient}`}
                  >
                    {isIncluded ? (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <Button
              variant="primary"
              className="flex-1 text-base py-3"
              onClick={handleConfirm}
              disabled={selectedCount === 0}
            >
              🛍️ Add {selectedCount} Item{selectedCount !== 1 ? 's' : ''} to Cart
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

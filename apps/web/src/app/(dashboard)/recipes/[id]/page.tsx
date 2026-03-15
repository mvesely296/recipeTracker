'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Badge, Spinner, Input, Textarea } from '@recipe-tracker/ui';
import { useRecipe, useUpdateRecipe, useDeleteRecipe } from '@/hooks/use-recipes';
import { useIngredientDensities } from '@/hooks/use-ingredient-densities';
import { useCartStore } from '@/stores/cart-store';
import { convertDisplayText } from '@/lib/unit-conversion';
import { IngredientPreviewModal } from '@/components/recipes/IngredientPreviewModal';

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  url: 'Web',
  image: 'Photo',
  youtube: 'YouTube',
  instagram: 'Instagram',
};

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: recipe, isLoading, error } = useRecipe(id);
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const addRecipe = useCartStore((s) => s.addRecipe);
  const isInCart = useCartStore((s) => s.isRecipeInCart(id));
  const { data: densityData } = useIngredientDensities();
  const densityMap = densityData ? new Map(Object.entries(densityData)) : undefined;

  const [editing, setEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIngredients, setEditIngredients] = useState<Array<{ displayText: string; quantity: number; unit: string; ingredient: string }>>([]);
  const [editSteps, setEditSteps] = useState<Array<{ stepNumber: number; instruction: string }>>([]);

  const startEditing = () => {
    if (!recipe) return;
    setEditTitle(recipe.title);
    setEditDescription(recipe.description || '');
    setEditIngredients(recipe.ingredients.map((ing) => ({
      displayText: ing.displayText,
      quantity: ing.quantity,
      unit: ing.unit,
      ingredient: ing.ingredient,
    })));
    setEditSteps(recipe.steps.map((s) => ({
      stepNumber: s.stepNumber,
      instruction: s.instruction,
    })));
    setEditing(true);
  };

  const handleSave = async () => {
    await updateRecipe.mutateAsync({
      id,
      title: editTitle,
      description: editDescription || null,
      ingredients: editIngredients.map((ing) => ({
        ...ing,
        displayText: `${ing.quantity} ${ing.unit} ${ing.ingredient}`.trim(),
      })),
      steps: editSteps,
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;
    await deleteRecipe.mutateAsync(id);
    router.push('/recipes' as any);
  };

  const handleAddToCart = () => {
    if (!recipe || isInCart) return;
    setShowPreview(true);
  };

  const handleConfirmCart = (selected: Array<{ quantity: number; unit: string; ingredient: string; displayText: string; category: string | null }>) => {
    if (!recipe) return;
    addRecipe({
      id: recipe.id,
      title: recipe.title,
      ingredients: selected.map((s) => ({ ...s, category: s.category as any })),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Recipe not found</h2>
        <Link href={"/recipes" as any}>
          <Button variant="outline">Back to Recipes</Button>
        </Link>
      </div>
    );
  }

  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={"/recipes" as any} className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 mb-4 inline-block">
        &larr; Back to Recipes
      </Link>

      {recipe.approved === false && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠</span>
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">This recipe is pending review</span>
          </div>
          <Link href={`/recipes/${recipe.id}/review` as any}>
            <Button variant="primary" size="sm">Review & Approve</Button>
          </Link>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          {editing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-3xl font-bold mb-2"
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{recipe.title}</h1>
          )}
          {editing ? (
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description..."
              rows={2}
            />
          ) : (
            recipe.description && (
              <p className="text-gray-600 dark:text-gray-400">{recipe.description}</p>
            )
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">{SOURCE_LABELS[recipe.sourceType] || recipe.sourceType}</Badge>
          {editing ? (
            <>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={updateRecipe.isPending}>
                {updateRecipe.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={startEditing}>Edit</Button>
              <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleteRecipe.isPending}>
                <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 mb-6 text-sm text-gray-600 dark:text-gray-400">
        <span>{recipe.servings} servings</span>
        {recipe.prepTimeMinutes && <span>Prep: {recipe.prepTimeMinutes} min</span>}
        {recipe.cookTimeMinutes && <span>Cook: {recipe.cookTimeMinutes} min</span>}
        {totalTime > 0 && <span>Total: {totalTime} min</span>}
      </div>

      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {recipe.tags.map((tag) => (
            <Badge key={tag} variant="default">{tag}</Badge>
          ))}
        </div>
      )}

      <div className="mb-6">
        <Button
          variant={isInCart ? 'secondary' : 'primary'}
          onClick={handleAddToCart}
          disabled={isInCart}
        >
          {isInCart ? 'Already in Cart' : 'Add to Cart'}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Ingredients</h2>
          {editing ? (
            <div className="space-y-2">
              {editIngredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="Qty"
                    value={String(ing.quantity)}
                    onChange={(e) => {
                      const next = [...editIngredients];
                      next[i] = { ...next[i], quantity: parseFloat(e.target.value) || 0 };
                      setEditIngredients(next);
                    }}
                    className="w-16"
                  />
                  <Input
                    placeholder="Unit"
                    value={ing.unit}
                    onChange={(e) => {
                      const next = [...editIngredients];
                      next[i] = { ...next[i], unit: e.target.value };
                      setEditIngredients(next);
                    }}
                    className="w-20"
                  />
                  <Input
                    placeholder="Ingredient"
                    value={ing.ingredient}
                    onChange={(e) => {
                      const next = [...editIngredients];
                      next[i] = { ...next[i], ingredient: e.target.value };
                      setEditIngredients(next);
                    }}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setEditIngredients(editIngredients.filter((_, idx) => idx !== i))}
                    className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditIngredients([...editIngredients, { displayText: '', quantity: 1, unit: '', ingredient: '' }])}
              >
                + Add Ingredient
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => {
                const display = convertDisplayText(ing.quantity, ing.unit, ing.ingredient, densityMap);
                return (
                  <li key={ing.id || i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <span>{display}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Steps</h2>
          {editing ? (
            <div className="space-y-2">
              {editSteps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-medium flex items-center justify-center mt-1">
                    {i + 1}
                  </span>
                  <Textarea
                    value={step.instruction}
                    onChange={(e) => {
                      const next = [...editSteps];
                      next[i] = { ...next[i], instruction: e.target.value };
                      setEditSteps(next);
                    }}
                    rows={2}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setEditSteps(editSteps.filter((_, idx) => idx !== i))}
                    className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 mt-1"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditSteps([...editSteps, { stepNumber: editSteps.length + 1, instruction: '' }])}
              >
                + Add Step
              </Button>
            </div>
          ) : (
            <ol className="space-y-4">
              {recipe.steps.map((step, i) => (
                <li key={step.id || i} className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-medium flex items-center justify-center">
                    {step.stepNumber}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-700 dark:text-gray-300">{step.instruction}</p>
                    {step.durationMinutes && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{step.durationMinutes} min</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <IngredientPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        recipeTitle={recipe.title}
        ingredients={recipe.ingredients.map((ing) => ({
          quantity: ing.quantity,
          unit: ing.unit,
          ingredient: ing.ingredient,
          displayText: ing.displayText,
          category: ing.category,
        }))}
        onConfirm={handleConfirmCart}
      />
    </div>
  );
}

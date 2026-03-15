'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Spinner, Input, Textarea } from '@recipe-tracker/ui';
import { useRecipe, useUpdateRecipe, useDeleteRecipe } from '@/hooks/use-recipes';
import { useJobStore } from '@/stores/job-store';

export default function RecipeReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: recipe, isLoading, error } = useRecipe(id);
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const removeJobByRecipeId = useJobStore((s) => s.removeByRecipeId);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIngredients, setEditIngredients] = useState<Array<{ displayText: string; quantity: number; unit: string; ingredient: string }>>([]);
  const [editSteps, setEditSteps] = useState<Array<{ stepNumber: number; instruction: string }>>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize edit state when recipe loads
  useEffect(() => {
    if (recipe && !initialized) {
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
      setInitialized(true);
    }
  }, [recipe, initialized]);

  const handleApprove = async () => {
    await updateRecipe.mutateAsync({
      id,
      title: editTitle,
      description: editDescription || null,
      ingredients: editIngredients.map((ing) => ({
        ...ing,
        displayText: `${ing.quantity} ${ing.unit} ${ing.ingredient}`.trim(),
      })),
      steps: editSteps,
      approved: true,
    });
    removeJobByRecipeId(id);
    router.push(`/recipes/${id}` as any);
  };

  const handleSaveDraft = async () => {
    await updateRecipe.mutateAsync({
      id,
      title: editTitle,
      description: editDescription || null,
      ingredients: editIngredients.map((ing) => ({
        ...ing,
        displayText: `${ing.quantity} ${ing.unit} ${ing.ingredient}`.trim(),
      })),
      steps: editSteps,
      approved: false,
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this recipe? This cannot be undone.')) return;
    await deleteRecipe.mutateAsync(id);
    router.push('/recipes' as any);
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

  return (
    <div className="max-w-6xl mx-auto">
      <Link href={"/recipes" as any} className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 mb-4 inline-block">
        &larr; Back to Recipes
      </Link>

      {/* Pending Review Banner */}
      <div className="mb-6 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 px-5 py-4 flex items-center gap-3">
        <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="font-semibold text-yellow-800 dark:text-yellow-200">Pending Review</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">This recipe was imported and needs your review before it appears in your library.</p>
        </div>
      </div>

      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="text-2xl font-bold"
        />
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <Textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Add a description..."
          rows={3}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Ingredients */}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Ingredients</h2>
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
                  className="w-20"
                />
                <Input
                  placeholder="Unit"
                  value={ing.unit}
                  onChange={(e) => {
                    const next = [...editIngredients];
                    next[i] = { ...next[i], unit: e.target.value };
                    setEditIngredients(next);
                  }}
                  className="w-24"
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
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/60 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors"
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
        </div>

        {/* Steps */}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Steps</h2>
          <div className="space-y-3">
            {editSteps.map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
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
                  rows={3}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => setEditSteps(editSteps.filter((_, idx) => idx !== i))}
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/60 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors mt-1"
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
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          onClick={handleApprove}
          disabled={updateRecipe.isPending}
          className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
        >
          {updateRecipe.isPending ? 'Saving...' : 'Approve & Save'}
        </Button>
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={updateRecipe.isPending}
        >
          {updateRecipe.isPending ? 'Saving...' : 'Save Draft'}
        </Button>
        <button
          onClick={handleDelete}
          disabled={deleteRecipe.isPending}
          className="ml-auto text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50"
        >
          {deleteRecipe.isPending ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

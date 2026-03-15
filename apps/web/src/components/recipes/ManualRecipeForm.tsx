'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea } from '@recipe-tracker/ui';
import { useCreateRecipe } from '@/hooks/use-recipes';

interface IngredientRow {
  quantity: string;
  unit: string;
  ingredient: string;
  displayText: string;
}

interface StepRow {
  instruction: string;
}

export function ManualRecipeForm() {
  const router = useRouter();
  const createRecipe = useCreateRecipe();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('4');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [tags, setTags] = useState('');

  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { quantity: '', unit: '', ingredient: '', displayText: '' },
  ]);
  const [steps, setSteps] = useState<StepRow[]>([{ instruction: '' }]);
  const [formError, setFormError] = useState('');

  const updateIngredient = (index: number, field: keyof IngredientRow, value: string) => {
    setIngredients((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addIngredient = () => {
    setIngredients((prev) => [...prev, { quantity: '', unit: '', ingredient: '', displayText: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    setSteps((prev) => prev.map((row, i) => (i === index ? { instruction: value } : row)));
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { instruction: '' }]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.ingredient.trim());
    if (validIngredients.length === 0) {
      setFormError('At least one ingredient is required');
      return;
    }

    const validSteps = steps.filter((step) => step.instruction.trim());
    if (validSteps.length === 0) {
      setFormError('At least one step is required');
      return;
    }

    try {
      await createRecipe.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        servings: parseInt(servings) || 4,
        prepTimeMinutes: prepTime ? parseInt(prepTime) : undefined,
        cookTimeMinutes: cookTime ? parseInt(cookTime) : undefined,
        ingredients: validIngredients.map((ing) => ({
          quantity: parseFloat(ing.quantity) || 1,
          unit: ing.unit.trim() || 'piece',
          ingredient: ing.ingredient.trim(),
          displayText: ing.displayText.trim() || `${ing.quantity} ${ing.unit} ${ing.ingredient}`.trim(),
          attributes: null,
          brandCandidate: null,
          category: null,
          ingredientCatalogId: null,
        })),
        steps: validSteps.map((step, i) => ({
          stepNumber: i + 1,
          instruction: step.instruction.trim(),
        })),
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      router.push('/recipes' as any);
    } catch {
      setFormError('Failed to create recipe. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {formError}
        </div>
      )}

      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., Chicken Tikka Masala"
        required
      />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional description..."
        rows={2}
      />

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Servings"
          type="number"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          min="1"
        />
        <Input
          label="Prep Time (min)"
          type="number"
          value={prepTime}
          onChange={(e) => setPrepTime(e.target.value)}
          min="0"
        />
        <Input
          label="Cook Time (min)"
          type="number"
          value={cookTime}
          onChange={(e) => setCookTime(e.target.value)}
          min="0"
        />
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ingredients</label>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input
                placeholder="Qty"
                value={ing.quantity}
                onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                className="w-20"
              />
              <Input
                placeholder="Unit"
                value={ing.unit}
                onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                className="w-24"
              />
              <Input
                placeholder="Ingredient"
                value={ing.ingredient}
                onChange={(e) => updateIngredient(i, 'ingredient', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Display text (optional)"
                value={ing.displayText}
                onChange={(e) => updateIngredient(i, 'displayText', e.target.value)}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 mt-0.5"
                aria-label="Remove ingredient"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={addIngredient} className="mt-2">
          + Add Ingredient
        </Button>
      </div>

      {/* Steps */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Steps</label>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-medium flex items-center justify-center mt-2">
                {i + 1}
              </span>
              <Textarea
                placeholder={`Step ${i + 1} instruction...`}
                value={step.instruction}
                onChange={(e) => updateStep(i, e.target.value)}
                rows={2}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 mt-0.5"
                aria-label="Remove step"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={addStep} className="mt-2">
          + Add Step
        </Button>
      </div>

      <Input
        label="Tags"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="e.g., dinner, chicken, indian (comma-separated)"
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" disabled={createRecipe.isPending}>
          {createRecipe.isPending ? 'Creating...' : 'Create Recipe'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/recipes' as any)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

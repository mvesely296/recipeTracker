'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea } from '@recipe-tracker/ui';
import { useImportRecipe } from '@/hooks/use-recipes';
import { useJobStore } from '@/stores/job-store';

function detectSourceType(url: string): 'youtube' | 'url' {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    if (host === 'youtube.com' || host === 'youtu.be') return 'youtube';
  } catch {
    // Not a valid URL yet
  }
  return 'url';
}

export function ImportRecipeForm() {
  const router = useRouter();
  const importRecipe = useImportRecipe();
  const addJob = useJobStore((s) => s.addJob);
  const [urls, setUrls] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const lines = urls
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setFormError('At least one URL is required');
      return;
    }

    // Validate all URLs
    for (const line of lines) {
      try {
        new URL(line);
      } catch {
        setFormError(`Invalid URL: ${line}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      for (const line of lines) {
        const sourceType = detectSourceType(line);
        const result = await importRecipe.mutateAsync({
          sourceType,
          sourceUrl: line,
          ...(recipeName ? { title: recipeName } : {}),
        });
        addJob({
          jobId: result.jobId,
          sourceUrl: line,
          title: recipeName || undefined,
        });
      }
      setUrls('');
      setRecipeName('');
    } catch {
      setFormError('Failed to start import. Please try again.');
    } finally {
      setSubmitting(false);
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
        label="Recipe Name (optional)"
        value={recipeName}
        onChange={(e) => setRecipeName(e.target.value)}
        placeholder="e.g., Grandma's Chicken Soup"
      />

      <div>
        <Textarea
          label="Recipe URLs (one per line)"
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder={"https://www.example.com/recipe\nhttps://www.youtube.com/watch?v=..."}
          rows={4}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Supports recipe websites and YouTube videos. Enter one URL per line.
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Starting...' : 'Import Recipe(s)'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/recipes' as any)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

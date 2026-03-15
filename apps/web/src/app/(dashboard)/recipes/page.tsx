'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Input, Spinner, Badge } from '@recipe-tracker/ui';
import { useRecipes, useTags } from '@/hooks/use-recipes';
import { RecipeCard } from '@/components/recipes/RecipeCard';

export default function RecipesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { data, isLoading, error } = useRecipes(page, search || undefined, selectedTags.length > 0 ? selectedTags : undefined);
  const { data: tags } = useTags();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recipes</h1>
        <Link href={"/recipes/new" as any}>
          <Button variant="primary">+ Add Recipe</Button>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="Search recipes..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="md">
            Search
          </Button>
        </div>
      </form>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag) => (
            <button key={tag} onClick={() => toggleTag(tag)}>
              <Badge variant={selectedTags.includes(tag) ? 'primary' : 'default'}>
                {tag}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="text-center py-20 text-red-600 dark:text-red-400">
          Failed to load recipes. Please try again.
        </div>
      )}

      {data && data.data.length === 0 && (
        <div className="text-center py-20">
          <svg className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No recipes yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first recipe to get started</p>
          <Link href={"/recipes/new" as any}>
            <Button variant="primary">+ Add Recipe</Button>
          </Link>
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.data.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

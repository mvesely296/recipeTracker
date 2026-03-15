'use client';
import { Spinner } from '@recipe-tracker/ui';
import Link from 'next/link';
import { useJobStore } from '@/stores/job-store';
import { useJobPolling } from '@/hooks/use-job-polling';

export function ImportActivity() {
  useJobPolling();
  const jobs = useJobStore((s) => s.jobs);
  const clearCompleted = useJobStore((s) => s.clearCompleted);

  if (jobs.length === 0) return null;

  const hasCompleted = jobs.some((j) => j.status === 'completed' || j.status === 'failed');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recipe Imports</h3>
          {hasCompleted && (
            <button onClick={clearCompleted} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Clear completed
            </button>
          )}
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {jobs.map((job) => (
            <div key={job.jobId} className="flex items-center gap-3 text-sm py-1">
              {(job.status === 'pending' || job.status === 'processing') && <Spinner size="sm" />}
              {job.status === 'completed' && <span className="text-green-500 text-base">&#10003;</span>}
              {job.status === 'failed' && <span className="text-red-500 text-base">&#10007;</span>}
              <span className="truncate flex-1 text-gray-600 dark:text-gray-400">
                {job.title || job.sourceUrl}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{job.status}</span>
              {job.status === 'completed' && job.recipeId && (
                <Link href={`/recipes/${job.recipeId}/review` as any} className="text-xs text-green-600 hover:text-green-700 dark:text-green-400">
                  View
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

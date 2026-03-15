'use client';

import { useState } from 'react';
import { Button, Spinner } from '@recipe-tracker/ui';
import Link from 'next/link';
import { useJobStore, type JobEntry } from '@/stores/job-store';
import { useJobPolling } from '@/hooks/use-job-polling';

function JobStatusIcon({ status }: { status: JobEntry['status'] }) {
  if (status === 'pending' || status === 'processing') return <Spinner size="sm" />;
  if (status === 'completed') return <span className="text-green-500 text-base">&#10003;</span>;
  if (status === 'failed') return <span className="text-red-500 text-base">&#10007;</span>;
  return null;
}

function JobRow({ job, onNavigate }: { job: JobEntry; onNavigate?: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <JobStatusIcon status={job.status} />
      <span className="truncate flex-1 text-sm text-gray-700 dark:text-gray-300">
        {job.title || job.sourceUrl}
      </span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        job.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
        job.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
      }`}>
        {job.status}
      </span>
      {job.status === 'completed' && job.recipeId && (
        <Link href={`/recipes/${job.recipeId}/review` as any} onClick={onNavigate}>
          <Button variant="primary" size="sm">Review</Button>
        </Link>
      )}
    </div>
  );
}

function ImportJobsModal({ jobs, onClose }: { jobs: JobEntry[]; onClose: () => void }) {
  const clearCompleted = useJobStore((s) => s.clearCompleted);
  const hasCompleted = jobs.some((j) => j.status === 'completed' || j.status === 'failed');

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[70vh] flex flex-col overflow-hidden">
          <div className="px-6 pt-6 pb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recipe Imports</h3>
            <div className="flex items-center gap-2">
              {hasCompleted && (
                <Button variant="ghost" size="sm" onClick={clearCompleted}>
                  Clear completed
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-4 divide-y divide-gray-100 dark:divide-gray-700">
            {jobs.map((job) => (
              <JobRow key={job.jobId} job={job} onNavigate={onClose} />
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function ImportActivity() {
  useJobPolling();
  const jobs = useJobStore((s) => s.jobs);
  const clearCompleted = useJobStore((s) => s.clearCompleted);
  const [showModal, setShowModal] = useState(false);

  if (jobs.length === 0) return null;

  const activeCount = jobs.filter((j) => j.status === 'pending' || j.status === 'processing').length;
  const hasCompleted = jobs.some((j) => j.status === 'completed' || j.status === 'failed');

  // Single job: show inline
  if (jobs.length === 1) {
    const job = jobs[0];
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <JobStatusIcon status={job.status} />
          <span className="truncate flex-1 text-sm text-gray-700 dark:text-gray-300">
            {job.status === 'pending' || job.status === 'processing'
              ? `Importing: ${job.title || job.sourceUrl}`
              : job.title || job.sourceUrl}
          </span>
          {job.status === 'completed' && job.recipeId && (
            <Link href={`/recipes/${job.recipeId}/review` as any}>
              <Button variant="primary" size="sm">Review</Button>
            </Link>
          )}
          {hasCompleted && (
            <Button variant="ghost" size="sm" onClick={clearCompleted}>
              Dismiss
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Multiple jobs: show summary with "View All"
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          {activeCount > 0 && <Spinner size="sm" />}
          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
            {activeCount > 0
              ? `${activeCount} recipe${activeCount !== 1 ? 's' : ''} importing...`
              : `${jobs.length} import${jobs.length !== 1 ? 's' : ''} completed`}
          </span>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            View All ({jobs.length})
          </Button>
          {hasCompleted && (
            <Button variant="ghost" size="sm" onClick={clearCompleted}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {showModal && (
        <ImportJobsModal jobs={jobs} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

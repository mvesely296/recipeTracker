'use client';

import { Spinner } from '@recipe-tracker/ui';

interface ImportProgressProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending: { label: 'Queued for processing...', color: 'text-gray-600 dark:text-gray-400' },
  processing: { label: 'Extracting recipe...', color: 'text-green-600 dark:text-green-400' },
  completed: { label: 'Recipe imported!', color: 'text-green-600 dark:text-green-400' },
  failed: { label: 'Import failed', color: 'text-red-600 dark:text-red-400' },
};

export function ImportProgress({ status, errorMessage }: ImportProgressProps) {
  const info = STATUS_INFO[status] || STATUS_INFO.pending;
  const isActive = status === 'pending' || status === 'processing';

  return (
    <div className="flex flex-col items-center py-8 gap-4">
      {isActive && <Spinner size="lg" />}

      {status === 'completed' && (
        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
          <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {status === 'failed' && (
        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
          <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}

      <p className={`text-sm font-medium ${info.color}`}>{info.label}</p>

      {status === 'failed' && errorMessage && (
        <p className="text-xs text-red-500 dark:text-red-400 text-center max-w-sm">{errorMessage}</p>
      )}
    </div>
  );
}

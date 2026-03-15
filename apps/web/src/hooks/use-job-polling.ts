'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useJobStore } from '@/stores/job-store';

export function useJobPolling() {
  const jobs = useJobStore((s) => s.jobs);
  const updateJob = useJobStore((s) => s.updateJob);
  const queryClient = useQueryClient();

  const activeJobs = jobs.filter((j) => j.status === 'pending' || j.status === 'processing');

  useEffect(() => {
    if (activeJobs.length === 0) return;

    const interval = setInterval(async () => {
      for (const job of activeJobs) {
        try {
          const data = await apiFetch<{
            id: string;
            status: string;
            recipeId?: string;
            errorMessage?: string;
          }>(`/ingestion-jobs/${job.jobId}`);

          if (data.status !== job.status) {
            updateJob(job.jobId, {
              status: data.status as any,
              recipeId: data.recipeId,
              errorMessage: data.errorMessage,
            });
            if (data.status === 'completed') {
              queryClient.invalidateQueries({ queryKey: ['recipes'] });
              queryClient.invalidateQueries({ queryKey: ['tags'] });
            }
          }
        } catch {
          // Silently fail polling
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeJobs.length]); // Re-setup when count changes
}

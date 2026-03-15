'use client';
import { create } from 'zustand';

export interface JobEntry {
  jobId: string;
  sourceUrl: string;
  title?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  recipeId?: string;
  errorMessage?: string;
  createdAt: string;
}

interface JobStore {
  jobs: JobEntry[];
  addJob: (job: Pick<JobEntry, 'jobId' | 'sourceUrl' | 'title'>) => void;
  updateJob: (jobId: string, update: Partial<JobEntry>) => void;
  removeByRecipeId: (recipeId: string) => void;
  clearCompleted: () => void;
  getActiveJobs: () => JobEntry[];
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  addJob: (job) =>
    set((state) => ({
      jobs: [{ ...job, status: 'pending', createdAt: new Date().toISOString() }, ...state.jobs],
    })),
  updateJob: (jobId, update) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.jobId === jobId ? { ...j, ...update } : j)),
    })),
  removeByRecipeId: (recipeId) =>
    set((state) => ({
      jobs: state.jobs.filter((j) => j.recipeId !== recipeId),
    })),
  clearCompleted: () =>
    set((state) => ({
      jobs: state.jobs.filter((j) => j.status === 'pending' || j.status === 'processing'),
    })),
  getActiveJobs: () => get().jobs.filter((j) => j.status === 'pending' || j.status === 'processing'),
}));

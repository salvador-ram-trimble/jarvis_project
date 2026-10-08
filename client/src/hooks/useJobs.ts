import type { Job, JobInput, JobPatch } from '@jarvis/shared';
import { api } from '../api/client';
import { useApiAction, useApiData } from './useApi';

/** Loads every job. */
export function useJobs() {
  const { data, loading, error } = useApiData(() => api.jobs.list(), []);
  return { jobs: data ?? [], loading, error };
}

/** Loads one customer's jobs. */
export function useCustomerJobs(customerId: string) {
  const { data, loading, error } = useApiData(() => api.jobs.list({ customerId }), [customerId]);
  return { jobs: data ?? [], loading, error };
}

/** Loads one job. A 404 from the API (unknown or malformed id) sets `notFound`. */
export function useJob(id: string) {
  const { data, loading, error } = useApiData(() => api.jobs.get(id), [id]);
  const notFound = error?.status === 404;
  return { job: data, loading, notFound, error: notFound ? null : error };
}

const createJob = (input: JobInput) => api.jobs.create(input);
const updateJob = (id: string, patch: JobPatch) => api.jobs.update(id, patch);

/** `create` resolves to the new job, or null on failure. */
export function useCreateJob() {
  const { run, submitting, error } = useApiAction<[JobInput], Job>(createJob);
  return { create: run, submitting, error };
}

/** `update` resolves to the updated job, or null on failure. */
export function useUpdateJob() {
  const { run, submitting, error } = useApiAction<[string, JobPatch], Job>(updateJob);
  return { update: run, submitting, error };
}

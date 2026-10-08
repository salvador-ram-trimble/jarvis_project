import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/client';

export function toApiError(err: unknown): ApiError {
  return err instanceof ApiError ? err : new ApiError(0, 'Something went wrong');
}

/** Runs `load` on mount and whenever `deps` change, and tracks its loading and error state. */
export function useApiData<T>(load: () => Promise<T>, deps: readonly unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    load()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `load` is a new function on every render, so the caller lists what it depends on instead.
  }, deps);

  return { data, loading, error };
}

/** Wraps a call that changes data. `run` resolves to its result, or null when it failed (see `error`). */
export function useApiAction<Args extends unknown[], T>(action: (...args: Args) => Promise<T>) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const run = useCallback(
    async (...args: Args): Promise<T | null> => {
      setSubmitting(true);
      setError(null);
      try {
        return await action(...args);
      } catch (err) {
        setError(toApiError(err));
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [action],
  );

  return { run, submitting, error };
}

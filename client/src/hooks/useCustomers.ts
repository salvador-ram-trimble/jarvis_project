import { useCallback, useEffect, useState } from 'react';
import type { Customer, CustomerInput } from '@jarvis/shared';
import { ApiError, api } from '../api/client';

function toApiError(err: unknown): ApiError {
  return err instanceof ApiError ? err : new ApiError(0, 'Something went wrong');
}

/** Loads every customer. */
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.customers
      .list()
      .then((data) => {
        if (!cancelled) setCustomers(data);
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
  }, []);

  return { customers, loading, error };
}

/** Creates a customer and tracks the request state. `create` resolves to the new customer, or null on failure. */
export function useCreateCustomer() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const create = useCallback(async (input: CustomerInput): Promise<Customer | null> => {
    setSubmitting(true);
    setError(null);
    try {
      return await api.customers.create(input);
    } catch (err) {
      setError(toApiError(err));
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { create, submitting, error };
}

import type { Customer, CustomerInput, CustomerPatch } from '@jarvis/shared';
import { api } from '../api/client';
import { useApiAction, useApiData } from './useApi';

/** Loads every customer. */
export function useCustomers() {
  const { data, loading, error } = useApiData(() => api.customers.list(), []);
  return { customers: data ?? [], loading, error };
}

/** Loads one customer. A 404 from the API (unknown or malformed id) sets `notFound`. */
export function useCustomer(id: string) {
  const { data, loading, error } = useApiData(() => api.customers.get(id), [id]);
  const notFound = error?.status === 404;
  return { customer: data, loading, notFound, error: notFound ? null : error };
}

const createCustomer = (input: CustomerInput) => api.customers.create(input);
const updateCustomer = (id: string, patch: CustomerPatch) => api.customers.update(id, patch);

/** `create` resolves to the new customer, or null on failure. */
export function useCreateCustomer() {
  const { run, submitting, error } = useApiAction<[CustomerInput], Customer>(createCustomer);
  return { create: run, submitting, error };
}

/** `update` resolves to the updated customer, or null on failure. */
export function useUpdateCustomer() {
  const { run, submitting, error } = useApiAction<[string, CustomerPatch], Customer>(updateCustomer);
  return { update: run, submitting, error };
}

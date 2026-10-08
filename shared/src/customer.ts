import type { Address } from './address.js';

/** A customer as returned by the API. Dates are ISO 8601 strings. Optional fields are left out when not set. */
export interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: Address;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * The fields a client sends to create a customer. An empty (or whitespace-only) string means "not set",
 * and an address with no fields filled in is the same as no address.
 */
export interface CustomerInput {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: Address;
  notes?: string;
}

/**
 * The body of `PATCH /api/customers/:id`. Only the fields present are changed. An empty string clears a field,
 * and an `address` replaces the whole stored address.
 */
export type CustomerPatch = Partial<CustomerInput>;

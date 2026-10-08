import mongoose from 'mongoose';
import { ADDRESS_FIELDS, type Address } from '@jarvis/shared';

/** Embedded as a customer's address and a job's site address. */
export const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false },
);

/** The filled-in fields of a stored address, or undefined when none are. */
export function toAddress(stored: Partial<Record<keyof Address, string | null>> | null | undefined): Address | undefined {
  if (!stored) return undefined;
  const address: Address = {};
  for (const field of ADDRESS_FIELDS) {
    const value = stored[field];
    if (value) address[field] = value;
  }
  return Object.keys(address).length > 0 ? address : undefined;
}

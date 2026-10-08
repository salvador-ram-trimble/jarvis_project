// Helpers for reading request bodies. A blank string (or null) means "not set" everywhere in the API.
import { ADDRESS_FIELDS } from '@jarvis/shared';

/** The body as a plain object, or an empty one when it isn't an object. */
export function bodyObject(body: unknown): Record<string, unknown> {
  return (typeof body === 'object' && body !== null && !Array.isArray(body) ? body : {}) as Record<string, unknown>;
}

/** Trims strings and turns blank ones into undefined, which means "not set". Anything else is left for Mongoose to reject. */
export function normalizeText(value: unknown): unknown {
  if (value === null) return undefined;
  if (typeof value !== 'string') return value;
  return value.trim() || undefined;
}

export function normalizeAddress(value: unknown): unknown {
  if (value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) return value;
  const address: Record<string, unknown> = {};
  for (const field of ADDRESS_FIELDS) {
    const text = normalizeText((value as Record<string, unknown>)[field]);
    if (text !== undefined) address[field] = text;
  }
  // An address with nothing filled in is no address.
  return Object.keys(address).length > 0 ? address : undefined;
}

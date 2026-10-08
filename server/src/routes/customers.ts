import { Router } from 'express';
import { ADDRESS_FIELDS, type CustomerInput } from '@jarvis/shared';
import { HttpError } from '../errors.js';
import { toCustomer, type CustomerModel } from '../models/customer.js';

const TEXT_FIELDS = ['name', 'company', 'email', 'phone', 'notes'] as const satisfies readonly (keyof CustomerInput)[];

/** Trims strings and turns blank ones into undefined, which means "not set". Anything else is left for Mongoose to reject. */
function normalizeText(value: unknown): unknown {
  if (value === null) return undefined;
  if (typeof value !== 'string') return value;
  return value.trim() || undefined;
}

function normalizeAddress(value: unknown): unknown {
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

/**
 * Picks the customer fields present in a request body, so clients can't set ids or timestamps.
 * A field that is present but blank comes back as undefined, which clears it on update.
 */
function pickCustomerFields(body: unknown): Record<string, unknown> {
  const source = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  const fields: Record<string, unknown> = {};
  for (const field of TEXT_FIELDS) {
    if (field in source) fields[field] = normalizeText(source[field]);
  }
  if ('address' in source) fields.address = normalizeAddress(source.address);
  return fields;
}

export function customersRouter(Customers: CustomerModel): Router {
  const router = Router();

  async function findCustomer(id: string) {
    // A malformed id throws a CastError, which the error middleware turns into a 404 too.
    const customer = await Customers.findById(id);
    if (!customer) {
      throw new HttpError(404, 'Customer not found');
    }
    return customer;
  }

  router.get('/', async (_req, res) => {
    const customers = await Customers.find().sort({ createdAt: -1 });
    res.json(customers.map(toCustomer));
  });

  router.post('/', async (req, res) => {
    const customer = await Customers.create(pickCustomerFields(req.body));
    res.status(201).json(toCustomer(customer));
  });

  router.get('/:id', async (req, res) => {
    res.json(toCustomer(await findCustomer(req.params.id)));
  });

  router.patch('/:id', async (req, res) => {
    const customer = await findCustomer(req.params.id);
    customer.set(pickCustomerFields(req.body));
    await customer.save();
    res.json(toCustomer(customer));
  });

  return router;
}

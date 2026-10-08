import { Router } from 'express';
import type { CustomerInput } from '@jarvis/shared';
import { HttpError } from '../errors.js';
import { toCustomer, type CustomerModel } from '../models/customer.js';
import { bodyObject, normalizeAddress, normalizeText } from './fields.js';

const TEXT_FIELDS = ['name', 'company', 'email', 'phone', 'notes'] as const satisfies readonly (keyof CustomerInput)[];

/**
 * Picks the customer fields present in a request body, so clients can't set ids or timestamps.
 * A field that is present but blank comes back as undefined, which clears it on update.
 */
function pickCustomerFields(body: unknown): Record<string, unknown> {
  const source = bodyObject(body);
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

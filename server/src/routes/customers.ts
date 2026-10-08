import { Router } from 'express';
import type { CustomerInput } from '@jarvis/shared';
import { toCustomer, type CustomerModel } from '../models/customer.js';

export function customersRouter(Customers: CustomerModel): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const customers = await Customers.find().sort({ createdAt: -1 });
    res.json(customers.map(toCustomer));
  });

  router.post('/', async (req, res) => {
    // Only pick known fields so clients can't set ids or timestamps.
    const { name } = (req.body ?? {}) as Partial<CustomerInput>;
    const customer = await Customers.create({ name });
    res.status(201).json(toCustomer(customer));
  });

  return router;
}

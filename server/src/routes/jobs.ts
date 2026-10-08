import { Router } from 'express';
import mongoose from 'mongoose';
import {
  isJobStatus,
  isValidDate,
  validationMessages,
  type FieldErrors,
  type JobInput,
} from '@jarvis/shared';
import { HttpError } from '../errors.js';
import type { CustomerModel } from '../models/customer.js';
import { toJob, type JobModel } from '../models/job.js';
import { bodyObject, normalizeAddress, normalizeText } from './fields.js';

const TEXT_FIELDS = ['title', 'status', 'description'] as const satisfies readonly (keyof JobInput)[];
const DATE_FIELDS = ['scheduledStart', 'scheduledEnd'] as const satisfies readonly (keyof JobInput)[];

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

/** The request field each stored path is reported under, where they differ. */
const ERROR_KEYS: Record<string, string> = { customer: 'customerId' };

interface PickedJobFields {
  /** Ready to set on a job document. Present but blank fields are undefined, which clears them. */
  fields: Record<string, unknown>;
  /** Values that couldn't be read at all, keyed by request field. */
  errors: FieldErrors;
}

/** Picks the job fields present in a request body, so clients can't set ids or timestamps. */
function pickJobFields(body: unknown): PickedJobFields {
  const source = bodyObject(body);
  const fields: Record<string, unknown> = {};
  const errors: FieldErrors = {};

  for (const field of TEXT_FIELDS) {
    if (field in source) fields[field] = normalizeText(source[field]);
  }

  if ('customerId' in source) {
    const customerId = normalizeText(source.customerId);
    if (customerId === undefined) {
      fields.customer = undefined;
    } else if (typeof customerId === 'string' && OBJECT_ID_PATTERN.test(customerId)) {
      fields.customer = customerId;
    } else {
      errors.customerId = validationMessages.customerNotFound;
    }
  }

  for (const field of DATE_FIELDS) {
    if (!(field in source)) continue;
    const value = normalizeText(source[field]);
    if (value === undefined) {
      fields[field] = undefined;
    } else if (typeof value === 'string' && isValidDate(value)) {
      fields[field] = new Date(`${value}T00:00:00Z`);
    } else {
      errors[field] = validationMessages.dateInvalid;
    }
  }

  if ('siteAddress' in source) fields.siteAddress = normalizeAddress(source.siteAddress);

  if ('price' in source) {
    const price = source.price;
    if (price === null || price === '') {
      fields.price = undefined;
    } else if (typeof price === 'number' && Number.isFinite(price)) {
      fields.price = price;
    } else {
      errors.price = validationMessages.priceInvalid;
    }
  }

  return { fields, errors };
}

export function jobsRouter(Jobs: JobModel, Customers: CustomerModel): Router {
  const router = Router();

  async function findJob(id: string) {
    // A malformed id throws a CastError, which the error middleware turns into a 404 too.
    const job = await Jobs.findById(id).populate('customer', 'name');
    if (!job) {
      throw new HttpError(404, 'Job not found');
    }
    return job;
  }

  /**
   * Validates the job and checks that its customer exists, then saves it. Every problem is reported in one
   * 400 response, together with the fields that couldn't be read (`readErrors`).
   */
  async function saveJob(job: Awaited<ReturnType<typeof findJob>>, readErrors: FieldErrors) {
    const errors: FieldErrors = {};
    try {
      await job.validate();
    } catch (err) {
      if (!(err instanceof mongoose.Error.ValidationError)) throw err;
      for (const [path, detail] of Object.entries(err.errors)) {
        errors[ERROR_KEYS[path] ?? path] = detail.message;
      }
    }
    Object.assign(errors, readErrors);

    if (!errors.customerId && (job.isNew || job.isModified('customer'))) {
      const exists = await Customers.exists({ _id: job.customer });
      if (!exists) errors.customerId = validationMessages.customerNotFound;
    }

    if (Object.keys(errors).length > 0) {
      throw new HttpError(400, 'Validation failed', errors);
    }
    await job.save({ validateBeforeSave: false });
    await job.populate('customer', 'name');
  }

  router.get('/', async (req, res) => {
    const filter: Record<string, unknown> = {};

    const status = req.query.status;
    if (status !== undefined && status !== '') {
      if (!isJobStatus(status)) {
        throw new HttpError(400, 'Invalid status filter', { status: validationMessages.statusInvalid });
      }
      filter.status = status;
    }

    const customerId = req.query.customerId;
    if (customerId !== undefined && customerId !== '') {
      // No job can belong to a malformed id.
      if (typeof customerId !== 'string' || !OBJECT_ID_PATTERN.test(customerId)) {
        res.json([]);
        return;
      }
      filter.customer = customerId;
    }

    const jobs = await Jobs.find(filter).sort({ createdAt: -1 }).populate('customer', 'name');
    res.json(jobs.map(toJob));
  });

  router.post('/', async (req, res) => {
    const { fields, errors } = pickJobFields(req.body);
    const job = new Jobs(fields);
    await saveJob(job, errors);
    res.status(201).json(toJob(job));
  });

  router.get('/:id', async (req, res) => {
    res.json(toJob(await findJob(req.params.id)));
  });

  router.patch('/:id', async (req, res) => {
    const job = await findJob(req.params.id);
    const { fields, errors } = pickJobFields(req.body);
    job.set(fields);
    await saveJob(job, errors);
    res.json(toJob(job));
  });

  return router;
}

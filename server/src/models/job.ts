import mongoose, { type Connection, type HydratedDocument, type InferSchemaType, type Model } from 'mongoose';
import {
  DEFAULT_JOB_STATUS,
  JOB_STATUSES,
  validationMessages,
  type CustomerSummary,
  type Job,
  type JobStatus,
} from '@jarvis/shared';
import { addressSchema, toAddress } from './address.js';
import { customerModel } from './customer.js';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, validationMessages.titleRequired],
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, validationMessages.customerRequired],
      index: true,
    },
    status: {
      type: String,
      enum: { values: JOB_STATUSES, message: validationMessages.statusInvalid },
      required: [true, validationMessages.statusInvalid],
      default: DEFAULT_JOB_STATUS,
      index: true,
    },
    description: { type: String, trim: true },
    // Calendar dates, stored as midnight UTC.
    scheduledStart: { type: Date },
    scheduledEnd: { type: Date },
    siteAddress: addressSchema,
    price: { type: Number, min: [0, validationMessages.priceNegative] },
  },
  { timestamps: true },
);

// A hook rather than a validator on scheduledEnd, because Mongoose only validates the paths that changed:
// moving just the start past the stored end must be caught too.
jobSchema.pre('validate', function () {
  if (this.scheduledStart && this.scheduledEnd && this.scheduledEnd < this.scheduledStart) {
    this.invalidate('scheduledEnd', validationMessages.endBeforeStart);
  }
});

export type JobModel = Model<InferSchemaType<typeof jobSchema>>;
type JobDocument = HydratedDocument<InferSchemaType<typeof jobSchema>>;

/** The customer of a job whose `customer` has been populated with its name. */
function toCustomerSummary(customer: unknown): CustomerSummary {
  if (customer && typeof customer === 'object' && 'name' in customer) {
    const { id, name } = customer as { id: string; name: string };
    return { id, name };
  }
  // Not populated, or the customer no longer exists.
  return { id: String(customer), name: '' };
}

function toCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Converts a stored job into the shape the API returns, leaving out fields that aren't set.
 * Populate `customer` with its name first.
 */
export function toJob(doc: JobDocument): Job {
  const job: Job = {
    id: doc.id as string,
    title: doc.title,
    customer: toCustomerSummary(doc.customer),
    status: doc.status as JobStatus,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
  if (doc.description) job.description = doc.description;
  if (doc.scheduledStart) job.scheduledStart = toCalendarDate(doc.scheduledStart);
  if (doc.scheduledEnd) job.scheduledEnd = toCalendarDate(doc.scheduledEnd);
  const siteAddress = toAddress(doc.siteAddress);
  if (siteAddress) job.siteAddress = siteAddress;
  if (doc.price != null) job.price = doc.price;
  return job;
}

export function jobModel(connection: Connection): JobModel {
  // Jobs populate their customer, so the Customer model must be registered on the same connection.
  customerModel(connection);
  return (connection.models.Job as JobModel | undefined) ?? connection.model('Job', jobSchema);
}

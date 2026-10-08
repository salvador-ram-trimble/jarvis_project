import type { Address } from './address.js';

/** Every job status, in the order the UI lists them. */
export const JOB_STATUSES = ['scheduled', 'in_progress', 'done', 'cancelled'] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/** The status a new job gets when none is given. */
export const DEFAULT_JOB_STATUS: JobStatus = 'scheduled';

/** How each status is shown in the UI. */
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

export function isJobStatus(value: unknown): value is JobStatus {
  return (JOB_STATUSES as readonly unknown[]).includes(value);
}

/** The part of a customer that comes with each job, so lists can show the name without another request. */
export interface CustomerSummary {
  id: string;
  name: string;
}

/**
 * A job as returned by the API. `scheduledStart` and `scheduledEnd` are calendar dates (`YYYY-MM-DD`),
 * and `createdAt` and `updatedAt` are ISO 8601 timestamps. Optional fields are left out when not set.
 */
export interface Job {
  id: string;
  title: string;
  customer: CustomerSummary;
  status: JobStatus;
  description?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  siteAddress?: Address;
  /** In US dollars. */
  price?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * The fields a client sends to create a job. An empty (or whitespace-only) string means "not set", as does
 * a `null` price, and a site address with no fields filled in is the same as no site address.
 */
export interface JobInput {
  title: string;
  /** The id of an existing customer. */
  customerId: string;
  /** Defaults to `scheduled`. */
  status?: JobStatus;
  description?: string;
  /** `YYYY-MM-DD`. */
  scheduledStart?: string;
  /** `YYYY-MM-DD`, not before `scheduledStart`. */
  scheduledEnd?: string;
  siteAddress?: Address;
  /** In US dollars, 0 or more. */
  price?: number | null;
}

/**
 * The body of `PATCH /api/jobs/:id`. Only the fields present are changed. An empty string (or a `null` price)
 * clears a field, and a `siteAddress` replaces the whole stored site address.
 */
export type JobPatch = Partial<JobInput>;

/** The optional filters of `GET /api/jobs`. */
export interface JobFilters {
  status?: JobStatus;
  customerId?: string;
}

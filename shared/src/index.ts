export { ADDRESS_FIELDS, type Address } from './address.js';
export type { Customer, CustomerInput, CustomerPatch } from './customer.js';
export type { ApiErrorBody, ApiErrorDetails, FieldErrors } from './errors.js';
export type { HealthResponse } from './health.js';
export {
  DEFAULT_JOB_STATUS,
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  isJobStatus,
  type CustomerSummary,
  type Job,
  type JobFilters,
  type JobInput,
  type JobPatch,
  type JobStatus,
} from './job.js';
export { isEndBeforeStart, isValidDate, isValidEmail, isValidPrice, validationMessages } from './validation.js';

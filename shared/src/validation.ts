// Rules the server enforces and the client mirrors for immediate feedback.

/** Deliberately loose: something@something.tld, with no spaces. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar date written as `YYYY-MM-DD` (so `2026-02-30` is rejected). */
export function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** True when both dates are set and the end comes before the start. Both must be `YYYY-MM-DD`. */
export function isEndBeforeStart(start: string | undefined, end: string | undefined): boolean {
  return Boolean(start && end && end < start);
}

export function isValidPrice(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export const validationMessages = {
  nameRequired: 'Name is required',
  emailInvalid: 'Enter a valid email address',
  titleRequired: 'Title is required',
  customerRequired: 'Choose a customer',
  customerNotFound: 'This customer does not exist',
  statusInvalid: 'Choose a valid status',
  dateInvalid: 'Enter a valid date',
  endBeforeStart: "The end date can't be before the start date",
  priceInvalid: 'Enter a valid price',
  priceNegative: "The price can't be negative",
} as const;

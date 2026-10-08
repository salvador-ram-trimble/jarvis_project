// Rules the server enforces and the client mirrors for immediate feedback.

/** Deliberately loose: something@something.tld, with no spaces. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

export const validationMessages = {
  nameRequired: 'Name is required',
  emailInvalid: 'Enter a valid email address',
} as const;

import { ADDRESS_FIELDS, type Address } from '@jarvis/shared';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
// Calendar dates are parsed as midnight UTC, so they're formatted in UTC to show the same day everywhere.
const calendarDateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });
const usdFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

/** Formats a calendar date (`YYYY-MM-DD`), such as a job's scheduled start. */
export function formatCalendarDate(date: string): string {
  return calendarDateFormat.format(new Date(`${date}T00:00:00Z`));
}

/** US dollars, for example $1,250.00. */
export function formatPrice(price: number): string {
  return usdFormat.format(price);
}

/** The filled-in address fields as display lines: street, then "city, state postal code", then country. */
export function addressLines(address: Address | undefined): string[] {
  if (!address || !ADDRESS_FIELDS.some((field) => address[field])) {
    return [];
  }
  const cityLine = [address.city, [address.state, address.postalCode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  return [address.street, cityLine, address.country].filter((line): line is string => Boolean(line));
}

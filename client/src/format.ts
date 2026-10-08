import { ADDRESS_FIELDS, type Address } from '@jarvis/shared';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
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

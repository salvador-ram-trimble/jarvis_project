/** A postal address. Embedded in customers, and in jobs as their site address. Every field is optional. */
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/** The address fields in display order. */
export const ADDRESS_FIELDS = ['street', 'city', 'state', 'postalCode', 'country'] as const satisfies readonly (keyof Address)[];

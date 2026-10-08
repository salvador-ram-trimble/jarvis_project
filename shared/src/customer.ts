/** A customer as returned by the API. Dates are ISO 8601 strings. */
export interface Customer {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** The fields a client sends to create a customer. */
export interface CustomerInput {
  name: string;
}

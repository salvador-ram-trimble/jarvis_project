/** Validation messages keyed by field name, for example `{ name: 'Name is required' }`. */
export type FieldErrors = Record<string, string>;

export interface ApiErrorDetails {
  message: string;
  fields?: FieldErrors;
}

/** The body of every error response from the API. */
export interface ApiErrorBody {
  error: ApiErrorDetails;
}

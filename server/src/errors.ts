import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import type { ApiErrorBody, FieldErrors } from '@jarvis/shared';

/** An error that maps directly to an HTTP status and the shared error shape. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: FieldErrors,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, 'Not found'));
};

function toHttpError(err: unknown): HttpError {
  if (err instanceof HttpError) {
    return err;
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const fields: FieldErrors = {};
    for (const [path, detail] of Object.entries(err.errors)) {
      fields[path] = detail.message;
    }
    return new HttpError(400, 'Validation failed', fields);
  }
  // A malformed id (or any other value Mongoose can't cast in a query) means the record can't exist.
  if (err instanceof mongoose.Error.CastError) {
    return new HttpError(404, 'Not found');
  }
  // Raised by express.json(), for example for a malformed JSON body.
  if (err instanceof Error && 'type' in err && err.type === 'entity.parse.failed') {
    return new HttpError(400, 'Request body is not valid JSON');
  }
  return new HttpError(500, 'Something went wrong on the server');
}

/** The single place that turns errors into responses. Must be registered last. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const httpError = toHttpError(err);
  if (httpError.status >= 500) {
    console.error(err);
  }
  const body: ApiErrorBody = { error: { message: httpError.message } };
  if (httpError.fields) {
    body.error.fields = httpError.fields;
  }
  res.status(httpError.status).json(body);
};

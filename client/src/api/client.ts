import type {
  ApiErrorBody,
  Customer,
  CustomerInput,
  CustomerPatch,
  FieldErrors,
  HealthResponse,
  Job,
  JobFilters,
  JobInput,
  JobPatch,
} from '@jarvis/shared';

/** Thrown for any failed API call. Carries the server's message and field errors when there are any. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields: FieldErrors = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorBody).error?.message === 'string'
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  const body: unknown = res.status === 204 ? undefined : await res.json().catch(() => undefined);
  if (!res.ok) {
    if (isApiErrorBody(body)) {
      throw new ApiError(res.status, body.error.message, body.error.fields);
    }
    throw new ApiError(res.status, `Request failed with status ${res.status}`);
  }
  return body as T;
}

export const api = {
  health: () => request<HealthResponse>('/health'),
  customers: {
    list: () => request<Customer[]>('/customers'),
    get: (id: string) => request<Customer>(`/customers/${encodeURIComponent(id)}`),
    create: (input: CustomerInput) =>
      request<Customer>('/customers', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, patch: CustomerPatch) =>
      request<Customer>(`/customers/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  },
  jobs: {
    list: (filters: JobFilters = {}) => {
      const query = new URLSearchParams();
      if (filters.status) query.set('status', filters.status);
      if (filters.customerId) query.set('customerId', filters.customerId);
      const search = query.toString();
      return request<Job[]>(search ? `/jobs?${search}` : '/jobs');
    },
    get: (id: string) => request<Job>(`/jobs/${encodeURIComponent(id)}`),
    create: (input: JobInput) => request<Job>('/jobs', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, patch: JobPatch) =>
      request<Job>(`/jobs/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  },
};

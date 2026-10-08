import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { api } from '../api/client';

vi.mock('@trimble-oss/moduswebcomponents-react', () => import('./modusMock'));

// Tests never reach a server: every API call is a mock that each test sets up. ApiError stays real.
vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return {
    ...actual,
    api: {
      health: vi.fn(),
      customers: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn() },
      jobs: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn() },
    },
  };
});

// Lists are empty unless a test says otherwise, so pages that also load related records (such as a
// customer's jobs) render without every test setting those up.
beforeEach(() => {
  vi.mocked(api.customers.list).mockResolvedValue([]);
  vi.mocked(api.jobs.list).mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

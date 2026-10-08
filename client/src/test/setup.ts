import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.mock('@trimble-oss/moduswebcomponents-react', () => import('./modusMock'));

// Tests never reach a server: every API call is a mock that each test sets up. ApiError stays real.
vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return {
    ...actual,
    api: {
      health: vi.fn(),
      customers: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn() },
    },
  };
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

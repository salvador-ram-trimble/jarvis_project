import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Customer } from '@jarvis/shared';
import { ApiError, api } from '../api/client';
import { CustomersListPage } from './CustomersListPage';
import { NewCustomerPage } from './NewCustomerPage';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return {
    ...actual,
    api: { health: vi.fn(), customers: { list: vi.fn(), create: vi.fn() } },
  };
});

const acme: Customer = {
  id: 'c1',
  name: 'Acme Plumbing',
  createdAt: '2026-10-08T12:00:00.000Z',
  updatedAt: '2026-10-08T12:00:00.000Z',
};

function renderNewCustomerPage() {
  render(
    <MemoryRouter initialEntries={['/customers/new']}>
      <Routes>
        <Route path="/customers" element={<CustomersListPage />} />
        <Route path="/customers/new" element={<NewCustomerPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('New customer form', () => {
  beforeEach(() => {
    vi.mocked(api.customers.create).mockReset();
    vi.mocked(api.customers.list).mockReset();
  });

  it('creates a customer with a name and returns to the list, which shows it', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.create).mockResolvedValue(acme);
    vi.mocked(api.customers.list).mockResolvedValue([acme]);
    renderNewCustomerPage();

    await user.type(screen.getByLabelText('Name'), '  Acme Plumbing ');
    await user.click(screen.getByRole('button', { name: 'Create customer' }));

    expect(api.customers.create).toHaveBeenCalledWith({ name: 'Acme Plumbing' });
    expect(await screen.findByRole('heading', { name: 'Customers' })).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'Acme Plumbing' })).toBeInTheDocument();
  });

  it('requires a name before submitting', async () => {
    const user = userEvent.setup();
    renderNewCustomerPage();

    await user.click(screen.getByRole('button', { name: 'Create customer' }));

    expect(api.customers.create).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Name is required');
  });

  it('shows a field error from the server next to the field and stays on the form', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.create).mockRejectedValue(
      new ApiError(400, 'Validation failed', { name: 'Name is already taken' }),
    );
    renderNewCustomerPage();

    await user.type(screen.getByLabelText('Name'), 'Acme');
    await user.click(screen.getByRole('button', { name: 'Create customer' }));

    expect(await screen.findByText('Name is already taken')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Name is already taken');
    expect(screen.getByRole('heading', { name: 'New customer' })).toBeInTheDocument();
  });

  it('shows a message when the server fails without field errors', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.create).mockRejectedValue(new ApiError(500, 'Something went wrong on the server'));
    renderNewCustomerPage();

    await user.type(screen.getByLabelText('Name'), 'Acme');
    await user.click(screen.getByRole('button', { name: 'Create customer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on the server');
  });
});

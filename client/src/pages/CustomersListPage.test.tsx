import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../api/client';
import { currentLocation, fullCustomer, makeCustomer, renderApp } from '../test/renderApp';

const customers = [
  makeCustomer({ id: 'b', name: 'bravo builders', createdAt: '2026-10-02T00:00:00.000Z' }),
  makeCustomer({ id: 'c', name: 'Charlie Co', createdAt: '2026-10-03T00:00:00.000Z' }),
  makeCustomer({ id: 'a', name: 'Alpha Electric', createdAt: '2026-10-01T00:00:00.000Z' }),
];

/** The names in the table, top to bottom. */
function shownNames(): string[] {
  const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
  return rows.map((row) => within(row).getAllByRole('cell')[0].textContent ?? '');
}

describe('Customers list page', () => {
  it('shows a loading indicator, then the customers with their contact details', async () => {
    vi.mocked(api.customers.list).mockResolvedValue([fullCustomer]);
    renderApp('/customers');

    expect(screen.getByRole('status', { name: 'Loading customers' })).toBeInTheDocument();
    const row = (await screen.findByRole('cell', { name: 'Ada Lovelace' })).closest('tr')!;
    expect(within(row).getByRole('cell', { name: 'Analytical Engines Ltd' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: 'ada@example.com' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '+1 555 0100' })).toBeInTheDocument();
  });

  it('sorts newest first by default, and by name or created date when chosen', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.list).mockResolvedValue(customers);
    renderApp('/customers');

    await screen.findByRole('table');
    expect(shownNames()).toEqual(['Charlie Co', 'bravo builders', 'Alpha Electric']);

    await user.selectOptions(screen.getByLabelText('Sort by'), 'Name (A to Z)');
    expect(shownNames()).toEqual(['Alpha Electric', 'bravo builders', 'Charlie Co']);
    expect(currentLocation()).toBe('/customers?sort=name-asc');

    await user.selectOptions(screen.getByLabelText('Sort by'), 'Name (Z to A)');
    expect(shownNames()).toEqual(['Charlie Co', 'bravo builders', 'Alpha Electric']);

    await user.selectOptions(screen.getByLabelText('Sort by'), 'Oldest first');
    expect(shownNames()).toEqual(['Alpha Electric', 'bravo builders', 'Charlie Co']);

    await user.selectOptions(screen.getByLabelText('Sort by'), 'Newest first');
    expect(shownNames()).toEqual(['Charlie Co', 'bravo builders', 'Alpha Electric']);
    expect(currentLocation()).toBe('/customers');
  });

  it('applies the sort from the URL', async () => {
    vi.mocked(api.customers.list).mockResolvedValue(customers);
    renderApp('/customers?sort=name-desc');

    await screen.findByRole('table');
    expect(screen.getByLabelText('Sort by')).toHaveValue('name-desc');
    expect(shownNames()).toEqual(['Charlie Co', 'bravo builders', 'Alpha Electric']);
  });

  it("opens a customer's page from their name", async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.list).mockResolvedValue([fullCustomer]);
    vi.mocked(api.customers.get).mockResolvedValue(fullCustomer);
    renderApp('/customers');

    const link = await screen.findByRole('link', { name: 'Ada Lovelace' });
    expect(link).toHaveAttribute('href', '/customers/c42');
    await user.click(link);

    expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/customers/c42');
  });

  it("opens a customer's page by clicking their row", async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.list).mockResolvedValue([fullCustomer]);
    vi.mocked(api.customers.get).mockResolvedValue(fullCustomer);
    renderApp('/customers');

    await user.click(await screen.findByRole('cell', { name: 'ada@example.com' }));

    expect(currentLocation()).toBe('/customers/c42');
  });

  it('shows an empty state whose action opens the new customer form', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.list).mockResolvedValue([]);
    renderApp('/customers');

    const emptyState = (await screen.findByRole('heading', { name: 'No customers yet' })).closest('section')!;
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(within(emptyState).getByRole('button', { name: 'New customer' }));

    expect(await screen.findByRole('heading', { name: 'New customer' })).toBeInTheDocument();
  });

  it('shows an error message when the server fails', async () => {
    vi.mocked(api.customers.list).mockRejectedValue(new ApiError(0, 'Could not reach the server.'));
    renderApp('/customers');

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server.');
  });
});

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../api/client';
import { currentLocation, fullCustomer, makeCustomer, renderApp } from '../test/renderApp';

/** The value shown under a detail label. */
function detail(label: string): HTMLElement {
  const term = screen.getByText(label, { selector: 'dt' });
  return term.nextElementSibling as HTMLElement;
}

describe('Customer detail page', () => {
  it('shows a loading indicator, then every field', async () => {
    vi.mocked(api.customers.get).mockResolvedValue(fullCustomer);
    renderApp('/customers/c42');

    expect(screen.getByRole('status', { name: 'Loading customer' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(api.customers.get).toHaveBeenCalledWith('c42');
    expect(detail('Company')).toHaveTextContent('Analytical Engines Ltd');
    expect(within(detail('Email')).getByRole('link', { name: 'ada@example.com' })).toHaveAttribute(
      'href',
      'mailto:ada@example.com',
    );
    expect(detail('Phone')).toHaveTextContent('+1 555 0100');
    expect(detail('Address')).toHaveTextContent('1 Main St');
    expect(detail('Address')).toHaveTextContent('Springfield, IL 62701');
    expect(detail('Address')).toHaveTextContent('USA');
    expect(detail('Notes')).toHaveTextContent('Prefers email. Call after 2pm.');
    expect(detail('Created')).not.toHaveTextContent('Not set');
    expect(detail('Last updated')).not.toHaveTextContent('Not set');
  });

  it('marks optional fields that are not set', async () => {
    vi.mocked(api.customers.get).mockResolvedValue(makeCustomer());
    renderApp('/customers/c1');

    await screen.findByRole('heading', { level: 1, name: 'Acme Plumbing' });
    for (const label of ['Company', 'Email', 'Phone', 'Address', 'Notes']) {
      expect(detail(label)).toHaveTextContent('Not set');
    }
  });

  it('opens the edit page', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.get).mockResolvedValue(fullCustomer);
    renderApp('/customers/c42');

    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(await screen.findByRole('heading', { name: 'Edit customer' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/customers/c42/edit');
  });

  it('shows the not-found page for an unknown or malformed id', async () => {
    vi.mocked(api.customers.get).mockRejectedValue(new ApiError(404, 'Not found'));
    renderApp('/customers/not-an-id');

    expect(await screen.findByRole('heading', { name: 'Customer not found' })).toBeInTheDocument();
  });

  it('shows an error message when the server fails', async () => {
    vi.mocked(api.customers.get).mockRejectedValue(new ApiError(500, 'Something went wrong on the server'));
    renderApp('/customers/c42');

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on the server');
  });
});

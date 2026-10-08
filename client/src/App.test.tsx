import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { api } from './api/client';
import { currentLocation, fullCustomer, renderApp } from './test/renderApp';

describe('App navigation', () => {
  it('redirects / to the customers list', async () => {
    vi.mocked(api.customers.list).mockResolvedValue([]);
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Customers' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/customers');
  });

  it('shows the not-found page for an unknown route', () => {
    renderApp('/no/such/page');

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('moves back and forward between the list, detail and edit pages', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.list).mockResolvedValue([fullCustomer]);
    vi.mocked(api.customers.get).mockResolvedValue(fullCustomer);
    vi.mocked(api.customers.update).mockResolvedValue(fullCustomer);
    renderApp('/customers');

    await user.click(await screen.findByRole('link', { name: 'Ada Lovelace' }));
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    await user.click(await screen.findByRole('button', { name: 'Save changes' }));

    // Saving goes back to the detail page rather than adding a new history entry...
    expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/customers/c42');

    // ...so Back from there returns to the list, and Forward to the edit page.
    await user.click(screen.getByRole('button', { name: 'Browser back' }));
    expect(await screen.findByRole('heading', { name: 'Customers' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/customers');

    await user.click(screen.getByRole('button', { name: 'Browser forward' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Browser forward' }));
    expect(await screen.findByRole('heading', { name: 'Edit customer' })).toBeInTheDocument();
  });

  it('returns to the detail page when editing is cancelled', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.get).mockResolvedValue(fullCustomer);
    renderApp('/customers/c42');

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(api.customers.update).not.toHaveBeenCalled();
  });
});

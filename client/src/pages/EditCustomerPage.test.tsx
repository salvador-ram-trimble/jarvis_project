import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../api/client';
import { currentLocation, fullCustomer, renderApp } from '../test/renderApp';

describe('Edit customer page', () => {
  it('fills the form with the stored customer', async () => {
    vi.mocked(api.customers.get).mockResolvedValue(fullCustomer);
    renderApp('/customers/c42/edit');

    expect(await screen.findByLabelText('Name')).toHaveValue('Ada Lovelace');
    expect(api.customers.get).toHaveBeenCalledWith('c42');
    expect(screen.getByLabelText('Company')).toHaveValue('Analytical Engines Ltd');
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
    expect(screen.getByLabelText('Phone')).toHaveValue('+1 555 0100');
    expect(screen.getByLabelText('Street')).toHaveValue('1 Main St');
    expect(screen.getByLabelText('City')).toHaveValue('Springfield');
    expect(screen.getByLabelText('State / region')).toHaveValue('IL');
    expect(screen.getByLabelText('Postal code')).toHaveValue('62701');
    expect(screen.getByLabelText('Country')).toHaveValue('USA');
    expect(screen.getByLabelText('Notes')).toHaveValue('Prefers email.\nCall after 2pm.');
  });

  it('saves changes, including cleared fields, then shows the customer', async () => {
    const user = userEvent.setup();
    const updated = { ...fullCustomer, company: undefined, phone: '+1 555 0199' };
    vi.mocked(api.customers.get).mockResolvedValueOnce(fullCustomer).mockResolvedValue(updated);
    vi.mocked(api.customers.update).mockResolvedValue(updated);
    renderApp('/customers/c42/edit');

    await user.clear(await screen.findByLabelText('Company'));
    await user.clear(screen.getByLabelText('Phone'));
    await user.type(screen.getByLabelText('Phone'), '+1 555 0199');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(api.customers.update).toHaveBeenCalledWith('c42', {
      name: 'Ada Lovelace',
      company: '',
      email: 'ada@example.com',
      phone: '+1 555 0199',
      address: { street: '1 Main St', city: 'Springfield', state: 'IL', postalCode: '62701', country: 'USA' },
      notes: 'Prefers email.\nCall after 2pm.',
    });
    expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/customers/c42');
    expect(screen.getByText('+1 555 0199')).toBeInTheDocument();
  });

  it('shows a server email error next to the email field', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.get).mockResolvedValue(fullCustomer);
    vi.mocked(api.customers.update).mockRejectedValue(
      new ApiError(400, 'Validation failed', { email: 'Enter a valid email address' }),
    );
    renderApp('/customers/c42/edit');

    await user.click(await screen.findByRole('button', { name: 'Save changes' }));

    expect(await screen.findByLabelText('Email')).toHaveAccessibleDescription('Enter a valid email address');
    expect(currentLocation()).toBe('/customers/c42/edit');
  });

  it('requires a name', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.get).mockResolvedValue(fullCustomer);
    renderApp('/customers/c42/edit');

    await user.clear(await screen.findByLabelText('Name'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(api.customers.update).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Name is required');
  });

  it('shows the not-found page for an unknown customer', async () => {
    vi.mocked(api.customers.get).mockRejectedValue(new ApiError(404, 'Customer not found'));
    renderApp('/customers/nope/edit');

    expect(await screen.findByRole('heading', { name: 'Customer not found' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });
});

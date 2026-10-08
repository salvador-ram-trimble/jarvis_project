import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../api/client';
import { currentLocation, fullCustomer, makeCustomer, renderApp } from '../test/renderApp';

const emptyAddress = { street: '', city: '', state: '', postalCode: '', country: '' };

describe('New customer page', () => {
  it('creates a customer with just a name and opens their page', async () => {
    const user = userEvent.setup();
    const acme = makeCustomer();
    vi.mocked(api.customers.create).mockResolvedValue(acme);
    vi.mocked(api.customers.get).mockResolvedValue(acme);
    renderApp('/customers/new');

    await user.type(screen.getByLabelText('Name'), '  Acme Plumbing ');
    await user.click(screen.getByRole('button', { name: 'Create customer' }));

    expect(api.customers.create).toHaveBeenCalledWith({
      name: 'Acme Plumbing',
      company: '',
      email: '',
      phone: '',
      address: emptyAddress,
      notes: '',
    });
    expect(await screen.findByRole('heading', { level: 1, name: 'Acme Plumbing' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/customers/c1');
  });

  it('sends every field', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.create).mockResolvedValue(fullCustomer);
    vi.mocked(api.customers.get).mockResolvedValue(fullCustomer);
    renderApp('/customers/new');

    await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Company'), 'Analytical Engines Ltd');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Phone'), '+1 555 0100');
    await user.type(screen.getByLabelText('Street'), '1 Main St');
    await user.type(screen.getByLabelText('City'), 'Springfield');
    await user.type(screen.getByLabelText('State / region'), 'IL');
    await user.type(screen.getByLabelText('Postal code'), '62701');
    await user.type(screen.getByLabelText('Country'), 'USA');
    await user.type(screen.getByLabelText('Notes'), 'Prefers email.');
    await user.click(screen.getByRole('button', { name: 'Create customer' }));

    expect(api.customers.create).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      company: 'Analytical Engines Ltd',
      email: 'ada@example.com',
      phone: '+1 555 0100',
      address: { street: '1 Main St', city: 'Springfield', state: 'IL', postalCode: '62701', country: 'USA' },
      notes: 'Prefers email.',
    });
  });

  it('requires a name before submitting', async () => {
    const user = userEvent.setup();
    renderApp('/customers/new');

    await user.click(screen.getByRole('button', { name: 'Create customer' }));

    expect(api.customers.create).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Name is required');
  });

  it('rejects an invalid email before submitting', async () => {
    const user = userEvent.setup();
    renderApp('/customers/new');

    await user.type(screen.getByLabelText('Name'), 'Acme');
    await user.type(screen.getByLabelText('Email'), 'acme@');
    await user.click(screen.getByRole('button', { name: 'Create customer' }));

    expect(api.customers.create).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter a valid email address');
    expect(screen.getByLabelText('Name')).not.toHaveAccessibleDescription();
  });

  it('shows a field error from the server next to that field and stays on the form', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.create).mockRejectedValue(
      new ApiError(400, 'Validation failed', { email: 'This email is not allowed' }),
    );
    renderApp('/customers/new');

    await user.type(screen.getByLabelText('Name'), 'Acme');
    await user.type(screen.getByLabelText('Email'), 'acme@example.com');
    await user.click(screen.getByRole('button', { name: 'Create customer' }));

    expect(await screen.findByText('This email is not allowed')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('This email is not allowed');
    expect(screen.getByRole('heading', { name: 'New customer' })).toBeInTheDocument();
  });

  it('shows a message when the server fails without field errors', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.create).mockRejectedValue(new ApiError(500, 'Something went wrong on the server'));
    renderApp('/customers/new');

    await user.type(screen.getByLabelText('Name'), 'Acme');
    await user.click(screen.getByRole('button', { name: 'Create customer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on the server');
  });

  it('goes to the customers list on cancel when opened directly', async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.list).mockResolvedValue([]);
    renderApp('/customers/new');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('heading', { name: 'Customers' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/customers');
  });
});

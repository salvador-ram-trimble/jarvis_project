import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../api/client';
import { currentLocation, fullCustomer, fullJob, makeCustomer, makeJob, renderApp } from '../test/renderApp';

const emptyAddress = { street: '', city: '', state: '', postalCode: '', country: '' };
const adaAddress = { street: '1 Main St', city: 'Springfield', state: 'IL', postalCode: '62701', country: 'USA' };

const acme = makeCustomer();
const grace = makeCustomer({
  id: 'c7',
  name: 'Grace Hopper',
  address: { street: '7 Navy Way', city: 'Arlington', country: 'USA' },
});
const customers = [grace, fullCustomer, acme];

/** The site address inputs' values, in form order. */
function siteAddressValues() {
  return {
    street: (screen.getByLabelText('Street') as HTMLInputElement).value,
    city: (screen.getByLabelText('City') as HTMLInputElement).value,
    state: (screen.getByLabelText('State / region') as HTMLInputElement).value,
    postalCode: (screen.getByLabelText('Postal code') as HTMLInputElement).value,
    country: (screen.getByLabelText('Country') as HTMLInputElement).value,
  };
}

async function renderForm(path = '/jobs/new') {
  vi.mocked(api.customers.list).mockResolvedValue(customers);
  renderApp(path);
  return screen.findByLabelText('Title');
}

describe('New job page', () => {
  it('starts with no customer, the Scheduled status and every other field blank', async () => {
    await renderForm();

    expect(screen.getByLabelText('Customer')).toHaveValue('');
    expect(screen.getByLabelText('Status')).toHaveValue('scheduled');
    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('Scheduled start')).toHaveValue('');
    expect(screen.getByLabelText('Scheduled end')).toHaveValue('');
    expect(screen.getByLabelText('Price (USD)')).toHaveValue(null);
    expect(screen.getByLabelText('Description')).toHaveValue('');
    expect(siteAddressValues()).toEqual(emptyAddress);
  });

  it('lists every customer by name in the picker, and every status by its label', async () => {
    await renderForm();

    const customerOptions = Array.from((screen.getByLabelText('Customer') as HTMLSelectElement).options);
    expect(customerOptions.map((option) => option.textContent)).toEqual([
      'Select a customer',
      'Acme Plumbing',
      'Ada Lovelace (Analytical Engines Ltd)',
      'Grace Hopper',
    ]);
    const statusOptions = Array.from((screen.getByLabelText('Status') as HTMLSelectElement).options);
    expect(statusOptions.map((option) => option.textContent)).toEqual(['Scheduled', 'In progress', 'Done', 'Cancelled']);
  });

  it('creates a job with just a title and a customer, and opens its page', async () => {
    const user = userEvent.setup();
    const job = makeJob();
    vi.mocked(api.jobs.create).mockResolvedValue(job);
    vi.mocked(api.jobs.get).mockResolvedValue(job);
    await renderForm();

    await user.type(screen.getByLabelText('Title'), '  Fix the sink ');
    await user.selectOptions(screen.getByLabelText('Customer'), 'Acme Plumbing');
    await user.click(screen.getByRole('button', { name: 'Create job' }));

    expect(api.jobs.create).toHaveBeenCalledWith({
      title: 'Fix the sink',
      customerId: 'c1',
      status: 'scheduled',
      description: '',
      scheduledStart: '',
      scheduledEnd: '',
      siteAddress: emptyAddress,
      price: null,
    });
    expect(await screen.findByRole('heading', { level: 1, name: 'Fix the sink' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/jobs/j1');
  });

  it("fills the site address from the chosen customer, and replaces it when the customer changes", async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.selectOptions(screen.getByLabelText('Customer'), 'Ada Lovelace (Analytical Engines Ltd)');
    expect(siteAddressValues()).toEqual(adaAddress);

    await user.selectOptions(screen.getByLabelText('Customer'), 'Grace Hopper');
    expect(siteAddressValues()).toEqual({ ...emptyAddress, street: '7 Navy Way', city: 'Arlington', country: 'USA' });

    // A customer without an address clears it.
    await user.selectOptions(screen.getByLabelText('Customer'), 'Acme Plumbing');
    expect(siteAddressValues()).toEqual(emptyAddress);
  });

  it('sends every field, with a site address the user changed after it was filled in', async () => {
    const user = userEvent.setup();
    vi.mocked(api.jobs.create).mockResolvedValue(fullJob);
    vi.mocked(api.jobs.get).mockResolvedValue(fullJob);
    await renderForm();

    await user.type(screen.getByLabelText('Title'), 'Kitchen remodel');
    await user.selectOptions(screen.getByLabelText('Customer'), 'Ada Lovelace (Analytical Engines Ltd)');
    await user.selectOptions(screen.getByLabelText('Status'), 'In progress');
    await user.type(screen.getByLabelText('Scheduled start'), '2026-10-12');
    await user.type(screen.getByLabelText('Scheduled end'), '2026-10-16');
    await user.type(screen.getByLabelText('Price (USD)'), '1250.5');
    await user.clear(screen.getByLabelText('Street'));
    await user.type(screen.getByLabelText('Street'), '9 Site Rd');
    await user.type(screen.getByLabelText('Description'), 'New cabinets.');
    await user.click(screen.getByRole('button', { name: 'Create job' }));

    expect(api.jobs.create).toHaveBeenCalledWith({
      title: 'Kitchen remodel',
      customerId: 'c42',
      status: 'in_progress',
      description: 'New cabinets.',
      scheduledStart: '2026-10-12',
      scheduledEnd: '2026-10-16',
      siteAddress: { ...adaAddress, street: '9 Site Rd' },
      price: 1250.5,
    });
  });

  it('starts with the customer from ?customerId= selected and their address filled in', async () => {
    await renderForm('/jobs/new?customerId=c42');

    expect(screen.getByLabelText('Customer')).toHaveValue('c42');
    expect(siteAddressValues()).toEqual(adaAddress);
  });

  it('ignores a ?customerId= that matches no customer', async () => {
    await renderForm('/jobs/new?customerId=nope');

    expect(screen.getByLabelText('Customer')).toHaveValue('');
    expect(siteAddressValues()).toEqual(emptyAddress);
  });

  it('requires a title and a customer before submitting', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.click(screen.getByRole('button', { name: 'Create job' }));

    expect(api.jobs.create).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Title')).toHaveAccessibleDescription('Title is required');
    expect(screen.getByLabelText('Customer')).toHaveAccessibleDescription('Choose a customer');
  });

  it('rejects an end date before the start date before submitting', async () => {
    const user = userEvent.setup();
    await renderForm('/jobs/new?customerId=c1');

    await user.type(screen.getByLabelText('Title'), 'Fix the sink');
    await user.type(screen.getByLabelText('Scheduled start'), '2026-10-12');
    await user.type(screen.getByLabelText('Scheduled end'), '2026-10-11');
    await user.click(screen.getByRole('button', { name: 'Create job' }));

    expect(api.jobs.create).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Scheduled end')).toHaveAccessibleDescription(
      "The end date can't be before the start date",
    );
  });

  it('rejects a negative price before submitting', async () => {
    const user = userEvent.setup();
    await renderForm('/jobs/new?customerId=c1');

    await user.type(screen.getByLabelText('Title'), 'Fix the sink');
    await user.type(screen.getByLabelText('Price (USD)'), '-5');
    await user.click(screen.getByRole('button', { name: 'Create job' }));

    expect(api.jobs.create).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Price (USD)')).toHaveAccessibleDescription("The price can't be negative");
  });

  it('accepts a price of zero', async () => {
    const user = userEvent.setup();
    vi.mocked(api.jobs.create).mockResolvedValue(makeJob({ price: 0 }));
    vi.mocked(api.jobs.get).mockResolvedValue(makeJob({ price: 0 }));
    await renderForm('/jobs/new?customerId=c1');

    await user.type(screen.getByLabelText('Title'), 'Fix the sink');
    await user.type(screen.getByLabelText('Price (USD)'), '0');
    await user.click(screen.getByRole('button', { name: 'Create job' }));

    expect(api.jobs.create).toHaveBeenCalledWith(expect.objectContaining({ price: 0 }));
  });

  it('shows field errors from the server next to their fields and stays on the form', async () => {
    const user = userEvent.setup();
    vi.mocked(api.jobs.create).mockRejectedValue(
      new ApiError(400, 'Validation failed', { customerId: 'This customer does not exist' }),
    );
    await renderForm('/jobs/new?customerId=c1');

    await user.type(screen.getByLabelText('Title'), 'Fix the sink');
    await user.click(screen.getByRole('button', { name: 'Create job' }));

    expect(await screen.findByLabelText('Customer')).toHaveAccessibleDescription('This customer does not exist');
    expect(currentLocation()).toBe('/jobs/new?customerId=c1');
  });

  it('shows a message when the server fails without field errors', async () => {
    const user = userEvent.setup();
    vi.mocked(api.jobs.create).mockRejectedValue(new ApiError(500, 'Something went wrong on the server'));
    await renderForm('/jobs/new?customerId=c1');

    await user.type(screen.getByLabelText('Title'), 'Fix the sink');
    await user.click(screen.getByRole('button', { name: 'Create job' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on the server');
  });

  it('asks for a customer first when there are none', async () => {
    const user = userEvent.setup();
    renderApp('/jobs/new');

    await user.click(await screen.findByRole('button', { name: 'New customer' }));

    expect(await screen.findByRole('heading', { name: 'New customer' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/customers/new');
  });

  it('goes to the jobs list on cancel when opened directly', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Jobs' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/jobs');
  });

  it("goes to the customer's page on cancel when opened directly for a customer", async () => {
    const user = userEvent.setup();
    vi.mocked(api.customers.get).mockResolvedValue(fullCustomer);
    await renderForm('/jobs/new?customerId=c42');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/customers/c42');
  });
});

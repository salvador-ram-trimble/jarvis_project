import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../api/client';
import { currentLocation, fullCustomer, fullJob, makeCustomer, renderApp } from '../test/renderApp';

const grace = makeCustomer({ id: 'c7', name: 'Grace Hopper', address: { street: '7 Navy Way', city: 'Arlington' } });

async function renderEdit() {
  vi.mocked(api.jobs.get).mockResolvedValue(fullJob);
  vi.mocked(api.customers.list).mockResolvedValue([fullCustomer, grace]);
  renderApp('/jobs/j42/edit');
  return screen.findByLabelText('Title');
}

describe('Edit job page', () => {
  it('fills the form with the stored job, keeping its own site address', async () => {
    expect(await renderEdit()).toHaveValue('Kitchen remodel');
    expect(api.jobs.get).toHaveBeenCalledWith('j42');
    expect(screen.getByLabelText('Customer')).toHaveValue('c42');
    expect(screen.getByLabelText('Status')).toHaveValue('in_progress');
    expect(screen.getByLabelText('Scheduled start')).toHaveValue('2026-10-12');
    expect(screen.getByLabelText('Scheduled end')).toHaveValue('2026-10-16');
    expect(screen.getByLabelText('Price (USD)')).toHaveValue(1250);
    // The job's site address, not the customer's current address.
    expect(screen.getByLabelText('Street')).toHaveValue('9 Site Rd');
    expect(screen.getByLabelText('City')).toHaveValue('Shelbyville');
    expect(screen.getByLabelText('Description')).toHaveValue('New cabinets.\nKeep the old sink.');
  });

  it('changes the status to Cancelled and clears fields, then shows the job', async () => {
    const user = userEvent.setup();
    const updated = { ...fullJob, status: 'cancelled' as const, price: undefined };
    await renderEdit();
    vi.mocked(api.jobs.get).mockResolvedValue(updated);
    vi.mocked(api.jobs.update).mockResolvedValue(updated);

    await user.selectOptions(screen.getByLabelText('Status'), 'Cancelled');
    await user.clear(screen.getByLabelText('Price (USD)'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(api.jobs.update).toHaveBeenCalledWith('j42', {
      title: 'Kitchen remodel',
      customerId: 'c42',
      status: 'cancelled',
      description: 'New cabinets.\nKeep the old sink.',
      scheduledStart: '2026-10-12',
      scheduledEnd: '2026-10-16',
      siteAddress: fullJob.siteAddress,
      price: null,
    });
    expect(await screen.findByRole('heading', { level: 1, name: 'Kitchen remodel' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/jobs/j42');
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('moves the job to another customer, taking their address as the site address', async () => {
    const user = userEvent.setup();
    vi.mocked(api.jobs.update).mockResolvedValue(fullJob);
    await renderEdit();

    await user.selectOptions(screen.getByLabelText('Customer'), 'Grace Hopper');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(api.jobs.update).toHaveBeenCalledWith(
      'j42',
      expect.objectContaining({
        customerId: 'c7',
        siteAddress: { street: '7 Navy Way', city: 'Arlington', state: '', postalCode: '', country: '' },
      }),
    );
  });

  it('rejects an end date before the start date', async () => {
    const user = userEvent.setup();
    await renderEdit();

    await user.clear(screen.getByLabelText('Scheduled start'));
    await user.type(screen.getByLabelText('Scheduled start'), '2026-10-20');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(api.jobs.update).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Scheduled end')).toHaveAccessibleDescription(
      "The end date can't be before the start date",
    );
  });

  it('shows a server field error next to its field', async () => {
    const user = userEvent.setup();
    vi.mocked(api.jobs.update).mockRejectedValue(
      new ApiError(400, 'Validation failed', { price: "The price can't be negative" }),
    );
    await renderEdit();

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByLabelText('Price (USD)')).toHaveAccessibleDescription("The price can't be negative");
    expect(currentLocation()).toBe('/jobs/j42/edit');
  });

  it('returns to the job on cancel without saving', async () => {
    const user = userEvent.setup();
    await renderEdit();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Kitchen remodel' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/jobs/j42');
    expect(api.jobs.update).not.toHaveBeenCalled();
  });

  it('shows the not-found page for an unknown job', async () => {
    vi.mocked(api.jobs.get).mockRejectedValue(new ApiError(404, 'Job not found'));
    renderApp('/jobs/nope/edit');

    expect(await screen.findByRole('heading', { name: 'Job not found' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });
});
